import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Socket } from "socket.io-client";
import { toast } from "react-toastify";
import { ServiceType } from "@/utils/enums";
import { socketManager } from "@/utils/socket-manager";

interface User {
  _id: string;
  username: string;
}

interface MatchingState {
  // Socket and connection state
  socket: Socket | null;
  connectionState: "disconnected" | "connecting" | "connected" | "reconnecting";

  isMatching: boolean;
  isRoomPreparing: boolean;
  count: number | null;
  roomId: string | null;
  questionId: string | null;
  selectedTopic: string | null;
  matchFound: boolean;

  user: User | null;

  initializeSocket: (user: User, refreshAccessToken?: () => Promise<string | null>) => void;
  startMatch: (difficulty: string, topic: string) => void;
  stopQueuing: () => void;
  reset: () => void;
  setUser: (user: User | null) => void;
  setSelectedTopic: (topic: string | null) => void;

  reconnect: () => void;
  disconnect: () => void;
  cleanup: () => void;
}

const initialState = {
  socket: null,
  connectionState: "disconnected" as const,
  isMatching: false,
  isRoomPreparing: false,
  count: null,
  roomId: null,
  questionId: null,
  selectedTopic: null,
  matchFound: false,
  user: null,
};

export const useMatchingStore = create<MatchingState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Initialize socket connection
    initializeSocket: (user: User, refreshAccessToken?: () => Promise<string | null>) => {
      const { socket } = get();

      if (socket && socket.connected) {
        return;
      }

      // If socket exists but not connected, try to reconnect
      if (socket && !socket.connected) {
        socket.connect();
        return;
      }

      const url =
        process.env.NEXT_PUBLIC_ENV === "production"
          ? process.env.NEXT_PUBLIC_MATCHING_ENDPOINT
          : `http://localhost:8002`;

      // Get access token for authentication
      const accessToken = localStorage.getItem("accessToken");

      // Create socket using socketManager
      const newSocket = socketManager.createSocket(ServiceType.MATCHING, {
        url: url || "",
        options: {},
        token: accessToken || undefined,
      });

      // Set the socket immediately so it's available
      set({
        socket: newSocket,
        connectionState: "connecting",
        user,
      });

      newSocket.connect();

      newSocket.on("connect", () => {
        set({ connectionState: "connected" });
      });

      newSocket.on("connect_error", async (error) => {
        // Check if this is an authentication error
        const errorMessage = error.message?.toLowerCase() || "";
        console.log(errorMessage);
        const isAuthError =
          errorMessage.includes("expired") ||
          errorMessage.includes("authentication failed") ||
          errorMessage.includes("invalid token") ||
          errorMessage.includes("missing authorization");

        if (isAuthError && refreshAccessToken) {
          console.log("Authentication error detected, attempting token refresh...");
          try {
            const newToken = await refreshAccessToken();
            if (newToken) {
              console.log("Token refreshed successfully, updating socket auth and reconnecting...");
              // Update socket auth with new token
              socketManager.updateSocketAuth(ServiceType.MATCHING, newToken);
              // Reconnect with new token
              newSocket.connect();
              return;
            } else {
              console.log("Token refresh failed, user needs to log in again");
              toast.error("Session expired. Please log in again.");
              set({ connectionState: "disconnected" });
              return;
            }
          } catch (refreshError) {
            console.error("Token refresh error:", refreshError);
            toast.error("Session expired. Please log in again.");
            set({ connectionState: "disconnected" });
            return;
          }
        }

        set({ connectionState: "disconnected" });
      });

      newSocket.on("disconnect", (reason) => {
        set({ connectionState: "disconnected" });

        if (reason === "io server disconnect") {
          setTimeout(() => {
            get().reconnect();
          }, 1000);
        }
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("Matching socket reconnected after", attemptNumber, "attempts");
        set({ connectionState: "connected" });
      });

      newSocket.on("reconnect_attempt", (attemptNumber) => {
        console.log("Reconnection attempt:", attemptNumber);
        set({ connectionState: "reconnecting" });
      });

      newSocket.on("reconnect_error", (error) => {
        console.error("Reconnection error:", error);
        set({ connectionState: "disconnected" });
      });

      newSocket.on("reconnect_failed", () => {
        console.error("Reconnection failed");
        set({ connectionState: "disconnected" });
        toast.error("Connection lost. Please refresh the page.");
      });

      newSocket.on("matchCountdown", (counter) => {
        if (counter === 0) {
          set({ count: null, isMatching: false });
          return;
        }
        set({ count: counter });
      });

      newSocket.on("roomPreparing", () => {
        set({
          isRoomPreparing: true,
          isMatching: false,
          count: null,
        });
      });

      newSocket.on("matchSuccess", async (data) => {
        toast.success("A match has been found!");
        set({
          count: null,
          roomId: data.roomId,
          questionId: data.questionId,
          isMatching: false,
          isRoomPreparing: false,
          matchFound: true,
        });
      });

      newSocket.on("matchTimeout", (data) => {
        set({ count: null, isMatching: false });

        toast.error(data.message, {
          position: "top-right",
          autoClose: 3000,
        });
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
        toast.error("Connection error occurred");
      });
    },

    // Start matching process
    startMatch: (difficulty: string, topic: string) => {
      const { socket, user } = get();

      if (!socket || !user) {
        toast.error("Please log in to start matching");
        return;
      }

      // Store null in state for empty topic, keep empty string for socket
      const selectedTopicForState = topic || null;

      if (!socket.connected) {
        socket.connect();

        // Wait for connection before sending match request
        socket.once("connect", () => {
          set({ isMatching: true, selectedTopic: selectedTopicForState, matchFound: false });
          socket.emit("matchStart", {
            difficulty,
            topic,
          });
        });
        return;
      }

      set({ isMatching: true, selectedTopic: selectedTopicForState, matchFound: false });
      socket.emit("matchStart", {
        difficulty,
        topic,
      });
    },

    // Stop queuing
    stopQueuing: () => {
      const { socket } = get();
      socket?.emit("stopQueuing");
      set({ isMatching: false, count: null });
      toast.error("You've cancelled your matching request", {
        position: "top-center",
        autoClose: 3000,
      });
    },

    // Reset state
    reset: () => {
      set({
        roomId: null,
        questionId: null,
        isMatching: false,
        isRoomPreparing: false,
        count: null,
        selectedTopic: null,
        matchFound: false,
      });
    },

    // Set user
    setUser: (user: User | null) => {
      set({ user });
    },

    // Set selected topic
    setSelectedTopic: (topic: string | null) => {
      set({ selectedTopic: topic });
    },

    // Reconnect socket
    reconnect: () => {
      const { socket } = get();
      if (socket && !socket.connected) {
        socket.connect();
      }
    },

    // Disconnect socket
    disconnect: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({
          socket: null,
          connectionState: "disconnected",
          isMatching: false,
          count: null,
          roomId: null,
          questionId: null,
          selectedTopic: null,
        });
      }
    },

    // Cleanup function to be called when component unmounts
    cleanup: () => {
      const { socket, roomId } = get();
      if (socket) {
        socket.removeAllListeners();
        socketManager.disconnect(ServiceType.MATCHING);

        // Only reset room-related state if we don't have an active room
        if (!roomId) {
          set({
            socket: null,
            connectionState: "disconnected",
            isMatching: false,
            isRoomPreparing: false,
            count: null,
            roomId: null,
            questionId: null,
            selectedTopic: null,
            matchFound: false,
            user: null,
          });
        } else {
          // Keep room state but clean up socket
          set({
            socket: null,
            connectionState: "disconnected",
            isMatching: false,
            isRoomPreparing: false,
            count: null,
            selectedTopic: null,
            matchFound: false,
          });
        }
      }
    },
  })),
);

export const useMatchingState = () => {
  const isMatching = useMatchingStore((state) => state.isMatching);
  const isRoomPreparing = useMatchingStore((state) => state.isRoomPreparing);
  const count = useMatchingStore((state) => state.count);
  const roomId = useMatchingStore((state) => state.roomId);
  const questionId = useMatchingStore((state) => state.questionId);
  const selectedTopic = useMatchingStore((state) => state.selectedTopic);
  const connectionState = useMatchingStore((state) => state.connectionState);
  const matchFound = useMatchingStore((state) => state.matchFound);

  return {
    isMatching,
    isRoomPreparing,
    count,
    roomId,
    questionId,
    selectedTopic,
    connectionState,
    matchFound,
  };
};

export const useMatchingActions = () => {
  const initializeSocket = useMatchingStore((state) => state.initializeSocket);
  const startMatch = useMatchingStore((state) => state.startMatch);
  const stopQueuing = useMatchingStore((state) => state.stopQueuing);
  const reset = useMatchingStore((state) => state.reset);
  const setUser = useMatchingStore((state) => state.setUser);
  const setSelectedTopic = useMatchingStore((state) => state.setSelectedTopic);
  const reconnect = useMatchingStore((state) => state.reconnect);
  const disconnect = useMatchingStore((state) => state.disconnect);
  const cleanup = useMatchingStore((state) => state.cleanup);

  return {
    initializeSocket,
    startMatch,
    stopQueuing,
    reset,
    setUser,
    setSelectedTopic,
    reconnect,
    disconnect,
    cleanup,
  };
};

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { toast } from "react-toastify";
import { DIFFICULTY } from "@/utils/enums";

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: DIFFICULTY;
}

interface User {
  _id: string;
  username: string;
}

interface MatchingState {
  // Socket and connection state
  socket: Socket | null;
  connectionState: "disconnected" | "connecting" | "connected" | "reconnecting";

  isMatching: boolean;
  count: number | null;
  roomId: string | null;
  questions: Question[];
  selectedTopic: string | null;
  matchFound: boolean; // Flag to track if match was found

  user: User | null;

  initializeSocket: (user: User) => void;
  startMatch: (difficulty: DIFFICULTY, topic?: string) => void;
  stopQueuing: () => void;
  leaveRoom: () => void;
  endSession: () => void;
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
  count: null,
  roomId: null,
  questions: [],
  selectedTopic: null,
  matchFound: false,
  user: null,
};

export const useMatchingStore = create<MatchingState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Initialize socket connection
    initializeSocket: (user: User) => {
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

      const newSocket = io(url || "", {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        forceNew: true,
      });

      // Set the socket immediately so it's available
      set({
        socket: newSocket,
        connectionState: "connecting",
        user,
      });

      newSocket.on("connect", () => {
        set({ connectionState: "connected" });
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
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

      newSocket.on("matchSuccess", (data) => {
        toast.success("A match has been found!");
        set({
          count: null,
          roomId: data.roomId,
          questions: data.questions,
          isMatching: false,
          matchFound: true,
        });
      });

      newSocket.on("matchLeave", () => {
        get().reset();
        toast.warn("The other user has left!");
      });

      newSocket.on("matchTimeout", () => {
        set({ count: null, isMatching: false });

        toast.error("No match found! Please try again.", {
          position: "top-center",
          autoClose: 3000,
        });
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
        toast.error("Connection error occurred");
      });
    },

    // Start matching process
    startMatch: (difficulty: DIFFICULTY, topic?: string) => {
      const { socket, user } = get();

      if (!socket || !user) {
        toast.error("Please log in to start matching");
        return;
      }

      if (!socket.connected) {
        socket.connect();

        // Wait for connection before sending match request
        socket.once("connect", () => {
          set({ isMatching: true, count: 30, selectedTopic: topic || null, matchFound: false });
          socket.emit("matchStart", {
            difficulty,
            topic: topic || null,
          });
        });
        return;
      }

      set({ isMatching: true, count: 30, selectedTopic: topic || null, matchFound: false });
      socket.emit("matchStart", {
        difficulty,
        topic: topic || null,
      });
    },

    // Stop queuing
    stopQueuing: () => {
      const { socket } = get();
      socket?.emit("stopQueuing");
      set({ isMatching: false, count: null });
    },

    // Leave room
    leaveRoom: () => {
      const { socket } = get();
      socket?.emit("matchLeave");
      get().reset();
    },

    // End session
    endSession: () => {
      const { socket, roomId } = get();
      socket?.emit("matchEndSession", roomId);
      get().reset();
      toast.success("The coding session has successfully ended.");
    },

    // Reset state
    reset: () => {
      set({
        roomId: null,
        questions: [],
        isMatching: false,
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
          questions: [],
          selectedTopic: null,
        });
      }
    },

    // Cleanup function to be called when component unmounts
    cleanup: () => {
      const { socket, roomId } = get();
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();

        // Only reset room-related state if we don't have an active room
        if (!roomId) {
          set({
            socket: null,
            connectionState: "disconnected",
            isMatching: false,
            count: null,
            roomId: null,
            questions: [],
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
  const count = useMatchingStore((state) => state.count);
  const roomId = useMatchingStore((state) => state.roomId);
  const questions = useMatchingStore((state) => state.questions);
  const selectedTopic = useMatchingStore((state) => state.selectedTopic);
  const connectionState = useMatchingStore((state) => state.connectionState);
  const matchFound = useMatchingStore((state) => state.matchFound);

  return {
    isMatching,
    count,
    roomId,
    questions,
    selectedTopic,
    connectionState,
    matchFound,
  };
};

export const useMatchingActions = () => {
  const initializeSocket = useMatchingStore((state) => state.initializeSocket);
  const startMatch = useMatchingStore((state) => state.startMatch);
  const stopQueuing = useMatchingStore((state) => state.stopQueuing);
  const leaveRoom = useMatchingStore((state) => state.leaveRoom);
  const endSession = useMatchingStore((state) => state.endSession);
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
    leaveRoom,
    endSession,
    reset,
    setUser,
    setSelectedTopic,
    reconnect,
    disconnect,
    cleanup,
  };
};

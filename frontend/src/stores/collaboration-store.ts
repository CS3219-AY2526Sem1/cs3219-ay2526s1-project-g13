import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { ProgrammingLanguage } from "@/utils/enums";
import { collaborationAPI, RoomDetails } from "@/lib/api-client";

interface CollaborationState {
  // Room state
  roomDetails: RoomDetails | null;
  documentContent: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRoomDetails: (roomId: string) => Promise<void>;
  changeLanguage: (roomId: string, language: ProgrammingLanguage) => Promise<void>;
  updateLanguage: (language: ProgrammingLanguage) => void;
  reset: () => void;
}

const initialState = {
  roomDetails: null,
  documentContent: "",
  isLoading: false,
  error: null,
};

export const useCollaborationStore = create<CollaborationState>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    // Fetch room details via HTTP
    fetchRoomDetails: async (roomId: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await collaborationAPI.getRoomDetails(roomId);

        if (response.success) {
          set({
            roomDetails: response.room,
            documentContent: response.document.content || "",
            isLoading: false,
          });
        } else {
          throw new Error(response.error || "Failed to fetch room details");
        }
      } catch (error) {
        const errorMessage =
          error instanceof AxiosError
            ? error.response?.data?.error || error.message
            : "Failed to fetch room details";
        set({ isLoading: false, error: errorMessage });
        toast.error(errorMessage);
      }
    },

    // Update language state (called when WebSocket receives language-change-notification)
    updateLanguage: (language: ProgrammingLanguage) => {
      set((state) => ({
        roomDetails: state.roomDetails
          ? { ...state.roomDetails, programmingLanguage: language }
          : null,
      }));
    },

    // Change programming language
    changeLanguage: async (roomId: string, language: ProgrammingLanguage) => {
      try {
        const response = await collaborationAPI.changeLanguage(roomId, language);

        if (!response.success) {
          throw new Error(response.error || "Failed to change language");
        }

        set((state) => ({
          roomDetails: state.roomDetails
            ? { ...state.roomDetails, programmingLanguage: language }
            : null,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof AxiosError
            ? error.response?.data?.error || error.message
            : "Failed to change language";
        toast.error(errorMessage);
      }
    },

    // Reset state
    reset: () => {
      set({
        ...initialState,
      });
    },
  })),
);

export const useCollaborationState = () => {
  const roomDetails = useCollaborationStore((state) => state.roomDetails);
  const documentContent = useCollaborationStore((state) => state.documentContent);
  const isLoading = useCollaborationStore((state) => state.isLoading);
  const error = useCollaborationStore((state) => state.error);

  return {
    roomDetails,
    documentContent,
    isLoading,
    error,
  };
};

export const useCollaborationActions = () => {
  const fetchRoomDetails = useCollaborationStore((state) => state.fetchRoomDetails);
  const changeLanguage = useCollaborationStore((state) => state.changeLanguage);
  const updateLanguage = useCollaborationStore((state) => state.updateLanguage);
  const reset = useCollaborationStore((state) => state.reset);

  return {
    fetchRoomDetails,
    changeLanguage,
    updateLanguage,
    reset,
  };
};

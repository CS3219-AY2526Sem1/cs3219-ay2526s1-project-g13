import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { ProgrammingLanguage } from "@/utils/enums";
import { collaborationConfig } from "@/utils/config";
import { collaborationAPI, RoomDetails, questionAPI, Question } from "@/lib/api-client";

let executionTimer: NodeJS.Timeout | null = null;
const EXECUTION_TIMEOUT_MS = 35000; // 35s

interface CollaborationState {
  // Room state
  roomDetails: RoomDetails | null;
  documentContent: string;
  isLoading: boolean;
  error: string | null;

  sourceCode: string;
  isExecuting: boolean;
  executionResult: {
    output: string;
    isError: boolean;
  } | null;

  // Question state
  questionDetails: Question | null;
  isQuestionLoading: boolean;
  questionError: string | null;

  agoraToken: string | null;

  // Actions
  fetchRoomDetails: (roomId: string) => Promise<void>;
  fetchQuestionDetails: (questionId: string) => Promise<void>;
  changeLanguage: (roomId: string, language: ProgrammingLanguage) => Promise<void>;
  updateLanguage: (language: ProgrammingLanguage) => void;
  reset: () => void;

  setSourceCode: (code: string) => void;
  submitCode: () => Promise<void>;
  setExecutionResult: (result: { output: string; isError: boolean }) => void;

  fetchAgoraToken: (roomId: string, userId: string) => Promise<void>;
}

const initialState = {
  roomDetails: null,
  documentContent: "",
  isLoading: false,
  error: null,

  sourceCode: "",
  isExecuting: false,
  executionResult: null,
  questionDetails: null,
  isQuestionLoading: false,
  questionError: null,

  agoraToken: null,
};

export const useCollaborationStore = create<CollaborationState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    fetchAgoraToken: async (roomId: string, userId: string) => {
      try {
        const response = await axios.get(`http://localhost:8011/v1/video/${roomId}/${userId}`);
        set({ agoraToken: response.data.rtcToken });
        return response.data.rtcToken;
      } catch (error) {
        console.error("Failed to fetch Agora token ", error);
        toast.error("Failed to start video service");
        return null;
      }
    },

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

    // Fetch question details via HTTP
    fetchQuestionDetails: async (questionId: string) => {
      set({ isQuestionLoading: true, questionError: null });
      try {
        const question = await questionAPI.getQuestionById(questionId);
        set({
          questionDetails: question,
          isQuestionLoading: false,
        });
      } catch (error) {
        const errorMessage =
          error instanceof AxiosError
            ? error.response?.data?.error || error.message
            : "Failed to fetch question details";
        set({ isQuestionLoading: false, questionError: errorMessage });
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

    setSourceCode: (code: string) => {
      set({ sourceCode: code });
    },

    setExecutionResult: (result) => {
      // end timer
      if (executionTimer) {
        clearTimeout(executionTimer);
        executionTimer = null;
      }
      // set result
      set({ executionResult: result, isExecuting: false });
    },

    submitCode: async () => {
      const { roomDetails, sourceCode } = get();
      if (!roomDetails || !sourceCode) {
        console.error("Missing roomDetails or sourceCode");
        return;
      }

      set({ isExecuting: true, executionResult: null });

      if (executionTimer) {
        clearTimeout(executionTimer);
      }

      executionTimer = setTimeout(() => {
        set({
          isExecuting: false,
          executionResult: {
            isError: true,
            output:
              "Execution timed out. The server may be busy or the callback failed. Please try again.",
          },
        });
      }, EXECUTION_TIMEOUT_MS);

      // call POST api
      try {
        const response = await axios.post(
          `${collaborationConfig.HTTP_URL}/api/v1/code/submit-code`,
          {
            room_id: roomDetails.roomId,
            language: roomDetails.programmingLanguage,
            source_code: sourceCode,
          },
        );

        if (response.status !== 202) {
          throw new Error(response.data.error || "Failed to submit code");
        }
      } catch (error) {
        const errorMessage =
          error instanceof AxiosError
            ? error.response?.data?.error || error.message
            : "Failed to submit code";

        if (executionTimer) {
          clearTimeout(executionTimer);
          executionTimer = null;
        }

        set({
          isExecuting: false,
          executionResult: { output: errorMessage, isError: true },
        });
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

  const sourceCode = useCollaborationStore((state) => state.sourceCode);
  const isExecuting = useCollaborationStore((state) => state.isExecuting);
  const executionResult = useCollaborationStore((state) => state.executionResult);
  const questionDetails = useCollaborationStore((state) => state.questionDetails);
  const isQuestionLoading = useCollaborationStore((state) => state.isQuestionLoading);
  const questionError = useCollaborationStore((state) => state.questionError);

  return {
    roomDetails,
    documentContent,
    isLoading,
    error,
    sourceCode,
    isExecuting,
    executionResult,
    questionDetails,
    isQuestionLoading,
    questionError,
  };
};

export const useCollaborationActions = () => {
  const fetchRoomDetails = useCollaborationStore((state) => state.fetchRoomDetails);
  const fetchQuestionDetails = useCollaborationStore((state) => state.fetchQuestionDetails);
  const changeLanguage = useCollaborationStore((state) => state.changeLanguage);
  const updateLanguage = useCollaborationStore((state) => state.updateLanguage);
  const reset = useCollaborationStore((state) => state.reset);

  const fetchAgoraToken = useCollaborationStore((state) => state.fetchAgoraToken);

  const setSourceCode = useCollaborationStore((state) => state.setSourceCode);
  const submitCode = useCollaborationStore((state) => state.submitCode);
  const setExecutionResult = useCollaborationStore((state) => state.setExecutionResult);

  return {
    fetchRoomDetails,
    fetchQuestionDetails,
    fetchAgoraToken,
    changeLanguage,
    updateLanguage,
    reset,
    setSourceCode,
    submitCode,
    setExecutionResult,
  };
};

export const apiConfig = {
  userService: {
    baseURL: process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:8001",
  },
  matchingService: {
    baseURL: process.env.NEXT_PUBLIC_MATCHING_SERVICE_URL || "http://localhost:8002",
  },
  questionService: {
    baseURL: process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL || "http://localhost:8003",
  },
  collaborationService: {
    baseURL: process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_URL || "http://localhost:8004",
  },
  videoCallService: {
    baseURL: process.env.NEXT_PUBLIC_VIDEO_CALL_SERVICE_URL || "http://localhost:8011",
  },
} as const;

export const getUserServiceURL = () => apiConfig.userService.baseURL;
export const getMatchingServiceURL = () => apiConfig.matchingService.baseURL;
export const getQuestionServiceURL = () => apiConfig.questionService.baseURL;
export const getCollaborationURL = () => apiConfig.collaborationService.baseURL;
export const getVideoCallServiceURL = () => apiConfig.videoCallService.baseURL;

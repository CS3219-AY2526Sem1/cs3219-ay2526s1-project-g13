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
    httpURL: process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_HTTP_URL || "http://localhost:8004",
    wsURL: process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_WS_URL || "ws://localhost:8005",
  },
} as const;

export const getUserServiceURL = () => apiConfig.userService.baseURL;
export const getMatchingServiceURL = () => apiConfig.matchingService.baseURL;
export const getQuestionServiceURL = () => apiConfig.questionService.baseURL;
export const getCollaborationHTTPURL = () => apiConfig.collaborationService.httpURL;
export const getCollaborationWSURL = () => apiConfig.collaborationService.wsURL;

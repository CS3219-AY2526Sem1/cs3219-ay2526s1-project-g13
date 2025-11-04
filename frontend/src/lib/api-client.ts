import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiConfig } from "./api-config";
import { ProgrammingLanguage } from "@/utils/enums";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  userId: string;
  accessToken: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  verificationToken?: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: "user" | "admin";
}

export interface VerifyRequest {
  verificationCode: number;
  verificationToken: string;
}

export interface VerifyResponse {
  message?: string;
  accessToken?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message?: string;
  resetToken: string;
}

export interface ResetPasswordRequest {
  resetPasswordToken: string;
  newPassword: string;
}

export interface UpdateAccountRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

export interface UpdateAccountResponse {
  success: boolean;
  message: string;
}

export interface QuestionDetails {
  _id: string;
  title: string;
  difficulty: string;
  topic: string;
}

export interface RoomDetails {
  roomId: string;
  questionId: string | null;
  userIds: string[];
  programmingLanguage: ProgrammingLanguage;
  isActive: boolean;
  closedAt: Date | null;
  createdAt: Date | null;
  question: QuestionDetails | null;
}

export interface RoomDetailsResponse {
  success: boolean;
  room: RoomDetails;
  document: {
    content: string;
  };
  error?: string;
}

export interface ChangeLanguageRequest {
  language: string;
}

export interface ChangeLanguageResponse {
  success: boolean;
  error?: string;
}

export interface GetUserRoomsResponse {
  success: boolean;
  rooms: RoomDetails[];
  error?: string;
}

// Create axios instance for user service
const userServiceClient = axios.create({
  baseURL: apiConfig.userService.baseURL,
  withCredentials: true,
});

// Create axios instance for collaboration service
const collaborationServiceClient = axios.create({
  baseURL: apiConfig.collaborationService.httpURL,
  withCredentials: true,
});

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await axios.post(
      `${apiConfig.userService.baseURL}/v1/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const { accessToken } = res.data;
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }
    return accessToken;
  } catch (err) {
    if (
      axios.isAxiosError(err) &&
      err.response?.status === 401 &&
      err.response?.data?.error === "Invalid or expired refresh token"
    ) {
      console.log("Refresh token has expired, user needs to log in again");
      localStorage.removeItem("accessToken");
    } else {
      console.error("Failed to refresh access token:", err);
    }
    return null;
  }
};

/**
 * Make an authenticated request with automatic token refresh on 401
 */
export const authRequest = async <T = unknown>(
  config: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => {
  config.withCredentials = true;
  const isLoggedOut = localStorage.getItem("logout");
  if (isLoggedOut) {
    throw new Error("User is logged out");
  }
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) throw new Error("No access token found");

  try {
    config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` };

    // Determine which client to use based on the URL
    const url = config.url || "";
    let client = userServiceClient;

    // If URL is a full URL and matches collaboration service, use collaboration client
    if (url.startsWith(apiConfig.collaborationService.httpURL)) {
      client = collaborationServiceClient;
      // Remove base URL since client already has it
      config.url = url.replace(apiConfig.collaborationService.httpURL, "");
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      // For absolute URLs (legacy support), use axios directly
      return await axios(config);
    }
    // Otherwise, use userServiceClient with relative URL

    return await client(config);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) throw new Error("Token refresh failed");
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newToken}` };

      const url = config.url || "";
      let client = userServiceClient;

      if (url.startsWith(apiConfig.collaborationService.httpURL)) {
        client = collaborationServiceClient;
        config.url = url.replace(apiConfig.collaborationService.httpURL, "");
      } else if (url.startsWith("http://") || url.startsWith("https://")) {
        return await axios(config);
      }

      return await client(config);
    }
    throw err;
  }
};

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const res = await axios.post<LoginResponse>(
      `${apiConfig.userService.baseURL}/v1/login`,
      credentials,
      { withCredentials: true },
    );
    return res.data;
  },

  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const res = await axios.post<RegisterResponse>(
      `${apiConfig.userService.baseURL}/v1/register`,
      userData,
    );
    return res.data;
  },

  logout: async (): Promise<void> => {
    await authRequest({
      method: "POST",
      url: `${apiConfig.userService.baseURL}/v1/logout`,
      withCredentials: true,
    });
  },

  verify: async (payload: VerifyRequest): Promise<VerifyResponse> => {
    const res = await axios.post<VerifyResponse>(
      `${apiConfig.userService.baseURL}/v1/verify`,
      payload,
    );
    return res.data;
  },

  resendVerification: async (verificationToken: string): Promise<{ message?: string }> => {
    const res = await axios.post(`${apiConfig.userService.baseURL}/v1/resend`, {
      verificationToken,
    });
    return res.data;
  },

  forgotPassword: async (payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const res = await axios.post<ForgotPasswordResponse>(
      `${apiConfig.userService.baseURL}/v1/forgot-password`,
      payload,
    );
    return res.data;
  },

  resetPassword: async (
    payload: ResetPasswordRequest,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await axios.post(`${apiConfig.userService.baseURL}/v1/reset-password`, payload);
    return res.data;
  },
};

export const accountAPI = {
  getAccount: async (): Promise<User> => {
    const res = await authRequest<User>({
      method: "GET",
      url: "/v1/account",
      withCredentials: true,
    });
    return res.data;
  },

  updateAccount: async (payload: UpdateAccountRequest): Promise<UpdateAccountResponse> => {
    const res = await authRequest<UpdateAccountResponse>({
      method: "POST",
      url: "/v1/update-account",
      data: payload,
    });
    return res.data;
  },
};

export const collaborationAPI = {
  getRoomDetails: async (roomId: string): Promise<RoomDetailsResponse> => {
    const res = await axios.get<RoomDetailsResponse>(
      `${apiConfig.collaborationService.httpURL}/api/v1/rooms/${roomId}`,
    );
    return res.data;
  },

  getUserRooms: async (userId: string): Promise<GetUserRoomsResponse> => {
    const res = await authRequest<GetUserRoomsResponse>({
      method: "GET",
      url: `${apiConfig.collaborationService.httpURL}/api/v1/rooms?userId=${userId}`,
    });
    return res.data;
  },

  changeLanguage: async (roomId: string, language: string): Promise<ChangeLanguageResponse> => {
    const res = await axios.patch<ChangeLanguageResponse>(
      `${apiConfig.collaborationService.httpURL}/api/v1/rooms/${roomId}/language`,
      { language },
    );
    return res.data;
  },
};

import { useCallback } from "react";
import axios, { AxiosRequestConfig } from "axios";

export function useAuth() {
  // Refresh the access token
  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await axios.post(
        "http://localhost:8080/v1/auth/refresh",
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
        console.error("Refresh token has expired:", err);
        localStorage.removeItem("accessToken");
      }
      console.error("Failed to refresh access token:", err);
      return null;
    }
  }, []);

  // Authenticated request with auto-refresh
  const authRequest = useCallback(
    async (config: AxiosRequestConfig) => {
      config.withCredentials = true;
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error("No access token found");

      try {
        config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` };
        return await axios(config);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (!newToken) throw new Error("Token refresh failed");
          config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newToken}` };
          return await axios(config);
        }
        throw err;
      }
    },
    [refreshAccessToken],
  );

  return { refreshAccessToken, authRequest };
}

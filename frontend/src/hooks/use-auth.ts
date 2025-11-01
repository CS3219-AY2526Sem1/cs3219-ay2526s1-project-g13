import { useCallback } from "react";
import { AxiosRequestConfig } from "axios";
import { refreshAccessToken, authRequest as authRequestClient } from "@/lib/api-client";

export function useAuth() {
  // Refresh the access token
  const refreshAccessTokenHook = useCallback(async () => {
    return await refreshAccessToken();
  }, []);

  // Authenticated request with auto-refresh
  const authRequest = useCallback(async (config: AxiosRequestConfig) => {
    return await authRequestClient(config);
  }, []);

  return { refreshAccessToken: refreshAccessTokenHook, authRequest };
}

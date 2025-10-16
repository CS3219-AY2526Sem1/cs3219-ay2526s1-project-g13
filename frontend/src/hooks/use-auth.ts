import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const router = useRouter();

  useEffect(() => {
    // Check for existing auth token/session
    const checkAuth = async () => {
      try {
        // TODO: Replace with actual auth check
        // For now, we'll simulate a logged-in user
        const mockUser: User = {
          _id: "mock-user-id",
          username: "testuser",
        };

        setAuthState({
          user: mockUser,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        console.log(error);
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    checkAuth();
  }, []);

  const refreshToken = async (callback: () => void) => {
    try {
      // TODO: Implement actual token refresh logic
      // For now, just execute the callback
      callback();
    } catch (error) {
      console.log(error);
      router.push("/auth");
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
    router.push("/auth");
  };

  return {
    ...authState,
    refreshToken,
    logout,
  };
};

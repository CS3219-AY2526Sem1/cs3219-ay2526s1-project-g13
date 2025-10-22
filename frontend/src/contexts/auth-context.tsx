"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { authRequest } = useAuth();
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if access token exists
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const res = await authRequest({
        method: "GET",
        url: "http://localhost:8001/v1/account",
        withCredentials: true,
      });

      const userData = res.data;
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.log("Authentication failed, clearing session", err);
      setIsAuthenticated(false);
      setUser(null);

      localStorage.removeItem("accessToken");
    } finally {
      setIsLoading(false);
    }
  }, [authRequest]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/");
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    checkAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

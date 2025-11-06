"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { accountAPI } from "@/lib/api-client";

interface User {
  _id: string;
  username: string;
  email: string;
  role: "user" | "admin";
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  isAdmin: boolean;
  isUser: boolean;
  checkAuth: () => Promise<User | null>;
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
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if access token exists
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setIsAuthenticated(false);
        setUser(null);
        return null;
      }

      const userData = await accountAPI.getAccount();
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (err) {
      console.log("Authentication failed, clearing session", err);
      setIsAuthenticated(false);
      setUser(null);

      localStorage.removeItem("accessToken");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    isAdmin: user?.role === "admin",
    isUser: user?.role === "user",
    checkAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

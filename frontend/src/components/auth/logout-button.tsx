"use client";

import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAuthContext } from "@/contexts/auth-context";

export default function LogoutButton() {
  const { authRequest } = useAuth();
  const { logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      const res = await authRequest({
        method: "POST",
        url: "http://localhost:8001/v1/logout",
        withCredentials: true,
      });

      console.log("Logout successful:", res.data);
      logout();
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error("Logout failed:", error.response?.data || error.message);
      logout();
    }
  };

  return (
    <Button
      variant="logout"
      className="text-black"
      onClick={() => {
        handleLogout();
      }}
    >
      Logout
    </Button>
  );
}

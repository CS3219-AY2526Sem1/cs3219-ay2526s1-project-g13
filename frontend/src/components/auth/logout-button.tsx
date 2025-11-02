"use client";

import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/auth-context";
import { authAPI } from "@/lib/api-client";

export default function LogoutButton() {
  const { logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      console.log("Logout successful");
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

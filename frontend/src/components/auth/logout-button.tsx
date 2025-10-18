"use client";

import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function LogoutButton() {
  const router = useRouter();
  const { authRequest } = useAuth();

  const handleLogout = async () => {
    try {
      const res = await authRequest({
        method: "POST",
        url: "http://localhost:8080/v1/logout",
        withCredentials: true,
      });

      console.log("Logout successful:", res.data);

      // Optionally remove token if using JWT
      localStorage.removeItem("accessToken");

      // Redirect to login
      router.push("/");
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error("Logout failed:", error.response?.data || error.message);
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

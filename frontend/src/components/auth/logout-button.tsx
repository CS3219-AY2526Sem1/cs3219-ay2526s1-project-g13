"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string>("");
  useEffect(() => {
    setAccessToken(localStorage.getItem("accessToken") || "");
  }, []);

  const handleLogout = async () => {
    try {
      const res = await axios.post(
        `http://localhost:8080/v1/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

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

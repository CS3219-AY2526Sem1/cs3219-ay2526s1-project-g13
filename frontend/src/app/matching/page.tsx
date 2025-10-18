"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MatchMake from "@/components/matching/match-make";
import { useMatchingStore } from "@/stores/matching-store";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/ui/nav-bar";
import MessageDialog from "@/components/ui/message-dialog";
import { DialogState, defaultDialogState } from "@/types/dialog";

export default function MatchingPage() {
  const router = useRouter();
  const { authRequest } = useAuth();
  const { roomId, matchFound, initializeSocket, setUser, cleanup } = useMatchingStore();
  const [dialog, setDialog] = useState<DialogState>(defaultDialogState);

  useEffect(() => {
    if (matchFound && roomId) {
      router.push("/room");
    }
  }, [matchFound, roomId, router]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const fetchUser = async () => {
      try {
        const res = await authRequest({
          method: "GET",
          url: "http://localhost:8080/v1/account",
          withCredentials: true,
        });
        const authUser = res.data;
        setUser(authUser);
        initializeSocket(authUser);
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setDialog({
          open: true,
          message: "Login session expired, please log in again.",
          description: "Redirecting to login page in 5 seconds...",
          icon: "circle-x",
          setOpen: () => {},
          showCloseButton: false,
        });
        timeout = setTimeout(() => {
          router.push("/auth");
        }, 5000);
      }
    };
    fetchUser();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [authRequest, initializeSocket, setUser, router]);

  // Cleanup socket when component unmounts
  useEffect(() => {
    return () => {
      // Only cleanup if we're not in a matching state and don't have a room
      const { isMatching, roomId } = useMatchingStore.getState();
      if (!isMatching && !roomId) {
        cleanup();
      }
    };
  }, [cleanup]);

  return (
    <div className="min-h-screen bg-[#d4eaf8]">
      <Navbar />
      <main className="pt-8">
        <MatchMake />
      </main>
      <MessageDialog
        open={dialog.open}
        setOpen={dialog.setOpen || ((open: boolean) => setDialog((prev) => ({ ...prev, open })))}
        title={dialog.message}
        description={dialog.description}
        icon={dialog.icon}
        showCloseButton={dialog.showCloseButton}
      />
    </div>
  );
}

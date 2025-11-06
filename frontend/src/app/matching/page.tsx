"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MatchMake from "@/components/matching/match-make";
import { useMatchingStore } from "@/stores/matching-store";
import { useAuthContext } from "@/contexts/auth-context";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/ui/nav-bar";
import ProtectedRoute from "@/components/auth/protected-route";

export default function MatchingPage() {
  const router = useRouter();
  const { user, isUser, isLoading } = useAuthContext();
  const { refreshAccessToken } = useAuth();
  const { roomId, matchFound, initializeSocket, setUser, cleanup } = useMatchingStore();

  useEffect(() => {
    if (!isLoading && !isUser) {
      router.push("/");
    }
  }, [isUser, isLoading, router]);

  useEffect(() => {
    if (matchFound && roomId) {
      router.push(`/practice/${roomId}`);
    }
  }, [matchFound, roomId, router]);

  useEffect(() => {
    if (user) {
      setUser(user);
      initializeSocket(user, refreshAccessToken);
    }
  }, [user, setUser, initializeSocket, refreshAccessToken]);

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
    <ProtectedRoute>
      <div className="min-h-screen bg-[#d4eaf8]">
        <Navbar />
        <main className="pt-8">
          <MatchMake />
        </main>
      </div>
    </ProtectedRoute>
  );
}

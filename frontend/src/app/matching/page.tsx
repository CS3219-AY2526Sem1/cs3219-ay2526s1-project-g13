"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MatchMake from "@/components/matching/match-make";
import { useMatchingStore } from "@/stores/matching-store";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/ui/nav-bar";

export default function MatchingPage() {
  const router = useRouter();
  const { user: authUser, isLoading } = useAuth();
  const { roomId, matchFound, initializeSocket, setUser, cleanup } = useMatchingStore();

  useEffect(() => {
    if (matchFound && roomId) {
      router.push("/room");
    }
  }, [matchFound, roomId, router]);

  useEffect(() => {
    if (authUser && !isLoading) {
      setUser(authUser);
      initializeSocket(authUser);
    }
  }, [authUser, isLoading, setUser, initializeSocket]);

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
    </div>
  );
}

"use client";

import QuestionCard from "@/components/question/question-card";
import Navbar from "@/components/ui/nav-bar";
import { useAuthContext } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/auth/protected-route";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function QuestionViewPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuthContext();
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/");
    }
  }, [user, isAdmin, isLoading, router]);
  return (
    <ProtectedRoute>
      <Navbar />
      <QuestionCard />
    </ProtectedRoute>
  );
}

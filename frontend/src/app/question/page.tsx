"use client";

import DataTable from "@/components/question/question-table";
import Navbar from "@/components/ui/nav-bar";
import { QuestionForm } from "@/components/question/question-add-form";
import { useAuthContext } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/auth/protected-route";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function QuestionPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuthContext();

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push("/");
    }
  }, [user, isAdmin, router]);

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto py-10">
        <h1 className="mb-4 text-2xl font-bold text-center">Question Bank</h1>
        <QuestionForm />
        <DataTable />
      </div>
    </ProtectedRoute>
  );
}

"use client";
import Header from "@/components/ui/header";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import PublicRoute from "@/components/auth/public-route";

export default function ResetPasswordPage() {
  return (
    <PublicRoute>
      <div>
        <Header />
        <h1 className="mt-40 text-center text-3xl sm:text-4xl font-extrabold tracking-tight">
          Reset Password
        </h1>
        <ResetPasswordForm />
      </div>
    </PublicRoute>
  );
}

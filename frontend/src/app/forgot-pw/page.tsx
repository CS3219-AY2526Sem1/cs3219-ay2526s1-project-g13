"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import MessageDialog from "@/components/ui/message-dialog";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSendEmail = useCallback(async () => {
    setIsEmailSent(true);
  }, []);

  const handleBackToLogin = useCallback(() => {
    router.push("/auth");
  }, [router]);

  return (
    <div>
      <Header />
      <h1 className="mt-40 text-center text-3xl sm:text-4xl font-extrabold tracking-tight">
        Forgot your password?
      </h1>
      <div className="mt-20 flex items-center justify-center ">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-lg sm:p-8 space-y-6">
          <p className="text-center text-sm sm:text-base font-medium text-gray-600">
            Enter your email to receive a password reset link.
          </p>
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendEmail();
              }}
            >
              <Input
                type="email"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button className="mt-4 w-full" type="submit">
                Send Email
              </Button>
            </form>
            <Button variant="outline" className="w-full" onClick={handleBackToLogin}>
              Back to login
            </Button>
          </div>
        </div>
      </div>

      {/* Email sent confirmation */}
      <MessageDialog
        open={isEmailSent}
        setOpen={setIsEmailSent}
        title={`Email sent to ${email}`}
        description="Please check your email for the password reset link."
      />
    </div>
  );
}

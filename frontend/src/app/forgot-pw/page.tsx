"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import MessageDialog from "@/components/ui/message-dialog";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Spinner } from "@/components/ui/spinner";

type ForgotPasswordPayload = {
  email: string;
};

type ForgotPasswordResponse = {
  message?: string;
  resetToken: string;
};

type BackendError = {
  error: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");

  const mutation = useMutation<
    ForgotPasswordResponse,
    AxiosError<BackendError>,
    ForgotPasswordPayload
  >({
    mutationFn: async (payload) => {
      const res = await axios.post<ForgotPasswordResponse>(
        "http://localhost:8080/v1/forgot-password",
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      setOpen(true);
      setTitle("Send reset password link successfully!");
      setDescription("Please check your email for the reset link.");
      setIcon("mail-check");
    },
    onError: (error) => {
      setOpen(true);
      setTitle("Send reset password link failed");
      setIcon("circle-x");
      const backendMessage = error.response?.data?.error;
      setDescription(backendMessage || error.message);
    },
  });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email });
  };

  const handleBackToLogin = () => {
    router.push("/auth");
  };

  const isLoading = mutation.isPending;

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
            <form onSubmit={handleSendEmail}>
              <Input
                type="email"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button className="mt-4 w-full" type="submit">
                {isLoading ? <Spinner /> : "Send Email"}
              </Button>
            </form>
            <Button variant="outline" className="w-full" onClick={handleBackToLogin}>
              Back to login
            </Button>
          </div>
        </div>
      </div>

      <MessageDialog
        open={open}
        setOpen={setOpen}
        title={title}
        description={description}
        icon={icon}
      />
    </div>
  );
}

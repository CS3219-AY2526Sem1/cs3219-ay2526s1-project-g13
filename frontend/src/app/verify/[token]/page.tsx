"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Header from "@/components/ui/header";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import MessageDialog from "@/components/ui/message-dialog";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

type VerifyPayload = {
  verificationCode: number;
  verificationToken: string;
};

type VerifyResponse = {
  message?: string;
};

type BackendError = {
  error: string;
};

export default function VerifyAccountPage() {
  const { token } = useParams<{ token: string }>();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const mutation = useMutation<VerifyResponse, AxiosError<BackendError>, VerifyPayload>({
    mutationFn: async (payload) => {
      const res = await axios.post<VerifyResponse>("http://localhost:8080/v1/verify", payload);
      return res.data;
    },
    onSuccess: (data) => {
      setOpen(true);
      setTitle("Verify account successfully!");
      setDescription(data.message || "You may now log in to your account.");
    },
    onError: (error) => {
      setOpen(true);
      setTitle("Verify account failed");

      // Access backend error message safely
      const backendMessage = error.response?.data?.error;
      setDescription(backendMessage || error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    const otpNumber = Number(otp);
    if (isNaN(otpNumber)) {
      setError("Verification code must be numeric.");
      return;
    }

    mutation.mutate({ verificationCode: otpNumber, verificationToken: token });
  };

  const resendMutation = useMutation<
    { message?: string },
    AxiosError<BackendError>,
    { verificationToken: string }
  >({
    mutationFn: async (payload) => {
      const res = await axios.post("http://localhost:8080/v1/resend", payload);
      return res.data;
    },
    onSuccess: (data) => {
      console.log(data);
      setOpen(true);
      setTitle("Verification code resent!");
      setDescription(data.message || "Please check your email for the new verification ode.");
    },
    onError: (error) => {
      setOpen(true);
      setTitle("Resend failed");
      const backendMessage = error.response?.data?.error;
      setDescription(backendMessage || error.message);
    },
  });

  const handleResendCode = () => {
    resendMutation.mutate({ verificationToken: token });
  };

  const isVerifyLoading = mutation.isPending;
  const isResendLoading = resendMutation.isPending;

  return (
    <div>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center gap-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            Account Verification
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle>We have sent a verification code to your email address.</CardTitle>
              <CardDescription>Enter the code below to verify your account</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                <InputOTP
                  maxLength={6}
                  onChange={(value: string) => {
                    const numericValue = value.replace(/\D/g, "");
                    setOtp(numericValue);
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                {error && <p className="text-red-600 text-sm">{error}</p>}
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full">
                {isVerifyLoading ? <Spinner /> : "Verify"}
              </Button>
            </CardFooter>
            <CardFooter>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleResendCode}
                className="w-full"
              >
                {isResendLoading ? <Spinner /> : "Resend code"}
              </Button>
            </CardFooter>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => router.push("/auth")}
              className="w-full"
            >
              Back to login
            </Button>
          </Card>
        </form>
      </div>

      <MessageDialog open={open} setOpen={setOpen} title={title} description={description} />
    </div>
  );
}

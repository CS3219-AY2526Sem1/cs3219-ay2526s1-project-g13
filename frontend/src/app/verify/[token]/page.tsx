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
import { AxiosError } from "axios";
import MessageDialog from "@/components/ui/message-dialog";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import PublicRoute from "@/components/auth/public-route";
import { useAuthContext } from "@/contexts/auth-context";
import { authAPI, VerifyResponse } from "@/lib/api-client";

type VerifyPayload = {
  verificationCode: number;
  verificationToken: string;
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
  const [icon, setIcon] = useState("");
  const router = useRouter();
  const { checkAuth } = useAuthContext();

  const mutation = useMutation<VerifyResponse, AxiosError<BackendError>, VerifyPayload>({
    mutationFn: async (payload) => {
      return await authAPI.verify(payload);
    },
    onSuccess: async (data) => {
      setOpen(true);
      setTitle("Verify account successfully!");
      console.log(data.message);
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        const user = await checkAuth(); // Update auth context

        setIcon("user-round-check");
        if (user?.role == "user") {
          setDescription("Redirecting to matching page in 5 seconds...");
          setTimeout(() => {
            router.push("/matching");
          }, 5000);
        }
      } else {
        console.log("No access token received upon verification.");
        setDescription("You can now log in to your account.");
        setIcon("circle-check");
      }
    },
    onError: (error) => {
      setOpen(true);
      setTitle("Verify account failed");
      const backendMessage = error.response?.data?.error;
      setDescription(backendMessage || error.message);
      setIcon("circle-x");
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
      return await authAPI.resendVerification(payload.verificationToken);
    },
    onSuccess: (data) => {
      console.log(data);
      setOpen(true);
      setTitle("Verification code resent!");
      setDescription(data.message || "Please check your email for the new verification code.");
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
    <PublicRoute>
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
                <Button type="submit" className="w-full" disabled={isVerifyLoading}>
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
                  disabled={isResendLoading}
                >
                  {isResendLoading ? <Spinner /> : "Resend code"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        <MessageDialog
          open={open}
          setOpen={setOpen}
          title={title}
          description={description}
          icon={icon}
        />
      </div>
    </PublicRoute>
  );
}

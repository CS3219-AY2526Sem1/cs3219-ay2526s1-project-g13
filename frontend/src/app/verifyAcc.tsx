"use client";
import { useState, useCallback, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function VerifyAccountPage() {
  const [otp, setOtp] = useState(""); // Store OTP input
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");

      // Simple validation: OTP should be 6 digits
      if (!/^\d{6}$/.test(otp)) {
        setError("Please enter a valid 6-digit OTP");
        return;
      }

      try {
        // Dummy submission
        console.log("Verifying OTP:", otp);
        await new Promise((res) => setTimeout(res, 700));
        alert("OTP verified (dummy)");
      } catch (err) {
        console.error(err);
        setError("Failed to verify OTP");
      }
    },
    [otp],
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          Account Verification
        </h1>
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Enter the OTP sent to your email
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <Card>
          <CardHeader className="items-center text-center">
            <CardTitle>Verify your account</CardTitle>
            <CardDescription>Enter the 6-digit OTP</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            <div className="grid gap-3">
              <InputOTP maxLength={6} onChange={(value) => setOtp(value)}>
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
              Verify Account
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

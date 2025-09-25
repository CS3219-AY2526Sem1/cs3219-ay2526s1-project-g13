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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Image from "next/image";
import PeerPrepImage from "@/images/peerprep.png";

// Types for forms
type SignInData = {
  username: string;
  password: string;
};

type SignUpData = SignInData & {
  email: string;
  retypePassword: string;
};

type FormType = "sign-in" | "sign-up";

type SubmitResponse = {
  ok: boolean;
  message: string;
};

export default function AuthPage() {
  // Store errors per field
  const [signUpErrors, setSignUpErrors] = useState<Partial<Record<keyof SignUpData, string>>>({});

  // Dummy submit function
  const submitForm = useCallback(
    async (payload: SignInData | (SignUpData & { type: FormType })): Promise<SubmitResponse> => {
      console.log("Submitting payload:", payload);
      await new Promise((res) => setTimeout(res, 700));
      return { ok: true, message: "Submitted (dummy)" };
    },
    [],
  );

  // Validation function (only for sign-up)
  const validateSignUp = (data: SignUpData) => {
    const errors: Partial<Record<keyof SignUpData, string>> = {};
    if (/^\d+$/.test(data.username)) {
      errors.username = "Username cannot be only numbers";
    }
    // Username: 6–32 characters
    if (!data.username || data.username.length < 6 || data.username.length > 32) {
      errors.username = "Username must be 6–32 characters";
    }

    // Password: 12–64 chars, at least one upper, lower, digit, special char
    if (!data.password || data.password.length < 12 || data.password.length > 64) {
      errors.password = "Password must be 12–64 characters";
    } else {
      const hasUpper = /[A-Z]/.test(data.password);
      const hasLower = /[a-z]/.test(data.password);
      const hasDigit = /[0-9]/.test(data.password);
      const hasSpecial = /[^\w\s]/.test(data.password);
      if (!(hasUpper && hasLower && hasDigit && hasSpecial)) {
        errors.password =
          "Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character";
      }
    }

    // Retype password check
    if (data.password !== data.retypePassword) {
      errors.retypePassword = "Passwords do not match";
    }

    return errors;
  };

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>, type: FormType) => {
      event.preventDefault();
      const formEl = event.currentTarget;
      const fd = new FormData(formEl);
      const data = Object.fromEntries(fd.entries()) as Record<string, string>;

      try {
        if (type === "sign-up") {
          // Explicitly map to SignUpData
          const signUpData: SignUpData = {
            username: data.username || "",
            password: data.password || "",
            email: data.email || "",
            retypePassword: data.retypePassword || "",
          };

          // Validate
          const errors = validateSignUp(signUpData);
          if (Object.keys(errors).length > 0) {
            setSignUpErrors(errors);
            return;
          }
          setSignUpErrors({});

          const res = await submitForm({ type, ...signUpData });
          if (res.ok) alert("Signed up (dummy)");
          else alert("Submission failed (dummy)");
        } else {
          // Map to SignInData
          const signInData: SignInData = {
            username: data.username || "",
            password: data.password || "",
          };

          const res = await submitForm({ type, ...signInData });
          if (res.ok) alert("Signed in (dummy)");
          else alert("Submission failed (dummy)");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred (dummy)");
      }
    },
    [submitForm],
  );

  return (
    <div className="min-h-screen flex items-center justify-center gap-30">
      <div className="flex flex-col items-center mb-10 gap-4">
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
          Welcome to PeerPrep
        </h1>
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Collaborate, learn, and prepare for your technical interviews with peers
        </h3>
        <Image src={PeerPrepImage} alt="" width={400} height={400} />
      </div>
      <div className="w-full max-w-sm flex-col gap-6 flex">
        <Tabs defaultValue="sign-in">
          <TabsList>
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>

          {/* Sign In */}
          <TabsContent value="sign-in">
            <form onSubmit={(e) => handleSubmit(e, "sign-in")}>
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>Welcome back — please sign in.</CardDescription>
                </CardHeader>

                <CardContent className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="signin-username">Username</Label>
                    <Input id="signin-username" name="username" required />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      onCopy={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                    />
                  </div>
                </CardContent>

                <CardFooter>
                  <Button variant="default" type="submit">
                    Sign in
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* Sign Up */}
          <TabsContent value="sign-up">
            <form onSubmit={(e) => handleSubmit(e, "sign-up")}>
              <Card>
                <CardHeader>
                  <CardTitle>Sign Up</CardTitle>
                  <CardDescription>Create a new account.</CardDescription>
                </CardHeader>

                <CardContent className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input id="signup-username" name="username" required />
                    {signUpErrors.username && (
                      <p className="text-red-600 text-sm">{signUpErrors.username}</p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" required />
                    {signUpErrors.email && (
                      <p className="text-red-600 text-sm">{signUpErrors.email}</p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="password" type="password" required />
                    {signUpErrors.password && (
                      <p className="text-red-600 text-sm">{signUpErrors.password}</p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="signup-retype-password">Retype password</Label>
                    <Input
                      id="signup-retype-password"
                      name="retypePassword"
                      type="password"
                      onCopy={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      required
                    />
                    {signUpErrors.retypePassword && (
                      <p className="text-red-600 text-sm">{signUpErrors.retypePassword}</p>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button type="submit">Sign up</Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

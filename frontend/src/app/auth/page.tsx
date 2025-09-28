"use client";
import { useState, useCallback, FormEvent } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import SignInForm from "@/components/auth/sign-in-form";
import SignUpForm from "@/components/auth/sign-up-form";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import { Home } from "lucide-react";

// Types for errors
type SignUpErrors = {
  username?: string;
  email?: string;
  password?: string;
  retypePassword?: string;
};

export default function AuthPage() {
  const router = useRouter();
  const [signUpErrors, setSignUpErrors] = useState<SignUpErrors>({});

  // Dummy submit function
  const submitForm = useCallback(
    async (payload: Record<string, string> & { type: "sign-in" | "sign-up" }) => {
      console.log("Submitting payload:", payload);
      await new Promise((res) => setTimeout(res, 700));
      return { ok: true, message: "Submitted (dummy)" };
    },
    [],
  );

  // Validation
  const validateSignUp = (username: string, password: string, retypePassword: string) => {
    const errors: SignUpErrors = {};

    if (!username || username.length < 6 || username.length > 32)
      errors.username = "Username must be 6–32 characters";
    else if (/^\d+$/.test(username)) errors.username = "Username cannot be only numbers";

    if (!password || password.length < 12 || password.length > 64)
      errors.password = "Password must be 12–64 characters";
    else {
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      const hasSpecial = /[^\w\s]/.test(password);
      if (!(hasUpper && hasLower && hasDigit && hasSpecial))
        errors.password =
          "Password must include 1 uppercase, 1 lowercase, 1 number, and 1 special character";
    }

    if (password !== retypePassword) errors.retypePassword = "Passwords do not match";

    return errors;
  };

  const handleSignInSubmit = async (e: FormEvent, username: string, password: string) => {
    e.preventDefault();
    const res = await submitForm({
      type: "sign-in",
      username,
      password,
    });
    if (res.ok) {
      alert("Signed in (dummy)");
    }
  };

  const handleSignUpSubmit = async (
    e: FormEvent,
    username: string,
    email: string,
    password: string,
    retypePassword: string,
  ) => {
    e.preventDefault();
    const errors = validateSignUp(username, password, retypePassword);
    if (Object.keys(errors).length > 0) {
      setSignUpErrors(errors);
      return;
    }
    setSignUpErrors({});
    const res = await submitForm({
      type: "sign-up",
      username,
      email,
      password,
      retypePassword,
    });
    if (res.ok) {
      // Redirect to verification page (dummy)
      router.push("/verify/1");
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen flex items-center justify-center gap-30 p-2 sm:p-4 md:p-8 lg:p-12 xl:p-20">
        <div className="flex flex-col items-center mb-10 gap-4">
          <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
            Welcome to PeerPrep
          </h1>
          <h3 className="scroll-m-20 text-center text-2xl font-semibold tracking-tight text-balance">
            Collaborate, learn, and prepare for your technical interviews with peers
          </h3>
          <Image src="/images/peerprep.png" alt="PeerPrep" width={400} height={400} />
        </div>
        <div className="w-full max-w-sm flex-col gap-6 flex">
          <Tabs defaultValue="sign-in">
            <TabsList className="grid w-full grid-cols-3 items-center text-center">
              <div className="flex justify-center">
                <Home
                  className="text-muted-foreground hover:cursor-pointer text-2xl"
                  onClick={() => router.push("/")}
                />
              </div>
              <div className="flex justify-center">
                <TabsTrigger value="sign-in">Sign In</TabsTrigger>
              </div>
              <div className="flex justify-center">
                <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
              </div>
            </TabsList>

            {/* Sign In */}
            <TabsContent value="sign-in">
              <SignInForm onSubmit={handleSignInSubmit} />
            </TabsContent>

            {/* Sign Up */}
            <TabsContent value="sign-up">
              <SignUpForm onSubmit={handleSignUpSubmit} errors={signUpErrors} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

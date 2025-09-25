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
import { Eye, EyeOff } from "lucide-react";

// Types for errors
type SignUpErrors = {
  username?: string;
  email?: string;
  password?: string;
  retypePassword?: string;
};

export default function AuthPage() {
  // Sign In fields
  const [signInUsername, setSignInUsername] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up fields
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpRetypePassword, setSignUpRetypePassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpRetypePassword, setShowSignUpRetypePassword] = useState(false);

  // Errors
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
  const validateSignUp = () => {
    const errors: SignUpErrors = {};

    if (/^\d+$/.test(signUpUsername)) errors.username = "Username cannot be only numbers";
    if (!signUpUsername || signUpUsername.length < 6 || signUpUsername.length > 32)
      errors.username = "Username must be 6–32 characters";

    if (!signUpPassword || signUpPassword.length < 12 || signUpPassword.length > 64)
      errors.password = "Password must be 12–64 characters";
    else {
      const hasUpper = /[A-Z]/.test(signUpPassword);
      const hasLower = /[a-z]/.test(signUpPassword);
      const hasDigit = /[0-9]/.test(signUpPassword);
      const hasSpecial = /[^\w\s]/.test(signUpPassword);
      if (!(hasUpper && hasLower && hasDigit && hasSpecial))
        errors.password =
          "Password must include 1 uppercase, 1 lowercase, 1 number, and 1 special character";
    }

    if (signUpPassword !== signUpRetypePassword) errors.retypePassword = "Passwords do not match";

    return errors;
  };

  const handleSignInSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await submitForm({
      type: "sign-in",
      username: signInUsername,
      password: signInPassword,
    });
    if (res.ok) alert("Signed in (dummy)");
  };

  const handleSignUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateSignUp();
    if (Object.keys(errors).length > 0) {
      setSignUpErrors(errors);
      return;
    }
    setSignUpErrors({});
    const res = await submitForm({
      type: "sign-up",
      username: signUpUsername,
      email: signUpEmail,
      password: signUpPassword,
      retypePassword: signUpRetypePassword,
    });
    if (res.ok) alert("Signed up (dummy)");
  };

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
            <form onSubmit={handleSignInSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>Welcome back — please sign in.</CardDescription>
                </CardHeader>

                <CardContent className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="signin-username">Username</Label>
                    <Input
                      id="signin-username"
                      name="username"
                      value={signInUsername}
                      onChange={(e) => setSignInUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-3 relative">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showSignInPassword ? "text" : "password"}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        onCopy={(e) => e.preventDefault()}
                        onPaste={(e) => e.preventDefault()}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                      >
                        {showSignInPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button type="submit">Sign in</Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* Sign Up */}
          <TabsContent value="sign-up">
            <form onSubmit={handleSignUpSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Sign Up</CardTitle>
                  <CardDescription>Create a new account.</CardDescription>
                </CardHeader>

                <CardContent className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      name="username"
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                      required
                    />
                    {signUpErrors.username && (
                      <p className="text-red-600 text-sm">{signUpErrors.username}</p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                    {signUpErrors.email && (
                      <p className="text-red-600 text-sm">{signUpErrors.email}</p>
                    )}
                  </div>

                  <div className="grid gap-3 relative">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showSignUpPassword ? "text" : "password"}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      >
                        {showSignUpPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    </div>
                    {signUpErrors.password && (
                      <p className="text-red-600 text-sm">{signUpErrors.password}</p>
                    )}
                  </div>

                  <div className="grid gap-3 relative">
                    <Label htmlFor="signup-retype-password">Retype password</Label>
                    <div className="relative">
                      <Input
                        id="signup-retype-password"
                        name="retypePassword"
                        type={showSignUpRetypePassword ? "text" : "password"}
                        value={signUpRetypePassword}
                        onChange={(e) => setSignUpRetypePassword(e.target.value)}
                        onCopy={(e) => e.preventDefault()}
                        onPaste={(e) => e.preventDefault()}
                        required
                        className="pr-10"
                      />

                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowSignUpRetypePassword(!showSignUpRetypePassword)}
                      >
                        {showSignUpRetypePassword ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    </div>
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

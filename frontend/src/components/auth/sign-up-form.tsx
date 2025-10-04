"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import MessageDialog from "../ui/message-dialog";
import { Spinner } from "@/components/ui/spinner";

type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  message: string;
  verificationToken?: string;
};

type Errors = {
  username?: string;
  email?: string;
  password?: string;
  retypePassword?: string;
};

type BackendError = {
  error: string;
};

export default function SignUpForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const router = useRouter();

  const validateSignUp = (
    username: string,
    email: string,
    password: string,
    retypePassword: string,
  ) => {
    const errors: Errors = {};
    if (username.trim() == email.trim()) errors.username = "Username cannot be the same as email";
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

  const mutation = useMutation<RegisterResponse, AxiosError<BackendError>, RegisterRequest>({
    mutationFn: async (newUser) => {
      const res = await axios.post("http://localhost:8080/v1/register", newUser);
      return res.data;
    },
    onSuccess: (data) => {
      setUsername("");
      setEmail("");
      setPassword("");
      setRetypePassword("");
      setErrors({});
      const verificationToken = data.verificationToken;
      if (verificationToken) {
        router.push(`/verify/${verificationToken}`);
      }
    },
    onError: (error) => {
      setOpen(true);
      setMessage("Registration failed");
      const backendMessage = error.response?.data?.error;
      setDescription(backendMessage || error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate first
    const validationErrors = validateSignUp(username, email, password, retypePassword);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    mutation.mutate({ username, email, password });
  };

  const isLoading = mutation.isPending;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create a new account.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            {/* Username */}
            <div className="grid gap-3">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              {errors.username && <p className="text-red-600 text-sm">{errors.username}</p>}
            </div>

            {/* Email */}
            <div className="grid gap-3">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="grid gap-3 relative">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
            </div>

            {/* Retype Password */}
            <div className="grid gap-3 relative">
              <Label htmlFor="signup-retype-password">Retype password</Label>
              <div className="relative">
                <Input
                  id="signup-retype-password"
                  name="retypePassword"
                  type={showRetypePassword ? "text" : "password"}
                  value={retypePassword}
                  onChange={(e) => setRetypePassword(e.target.value)}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowRetypePassword(!showRetypePassword)}
                >
                  {showRetypePassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.retypePassword && (
                <p className="text-red-600 text-sm">{errors.retypePassword}</p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit">{isLoading ? <Spinner variant="ellipsis" /> : "Sign up"} </Button>
          </CardFooter>
        </Card>
      </form>
      <MessageDialog open={open} setOpen={setOpen} title={message} description={description} />
    </div>
  );
}

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
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import MessageDialog from "../ui/message-dialog";
import { Spinner } from "@/components/ui/spinner";

type LoginRequest = {
  username: string;
  password: string;
};

type LoginResponse = {
  message: string;
  accessToken?: string;
};

type BackendError = {
  error: string;
};

export default function SignInForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const mutation = useMutation<LoginResponse, AxiosError<BackendError>, LoginRequest>({
    mutationFn: async (user) => {
      const res = await axios.post("http://localhost:8080/v1/login", user);
      return res.data;
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken ?? null);
      console.log(accessToken);
      setOpen(true);
      setMessage("Login successful");
    },
    onError: (error) => {
      setOpen(true);
      setMessage("Login failed");
      const backendMessage = error.response?.data?.error;
      setDescription(backendMessage || error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ username, password });
  };

  const isLoading = mutation.isPending;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Welcome back — please sign in.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            {/* Username */}
            <div className="grid gap-3">
              <Label htmlFor="signin-username">Username</Label>
              <Input
                id="signin-username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="grid gap-3 relative">
              <div className="flex items-center">
                <Label htmlFor="signin-password">Password</Label>
                <Link
                  href="/forgot-pw"
                  className="text-center text-sm text-gray-500 hover:underline ml-auto"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="signin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
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
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit">{isLoading ? <Spinner /> : "Sign in"}</Button>
          </CardFooter>
        </Card>
      </form>
      <MessageDialog open={open} setOpen={setOpen} title={message} description={description} />
    </div>
  );
}

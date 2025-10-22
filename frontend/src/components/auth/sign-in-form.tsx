"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { useRouter } from "next/navigation";
import { DialogState, defaultDialogState } from "@/types/dialog";
import { useAuthContext } from "@/contexts/auth-context";

type FormValues = {
  username: string;
  password: string;
};

type LoginRequest = {
  username: string;
  password: string;
};

type LoginResponse = {
  message: string;
  userId: string;
  accessToken: string;
};

type BackendError = {
  error: string;
};

export default function SignInForm() {
  const router = useRouter();
  const { checkAuth } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(defaultDialogState);

  const mutation = useMutation<LoginResponse, AxiosError<BackendError>, LoginRequest>({
    mutationFn: async (user) => {
      const res = await axios.post(`http://localhost:8001/v1/login`, user, {
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: async (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      await checkAuth(); // Update auth context
      setDialog({
        open: true,
        message: "Login successful",
        description: "",
        icon: "circle-check",
      });
      reset();
      router.push(`/matching`);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.error;
      setDialog({
        open: true,
        message: "Login failed",
        description: backendMessage || error.message,
        icon: "circle-x",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate({ username: data.username, password: data.password });
  };

  const isLoading = mutation.isPending;

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
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
                {...register("username", { required: "Username is required" })}
                aria-invalid={!!errors.username}
              />
              {errors.username && <p className="text-red-600 text-sm">{errors.username.message}</p>}
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
                  type={showPassword ? "text" : "password"}
                  className="pr-10"
                  {...register("password", { required: "Password is required" })}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : "Sign in"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <MessageDialog
        open={dialog.open}
        setOpen={(open: boolean) => setDialog((prev) => ({ ...prev, open }))}
        title={dialog.message}
        description={dialog.description}
        icon={dialog.icon}
      />
    </div>
  );
}

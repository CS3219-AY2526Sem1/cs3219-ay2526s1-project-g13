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
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import MessageDialog from "../ui/message-dialog";
import { Spinner } from "@/components/ui/spinner";
import { DialogState, defaultDialogState } from "@/types/dialog";

type FormValues = {
  username: string;
  email: string;
  password: string;
  retypePassword: string;
};

type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  message: string;
  verificationToken?: string;
};

type BackendError = {
  error: string;
};

export default function SignUpForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      retypePassword: "",
    },
  });
  const [dialog, setDialog] = useState<DialogState>(defaultDialogState);

  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);

  // mutation
  const mutation = useMutation<RegisterResponse, AxiosError<BackendError>, RegisterRequest>({
    mutationFn: async (newUser) => {
      const res = await axios.post("http://localhost:8080/v1/register", newUser);
      return res.data;
    },
    onSuccess: (data) => {
      reset();
      const verificationToken = data.verificationToken;
      if (verificationToken) {
        router.push(`/verify/${verificationToken}`);
      }
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.error;
      setDialog({
        open: true,
        message: "Registration failed",
        description: backendMessage || error.message,
        icon: "circle-x",
      });
    },
  });

  const isLoading = mutation.isPending;

  const usernameValidate = (value: string) => {
    const email = getValues("email") || "";
    if (value.trim() === email.trim()) return "Username cannot be the same as email";
    if (!value || value.length < 6 || value.length > 32) return "Username must be 6–32 characters";
    if (/^\d+$/.test(value)) return "Username cannot be only numbers";
    return true;
  };

  const emailValidate = (value: string) => {
    if (!value) return "Email is required";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) return "Enter a valid email";
    return true;
  };

  const passwordValidate = (value: string) => {
    if (!value || value.length < 12 || value.length > 64)
      return "Password must be 12–64 characters";
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[^\w\s]/.test(value);
    if (!(hasUpper && hasLower && hasDigit && hasSpecial))
      return "Password must include 1 uppercase, 1 lowercase, 1 number, and 1 special character";
    return true;
  };

  const retypeValidate = (value: string) => {
    if (value !== getValues("password")) return "Passwords do not match";
    return true;
  };

  const onSubmit = (data: FormValues) => {
    mutation.mutate({ username: data.username, email: data.email, password: data.password });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
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
                {...register("username", {
                  required: "Username is required",
                  validate: usernameValidate,
                })}
              />
              {errors.username && <p className="text-red-600 text-sm">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div className="grid gap-3">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  validate: emailValidate,
                })}
              />
              {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="grid gap-3 relative">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  className="pr-10"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  {...register("password", {
                    required: "Password is required",
                    validate: passwordValidate,
                  })}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
            </div>

            {/* Retype Password */}
            <div className="grid gap-3 relative">
              <Label htmlFor="signup-retype-password">Retype password</Label>
              <div className="relative">
                <Input
                  id="signup-retype-password"
                  type={showRetypePassword ? "text" : "password"}
                  className="pr-10"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  {...register("retypePassword", {
                    required: "Please retype your password",
                    validate: retypeValidate,
                  })}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowRetypePassword((s) => !s)}
                >
                  {showRetypePassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.retypePassword && (
                <p className="text-red-600 text-sm">{errors.retypePassword.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : "Sign up"}
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

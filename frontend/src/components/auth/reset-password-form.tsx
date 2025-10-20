"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import MessageDialog from "../ui/message-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useParams, useRouter } from "next/navigation";

type FormValues = {
  password: string;
  retypePassword: string;
};

export default function ResetPasswordForm() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      password: "",
      retypePassword: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");

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

  const mutation = useMutation<
    { success: boolean; message: string },
    AxiosError<{ error: string }>,
    { resetPasswordToken: string; newPassword: string }
  >({
    mutationFn: async (payload) => {
      const res = await axios.post("http://localhost:8001/v1/reset-password", payload);
      return res.data;
    },
    onSuccess: () => {
      setOpen(true);
      setMessage("Password reset successful");
      setDescription("You may now log in with your new password");
      setIcon("circle-check");
    },
    onError: (error) => {
      const backendMsg = error.response?.data?.error || error.message;
      setOpen(true);
      setMessage("Reset failed");
      setDescription(backendMsg);
      setIcon("circle-x");
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!token) {
      setOpen(true);
      setMessage("Reset password failed");
      setDescription("Wrong reset password link");
      return;
    }
    mutation.mutate({ resetPasswordToken: token, newPassword: data.password });
  };

  const isLoading = mutation.isPending;

  return (
    <div className="flex items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="ml-20 mr-20 mt-10 w-[400px]">
          <CardHeader>
            <CardTitle>Enter a new password to secure your account</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-6">
            {/* New Password */}
            <div className="grid gap-3 relative">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  className="pr-10"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  aria-invalid={!!errors.password}
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

            {/* Confirm New Password */}
            <div className="grid gap-3 relative">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showRetypePassword ? "text" : "password"}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  aria-invalid={!!errors.retypePassword}
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
              {isLoading ? <Spinner /> : "Reset Password"}
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

      <MessageDialog
        open={open}
        setOpen={setOpen}
        title={message}
        description={description}
        icon={icon}
      />
    </div>
  );
}

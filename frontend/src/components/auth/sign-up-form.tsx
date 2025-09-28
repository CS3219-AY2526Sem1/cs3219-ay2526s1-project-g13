"use client";

import { useState, FormEvent } from "react";
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

type Errors = {
  username?: string;
  email?: string;
  password?: string;
  retypePassword?: string;
};

type SignUpFormProps = {
  onSubmit: (
    e: FormEvent<HTMLFormElement>,
    username: string,
    email: string,
    password: string,
    retypePassword: string,
  ) => void;
  errors?: Errors;
};

export default function SignUpForm({ onSubmit, errors = {} }: SignUpFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);

  return (
    <form onSubmit={(e) => onSubmit(e, username, email, password, retypePassword)}>
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
          <Button type="submit">Sign up</Button>
        </CardFooter>
      </Card>
    </form>
  );
}

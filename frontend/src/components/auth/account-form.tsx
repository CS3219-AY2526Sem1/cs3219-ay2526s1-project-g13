"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff } from "lucide-react";
import React from "react";
import { useAccountForm } from "@/hooks/use-account-form";

type AccountFormProps = {
  email: string;
  originalUsername: string;
  setDialog: (dialog: {
    open: boolean;
    message: string;
    description: string;
    icon: string;
  }) => void;
};

export default function AccountForm({ email, originalUsername, setDialog }: AccountFormProps) {
  const {
    form,
    setForm,
    editMode,
    setEditMode,
    errors,
    showPassword,
    setShowPassword,
    handleCancel,
    handleSaveChanges,
    isLoading,
  } = useAccountForm({ email, originalUsername, setDialog });

  return (
    <Card className="mr-8 mt-10 ml-8 max-h-screen">
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account details</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        {/* Username */}
        <div className="grid gap-3">
          <Label htmlFor="username">Username</Label>
          <div className="flex items-center">
            <Input
              id="username"
              name="username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              disabled={!editMode}
              required
            />
          </div>
        </div>
        {errors.username && <p className="text-red-600 text-sm">{errors.username}</p>}

        {/* Email */}
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <div className="flex items-center">
            <Input id="email" name="email" type="email" value={email} disabled required />
          </div>
        </div>

        {/* Password */}
        <div className="grid gap-3 relative">
          <Label htmlFor="current-password">Current Password</Label>
          <div className="relative">
            <Input
              id="current-password"
              name="current-password"
              type={showPassword.current ? "text" : "password"}
              value={form.currentPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              disabled={!editMode}
              className="pr-10"
              onCopy={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={!editMode}
              onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
            >
              {showPassword.current ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Input
              id="new-password"
              name="new-password"
              type={showPassword.new ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              disabled={!editMode}
              onCopy={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={!editMode}
              onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
            >
              {showPassword.new ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>
        {errors.invalidPassword && <p className="text-red-600 text-sm">{errors.invalidPassword}</p>}

        <div className="grid gap-3">
          <Label htmlFor="confirm-new-password">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirm-new-password"
              name="confirm-new-password"
              type={showPassword.confirm ? "text" : "password"}
              value={form.confirmNewPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
              disabled={!editMode}
              onCopy={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={!editMode}
              onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
            >
              {showPassword.confirm ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>
        {errors.emptyPassword && <p className="text-red-600 text-sm">{errors.emptyPassword}</p>}
        {errors.unmatchedPasswords && (
          <p className="text-red-600 text-sm">{errors.unmatchedPasswords}</p>
        )}
      </CardContent>

      <div className="flex gap-2 mr-6 ml-6 mb-6">
        {editMode ? (
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        ) : (
          <Button variant="default" className="flex-1" onClick={() => setEditMode(true)}>
            Edit
          </Button>
        )}
        <Button className="flex-1" onClick={handleSaveChanges} disabled={!editMode}>
          {isLoading ? <Spinner /> : "Save Changes"}
        </Button>
      </div>
    </Card>
  );
}

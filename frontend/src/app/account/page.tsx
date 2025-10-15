"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/ui/nav-bar";
import axios from "axios";
import { Spinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import MessageDialog from "@/components/ui/message-dialog";
import { Eye, EyeOff } from "lucide-react";

type Errors = {
  username?: string;
  emptyPassword?: string;
  invalidPassword?: string;
  unmatchedPasswords?: string;
};

export default function AccountPage() {
  // Fetched values
  const [email, setEmail] = useState("");
  const [originalUsername, setoriginalUsername] = useState("");

  // Form values
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Other states
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [icon, setIcon] = useState("");

  // Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.error("No access token found");
        return;
      }

      try {
        const res = await axios.get(`http://localhost:8080/v1/account`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUsername(res.data.username);
        setoriginalUsername(res.data.username);
        setEmail(res.data.email);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleCancel = () => {
    setUsername(originalUsername);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setErrors({});
    setEditMode(false);
  };

  const validateCredentials = (
    username: string,
    newPassword: string,
    confirmNewPassword: string,
  ) => {
    const errors: Errors = {};
    if (username) {
      if (username.trim() == email.trim()) errors.username = "Username cannot be the same as email";
      if (!username || username.length < 6 || username.length > 32)
        errors.username = "Username must be 6–32 characters";
      else if (/^\d+$/.test(username)) errors.username = "Username cannot be only numbers";
    }
    if (!currentPassword.trim() && !newPassword.trim() && !confirmNewPassword.trim()) {
      return errors;
    }
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      errors.emptyPassword = "Please fill in all password fields";
    }

    if (!newPassword || newPassword.length < 12 || newPassword.length > 64)
      errors.invalidPassword = "Password must be 12–64 characters";
    else {
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasLower = /[a-z]/.test(newPassword);
      const hasDigit = /[0-9]/.test(newPassword);
      const hasSpecial = /[^\w\s]/.test(newPassword);
      if (!(hasUpper && hasLower && hasDigit && hasSpecial))
        errors.invalidPassword =
          "Password must include 1 uppercase, 1 lowercase, 1 number, and 1 special character";
    }

    if (newPassword !== confirmNewPassword) errors.unmatchedPasswords = "Passwords do not match";

    return errors;
  };

  const mutation = useMutation<
    { success: boolean; message: string },
    AxiosError<{ error: string }>,
    { username: string; currentPassword: string; newPassword: string }
  >({
    mutationFn: async (payload) => {
      const accessToken = localStorage.getItem("accessToken");
      const res = await axios.post("http://localhost:8080/v1/update-account", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setOpen(true);
      setMessage("Updated user profile successfully");
      setDescription(data.message);
      setEditMode(false);
      setIcon("user-round-check");
    },
    onError: (error) => {
      setOpen(true);
      setMessage("Update user profile failed");
      setDescription(error.response?.data?.error || error.message);
      setIcon("circle-x");
    },
  });

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCredentials(username, newPassword, confirmNewPassword);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    mutation.mutate({ username, currentPassword, newPassword });
  };

  const isLoading = mutation.isPending;

  return (
    <div>
      <Navbar />
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                name="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={!editMode}
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={!editMode}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
          {errors.invalidPassword && (
            <p className="text-red-600 text-sm">{errors.invalidPassword}</p>
          )}

          <div className="grid gap-3">
            <Label htmlFor="confirm-new-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-new-password"
                name="confirm-new-password"
                type={showConfirmNewPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={!editMode}
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={!editMode}
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              >
                {showConfirmNewPassword ? <Eye size={20} /> : <EyeOff size={20} />}
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

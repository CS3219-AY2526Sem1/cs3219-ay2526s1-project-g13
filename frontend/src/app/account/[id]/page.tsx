"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/ui/nav-bar";

export default function AccountPage() {
  const { id } = useParams();
  console.log("User ID from URL:", id);

  // State variables for user details and form inputs
  const [username, setUsername] = useState("JohnDoe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [editMode, setEditMode] = useState(false);
  const handleSaveChanges = () => {
    // empty for now
  };

  return (
    <div>
      <Navbar />

      <Card className="mr-30 mt-10 ml-30 max-h-screen">
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

          {/* Email */}
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center">
              <Input
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!editMode}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid gap-3 relative">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              name="current-password"
              type="text"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={!editMode}
              required
              className="pr-10"
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              name="new-password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={!editMode}
              required
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="confirm-new-password">Confirm New Password</Label>
            <Input
              id="confirm-new-password"
              name="confirm-new-password"
              type="text"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={!editMode}
              required
            />
          </div>
        </CardContent>
        <div className="flex gap-2 mr-6 ml-6">
          {editMode ? (
            <Button variant="destructive" className="flex-1" onClick={() => setEditMode(!editMode)}>
              Cancel
            </Button>
          ) : (
            <Button variant="default" className="flex-1" onClick={() => setEditMode(!editMode)}>
              Edit
            </Button>
          )}
          <Button className="flex-1" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}

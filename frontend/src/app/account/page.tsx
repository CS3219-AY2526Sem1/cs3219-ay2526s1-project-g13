"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/ui/nav-bar";
import MessageDialog from "@/components/ui/message-dialog";
import AccountForm from "@/components/auth/account-form";
import { useAuthContext } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/auth/protected-route";
import { DialogState, defaultDialogState } from "@/types/dialog";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [dialog, setDialog] = useState<DialogState>(defaultDialogState);
  const { user } = useAuthContext();

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  return (
    <ProtectedRoute>
      <div>
        <Navbar />
        <AccountForm email={email} originalUsername={username} setDialog={setDialog} />
        <MessageDialog
          open={dialog.open}
          setOpen={dialog.setOpen || ((open: boolean) => setDialog((prev) => ({ ...prev, open })))}
          title={dialog.message}
          description={dialog.description}
          icon={dialog.icon}
          showCloseButton={dialog.showCloseButton}
        />
      </div>
    </ProtectedRoute>
  );
}

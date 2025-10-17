"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/ui/nav-bar";
import MessageDialog from "@/components/ui/message-dialog";
import AccountForm from "@/components/auth/account-form";
import { useAuth } from "@/hooks/use-auth";

type DialogState = {
  open: boolean;
  message: string;
  description: string;
  icon: string;
};

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    message: "",
    description: "",
    icon: "",
  });

  const { authRequest } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authRequest({
          method: "GET",
          url: "http://localhost:8080/v1/account",
          withCredentials: true,
        });

        setUsername(res.data.username);
        setEmail(res.data.email);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setDialog({
          open: true,
          message: "Login session expired",
          description: "Please log in again.",
          icon: "circle-x",
        });
      }
    };
    fetchUser();
  }, [authRequest]);

  return (
    <div>
      <Navbar />
      <AccountForm email={email} originalUsername={username} setDialog={setDialog} />
      <MessageDialog
        open={dialog.open}
        setOpen={() => {}}
        title={dialog.message}
        description={dialog.description}
        icon={dialog.icon}
        showCloseButton={false}
      />
    </div>
  );
}

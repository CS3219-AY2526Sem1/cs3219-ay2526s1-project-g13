"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/nav-bar";
import MessageDialog from "@/components/ui/message-dialog";
import AccountForm from "@/components/auth/account-form";
import { useAuth } from "@/hooks/use-auth";
import { DialogState, defaultDialogState } from "@/types/dialog";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [dialog, setDialog] = useState<DialogState>(defaultDialogState);

  const { authRequest } = useAuth();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const fetchUser = async () => {
      try {
        const res = await authRequest({
          method: "GET",
          url: "http://localhost:8001/v1/account",
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
          setOpen: () => {},
          showCloseButton: false,
        });
        timeout = setTimeout(() => {
          router.push("/auth");
        }, 5000);
      }
    };
    fetchUser();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [authRequest, router]);

  return (
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
  );
}

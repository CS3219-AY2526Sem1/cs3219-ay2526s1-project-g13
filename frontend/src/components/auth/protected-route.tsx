"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import MessageDialog from "@/components/ui/message-dialog";
import { DialogState, defaultDialogState } from "@/types/dialog";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthContext();
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(defaultDialogState);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Check if this is due to token expiration (not just no token)
      const accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        // Token exists but auth failed - likely expired
        setShowExpiredDialog(true);
        setDialog({
          open: true,
          message: "Session expired",
          description: "Your login session has expired. Please log in again.",
          icon: "circle-x",
          setOpen: () => {},
          showCloseButton: false,
        });

        setTimeout(() => {
          router.push("/auth");
        }, 3000);
      } else {
        // No token - redirect immediately
        router.push("/auth");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {showExpiredDialog && (
          <MessageDialog
            open={dialog.open}
            setOpen={
              dialog.setOpen || ((open: boolean) => setDialog((prev) => ({ ...prev, open })))
            }
            title={dialog.message}
            description={dialog.description}
            icon={dialog.icon}
            showCloseButton={dialog.showCloseButton}
          />
        )}
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      </>
    );
  }

  return <>{children}</>;
}

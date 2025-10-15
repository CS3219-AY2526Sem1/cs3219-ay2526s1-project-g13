"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MailCheck, UserRoundCheck, CircleCheck, CircleX } from "lucide-react";

interface MessageDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: string;
}

// default icon mapping
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "mail-check": MailCheck,
  "user-round-check": UserRoundCheck,
  "circle-check": CircleCheck,
  "circle-x": CircleX,
};

export default function MessageDialog({
  open,
  setOpen,
  title,
  description,
  icon,
}: MessageDialogProps) {
  const IconComponent = icon ? iconMap[icon] || null : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col items-center justify-center space-y-1">
        {/* Icon */}
        {IconComponent && <IconComponent size={40} className="text-primary" />}

        {/* Text */}
        <div className="flex flex-col items-center text-center space-y-1">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

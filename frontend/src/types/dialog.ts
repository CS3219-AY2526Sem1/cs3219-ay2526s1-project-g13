export type DialogState = {
  open: boolean;
  message: string;
  description: string;
  icon: string;
  setOpen?: (open: boolean) => void;
  showCloseButton?: boolean;
};

export const defaultDialogState: DialogState = {
  open: false,
  message: "",
  description: "",
  icon: "",
};

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";

type Errors = {
  username?: string;
  emptyPassword?: string;
  invalidPassword?: string;
  unmatchedPasswords?: string;
};

type FormState = {
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type ShowPasswordState = {
  current: boolean;
  new: boolean;
  confirm: boolean;
};

type UseAccountFormProps = {
  email: string;
  originalUsername: string;
  setDialog: (dialog: {
    open: boolean;
    message: string;
    description: string;
    icon: string;
  }) => void;
};

export function useAccountForm({ email, originalUsername, setDialog }: UseAccountFormProps) {
  const [form, setForm] = useState<FormState>({
    username: originalUsername,
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState<ShowPasswordState>({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, username: originalUsername }));
  }, [originalUsername]);

  const handleCancel = () => {
    setForm({
      username: originalUsername,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setErrors({});
    setEditMode(false);
  };

  const validateCredentials = (form: FormState) => {
    const errors: Errors = {};
    if (form.username) {
      if (form.username.trim() === email.trim())
        errors.username = "Username cannot be the same as email";
      if (!form.username || form.username.length < 6 || form.username.length > 32)
        errors.username = "Username must be 6–32 characters";
      else if (/^\d+$/.test(form.username)) errors.username = "Username cannot be only numbers";
    }
    const anyPasswordFilled = form.currentPassword || form.newPassword || form.confirmNewPassword;
    if (anyPasswordFilled) {
      if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
        errors.emptyPassword = "Please fill in all password fields";
      }
      if (!form.newPassword || form.newPassword.length < 12 || form.newPassword.length > 64)
        errors.invalidPassword = "Password must be 12–64 characters";
      else {
        const hasUpper = /[A-Z]/.test(form.newPassword);
        const hasLower = /[a-z]/.test(form.newPassword);
        const hasDigit = /[0-9]/.test(form.newPassword);
        const hasSpecial = /[^\w\s]/.test(form.newPassword);
        if (!(hasUpper && hasLower && hasDigit && hasSpecial))
          errors.invalidPassword =
            "Password must include 1 uppercase, 1 lowercase, 1 number, and 1 special character";
      }
      if (form.newPassword !== form.confirmNewPassword)
        errors.unmatchedPasswords = "Passwords do not match";
    }
    return errors;
  };

  const mutation = useMutation<
    { success: boolean; message: string },
    AxiosError<{ error: string }>,
    { username: string; currentPassword: string; newPassword: string }
  >({
    mutationFn: async (payload) => {
      const accessToken = localStorage.getItem("accessToken");
      const res = await axios.post("http://localhost:8001/v1/update-account", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setDialog({
        open: true,
        message: "Updated user profile successfully",
        description: data.message,
        icon: "user-round-check",
      });
      setEditMode(false);
    },
    onError: (error) => {
      setDialog({
        open: true,
        message: "Update user profile failed",
        description: error.response?.data?.error || error.message,
        icon: "circle-x",
      });
    },
  });

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCredentials(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    mutation.mutate({
      username: form.username,
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  };

  return {
    form,
    setForm,
    editMode,
    setEditMode,
    errors,
    setErrors,
    showPassword,
    setShowPassword,
    handleCancel,
    handleSaveChanges,
    isLoading: mutation.isPending,
  };
}

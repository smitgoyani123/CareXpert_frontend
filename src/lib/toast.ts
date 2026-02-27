// src/lib/toast.ts
import { toast } from "sonner";

let activeToastId: string | number | undefined;

const show = (
  type: "success" | "error" | "info" | "warning",
  message: string
) => {
  if (activeToastId) {
    toast.dismiss(activeToastId);
  }

  switch (type) {
    case "success":
      activeToastId = toast.success(message);
      break;
    case "error":
      activeToastId = toast.error(message);
      break;
    case "info":
      activeToastId = toast(message);
      break;
    case "warning":
      activeToastId = toast(message);
      break;
  }
};

export const notify = {
  success: (message: string) => show("success", message),
  error: (message: string) => show("error", message),
  info: (message: string) => show("info", message),
  warning: (message: string) => show("warning", message),
};
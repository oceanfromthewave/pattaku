import { toast } from "react-toastify";

export const notifySuccess = (msg) =>
  toast.success(msg, {
    position: "top-center",
    autoClose: 3000,
    pauseOnHover: true,
    theme: "dark",
  });

export const notifyError = (msg) =>
  toast.error(msg, {
    position: "top-center",
    autoClose: 3000,
    pauseOnHover: true,
    theme: "dark",
  });

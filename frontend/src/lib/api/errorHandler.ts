import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

export const handleApiError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    // Clear token and redirect to login
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
  throw error;
};

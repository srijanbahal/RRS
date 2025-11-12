import { CheckCircle, AlertCircle, X } from "lucide-react";
// Use relative path to fix build resolution error
import { useAuth } from "../../store/authStore";

export default function Notification() {
  const { error, successMessage, clearMessages } = useAuth();

  const message = error || successMessage;
  const type = error ? "error" : "success";

  if (!message) return null;

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg ${
        type === "error"
          ? "border-red-500/30 bg-red-900/40 text-red-100 backdrop-blur-md"
          : "border-emerald-500/30 bg-emerald-900/40 text-emerald-100 backdrop-blur-md"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {type === "error" ? (
          <AlertCircle className="h-5 w-5 text-red-400" />
        ) : (
          <CheckCircle className="h-5 w-5 text-emerald-400" />
        )}
      </div>
      <div className="flex-1 text-sm">
        <p className="font-medium">
          {type === "error" ? "An error occurred" : "Success"}
        </p>
        <p className="mt-1 text-white/80">{message}</p>
      </div>
      <button
        onClick={clearMessages}
        className="ml-2 shrink-0 rounded-full p-1 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
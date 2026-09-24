import { createContext, useCallback, useContext, useRef, useState } from "react";
import { HiCheckCircle, HiXMark } from "react-icons/hi2";

const ToastContext = createContext();

const DEFAULT_DURATION = 5500;
const EXIT_DURATION = 320; // keep in sync with .animate-toast-out in index.css

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  // Two-step removal so the toast gets to play its fade/slide-out animation
  // instead of just vanishing: first mark it "exiting" (swaps its CSS
  // animation), then actually drop it from state once that animation ends.
  const dismissToast = useCallback((id) => {
    setToasts((current) =>
      current.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, EXIT_DURATION);
  }, []);

  // showToast("Message") or showToast({ title, message, duration })
  const showToast = useCallback(
    (opts) => {
      const { title = "Done", message = "", duration = DEFAULT_DURATION } =
        typeof opts === "string" ? { message: opts } : opts || {};

      const id = ++idRef.current;
      setToasts((current) => [...current, { id, title, message, duration, exiting: false }]);

      if (duration > 0) {
        setTimeout(() => dismissToast(id), duration);
      }
      return id;
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      <div className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex w-[calc(100%-2.5rem)] max-w-sm flex-col items-end gap-3">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismissToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  return (
    <div
      role="status"
      className={`pointer-events-auto w-full overflow-hidden rounded-xl bg-[#0b1b23] shadow-2xl ring-1 ring-black/10 ${
        toast.exiting ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-blue-400">
          <HiCheckCircle className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{toast.title}</p>
          {toast.message && (
            <p className="mt-0.5 text-sm leading-snug text-gray-300">{toast.message}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="-mr-1 -mt-1 flex-none rounded-full p-1 text-gray-500 transition-colors hover:text-gray-300"
        >
          <HiXMark className="h-4 w-4" />
        </button>
      </div>

      {toast.duration > 0 && !toast.exiting && (
        <div className="h-0.5 w-full bg-white/10">
          <div
            className="animate-toast-progress h-full bg-blue-500"
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

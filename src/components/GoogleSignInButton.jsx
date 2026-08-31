import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Renders our own custom-styled "G" button, but the actual click is
// delegated to Google's own hidden button (Google Identity Services
// requires its own rendered button/element to trigger the sign-in flow —
// this keeps our UI consistent while still using the real, secure flow).
export default function GoogleSignInButton({ className = "" }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const hiddenButtonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function init() {
      if (!window.google?.accounts?.id || !hiddenButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      // Render Google's real button into our hidden container so it's a
      // legitimate, clickable Google element (required for the popup flow)
      window.google.accounts.id.renderButton(hiddenButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
      });

      setReady(true);
    }

    if (window.google?.accounts?.id) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          init();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  async function handleCredentialResponse(response) {
    setError("");
    try {
      await loginWithGoogle(response.credential);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed.");
    }
  }

  function handleCustomButtonClick() {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-in isn't configured yet.");
      return;
    }
    // Forward the click to Google's real (invisible) button
    hiddenButtonRef.current?.querySelector("div[role=button]")?.click();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCustomButtonClick}
        title={GOOGLE_CLIENT_ID ? "Continue with Google" : "Google sign-in not configured"}
        className={className}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.11A12 12 0 0 0 12 24Z"/>
          <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4-3.11Z"/>
          <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"/>
        </svg>
      </button>

      {/* Google's real (functional) button, rendered off-screen */}
      <div
        ref={hiddenButtonRef}
        className="absolute pointer-events-none opacity-0"
        style={{ top: 0, left: 0, height: 1, width: 1, overflow: "hidden" }}
      />

      {error && (
        <p className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max max-w-[200px] text-center text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

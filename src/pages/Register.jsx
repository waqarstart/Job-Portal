import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineUser, HiOutlineEnvelope, HiOutlineLockClosed,
  HiOutlineEye, HiOutlineEyeSlash,
} from "react-icons/hi2";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [comingSoon, setComingSoon] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms and Conditions to continue.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">H</div>
          <span className="text-lg font-bold text-gray-900">HireHub</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 text-center">Create your account</h1>
          <p className="mt-1 text-gray-500 text-center">Join and start applying</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Full name</label>
              <div className="relative mt-1.5">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative mt-1.5">
                <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1.5">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative mt-1.5">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="font-medium text-blue-600 hover:text-blue-700">
                  Terms and Conditions
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">Or continue with</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {comingSoon && (
            <p className="mb-3 text-center text-xs text-gray-500">{comingSoon}</p>
          )}

          <div className="flex justify-center gap-3">
            <GoogleSignInButton className="flex h-11 w-11 items-center justify-center rounded-xl border hover:bg-gray-50" />

            <button
              type="button"
              onClick={() => setComingSoon("LinkedIn sign-in is coming soon.")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border hover:bg-gray-50"
              title="Continue with LinkedIn"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setComingSoon("Apple sign-in is coming soon.")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border hover:bg-gray-50"
              title="Continue with Apple"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000">
                <path d="M16.36 1.43c0 1.14-.42 2.2-1.24 3.08-.99 1.06-2.29 1.7-3.65 1.58-.16-1.31.44-2.6 1.24-3.44.94-1 2.4-1.65 3.65-1.22ZM19.44 17.13c-.4.93-.88 1.79-1.44 2.6-.79 1.13-1.61 2.26-2.9 2.28-1.24.03-1.65-.73-3.08-.73-1.44 0-1.9.71-3.08.76-1.24.05-2.19-1.22-2.99-2.34C4.4 17.14 3.15 12.9 4.85 10c.84-1.44 2.34-2.35 3.98-2.37 1.2-.03 2.34.81 3.08.81.73 0 2.12-1 3.57-.85.61.03 2.32.25 3.42 1.87-.09.06-2.04 1.19-2.02 3.55.03 2.82 2.48 3.76 2.51 3.77-.02.07-.4 1.36-1.35 2.68Z"/>
              </svg>
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Login
            </Link>
          </p>
      </div>
    </main>
  );
}

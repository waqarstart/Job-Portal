import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineLockClosed,
  HiOutlineEnvelope,
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
  HiCheck,
} from "react-icons/hi2";
import Navbar from "../components/Navbar";
import { forgotPassword } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/images/forgot-password-bg.jpg)" }}
    >
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl md:grid-cols-2">
          {/* ── Left: form ── */}
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <HiOutlineLockClosed className="h-7 w-7 text-blue-600" />
            </div>

            <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
              Forgot your password?
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-center text-sm text-gray-500">
              No worries. Enter your email and we&apos;ll send you a secure reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                  {message}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative mt-1.5">
                  <HiOutlineEnvelope className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <HiOutlineArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>

          {/* ── Right: illustration ── */}
          <div className="relative hidden items-center justify-center overflow-hidden bg-blue-50/60 p-10 md:flex">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/70 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-100/70 blur-2xl" />

            <div className="relative w-full max-w-[240px]">
              {/* Browser-style card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
                <div className="mb-4 flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gray-200" />
                  <span className="h-2 w-2 rounded-full bg-gray-200" />
                  <span className="h-2 w-2 rounded-full bg-gray-200" />
                </div>

                <div className="flex items-center gap-2.5">
                  <HiOutlineUserCircle className="h-9 w-9 text-gray-300" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2 w-3/4 rounded-full bg-gray-200" />
                    <div className="h-2 w-1/2 rounded-full bg-gray-100" />
                  </div>
                </div>

                <div className="mt-4 flex gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-blue-200" />
                  ))}
                </div>
              </div>

              {/* Verified badge */}
              <div className="absolute -right-4 -top-4 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 shadow-md ring-4 ring-white">
                <HiCheck className="h-5 w-5 text-white" />
              </div>

              {/* Email icon */}
              <div className="absolute -bottom-4 -left-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-md ring-4 ring-white">
                <HiOutlineEnvelope className="h-5 w-5 text-blue-600" />
              </div>

              {/* Shield icon */}
              <div className="absolute -bottom-5 -right-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-md ring-4 ring-white">
                <HiOutlineShieldCheck className="h-6 w-6 text-white" />
              </div>
            </div>

            <p className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <HiOutlineShieldCheck className="h-4 w-4 text-gray-400" />
              Your account security matters to us.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

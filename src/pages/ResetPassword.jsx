import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import Navbar from "../components/Navbar";
import { resetPassword } from "../services/authService";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password.");
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
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <HiOutlineLockClosed className="h-7 w-7 text-blue-600" />
          </div>

          <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Reset your password
          </h1>

          {success ? (
            <>
              <div className="mt-6 flex flex-col items-center gap-2 rounded-xl bg-green-50 px-4 py-6 text-center">
                <HiOutlineCheckCircle className="h-8 w-8 text-green-600" />
                <p className="text-sm font-medium text-green-700">
                  Password updated! Redirecting you to login...
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="mx-auto mt-2 max-w-xs text-center text-sm text-gray-500">
                Choose a new password to secure your account.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    New password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 py-3 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 py-3 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Back to login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

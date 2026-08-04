import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          to="/"
          className="text-2xl font-bold text-blue-600"
        >
          Job Portal
        </Link>

        {!user ? (
          <div className="flex gap-4">
            <Link
              to="/login"
              className="rounded-lg border border-blue-600 px-5 py-2 text-blue-600 transition hover:bg-blue-50"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="font-medium">
              {user.name}
            </span>

            {user.role === "admin" ? (
              <Link
                to="/admin"
                className="text-blue-600"
              >
                Admin
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="text-blue-600"
              >
                Dashboard
              </Link>
            )}

            <button
              onClick={logout}
              className="rounded-lg bg-red-500 px-4 py-2 text-white"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.name}
        </h1>

        <p className="mt-2 text-gray-600">
          Manage your account and job applications.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Link
            to="/my-applications"
            className="rounded-xl border bg-white p-6 shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">
              My Applications
            </h2>

            <p className="mt-2 text-gray-500">
              View all jobs you've applied for.
            </p>
          </Link>

          <Link
            to="/"
            className="rounded-xl border bg-white p-6 shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">
              Search Jobs
            </h2>

            <p className="mt-2 text-gray-500">
              Browse and apply for more jobs.
            </p>
          </Link>
        </div>
      </main>
    </>
  );
}
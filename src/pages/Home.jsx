import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
} from "react-icons/hi2";

import Navbar from "../components/Navbar";
import { searchJobs } from "../services/jobApi";

export default function Home() {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await searchJobs(title);

      const filtered = data.filter((job) => {
        if (!city) return true;

        return (
          job.candidate_required_location &&
          job.candidate_required_location
            .toLowerCase()
            .includes(city.toLowerCase())
        );
      });

      setJobs(filtered);
    } catch (err) {
      console.error(err);
      alert("Unable to fetch jobs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h1 className="text-center text-5xl font-bold text-white">
            Find Your Next Job
          </h1>

          <p className="mt-4 text-center text-lg text-blue-100">
            Search jobs by title and city.
          </p>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 grid max-w-5xl gap-4 rounded-2xl bg-white p-4 shadow-xl md:grid-cols-[1fr_1fr_auto]"
          >
            <div className="flex items-center rounded-xl border px-4">
              <HiOutlineMagnifyingGlass className="mr-3 h-5 w-5 text-gray-400" />

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Job title"
                className="h-14 w-full outline-none"
              />
            </div>

            <div className="flex items-center rounded-xl border px-4">
              <HiOutlineMapPin className="mr-3 h-5 w-5 text-gray-400" />

              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="h-14 w-full outline-none"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-8 font-semibold text-white transition hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-8 text-3xl font-bold">
          Available Jobs
        </h2>

        {loading && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            Loading jobs...
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            Search for a job to begin.
          </div>
        )}

        <div className="space-y-5">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/interview/${job.id}`}
              state={{ job }}
              className="block rounded-xl border bg-white p-6 shadow-sm transition duration-200 hover:border-blue-600 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">
                    {job.title}
                  </h3>

                  <p className="mt-2 text-gray-600">
                    📍 {job.candidate_required_location}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Posted{" "}
                    {new Date(
                      job.publication_date
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <button className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
                    Start Interview →
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
import { HiOutlineMagnifyingGlass, HiOutlineMapPin } from "react-icons/hi2";

export default function SearchBox() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold text-gray-900">
            Find Your Next Job
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Search thousands of jobs by title and location.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl rounded-2xl bg-white p-4 shadow-xl">
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            {/* Job Title */}

            <div className="flex items-center rounded-xl border border-gray-200 px-4">
              <HiOutlineMagnifyingGlass className="mr-3 h-5 w-5 text-gray-400" />

              <input
                type="text"
                placeholder="Job title"
                className="h-14 w-full bg-transparent outline-none"
              />
            </div>

            {/* City */}

            <div className="flex items-center rounded-xl border border-gray-200 px-4">
              <HiOutlineMapPin className="mr-3 h-5 w-5 text-gray-400" />

              <input
                type="text"
                placeholder="City"
                className="h-14 w-full bg-transparent outline-none"
              />
            </div>

            {/* Search Button */}

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-10 text-white transition hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
// function Home() {
//   return (
//     <div>
//       <h1>Home Page</h1>
//     </div>
//   );
// }

// export default Home;

// import {
//   HiOutlineMagnifyingGlass,
//   HiOutlineMapPin,
// } from "react-icons/hi2";

// export default function Home() {
//   return (
//     <main className="min-h-screen bg-gray-50">
//       {/* Hero */}
//       <section className="bg-blue-600">
//         <div className="mx-auto max-w-7xl px-6 py-20">
//           <div className="mx-auto max-w-4xl text-center">
//             <h1 className="text-5xl font-bold text-white">
//               Find Your Next Job
//             </h1>

//             <p className="mt-4 text-lg text-blue-100">
//               Search jobs by title and city.
//             </p>
//           </div>

//           {/* Search Box */}
//           <div className="mx-auto mt-10 max-w-5xl rounded-2xl bg-white p-4 shadow-xl">
//             <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
//               {/* Job Title */}
//               <div className="flex items-center rounded-xl border border-gray-200 px-4">
//                 <HiOutlineMagnifyingGlass className="mr-3 h-5 w-5 text-gray-400" />

//                 <input
//                   type="text"
//                   placeholder="Job title"
//                   className="h-14 w-full bg-transparent outline-none"
//                 />
//               </div>

//               {/* City */}
//               <div className="flex items-center rounded-xl border border-gray-200 px-4">
//                 <HiOutlineMapPin className="mr-3 h-5 w-5 text-gray-400" />

//                 <input
//                   type="text"
//                   placeholder="City"
//                   className="h-14 w-full bg-transparent outline-none"
//                 />
//               </div>

//               {/* Search Button */}
//               <button
//                 type="submit"
//                 className="h-14 rounded-xl bg-blue-600 px-8 font-semibold text-white transition hover:bg-blue-700"
//               >
//                 Search
//               </button>
//             </form>
//           </div>
//         </div>
//       </section>

//       {/* Placeholder for Job Listings */}
//       <section className="mx-auto max-w-7xl px-6 py-16">
//         <h2 className="mb-6 text-3xl font-bold text-gray-900">
//           Latest Jobs
//         </h2>

//         <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
//           Job listings will appear here...
//         </div>
//       </section>
//     </main>
//   );
// }

import { useState } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
} from "react-icons/hi2";

import { searchJobs } from "../services/jobApi";

export default function Home() {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");

  const [jobs, setJobs] = useState([]);

  async function handleSearch(e) {
    e.preventDefault();

    const data = await searchJobs(title);

    const filtered = data.filter((job) => {
      if (!city) return true;

      return job.candidate_required_location
        .toLowerCase()
        .includes(city.toLowerCase());
    });

    setJobs(filtered);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 py-20">

          <h1 className="text-center text-5xl font-bold text-white">
            Find Your Next Job
          </h1>

          <p className="mt-4 text-center text-blue-100">
            Search by title and city.
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 grid max-w-5xl gap-4 rounded-2xl bg-white p-4 shadow-xl md:grid-cols-[1fr_1fr_auto]"
          >
            <div className="flex items-center rounded-xl border px-4">
              <HiOutlineMagnifyingGlass className="mr-3 text-gray-400" />

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-14 w-full outline-none"
                placeholder="Job title"
              />
            </div>

            <div className="flex items-center rounded-xl border px-4">
              <HiOutlineMapPin className="mr-3 text-gray-400" />

              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-14 w-full outline-none"
                placeholder="City"
              />
            </div>

            <button
              className="rounded-xl bg-blue-600 px-8 font-semibold text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">

        <div className="space-y-4">

          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">
                {job.title}
              </h2>

              <p className="mt-2 text-gray-600">
                📍 {job.candidate_required_location}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Posted {new Date(job.publication_date).toLocaleDateString()}
              </p>
            </div>
          ))}

        </div>

      </section>
    </main>
  );
}
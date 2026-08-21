import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineBriefcase,
  HiOutlineUsers,
  HiOutlineStar,
  HiOutlineVideoCamera,
} from "react-icons/hi2";
import HRLayout from "../../layouts/HRLayout";
import { getHRDashboard } from "../../services/hrService";
import { useAuth } from "../../context/AuthContext";

export default function HRDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getHRDashboard().then(setStats).catch(console.error);
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <HRLayout title="HR Dashboard">
      
      

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={HiOutlineBriefcase} color="blue" label="Active Jobs" value={stats?.activeJobs ?? "—"} />
        <StatCard icon={HiOutlineUsers} color="purple" label="Total Applicants" value={stats?.totalApplicants ?? "—"} />
        <StatCard icon={HiOutlineStar} color="amber" label="Shortlisted" value={stats?.shortlisted ?? "—"} />
        <StatCard icon={HiOutlineVideoCamera} color="teal" label="Interviews" value={stats?.interviews ?? "—"} />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <QuickLink to="/hr/post-job" color="blue" label="Post a New Job" desc="Create a job listing for candidates" />
        <QuickLink to="/hr/applicants" color="purple" label="Review Applicants" desc="See who applied to your jobs" />
        <QuickLink to="/hr/company" color="teal" label="Company Profile" desc="Update your company information" />
      </div>
    </HRLayout>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    teal: "bg-teal-50 text-teal-600",
  };
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function QuickLink({ to, color, label, desc }) {
  const colors = {
    blue: "border-blue-200 bg-blue-50 hover:bg-blue-100",
    purple: "border-purple-200 bg-purple-50 hover:bg-purple-100",
    teal: "border-teal-200 bg-teal-50 hover:bg-teal-100",
  };
  return (
    <Link to={to} className={`rounded-2xl border p-5 transition ${colors[color]}`}>
      <p className="font-semibold">{label}</p>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </Link>
  );
}

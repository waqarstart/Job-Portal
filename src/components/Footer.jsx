import { useNavigate, useLocation } from "react-router-dom";
import {
  HiOutlineEnvelope, HiOutlineChatBubbleBottomCenterText, HiOutlineMapPin,
} from "react-icons/hi2";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

// Site-wide footer — same on every page (Home, Companies, ...). Kept as its
// own component so pages other than Home can render it too without
// duplicating this markup.
export default function Footer() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleFindJobs() {
    navigate("/find-jobs");
  }

  function handleImHiring() {
    if (isLoggedIn && user?.role === "hr") { navigate("/hr/post-job"); return; }
    if (isLoggedIn && user?.role === "admin") { navigate("/admin/dashboard"); return; }
    navigate("/register");
  }

  function handleCareerAdvice() {
    if (location.pathname === "/") {
      document.getElementById("career-resources")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#career-resources");
    }
  }

  return (
    <footer className="bg-[#0b1526] text-gray-300 px-6 pt-12 pb-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

        <div>
          <div className="flex items-center gap-2 mb-3">
            <img src="/images/tekky-icon.png" alt="Tekky Job" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold text-white">Tekky Job</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your trusted partner in finding the perfect job. Explore opportunities, connect with top companies, and build your future.
          </p>
          <div className="flex items-center gap-3 mt-4">
            {[FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram].map((Icon, i) => (
              <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-all duration-300 hover:bg-blue-600 hover:text-white hover:scale-110">
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">For Job Seekers</p>
          <ul className="space-y-2 text-sm">
            <li><button onClick={handleFindJobs} className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Browse Jobs</button></li>
            <li><button onClick={handleFindJobs} className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Advanced Search</button></li>
            <li><button onClick={handleCareerAdvice} className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Career Advice</button></li>
            <li><button onClick={() => navigate(isLoggedIn ? "/dashboard" : "/register")} className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Create Profile</button></li>
            <li><button onClick={() => navigate(isLoggedIn ? "/dashboard/settings" : "/register")} className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Job Alerts</button></li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">For Employers</p>
          <ul className="space-y-2 text-sm">
            <li><button onClick={handleImHiring} className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Post a Job</button></li>
            <li><button onClick={() => navigate("/login")} className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Browse Candidates</button></li>
            <li><button onClick={() => alert("Pricing plans are coming soon.")} className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Pricing Plans</button></li>
            <li><button onClick={() => navigate("/login")} className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Employer Login</button></li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Company</p>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">About Us</a></li>
            <li><a href="#" className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Contact Us</a></li>
            <li><a href="#" className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Terms of Service</a></li>
            <li><a href="#" className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Privacy Policy</a></li>
            <li><a href="#" className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Help Center</a></li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Contact Us</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><HiOutlineEnvelope className="h-4 w-4 shrink-0" /> support@tekkyjob.com</li>
            <li className="flex items-center gap-2"><HiOutlineChatBubbleBottomCenterText className="h-4 w-4 shrink-0" /> +92 300 1234567</li>
            <li className="flex items-start gap-2"><HiOutlineMapPin className="h-4 w-4 shrink-0 mt-0.5" /> 123 Business Avenue, Lahore, Pakistan</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Tekky Job. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <a href="#" className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Privacy Policy</a>
          <a href="#" className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Terms of Service</a>
          <a href="#" className="inline-block transition-all duration-300 hover:text-white hover:translate-x-1">Sitemap</a>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineUser, HiOutlineBuildingOffice2, HiOutlineBriefcase,
  HiOutlineDocumentText, HiOutlineCalendarDays, HiOutlineBell,
  HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineCreditCard,
  HiOutlineSwatch, HiOutlinePuzzlePiece, HiOutlineExclamationTriangle,
  HiOutlineChevronRight, HiOutlineArrowRight,
} from "react-icons/hi2";
import HRLayout from "../../layouts/HRLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getMyProfile, updateMyProfile, updateSettings,
  changeEmail, changePassword, deactivateAccount, deleteAccount,
} from "../../services/userService";

const CARDS = [
  {
    key: "account", tab: "account", title: "Account", icon: HiOutlineUser,
    iconBg: "bg-blue-50", iconColor: "text-blue-600",
    description: "Manage your personal information and account security.",
    bullets: ["Profile Information", "Change Password", "Email Address", "Two-Factor Authentication", "Login Activity"],
    wired: true,
  },
  {
    key: "company", tab: "company", title: "Company", icon: HiOutlineBuildingOffice2,
    iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
    description: "Update your company details and preferences.",
    bullets: ["Company Information", "Company Description", "Company Logo", "Industry & Size", "Company Visibility"],
    wired: true,
  },
  {
    key: "hiring", tab: null, title: "Hiring Preferences", icon: HiOutlineBriefcase,
    iconBg: "bg-violet-50", iconColor: "text-violet-600",
    description: "Set default preferences for job posting and hiring.",
    bullets: ["Default Job Type", "Default Work Mode", "Application Deadline", "Auto-close Expired Jobs", "Candidate Auto-Response"],
    wired: false,
  },
  {
    key: "application", tab: null, title: "Application Settings", icon: HiOutlineDocumentText,
    iconBg: "bg-amber-50", iconColor: "text-amber-600",
    description: "Configure application process and requirements.",
    bullets: ["Application Statuses", "Resume/CV Requirements", "Allow Multiple Applications", "Application Retention", "Custom Questions"],
    wired: false,
  },
  {
    key: "interview", tab: null, title: "Interview Settings", icon: HiOutlineCalendarDays,
    iconBg: "bg-rose-50", iconColor: "text-rose-600",
    description: "Manage interview process and scheduling.",
    bullets: ["Interview Types", "Default Duration", "Interview Reminders", "Calendar Integration", "Automatic Emails"],
    wired: false,
  },
  {
    key: "notifications", tab: "notifications", title: "Notifications", icon: HiOutlineBell,
    iconBg: "bg-amber-50", iconColor: "text-amber-600",
    description: "Control in-app and email notifications.",
    bullets: ["Email Notifications", "In-app Notifications", "New Application Alerts", "Interview Reminders", "Job Expiration Alerts"],
    wired: true,
  },
  {
    key: "team", tab: "team", title: "Team & Permissions", icon: HiOutlineUserGroup,
    iconBg: "bg-cyan-50", iconColor: "text-cyan-600",
    description: "Manage your team members and their permissions.",
    bullets: ["Team Members", "Invite Members", "Roles & Permissions", "Permission Management", "Activity Log"],
    wired: false,
  },
  {
    key: "security", tab: "security", title: "Privacy & Security", icon: HiOutlineShieldCheck,
    iconBg: "bg-blue-50", iconColor: "text-blue-600",
    description: "Manage security, privacy and data protection.",
    bullets: ["Profile Visibility", "Data Privacy", "Login Sessions", "Security Activity", "Data Export"],
    wired: false,
  },
  {
    key: "billing", tab: "billing", title: "Billing & Subscription", icon: HiOutlineCreditCard,
    iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
    description: "View billing details and manage your subscription.",
    bullets: ["Current Plan", "Billing Information", "Payment Methods", "Invoices & History", "Usage & Limits"],
    wired: false,
  },
  {
    key: "appearance", tab: null, title: "Appearance", icon: HiOutlineSwatch,
    iconBg: "bg-violet-50", iconColor: "text-violet-600",
    description: "Customize the look and feel of your dashboard.",
    bullets: ["Theme (Light / Dark)", "Layout Style", "Language", "Date & Time Format", "Time Zone"],
    wired: false,
  },
  {
    key: "integrations", tab: "integrations", title: "Integrations", icon: HiOutlinePuzzlePiece,
    iconBg: "bg-blue-50", iconColor: "text-blue-600",
    description: "Connect with third-party tools and services.",
    bullets: ["Calendar Integration", "Email Integration", "Video Interview Tools", "Slack / Teams", "API & Webhooks"],
    wired: false,
  },
  {
    key: "danger", tab: null, title: "Danger Zone", icon: HiOutlineExclamationTriangle,
    iconBg: "bg-red-50", iconColor: "text-red-600", danger: true,
    description: "Irreversible actions that affect your account and data.",
    bullets: ["Deactivate Account", "Delete Company Account", "Delete All Candidate Data", "Logout from All Devices"],
    wired: true,
  },
];

const TABS = [
  { key: "all",           label: "All Settings" },
  { key: "account",       label: "Account" },
  { key: "company",       label: "Company" },
  { key: "team",          label: "Team" },
  { key: "notifications", label: "Notifications" },
  { key: "billing",       label: "Billing" },
  { key: "integrations",  label: "Integrations" },
  { key: "security",      label: "Security" },
];

export default function HRSettings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [openCard, setOpenCard] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => { getMyProfile().then(setProfile); }, []);

  const visibleCards = activeTab === "all" ? CARDS : CARDS.filter((c) => c.tab === activeTab);

  function toggleCard(key) {
    setOpenCard((prev) => (prev === key ? null : key));
  }

  async function handleToggle(field) {
    const updated = { [field]: !profile[field] };
    const result = await updateSettings(updated);
    setProfile(result);
  }

  return (
    <HRLayout title="Settings" subtitle="Manage your HR account and system preferences">

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 overflow-x-auto hide-scrollbar rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              activeTab === t.key ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleCards.map((card) => (
          <button
            key={card.key}
            onClick={() => toggleCard(card.key)}
            className={`flex flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
              card.danger ? "border-red-100" : "border-gray-100"
            } ${openCard === card.key ? "ring-2 ring-blue-500" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <HiOutlineChevronRight className="h-4 w-4 text-gray-300" />
            </div>

            <h3 className={`mt-3 font-bold ${card.danger ? "text-red-600" : "text-gray-900"}`}>{card.title}</h3>
            <p className="mt-1 text-xs text-gray-400 leading-relaxed">{card.description}</p>

            <ul className="mt-3 space-y-1.5">
              {card.bullets.map((b) => (
                <li key={b} className={`flex items-center gap-1.5 text-xs ${card.danger ? "text-red-500" : "text-gray-500"}`}>
                  <span className={`h-1 w-1 shrink-0 rounded-full ${card.danger ? "bg-red-400" : "bg-gray-300"}`} />
                  {b}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Expanded panel */}
      {openCard && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {openCard === "account" && <AccountPanel user={user} />}
          {openCard === "company" && <CompanyPanel />}
          {openCard === "notifications" && profile && (
            <NotificationsPanel profile={profile} onToggle={handleToggle} />
          )}
          {openCard === "danger" && <DangerPanel logout={logout} />}
          {!["account", "company", "notifications", "danger"].includes(openCard) && (
            <ComingSoonPanel card={CARDS.find((c) => c.key === openCard)} />
          )}
        </div>
      )}

      <footer className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 pt-5 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Tekky Job. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-gray-600 transition">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600 transition">Terms of Service</a>
          <a href="#" className="hover:text-gray-600 transition">Help Center</a>
        </div>
      </footer>
    </HRLayout>
  );
}

// ── Panels ─────────────────────────────────────────────────────────────────────

function AccountPanel({ user }) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await updateMyProfile({ name, phone });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-gray-900">Account</h2>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Profile Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
            className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number"
            className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
        </div>
        <button onClick={saveProfile} disabled={savingProfile}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {savingProfile ? "Saving…" : "Save"}
        </button>
        {profileSaved && <span className="ml-3 text-sm text-green-600">Saved.</span>}
      </div>

      <div className="border-t border-gray-50 pt-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Email Address</h3>
        <ChangeEmailForm currentEmail={user?.email} />
      </div>

      <div className="border-t border-gray-50 pt-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Change Password</h3>
        <ChangePasswordForm />
      </div>

      <div className="border-t border-gray-50 pt-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Two-Factor Authentication</h3>
        <p className="text-sm text-gray-400">Not enabled yet — this feature is coming soon.</p>
      </div>

      <div className="border-t border-gray-50 pt-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Login Activity</h3>
        <p className="text-sm text-gray-400">Session/device history isn't tracked yet — coming soon.</p>
      </div>
    </div>
  );
}

function CompanyPanel() {
  return (
    <div>
      <h2 className="font-bold text-gray-900">Company</h2>
      <p className="mt-1 text-sm text-gray-500">
        Company name, description, logo, industry, size and visibility are all managed on your full Company Profile page.
      </p>
      <Link
        to="/hr/company"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
      >
        Go to Company Profile <HiOutlineArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function NotificationsPanel({ profile, onToggle }) {
  return (
    <div>
      <h2 className="font-bold text-gray-900 mb-4">Notifications</h2>
      <div className="divide-y divide-gray-50">
        <ToggleRow label="Email Notifications" description="Receive email updates about your account and hiring activity"
          value={profile.emailNotifications} onChange={() => onToggle("emailNotifications")} />
        <ToggleRow label="New Application Alerts" description="Get notified when a candidate applies to one of your jobs"
          value={profile.applicationUpdates} onChange={() => onToggle("applicationUpdates")} />
        <ToggleRow label="Interview Reminders" description="Receive reminders for upcoming interviews"
          value={profile.interviewReminders} onChange={() => onToggle("interviewReminders")} />
        <ToggleRow label="In-app Notifications" description="Coming soon" value={false} disabled />
        <ToggleRow label="Job Expiration Alerts" description="Coming soon" value={false} disabled />
      </div>
    </div>
  );
}

function DangerPanel({ logout }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <h2 className="font-bold text-red-600 mb-1">Danger Zone</h2>
      <p className="text-sm text-gray-500 mb-4">These actions are irreversible — proceed carefully.</p>

      <div className="divide-y divide-gray-50 rounded-xl border border-red-100">
        <DangerRow
          label="Deactivate Account"
          description="Temporarily disable your account and hide your company profile."
          open={expanded === "deactivate"} onToggle={() => setExpanded(expanded === "deactivate" ? null : "deactivate")}
        >
          <DeactivateForm logout={logout} />
        </DangerRow>

        <DangerRow
          label="Delete Company Account"
          description="Permanently delete your account and company data."
          open={expanded === "delete"} onToggle={() => setExpanded(expanded === "delete" ? null : "delete")}
        >
          <DeleteForm logout={logout} />
        </DangerRow>

        <DangerRow label="Delete All Candidate Data" description="Coming soon" disabled />

        <button onClick={logout} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition">
          Logout from All Devices
          <HiOutlineChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ComingSoonPanel({ card }) {
  if (!card) return null;
  return (
    <div className="text-center py-6">
      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
        <card.icon className="h-6 w-6" />
      </div>
      <h2 className="font-bold text-gray-900">{card.title}</h2>
      <p className="mt-1 text-sm text-gray-400">This section isn't available yet — we're still building it.</p>
    </div>
  );
}

// ── Small shared bits ────────────────────────────────────────────────────────

function ToggleRow({ label, description, value, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          disabled ? "bg-gray-100 cursor-not-allowed" : value ? "bg-blue-600 cursor-pointer" : "bg-gray-300 cursor-pointer"
        }`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function DangerRow({ label, description, open, onToggle, disabled, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
          disabled ? "text-gray-300 cursor-not-allowed" : "text-red-600 hover:bg-red-50"
        }`}
      >
        <div>
          <p className="font-medium">{label}</p>
          {description && <p className={`text-xs ${disabled ? "text-gray-300" : "text-red-400"}`}>{description}</p>}
        </div>
        {!disabled && <HiOutlineChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />}
      </button>
      {open && <div className="border-t border-red-50 bg-red-50/40 px-4 py-4">{children}</div>}
    </div>
  );
}

function ChangeEmailForm({ currentEmail }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handle() {
    setError(""); setLoading(true);
    try {
      await changeEmail(email, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update email.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return <p className="text-sm text-green-600">Email updated to {email}.</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Current: {currentEmail}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input type="email" placeholder="New email address" value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      <input type="password" placeholder="Current password" value={password} onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      <button onClick={handle} disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Updating..." : "Update Email"}
      </button>
    </div>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handle() {
    setError(""); setLoading(true);
    try {
      await changePassword(current, newPass);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return <p className="text-sm text-green-600">Password updated successfully.</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      <input type="password" placeholder="New password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      <button onClick={handle} disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}

function DeactivateForm({ logout }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handle() {
    setError(""); setLoading(true);
    try {
      await deactivateAccount();
      logout();
    } catch (err) {
      setError(err.response?.data?.message || "Could not deactivate account.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-gray-600">Your account and company profile will be hidden until you log back in.</p>
      <button onClick={handle} disabled={loading}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
        {loading ? "Deactivating..." : "Deactivate My Account"}
      </button>
    </div>
  );
}

function DeleteForm({ logout }) {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handle() {
    setError(""); setLoading(true);
    try {
      await deleteAccount(password);
      logout();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete account.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-gray-600">This permanently deletes your account and company profile. Type <strong>DELETE</strong> to confirm.</p>
      <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE"
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-500" />
      <input type="password" placeholder="Current password" value={password} onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-500" />
      <button onClick={handle} disabled={loading || confirmText !== "DELETE"}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40">
        {loading ? "Deleting..." : "Permanently Delete Account"}
      </button>
    </div>
  );
}

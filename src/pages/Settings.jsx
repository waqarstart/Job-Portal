import { useEffect, useState } from "react";
import { HiOutlineChevronRight } from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import { useAuth } from "../context/AuthContext";
import {
  getMyProfile,
  updateSettings,
  changeEmail,
  changePassword,
  deactivateAccount,
  deleteAccount,
} from "../services/userService";

export default function Settings() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  function toggle(key) {
    setExpanded((prev) => (prev === key ? null : key));
  }

  async function handleToggle(field) {
    const updated = { [field]: !profile[field] };
    const result = await updateSettings(updated);
    setProfile(result);
  }

  return (
    <CandidateLayout title="Settings" subtitle="Manage your account, privacy and notification preferences.">
      <div className="max-w-2xl space-y-6">

        {/* ── Account ── */}
        <SettingsSection title="Account">
          <ExpandableRow
            label="Change Email"
            open={expanded === "email"}
            onToggle={() => toggle("email")}
          >
            <ChangeEmailForm onDone={() => toggle("email")} />
          </ExpandableRow>

          <ExpandableRow
            label="Change Password"
            open={expanded === "password"}
            onToggle={() => toggle("password")}
          >
            <ChangePasswordForm onDone={() => toggle("password")} />
          </ExpandableRow>

          <ExpandableRow
            label="Two-Factor Authentication"
            open={expanded === "2fa"}
            onToggle={() => toggle("2fa")}
          >
            <p className="text-sm text-gray-500">Two-factor authentication is not enabled yet. This feature is coming soon.</p>
          </ExpandableRow>
        </SettingsSection>

        {/* ── Notifications ── */}
        {profile && (
          <SettingsSection title="Notifications">
            <ToggleRow
              label="Email Notifications"
              value={profile.emailNotifications}
              onChange={() => handleToggle("emailNotifications")}
            />
            <ToggleRow
              label="Application Updates"
              value={profile.applicationUpdates}
              onChange={() => handleToggle("applicationUpdates")}
            />
            <ToggleRow
              label="Interview Reminders"
              value={profile.interviewReminders}
              onChange={() => handleToggle("interviewReminders")}
            />
            <ToggleRow
              label="Job Recommendations"
              value={profile.jobRecommendations}
              onChange={() => handleToggle("jobRecommendations")}
            />
          </SettingsSection>
        )}

        {/* ── Privacy ── */}
        {profile && (
          <SettingsSection title="Privacy">
            <ToggleRow
              label="Profile Visibility"
              description="Allow employers to find your profile"
              value={profile.profileVisible}
              onChange={() => handleToggle("profileVisible")}
            />
            <ToggleRow
              label="CV Privacy"
              description="Hide your CV from employers until you apply"
              value={profile.cvPrivate}
              onChange={() => handleToggle("cvPrivate")}
            />
            <ToggleRow
              label="Search Appearance"
              description="Appear in employer and recruiter searches"
              value={profile.searchAppearance}
              onChange={() => handleToggle("searchAppearance")}
            />
          </SettingsSection>
        )}

        {/* ── Danger Zone ── */}
        <SettingsSection title="Danger Zone" danger>
          <ExpandableRow
            label="Deactivate Account"
            open={expanded === "deactivate"}
            onToggle={() => toggle("deactivate")}
            danger
          >
            <DeactivateForm logout={logout} />
          </ExpandableRow>

          <ExpandableRow
            label="Delete Account"
            open={expanded === "delete"}
            onToggle={() => toggle("delete")}
            danger
          >
            <DeleteForm logout={logout} />
          </ExpandableRow>
        </SettingsSection>
      </div>
    </CandidateLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SettingsSection({ title, children, danger }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className={`border-b px-5 py-4 ${danger ? "bg-red-50" : "bg-gray-50"}`}>
        <h2 className={`font-semibold ${danger ? "text-red-700" : "text-gray-800"}`}>{title}</h2>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function ExpandableRow({ label, open, onToggle, children, danger }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm hover:bg-gray-50"
      >
        <span className={danger ? "text-red-600" : "text-gray-700"}>{label}</span>
        <HiOutlineChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="border-t bg-gray-50 px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <button
        onClick={onChange}
        style={{ minWidth: 44 }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${value ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function ChangeEmailForm({ onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await changeEmail(email, password);
      setSuccess(true);
      setTimeout(onDone, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update email.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return <p className="text-sm text-green-600">Email updated successfully.</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input type="email" placeholder="New email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      <input type="password" placeholder="Current password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      <button onClick={handleSubmit} disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Updating..." : "Update Email"}
      </button>
    </div>
  );
}

function ChangePasswordForm({ onDone }) {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await changePassword(current, newPass);
      setSuccess(true);
      setTimeout(onDone, 1500);
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
      <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      <input type="password" placeholder="New password (min 6 chars)" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      <button onClick={handleSubmit} disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}

function DeactivateForm({ logout }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm("Are you sure you want to deactivate your account?")) return;
    setLoading(true);
    try {
      await deactivateAccount();
      logout();
    } catch (err) {
      alert(err.response?.data?.message || "Could not deactivate.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">Your account will be hidden but your data will be kept. You can reactivate by contacting support.</p>
      <button onClick={handle} disabled={loading} className="rounded-lg border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-60">
        {loading ? "Deactivating..." : "Deactivate Account"}
      </button>
    </div>
  );
}

function DeleteForm({ logout }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handle() {
    if (!confirm("Are you absolutely sure? This will permanently delete your account and all data.")) return;
    setError("");
    setLoading(true);
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
      <p className="text-sm text-gray-500">This is permanent and cannot be undone. Enter your password to confirm.</p>
      <input type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-500" />
      <button onClick={handle} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
        {loading ? "Deleting..." : "Delete Account Permanently"}
      </button>
    </div>
  );
}

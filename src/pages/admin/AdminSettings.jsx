import { useState } from "react";
import {
  HiOutlineCog6Tooth, HiOutlineUsers, HiOutlineBuildingOffice2,
  HiOutlineBriefcase, HiOutlineEnvelope, HiOutlineShieldCheck,
  HiOutlineServerStack, HiOutlineLink, HiOutlineCreditCard,
  HiOutlinePaintBrush, HiOutlineExclamationTriangle,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import AdminLayout from "../../layouts/AdminLayout";

const TABS = [
  "All Settings", "General", "Users & Roles", "Companies",
  "Jobs & Applications", "Email & Notifications", "Security", "System",
  "Integrations", "Billing",
];

const CARDS = [
  {
    key: "general",
    tab: "General",
    icon: HiOutlineCog6Tooth,
    iconBg: "bg-blue-50 text-blue-500",
    title: "General Settings",
    desc: "Manage platform basic information and preferences.",
    items: ["Platform Name", "Support Email & Phone", "Default Language", "Time Zone", "Date & Time Format"],
  },
  {
    key: "users",
    tab: "Users & Roles",
    icon: HiOutlineUsers,
    iconBg: "bg-green-50 text-green-500",
    title: "Users & Roles",
    desc: "Manage admins, HRs and system roles.",
    items: ["Admin Users", "Role Management", "Permission Management", "Invite Admins", "Activity Log"],
  },
  {
    key: "companies",
    tab: "Companies",
    icon: HiOutlineBuildingOffice2,
    iconBg: "bg-amber-50 text-amber-500",
    title: "Companies Settings",
    desc: "Configure company registration and verification settings.",
    items: ["Company Registration", "Verification Settings", "Company Limits", "Allowed Features", "Subscription Plans"],
  },
  {
    key: "jobs",
    tab: "Jobs & Applications",
    icon: HiOutlineBriefcase,
    iconBg: "bg-purple-50 text-purple-500",
    title: "Jobs & Applications",
    desc: "Manage job posting and application preferences.",
    items: ["Job Posting Limits", "Application Settings", "Application Statuses", "Auto Expiry Settings", "Custom Questions"],
  },
  {
    key: "email",
    tab: "Email & Notifications",
    icon: HiOutlineEnvelope,
    iconBg: "bg-orange-50 text-orange-500",
    title: "Email & Notifications",
    desc: "Configure email templates and notification preferences.",
    items: ["Email Templates", "SMTP Settings", "In-app Notifications", "System Alerts", "Notification Logs"],
  },
  {
    key: "security",
    tab: "Security",
    icon: HiOutlineShieldCheck,
    iconBg: "bg-red-50 text-red-500",
    title: "Security Settings",
    desc: "Manage security, access and authentication settings.",
    items: ["Password Policy", "Two-Factor Authentication", "Login Attempts", "Captcha Settings", "Session Management"],
  },
  {
    key: "system",
    tab: "System",
    icon: HiOutlineServerStack,
    iconBg: "bg-cyan-50 text-cyan-500",
    title: "System Settings",
    desc: "Configure system behavior and maintenance settings.",
    items: ["Maintenance Mode", "System Backup", "Data Import / Export", "Clear Cache", "System Logs"],
  },
  {
    key: "integrations",
    tab: "Integrations",
    icon: HiOutlineLink,
    iconBg: "bg-indigo-50 text-indigo-500",
    title: "Integrations",
    desc: "Manage third-party services and integrations.",
    items: ["Google reCAPTCHA", "Google Analytics", "Payment Gateways", "Social Login", "API Settings"],
  },
  {
    key: "billing",
    tab: "Billing",
    icon: HiOutlineCreditCard,
    iconBg: "bg-blue-50 text-blue-500",
    title: "Billing & Plans",
    desc: "Manage subscription plans and billing settings.",
    items: ["Subscription Plans", "Pricing Settings", "Payment Methods", "Invoices", "Transaction History"],
  },
  {
    key: "appearance",
    tab: "General",
    icon: HiOutlinePaintBrush,
    iconBg: "bg-pink-50 text-pink-500",
    title: "Appearance",
    desc: "Customize platform appearance and branding.",
    items: ["Logo & Favicon", "Theme Settings", "Primary Color", "Custom CSS", "Branding Settings"],
  },
];

const DANGER_ACTIONS = [
  "Clear System Cache",
  "Reset All Settings",
  "Delete All Data",
  "Disable Platform (Maintenance)",
  "System Backup & Restore",
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("All Settings");

  const visibleCards = activeTab === "All Settings"
    ? CARDS
    : CARDS.filter((c) => c.tab === activeTab);

  return (
    <AdminLayout title="Admin Settings">
      <p className="mb-6 text-sm text-gray-500">Manage system-wide settings and preferences</p>

      {/* ── Tabs ── */}
      <div className="mb-8 flex flex-wrap gap-0 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 pb-3 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Setting Cards Grid ── */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {visibleCards.filter((c) => c.key !== "danger").map((card) => (
          <SettingCard key={card.key} card={card} />
        ))}
      </div>

      {/* ── Danger Zone ── */}
      {(activeTab === "All Settings" || activeTab === "System") && (
        <div className="mt-5 rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <HiOutlineExclamationTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Danger Zone</h3>
              <p className="text-sm text-gray-500">Irreversible actions that affect the entire platform.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {DANGER_ACTIONS.map((action) => (
              <li key={action}>
                <button className="text-sm font-medium text-red-500 hover:text-red-700 hover:underline transition">
                  • {action}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-10 flex items-center justify-between border-t pt-5">
        <p className="text-xs text-gray-400">© 2024 HireHub. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <button className="hover:text-gray-600">Privacy Policy</button>
          <button className="hover:text-gray-600">Terms of Service</button>
          <button className="hover:text-gray-600">Help Center</button>
        </div>
      </div>
    </AdminLayout>
  );
}

function SettingCard({ card }) {
  const { icon: Icon, iconBg, title, desc, items } = card;
  return (
    <div className="group cursor-pointer rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <HiOutlineChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition mt-1" />
      </div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-400 mb-3 leading-relaxed">{desc}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-1 w-1 rounded-full bg-gray-300 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

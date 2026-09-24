import { createContext, useContext, useState } from "react";
import * as auth from "../services/authService";
import { getCandidateDashboard } from "../services/dashboardService";

// Candidates whose profile is below this percentage get a one-time reminder
// popup right after they log in, nudging them to finish it up. Matches the
// employer-search visibility threshold shown in the reminder modal itself.
const PROFILE_REMINDER_THRESHOLD = 75;

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(auth.currentUser());
  // Set to { percent, checklist } when a just-logged-in candidate's profile
  // is below the threshold; the reminder modal (rendered in App.jsx) reads
  // this and clears it via dismissProfileReminder.
  const [profileReminder, setProfileReminder] = useState(null);

  // Best-effort — a candidate whose dashboard call fails just doesn't see
  // the reminder this time; it should never block login itself.
  async function checkProfileReminder(loggedInUser) {
    if (!loggedInUser || loggedInUser.role !== "user") return;
    try {
      const dashboard = await getCandidateDashboard();
      const percent = dashboard?.profileCompletion?.percent;
      if (typeof percent === "number" && percent < PROFILE_REMINDER_THRESHOLD) {
        setProfileReminder({
          percent,
          checklist: dashboard.profileCompletion.checklist || {},
        });
      }
    } catch {
      // Non-critical — skip the reminder silently.
    }
  }

  function dismissProfileReminder() {
    setProfileReminder(null);
  }

  async function login(email, password) {
    const loggedInUser = await auth.login(email, password);
    setUser(loggedInUser);
    checkProfileReminder(loggedInUser);
    return loggedInUser;
  }

  async function loginWithGoogle(credential) {
    const loggedInUser = await auth.loginWithGoogle(credential);
    setUser(loggedInUser);
    checkProfileReminder(loggedInUser);
    return loggedInUser;
  }

  async function register(name, email, password) {
    const newUser = await auth.register(name, email, password);
    setUser(newUser);
    return newUser;
  }

  function logout() {
    auth.logout();
    // Note: we deliberately do NOT call setUser(null) here. Doing so would
    // trigger a React re-render while still on the current page, and any
    // ProtectedRoute on that page would immediately client-side redirect to
    // /login (since user becomes null) — causing a one-frame flash of the
    // Login page before the browser finishes navigating to Home below.
    // Skipping it avoids that extra render entirely; the full page reload
    // (window.location.href) wipes all React/context state anyway.
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        logout,
        register,
        isLoggedIn: !!user,
        profileReminder,
        dismissProfileReminder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import { createContext, useContext, useState } from "react";
import * as auth from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(auth.currentUser());

  async function login(email, password) {
    const loggedInUser = await auth.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function loginWithGoogle(credential) {
    const loggedInUser = await auth.loginWithGoogle(credential);
    setUser(loggedInUser);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

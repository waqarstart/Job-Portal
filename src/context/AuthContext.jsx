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
    setUser(null);
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

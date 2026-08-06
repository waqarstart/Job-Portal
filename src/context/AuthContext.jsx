import { createContext, useContext, useState } from "react";
import * as auth from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(auth.currentUser());

  function login(email, password) {
    const loggedInUser = auth.login(email, password);
    setUser(loggedInUser);
  }

  function register(name, email, password) {
    return auth.register(name, email, password);
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
/**
 * AuthContext.jsx — Single-file, zero-dependency auth context.
 * Hardcoded admin auto-login. No Firebase. No guest mode branches.
 *
 * Exports: AuthProvider, useAuth
 * useAuth() returns: { user, isAuthenticated, isGuest, login, logout, checkPermission }
 */

import { createContext, useState, useContext, useCallback } from "react";

// ── Hardcoded admin user ───────────────────────────────
const ADMIN_USER = {
  uid: "admin-auto-login",
  displayName: "Admin",
  email: "admin@paraph.local",
  role: "admin",
  isGuest: false,
  photoURL: null,
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(ADMIN_USER);

  const isAuthenticated = !!user && !user.isGuest;
  const isGuest = user?.isGuest || false;

  const login = useCallback(async (_email, _password) => {
    // In staging, login always succeeds as admin
    setUser(ADMIN_USER);
  }, []);

  const signup = useCallback(async (_email, _password) => {
    // In staging, signup always succeeds as admin
    setUser(ADMIN_USER);
  }, []);

  const logout = useCallback(() => {
    // In staging, logout just resets to admin (no-op for now)
    setUser(ADMIN_USER);
  }, []);

  const checkPermission = useCallback(
    (level) => {
      if (level === "admin") return user?.role === "admin";
      if (level === "user") return isAuthenticated;
      return true;
    },
    [user, isAuthenticated],
  );

  const value = {
    user,
    isAuthenticated,
    isGuest,
    login,
    signup,
    logout,
    checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

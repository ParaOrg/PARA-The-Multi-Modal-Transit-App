/**
 * Profile.jsx — User profile page.
 * Shows user info from AuthContext. Minimal personalization.
 */

import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  // Safe auth — won't crash if provider missing
  let auth = { user: null, isAuthenticated: false };
  try {
    auth = useAuth();
  } catch (_) {}

  const { user, isAuthenticated } = auth;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-8">👤 Profile</h1>

        {!isAuthenticated ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-4">You are not signed in.</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 bg-purple-800 text-white rounded-lg font-semibold text-sm hover:bg-purple-700"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Avatar + name */}
            <div className="bg-gradient-to-r from-purple-800 to-purple-600 px-6 py-8 text-white">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mb-3">
                {(user?.displayName || user?.email || "U")[0].toUpperCase()}
              </div>
              <h2 className="text-xl font-bold">{user?.displayName || "Commuter"}</h2>
              <p className="text-purple-200 text-sm">{user?.email || "admin@paraph.local"}</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</p>
                <p className="text-sm text-gray-800 capitalize">{user?.role || "user"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">User ID</p>
                <p className="text-sm text-gray-800 font-mono text-xs truncate">{user?.uid || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account Type</p>
                <p className="text-sm text-gray-800">{user?.isGuest ? "Guest" : "Registered"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

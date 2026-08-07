/**
 * Community.jsx — Community-contributed routes page.
 *
 * Tabs:
 *   Browse — see approved community routes
 *   Upload — submit a new route (GeoJSON file)
 *   Pending — view your pending submissions
 */

import { useState, useEffect, useCallback } from "react";
import { getApiBaseUrl } from "../utils/api";
import Navbar from "../components/Navbar";
import RouteUploader from "../components/RouteUploader";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const API = getApiBaseUrl();

export default function Community() {
  let auth = { isAuthenticated: false };
  try { auth = useAuth(); } catch (_) {}

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-4">🌐 Community Routes</h1>
          <p className="text-gray-500 mb-8 text-lg">Sign up to upload routes, track commutes, and get full access to Para PH.</p>
          <Link to="/signup" className="inline-block px-8 py-3 bg-purple-800 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors">Sign Up — It's Free</Link>
          <p className="mt-4 text-sm text-gray-400">Already have an account? <Link to="/login" className="text-purple-700 underline">Log in</Link></p>
        </div>
      </div>
    );
  }

  const [tab, setTab] = useState("browse"); // "browse" | "upload" | "pending"
  const [routes, setRoutes] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch routes ────────────────────────────────────
  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "browse") {
        const res = await fetch(`${API}/admin/routes/list`);
        const data = await res.json();
        // Show only community-submitted approved routes
        const community = (data.routes || []).filter(
          (r) => r.is_approved && r.status === "verified",
        );
        setRoutes(community);
      } else if (tab === "pending") {
        const res = await fetch(`${API}/admin/pending/list`);
        const data = await res.json();
        setPending(data.routes || []);
      }
    } catch (e) {
      setError("Failed to load routes. Is the backend running?");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== "upload") fetchRoutes();
  }, [tab, fetchRoutes]);

  // ── Render ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">🌐 Community Routes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Contribute and discover transit routes submitted by fellow commuters.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            ["browse", "Browse"],
            ["upload", "Upload"],
            ["pending", "Pending"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === id
                  ? "bg-white text-purple-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Browse tab */}
        {tab === "browse" && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading routes…</div>
            ) : routes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-400 text-sm">No community routes yet.</p>
                <button
                  onClick={() => setTab("upload")}
                  className="mt-3 text-purple-700 font-semibold text-sm hover:underline"
                >
                  Be the first to upload →
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {routes.map((route) => (
                  <div
                    key={route.route_uuid}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-bold text-gray-900 text-sm truncate">{route.name}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="capitalize">{route.mode}</span>
                      {route.length_m && <span>📏 {Math.round(route.length_m).toLocaleString()}m</span>}
                    </div>
                    <span className="inline-block mt-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      ✓ Verified
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload tab */}
        {tab === "upload" && (
          <RouteUploader
            onSuccess={() => {
              setTab("pending");
            }}
          />
        )}

        {/* Pending tab */}
        {tab === "pending" && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading pending routes…</div>
            ) : pending.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-400 text-sm">No pending submissions.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {pending.map((route) => (
                  <div
                    key={route.route_uuid}
                    className="bg-white rounded-xl border border-amber-200 p-4"
                  >
                    <h3 className="font-bold text-gray-900 text-sm truncate">{route.name}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="capitalize">{route.mode}</span>
                    </div>
                    <span className="inline-block mt-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                      ⏳ Pending Review
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

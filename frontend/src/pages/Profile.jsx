import { useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const BADGES = [
  { id: 1, name: "First Ride", icon: "🚐", description: "Completed your first tracked commute", tier: "bronze" },
  { id: 2, name: "Route Builder", icon: "🗺️", description: "Uploaded 5 community routes", tier: "silver", locked: true },
  { id: 3, name: "Commute Champion", icon: "🏆", description: "100 tracked commutes", tier: "gold", locked: true },
  { id: 4, name: "Early Adopter", icon: "⭐", description: "Joined during beta", tier: "bronze" },
];

export default function Profile() {
  let auth = { user: null, isAuthenticated: false };
  try { auth = useAuth(); } catch (_) {}
  const { user, isAuthenticated } = auth;
  const [bio, setBio] = useState("Metro Manila commuter. Helping build better routes for everyone.");
  const [editing, setEditing] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <span className="text-5xl">👤</span>
          <h1 className="text-2xl font-black text-gray-900 mt-4">Sign in to view your profile</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#D1B6FC] flex items-center justify-center text-2xl font-bold text-[#381D65] shrink-0">
              {(user?.displayName || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#381D65]">{user?.displayName || "Commuter"}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button onClick={() => setEditing(!editing)} className="text-[#7A4BC8] text-sm font-bold">
              {editing ? "Save" : "Edit"}
            </button>
          </div>
          {editing ? (
            <textarea value={bio} onChange={(e) => setBio(e.target.value)}
              className="w-full mt-4 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none"
              rows={3} />
          ) : (
            <p className="mt-4 text-sm text-gray-600">{bio}</p>
          )}
        </div>

        {/* Badges */}
        <div>
          <h3 className="font-bold text-[#381D65] mb-3">Badges</h3>
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map((badge) => (
              <div key={badge.id} className={`bg-white rounded-2xl border p-4 text-center ${badge.locked ? "opacity-50" : "border-[#D1B6FC]"}`}>
                <span className="text-3xl">{badge.locked ? "🔒" : badge.icon}</span>
                <p className="text-sm font-bold text-[#381D65] mt-2">{badge.name}</p>
                <p className="text-[10px] text-gray-400 mt-1">{badge.description}</p>
                <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  badge.tier === "gold" ? "bg-yellow-100 text-yellow-700" :
                  badge.tier === "silver" ? "bg-gray-100 text-gray-600" :
                  "bg-amber-100 text-amber-700"
                }`}>{badge.tier}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

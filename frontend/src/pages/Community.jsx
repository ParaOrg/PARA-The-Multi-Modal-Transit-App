import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const MOCK_THREADS = [
  { id: 1, user: "JuanDelaCruz", title: "Best Cubao to Makati route at 7am?", replies: 24, votes: 15, time: "2h ago", tag: "Routes" },
  { id: 2, user: "CommuterQueen", title: "PSA: EDSA Carousel now has free WiFi!", replies: 18, votes: 42, time: "4h ago", tag: "Tips" },
  { id: 3, user: "JeepneyKing", title: "New UV Express terminal at Ayala - review", replies: 31, votes: 28, time: "6h ago", tag: "Review" },
  { id: 4, user: "TrafficWizard", title: "LRT-1 extension update: when will it open?", replies: 56, votes: 89, time: "8h ago", tag: "News" },
  { id: 5, user: "BudgetBiyahe", title: "Cheapest way from Fairview to PITX?", replies: 12, votes: 7, time: "10h ago", tag: "Routes" },
];

export default function Community() {
  let auth = { isAuthenticated: false };
  try { auth = useAuth(); } catch (_) {}
  const [showCTA, setShowCTA] = useState(!auth.isAuthenticated);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Signup CTA Overlay */}
      {showCTA && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
            <span className="text-5xl">🌟</span>
            <h2 className="text-2xl font-black text-[#381D65] mt-4">Join the Community</h2>
            <p className="text-gray-500 mt-2 text-sm">Share routes, get tips, and help fellow commuters navigate Metro Manila.</p>
            <div className="mt-6 space-y-2">
              <Link to="/signup" className="block w-full py-3 bg-[#7A4BC8] text-white rounded-xl font-bold text-sm hover:bg-[#381D65] transition-colors">
                Sign Up — It's Free
              </Link>
              <button onClick={() => setShowCTA(false)} className="block w-full py-2 text-gray-400 text-xs hover:text-gray-600">
                Maybe later
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Already a member? <Link to="/login" className="text-[#7A4BC8] underline">Log in</Link>
            </p>
          </div>
        </div>
      )}

      {/* Community Feed */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-gray-900">Community</h1>
          <Link to="/community/upload" className="bg-[#7A4BC8] text-white px-4 py-2 rounded-full text-xs font-bold">+ New Post</Link>
        </div>

        {/* Thread list */}
        <div className="space-y-3">
          {MOCK_THREADS.map((thread) => (
            <div key={thread.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-[#D1B6FC] flex items-center justify-center text-[10px] font-bold text-[#381D65]">
                  {thread.user[0]}
                </span>
                <span className="text-xs font-medium text-gray-500">{thread.user}</span>
                <span className="text-[10px] text-gray-300">{thread.time}</span>
                <span className="ml-auto text-[10px] bg-[#7A4BC81A] text-[#7A4BC8] px-2 py-0.5 rounded-full font-bold">{thread.tag}</span>
              </div>
              <h3 className="font-bold text-[#381D65] text-sm mb-2">{thread.title}</h3>
              <div className="flex gap-4 text-[10px] text-gray-400">
                <span>💬 {thread.replies} replies</span>
                <span>⬆ {thread.votes} votes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

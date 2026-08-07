import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "../utils/api";
import TripSummaryCard from "../components/TripSummaryCard";

const API = getApiBaseUrl();

const BOTTOM_NAV = [
  { id: "feed", label: "Feed", icon: "📰" },
  { id: "saved", label: "Saved", icon: "🔖" },
  { id: "search", label: "Search", icon: "🔍", primary: true },
  { id: "advisory", label: "Advisory", icon: "⚠️" },
  { id: "streak", label: "Streak", icon: "🔥" },
];

export default function SearchResults() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: "guest", message: query }) });
      const data = await res.json();
      setResults(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      <div className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/1tez9sml_expires_30_days.png')" }} />
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <div className="mx-4 mt-4 bg-white/60 backdrop-blur rounded-2xl border border-[#49698F99] p-3.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-14 bg-white rounded-full shadow-sm flex items-center justify-center"><span className="text-xl">🗺️</span></div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="How to go to Cafe Name ..."
              className="flex-1 bg-[#7A4BC8] text-white placeholder-white/70 rounded-2xl px-4 py-3 text-sm outline-none" />
            <button onClick={handleSearch} className="w-8 h-8"><span className="text-xl">🔍</span></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 mt-4 pb-28">
          {loading && <div className="text-center py-8 text-gray-400">Finding routes…</div>}
          {results?.route_data && (
            <div className="space-y-4">
              <p className="text-[#381D65] text-sm">Here are your commute options:</p>
              <div className="bg-[#7A4BC81A] rounded-2xl p-4 border-l-[11px] border-l-[#7A4BC8] rounded-l-xl">
                <span className="text-[#7A4BC8] text-xs font-bold">Recommended</span>
                <TripSummaryCard routeData={results.route_data} />
              </div>
              <div className="bg-[#FFCC001A] border border-[#FFCC00] rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <span className="text-[#381D65] text-sm">Weather Alert: Check conditions before commuting.</span>
              </div>
              <p className="text-[#381D65] text-sm">Do you have additional inquiries or should we start your commute journey?</p>
              <div className="flex justify-end">
                <button onClick={() => navigate("/")} className="bg-[#7A4BC8] text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Start Commute</button>
              </div>
            </div>
          )}
          {!loading && !results && <div className="text-center py-12 text-gray-400"><p className="text-lg mb-2">🔍</p><p>Type a destination above to find routes</p></div>}
        </div>
        <div className="mx-4 mb-24 bg-white rounded-t-2xl shadow-[0_-4px_7px_rgba(0,0,0,0.05)] px-4 py-3 flex items-center gap-3">
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply..." className="flex-1 text-[#381C65] text-sm outline-none" />
          <button className="w-9 h-9"><span className="text-xl">📤</span></button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-2xl shadow-[0_-4px_7px_rgba(0,0,0,0.05)] px-4 py-5">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {BOTTOM_NAV.map((item) => (
            <button key={item.id} className={`flex flex-col items-center gap-1.5 min-w-[56px] ${item.primary ? "-mt-8" : ""}`}>
              {item.primary ? (
                <div className="flex items-center gap-2 bg-[#7A4BC8] text-white px-5 py-3 rounded-full shadow-lg"><span className="text-sm font-semibold">Search</span><span>🔍</span></div>
              ) : (
                <><span className="text-xl">{item.icon}</span><span className="text-[10px] font-medium text-gray-400">{item.label}</span></>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

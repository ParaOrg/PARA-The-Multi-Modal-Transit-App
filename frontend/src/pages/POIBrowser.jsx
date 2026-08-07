import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "../utils/api";
import Navbar from "../components/Navbar";
import POIForm from "../components/POIForm";

const API = getApiBaseUrl();

const CATEGORY_ICONS = {
  terminal: "🚌", station: "🚆", landmark: "📍", mall: "🛍️",
  school: "🏫", church: "⛪", government: "🏛️",
};

const BOTTOM_NAV = [
  { id: "feed", label: "Feed", icon: "📰", to: "/" },
  { id: "explore", label: "Routes", icon: "🗺️", to: "/explore" },
  { id: "search", label: "Search", icon: "🔍", primary: true, to: "/" },
  { id: "community", label: "Community", icon: "🌟", to: "/community" },
  { id: "profile", label: "Profile", icon: "👤", to: "/profile" },
];

export default function POIBrowser() {
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/poi/list`)
      .then(r => r.json())
      .then(d => setPois(d.pois || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = pois.filter(p => {
    if (category !== "all" && p.category !== category) return false;
    if (search && !p.canonical_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = ["all", ...new Set(pois.map(p => p.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#381D65]">📍 Places</h1>
            <p className="text-sm text-gray-500 mt-1">{pois.length} points of interest</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#7A4BC8] text-white px-4 py-2 rounded-full text-xs font-bold">
            {showForm ? "✕ Close" : "+ Add Place"}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="mb-6">
            <POIForm onSuccess={() => {
              setShowForm(false);
              fetch(`${API}/poi/list`).then(r => r.json()).then(d => setPois(d.pois || []));
            }} />
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search places..."
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#7A4BC8] w-40 shrink-0" />
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${
                category === c ? "bg-[#7A4BC8] text-white" : "bg-white text-gray-500 border border-gray-200"
              }`}>
                {c === "all" ? "All" : `${CATEGORY_ICONS[c] || "📍"} ${c}`}
            </button>
          ))}
        </div>

        {/* POI Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading places...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">No places found</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-[#7A4BC8] text-xs font-bold">Add the first one →</button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((poi) => (
              <div key={poi.place_uuid || poi.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{CATEGORY_ICONS[poi.category] || "📍"}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#381D65] text-sm truncate">{poi.canonical_name || poi.name}</h3>
                    <p className="text-[10px] text-gray-400 capitalize mt-0.5">{poi.category}</p>
                    {poi.lat && poi.lng && (
                      <p className="text-[10px] text-gray-300 mt-1">
                        {Number(poi.lat).toFixed(4)}, {Number(poi.lng).toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-[0_-4px_7px_rgba(0,0,0,0.05)] px-2 py-3"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-end justify-center gap-7 px-4 py-2">
          {BOTTOM_NAV.map((item) => (
            <button key={item.id} onClick={() => item.to && navigate(item.to)}
              className={`flex flex-col items-center gap-0.5 ${item.primary ? "-mt-5" : ""}`}>
              {item.primary ? (
                <div className="bg-[#7A4BC8] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-lg">
                  {item.icon}
                </div>
              ) : (
                <span className="text-lg">{item.icon}</span>
              )}
              <span className={`text-[9px] font-medium ${item.id === "search" ? "text-[#7A4BC8]" : "text-gray-400"}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

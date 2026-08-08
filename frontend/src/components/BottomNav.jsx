import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MAIN_NAV = [
  { id: "home", label: "Home", icon: "🏠", to: "/" },
  { id: "explore", label: "Routes", icon: "🗺️", to: "/explore" },
  { id: "search", label: "Search", icon: "🔍", to: "/", primary: true },
  { id: "community", label: "Community", icon: "🌟", to: "/community" },
  { id: "profile", label: "Profile", icon: "👤", to: "/profile" },
];

const MORE_LINKS = [
  { id: "poi", label: "Places", icon: "📍", to: "/poi" },
  { id: "about", label: "About", icon: "ℹ️", to: "/about" },
  { id: "privacy", label: "Privacy", icon: "🔒", to: "/privacy-policy" },
  { id: "gas", label: "Gas Prices", icon: "⛽", to: "/gas-prices" },
  { id: "admin", label: "Admin", icon: "🛠️", to: "/admin" },
];

export default function BottomNav({ onSearchClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Hamburger menu overlay */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">More</p>
            <div className="grid grid-cols-2 gap-2">
              {MORE_LINKS.map((item) => (
                <button key={item.id} onClick={() => { navigate(item.to); setMenuOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-[0_-4px_7px_rgba(0,0,0,0.05)] px-2 py-3"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-end justify-center gap-5 px-2">
          {/* Hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col items-center gap-0.5 min-w-[48px]">
            <span className="text-lg">{menuOpen ? "✕" : "☰"}</span>
            <span className="text-[9px] font-medium text-gray-400">More</span>
          </button>

          {MAIN_NAV.map((item) => (
            <button key={item.id} onClick={() => {
              if (item.primary && onSearchClick) onSearchClick();
              else if (item.to) navigate(item.to);
            }}
              className={`flex flex-col items-center gap-0.5 min-w-[48px] ${item.primary ? "-mt-5" : ""}`}>
              {item.primary ? (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-lg ${
                  isActive("/") ? "bg-[#381D65] text-white" : "bg-[#7A4BC8] text-white"
                }`}>
                  {item.icon}
                </div>
              ) : (
                <span className="text-lg">{item.icon}</span>
              )}
              <span className={`text-[9px] font-medium ${
                isActive(item.to) ? "text-[#7A4BC8]" : "text-gray-400"
              }`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

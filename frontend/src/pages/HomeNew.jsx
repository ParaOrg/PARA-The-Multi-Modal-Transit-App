import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapComponent from "../components/map_component";
import TripSummaryCard, { RouteCardList } from "../components/TripSummaryCard";
import CommuteTracker from "../components/CommuteTracker";
import { getApiBaseUrl } from "../utils/api";
import paralogo from "../assets/images/Para1P.png";
import Navbar from "../components/Navbar";
import ChatPanel from "../components/ChatPanel";

const API = getApiBaseUrl();

const BOTTOM_NAV = [
  { id: "feed", label: "Feed", icon: "📰", to: "/" },
  { id: "explore", label: "Routes", icon: "🗺️", to: "/explore" },
  { id: "search", label: "Search", icon: "🔍", primary: true },
  { id: "community", label: "Community", icon: "🌟", to: "/community" },
  { id: "profile", label: "Profile", icon: "👤", to: "/profile" },
];

export default function HomeNew() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [routeMarkers, setRouteMarkers] = useState([]);
  const [polylines, setPolylines] = useState([]);
  const [activeRouteData, setActiveRouteData] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const messagesEndRef = useRef(null);
  const gpsCheckRef = useRef(null);
  const navigate = useNavigate();
  const [placeholder, setPlaceholder] = useState("Saan mo gustong pumunta?");
  const fullText = "Saan mo gustong pumunta?";
  const exampleText = "Ex. UPD to UST";

  // Placeholder animation
  
  // Check GPS status
  useEffect(() => {
    const check = () => setGpsActive(!!window.__userLocation);
    check();
    gpsCheckRef.current = setInterval(check, 1000);
    return () => clearInterval(gpsCheckRef.current);
  }, []);

  useEffect(() => {
    if (!chatOpen || messages.length > 0) return;
    let timeouts = [], intervals = [];
    const typeText = (text, speed, onDone) => {
      let j = 0;
      const id = setInterval(() => { j++; if (j <= text.length) setPlaceholder(text.slice(0, j)); else { clearInterval(id); if (onDone) onDone(); } }, speed);
      intervals.push(id);
    };
    const backspaceText = (text, speed, onDone) => {
      let i = text.length;
      const id = setInterval(() => { i--; if (i >= 0) setPlaceholder(text.slice(0, i)); else { clearInterval(id); if (onDone) onDone(); } }, speed);
      intervals.push(id);
    };
    const runCycle = () => {
      setPlaceholder("");
      typeText(fullText, 60, () => {
        const t1 = setTimeout(() => backspaceText(fullText, 40, () => typeText(exampleText, 80, () => {
          const t2 = setTimeout(() => backspaceText(exampleText, 40, () => { const t3 = setTimeout(() => runCycle(), 300); timeouts.push(t3); }), 5000);
          timeouts.push(t2);
        })), 5000);
        timeouts.push(t1);
      });
    };
    runCycle();
    return () => { timeouts.forEach(clearTimeout); intervals.forEach(clearInterval); };
  }, [chatOpen, messages.length]);

  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (chatOpen) { setMessages([]); setInput(""); setRouteMarkers([]); setPolylines([]); setShowChat(false); }
  };

  const closeChatPanel = () => {
    setShowChat(false);
    setMessages([]);
    setRouteMarkers([]);
    setPolylines([]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { sender: "user", text }]);
    setInput("");
    setLoading(true);
    setShowChat(true);
    setRouteMarkers([]); setPolylines([]);
    
    const gpsLoc = window.__userLocation;
    const hasOrigin = /from|mula|galing|papunta/i.test(text);
    const backendMessage = (!hasOrigin && gpsLoc) ? `from here to ${text}` : text;
    const body = { user_id: "guest", message: backendMessage };
    if (gpsLoc) body.user_location = { lat: gpsLoc[0], lng: gpsLoc[1] };
    
    try {
      const res = await fetch(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: "bot", text: data.reply_text || "No route found", routeData: data.route_data, alternatives: data.alternatives }]);
      if (data.route_data) {
        setActiveRouteData(data.route_data);
        const segs = data.route_data.segments || [];
        const lns = [], mkrs = [];
        segs.forEach((seg) => {
          if (!seg.geometry || seg.geometry.length < 2) return;
          const coords = seg.geometry.map(c => [c[1], c[0]]);
          const isWalk = seg.is_transfer || seg.type === "walk" || (seg.route && seg.route.indexOf("WALK") !== -1);
          lns.push({ coordinates: coords, color: isWalk ? "#9CA3AF" : "#310775", weight: isWalk ? 2 : 4, dashed: isWalk });
          mkrs.push({ lat: coords[0][0], lng: coords[0][1], type: "stop" });
        });
        setPolylines(lns);
        setRouteMarkers(mkrs);
      }
    } catch (e) {
      setMessages(prev => [...prev, { sender: "bot", text: "Sorry, something went wrong." }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-white">
      {/* DESKTOP: Original Navbar + ChatPanel */}
      <div className="hidden md:block">
        <Navbar />
        <ChatPanel />
        <button onClick={() => {
          const m = window.__paraMap;
          if (!m) return;
          const loc = window.__userLocation;
          if (loc) m.setView(loc, 17, { animate: true });
          else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => m.setView([pos.coords.latitude, pos.coords.longitude], 17, { animate: true }),
              () => {}, { timeout: 5000 }
            );
          }
        }} className="fixed top-20 right-4 z-[9999] bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-lg hover:bg-gray-50 border border-gray-200">
          ⊕
        </button>
      </div>

      {/* MOBILE: New design below */}
      <div className="md:hidden">
      {/* Map */}
      <div className="absolute inset-0 z-0">
        <MapComponent markers={routeMarkers} polylines={polylines} showLegend={false} fitBounds={true} />
        
      </div>

      {/* Mobile logo */}
      <div className="md:hidden absolute top-4 left-4 z-30 flex items-center gap-2">
        <img src={paralogo} alt="Para PH" className="w-12 h-12 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]" />
      </div>
      {/* GPS enable button — always visible when GPS not active */}
      {!gpsActive && (
        <button onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                window.__userLocation = [pos.coords.latitude, pos.coords.longitude];
                // Force reload state
                setChatOpen(prev => prev);
              },
              (err) => alert("Location access denied. Please enable in Settings."),
              { enableHighAccuracy: true, timeout: 15000 }
            );
          } else {
            alert("Geolocation not supported on this device.");
          }
        }} className="md:hidden absolute top-16 right-4 z-30 bg-white rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2 text-xs font-bold text-[#7A4BC8] animate-pulse">
          <span>📍</span>
          <span>Enable GPS</span>
        </button>
      )}
      <button onClick={() => {
        const m = window.__paraMap;
        if (!m) return;
        const loc = window.__userLocation;
        if (loc) m.setView(loc, 17, { animate: true });
        else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => m.setView([pos.coords.latitude, pos.coords.longitude], 17, { animate: true }),
            () => {}, { timeout: 5000 }
          );
        }
      }} className="absolute top-4 right-4 z-[9999] bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-lg hover:bg-gray-50 border border-gray-200">
        ⊕
      </button>

      {/* CHAT PANEL — appears above pill when showChat is true */}
      {/* ONE unified container — pill at bottom, chat above when expanded */}
      {chatOpen && (
        <div className="absolute left-2 right-2 z-20 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ bottom: "84px", maxHeight: showChat ? "50vh" : "auto" }}>
          
          {showChat && (
            <>
              <div className="flex items-center justify-end px-2 py-1 bg-white shrink-0">
                <button onClick={closeChatPanel} className="text-gray-400 hover:text-gray-600 text-sm leading-none w-5 h-5 flex items-center justify-center">✕</button>
              </div>
              <div className="overflow-y-auto px-3 pb-2 space-y-2" style={{ maxHeight: "calc(50vh - 80px)" }}>
                {messages.map((m, i) => (
                  <div key={i}>
                    {m.routeData && (
                      <div className="mb-2">
                        <RouteCardList routeData={m.routeData} alternatives={m.alternatives || []} />
                        {!showTracker && (
                          <button onClick={() => setShowTracker(true)} className="w-full mt-1.5 py-1.5 bg-green-500 text-white rounded-lg text-[11px] font-bold">🚀 Start Tracked Commute</button>
                        )}
                      </div>
                    )}
                    {!m.routeData && (
                      <div className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] px-2.5 py-1.5 text-[12px] leading-snug ${m.sender === "user" ? "bg-[#7A4BC8] text-white rounded-2xl rounded-br-sm" : "bg-gray-100 text-[#381D65] rounded-2xl rounded-bl-sm"}`}>
                          <div className="whitespace-pre-wrap">{m.text}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && <div className="text-gray-400 text-[11px] italic px-1">Naghahanap ng ruta…</div>}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
          
          <div className="flex items-center gap-2 px-3 py-2.5">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={placeholder}
              className="flex-1 text-[13px] outline-none text-[#381D65] placeholder-gray-400" />
            <button onClick={send} disabled={loading}
              className="bg-[#7A4BC8] text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs">➤</span>
            </button>
          </div>
        </div>
      )}

      {/* Commute Tracker */}
      {showTracker && activeRouteData && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowTracker(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CommuteTracker routeData={activeRouteData} onComplete={() => { setShowTracker(false); setActiveRouteData(null); }} onCancel={() => setShowTracker(false)} />
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-[0_-4px_7px_rgba(0,0,0,0.05)] px-2 py-3"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-end justify-center gap-7 px-4 py-2">
          {BOTTOM_NAV.map((item) => (
            <button key={item.id} onClick={() => { if (item.id === "search") toggleChat(); else if (item.to) navigate(item.to); }}
              className="flex flex-col items-center gap-0.5">
              {item.primary ? (
                <div className={`px-4 py-2 rounded-full shadow-md text-xs font-semibold flex items-center gap-1.5 ${chatOpen ? "bg-[#381D65] text-white" : "bg-[#7A4BC8] text-white"}`}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </div>
              ) : (
                <>
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[9px] font-medium text-gray-400">{item.label}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}

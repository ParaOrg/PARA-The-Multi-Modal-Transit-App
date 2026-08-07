import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapComponent from "../components/map_component";
import ChatPanel from "../components/ChatPanel";
import Navbar from "../components/Navbar";
import TripSummaryCard from "../components/TripSummaryCard";
import CommuteTracker from "../components/CommuteTracker";
import { getApiBaseUrl } from "../utils/api";
import paralogo from "../assets/images/Para1P.png";

const API = getApiBaseUrl();

const BOTTOM_NAV = [
  { id: "community", label: "Community", icon: "💬", to: "/community" },
  { id: "explore", label: "Routes", icon: "🗺️", to: "/explore" },
  { id: "search", label: "Search", icon: "🔍", primary: true },
  { id: "ambag", label: "Ambag", icon: "📤", to: "/community" },
  { id: "profile", label: "Profile", icon: "👤", to: "/profile" },
];

export default function HomeNew() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [routeMarkers, setRouteMarkers] = useState([]);
  const [polylines, setPolylines] = useState([]);
  const [activeRouteData, setActiveRouteData] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const [placeholder, setPlaceholder] = useState("Saan mo gustong pumunta?");
  const fullText = "Saan mo gustong pumunta?";
  const exampleText = "Ex. UPD to UST";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Placeholder animation (mobile only)
  useEffect(() => {
    if (!chatOpen || messages.length > 0) return;
    let timeouts = [];
    let intervals = [];
    const typeText = (text, speed, onDone) => {
      let j = 0;
      const id = setInterval(() => {
        j++;
        if (j <= text.length) { setPlaceholder(text.slice(0, j)); }
        else { clearInterval(id); if (onDone) onDone(); }
      }, speed);
      intervals.push(id);
    };
    const backspaceText = (text, speed, onDone) => {
      let i = text.length;
      const id = setInterval(() => {
        i--;
        if (i >= 0) { setPlaceholder(text.slice(0, i)); }
        else { clearInterval(id); if (onDone) onDone(); }
      }, speed);
      intervals.push(id);
    };
    const runCycle = () => {
      setPlaceholder("");
      typeText(fullText, 60, () => {
        const t1 = setTimeout(() => {
          backspaceText(fullText, 40, () => {
            typeText(exampleText, 80, () => {
              const t2 = setTimeout(() => {
                backspaceText(exampleText, 40, () => {
                  const t3 = setTimeout(() => runCycle(), 300);
                  timeouts.push(t3);
                });
              }, 5000);
              timeouts.push(t2);
            });
          });
        }, 5000);
        timeouts.push(t1);
      });
    };
    runCycle();
    return () => { timeouts.forEach(clearTimeout); intervals.forEach(clearInterval); };
  }, [chatOpen, messages]);

  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (chatOpen) { setMessages([]); setInput(""); setRouteMarkers([]); setPolylines([]); }
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { sender: "user", text }]);
    setInput("");
    setLoading(true);
    setRouteMarkers([]); setPolylines([]);
    try {
      const gpsLoc = window.__userLocation;
      const hasOrigin = /from|mula|galing|papunta/i.test(text);
      const backendMessage = (!hasOrigin && gpsLoc) ? `from here to ${text}` : text;
      const body = { user_id: "guest", message: backendMessage };
      if (gpsLoc) body.user_location = { lat: gpsLoc[0], lng: gpsLoc[1] };
      console.log("Sending:", body);
      const res = await fetch(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      setMessages(prev => [...prev, { 
            sender: "bot", 
            text: data.reply_text || "No route found", 
            routeData: data.route_data,
            alternatives: data.alternatives || null
          }]);
      if (data.route_data) {
        setActiveRouteData(data.route_data);
        const segs = data.route_data.segments || [];
        const lns = [];
        const mkrs = [];
        segs.forEach((seg) => {
          if (!seg.geometry || seg.geometry.length < 2) return;
          const coords = seg.geometry.map(c => [c[1], c[0]]);
          lns.push({ coordinates: coords, color: seg.is_transfer ? "#9CA3AF" : "#310775", weight: seg.is_transfer ? 2 : 4, dashed: !!seg.is_transfer });
          // Start marker
          mkrs.push({ lat: coords[0][0], lng: coords[0][1], type: "stop", label: seg.is_transfer ? "Walk" : (seg.route || "Transit") });
          // End marker
          mkrs.push({ lat: coords[coords.length-1][0], lng: coords[coords.length-1][1], type: "stop", label: "" });
        });
        setPolylines(lns);
        setRouteMarkers(mkrs);
      }
    } catch (e) {
      setMessages(prev => [...prev, { sender: "bot", text: "Sorry, something went wrong." }]);
    }
    setLoading(false);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="fixed inset-0 bg-white">
      <button onClick={() => {
        if (!navigator.geolocation) return;
        const loc = window.__userLocation;
        if (loc && window.__paraMap) {
          window.__paraMap.setView(loc, 17, { animate: true });
        } else {
          navigator.geolocation.getCurrentPosition((pos) => {
            if (window.__paraMap) window.__paraMap.setView([pos.coords.latitude, pos.coords.longitude], 17, { animate: true });
          });
        }
      }} style={{position:"fixed",top:"80px",right:"20px",zIndex:99999,width:"44px",height:"44px",borderRadius:"50%",background:"#7A4BC8",color:"white",border:"3px solid white",boxShadow:"0 4px 16px rgba(122,75,200,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",cursor:"pointer"}}>⊕</button>
      {/* Full screen map */}
      <div className="absolute inset-0 z-0">
        <MapComponent markers={routeMarkers} polylines={polylines} showLegend={false} fitBounds={true} />
      </div>

      {/* DESKTOP: Original Navbar + ChatPanel */}
      <div className="hidden md:block">
        <Navbar />
        <ChatPanel />
      </div>

      {/* MOBILE: Logo + Bottom Nav + Compact Chat */}
      <div className="md:hidden">
        {/* Logo top right */}
        <img src={paralogo} alt="Para PH" className="absolute top-4 right-4 z-30 w-16 h-16 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]" />

        {/* Chat overlay */}
        {chatOpen && hasMessages && (
          <div className="absolute left-2 right-2 z-20 flex flex-col bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            style={{ bottom: "80px", maxHeight: "40vh" }}>
            <div className="flex items-center justify-end px-2 py-1 bg-white border-b border-gray-100 shrink-0 rounded-t-2xl">
              <button onClick={toggleChat} className="text-gray-400 hover:text-gray-600 text-sm leading-none w-5 h-5 flex items-center justify-center">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] px-2.5 py-1.5 text-[12px] leading-snug ${
                    m.sender === "user" ? "bg-[#7A4BC8] text-white rounded-2xl rounded-br-sm" : "bg-gray-100 text-[#381D65] rounded-2xl rounded-bl-sm"
                  }`}>
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    {m.routeData && (
                      <div className="mt-1.5 scale-90 origin-top-left">
                        <TripSummaryCard routeData={m.routeData} />
                        {!showTracker && (
                          <button onClick={() => setShowTracker(true)} className="w-full mt-1.5 py-1.5 bg-green-500 text-white rounded-lg text-[11px] font-bold">🚀 Start Tracked Commute</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && <div className="text-gray-400 text-[11px] italic px-1">Naghahanap ng ruta…</div>}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input bar */}
        {chatOpen && (
          <div className="absolute left-2 right-2 z-20" style={{ bottom: hasMessages ? "88px" : "88px" }}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center gap-2 px-3 py-2.5">
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

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-[0_-4px_7px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
          <div className="flex items-end justify-center gap-7 px-4 py-2">
            {BOTTOM_NAV.map((item) => (
              <button key={item.id} onClick={() => { if (item.id === "search") toggleChat(); else if (item.to) navigate(item.to); }}
                className="flex flex-col items-center gap-0.5">
                {item.primary ? (
                  <div className={`px-4 py-2 rounded-full shadow-md text-xs font-semibold flex items-center gap-1.5 ${
                    chatOpen ? "bg-[#381D65] text-white" : "bg-[#7A4BC8] text-white"
                  }`}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
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

      {/* Commute Tracker Overlay (shared) */}
      {showTracker && activeRouteData && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowTracker(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CommuteTracker routeData={activeRouteData} 
            onStart={() => {
              if (window.__userLocation && window.__paraMap) {
                window.__paraMap.setView(window.__userLocation, 17, { animate: true });
              }
            }}
            onComplete={() => { setShowTracker(false); setActiveRouteData(null); }} 
            onCancel={() => setShowTracker(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

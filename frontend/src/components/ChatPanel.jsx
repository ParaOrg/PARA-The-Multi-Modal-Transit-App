/**
 * ChatPanel.jsx — Chat interface for route finding.
 * - Prompts for GPS on load
 * - 55% width on desktop, 40% on mobile
 * - Full route markers on map
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { getApiBaseUrl } from "../utils/api";
import MapComponent from "./map_component";
import TripSummaryCard from "./TripSummaryCard";
import CommuteTracker from "./CommuteTracker";
import InlineRecorder from "./InlineRecorder";

const API = getApiBaseUrl();

function TypewriterText({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i > text.length) { clearInterval(timer); setDone(true); }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);
  return <span>{displayed}{!done && <span className="animate-pulse">|</span>}</span>;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState([{
    sender: "bot",
    text: "🚐 Kumusta! Ako si Para PH.\n\n🔍 Maghanap ng ruta: Type 'from UPD to UST'\n📤 Mag-upload: Punta sa Community tab\n\nSaan gusto mong puntahan?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [routeMarkers, setRouteMarkers] = useState([]);
  const [polylines, setPolylines] = useState([]);
  const [showTracker, setShowTracker] = useState(false);
  const [activeRouteData, setActiveRouteData] = useState(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages]);

  const drawRoute = useCallback((routeData) => {
    if (!routeData) return;
    const segments = routeData.segments || [];
    const allMarkers = [];
    const allLines = [];

    // Filter out virtual walk segments (WALK_TO_ROUTE, WALK_TO_DEST)
    const realSegments = segments.filter(
      (seg) => seg.route !== "WALK_TO_ROUTE" && seg.route !== "WALK_TO_DEST" && seg.route !== "WALK_TRANSFER"
    );

    realSegments.forEach((seg, i) => {
      if (!seg.geometry || seg.geometry.length < 2) return;
      const coords = seg.geometry.map((c) => [c[1], c[0]]);
      const isWalk = seg.is_transfer || seg.type === "walk";
      const isFirst = i === 0;
      const isLast = i === realSegments.length - 1;

      allLines.push({
        coordinates: coords,
        color: isWalk ? "#9CA3AF" : "#3e00a6",
        weight: isWalk ? 2 : 4,
        dashed: isWalk,
        routeName: seg.route || "",
      });

      // Start marker
      const startCoord = coords[0];
      if (isFirst && isWalk) {
        allMarkers.push({ lat: startCoord[0], lng: startCoord[1], type: "origin", label: "🚩 Start Walking" });
      } else if (isFirst) {
        allMarkers.push({ lat: startCoord[0], lng: startCoord[1], type: "origin", label: `🚌 Hop on: ${seg.route || "Transit"}` });
      } else if (isWalk) {
        allMarkers.push({ lat: startCoord[0], lng: startCoord[1], type: "stop", label: "🚶 Walk Transfer" });
      } else {
        allMarkers.push({ lat: startCoord[0], lng: startCoord[1], type: "stop", label: `🚌 Hop on: ${seg.route || "Transit"}` });
      }

      // End marker
      const endCoord = coords[coords.length - 1];
      if (isLast && isWalk) {
        allMarkers.push({ lat: endCoord[0], lng: endCoord[1], type: "destination", label: "🏁 Arrived" });
      } else if (isLast) {
        allMarkers.push({ lat: endCoord[0], lng: endCoord[1], type: "destination", label: `🚏 Hop off: ${seg.route || "Transit"}` });
      } else if (isWalk) {
        allMarkers.push({ lat: endCoord[0], lng: endCoord[1], type: "stop", label: "🚶 End Walk" });
      } else {
        allMarkers.push({ lat: endCoord[0], lng: endCoord[1], type: "stop", label: `🚏 Hop off: ${seg.route || "Transit"}` });
      }
    });

    setRouteMarkers(allMarkers);
    setPolylines(allLines);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    
    // Handle "record route" command
    if (text.toLowerCase().includes("record route") || text.toLowerCase().includes("record a route")) {
      setCollapsed(false);
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "📡 Let's record your route!\n\n1. Press Start Recording below\n2. Ride your commute\n3. Press Stop when you arrive\n\nYour GPS trace will be saved automatically.",
        recordPrompt: true 
      }]);
      return;
    }
    
    setLoading(true);
    setCollapsed(false);
    setRouteMarkers([]);
    setPolylines([]);

    try {
      const res = await fetch(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: "guest", message: text }) });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply_text || data.reply || "No route found", routeData: data.route_data || null }]);
      if (data.route_data) {
        setActiveRouteData(data.route_data);
        drawRoute(data.route_data);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, something went wrong." }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <MapComponent markers={routeMarkers} polylines={polylines} showLegend={false} fitBounds={true} />
      </div>



      {/* Chat panel — 55% desktop, 40% mobile */}
      <div
        className={`absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 z-10 flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 ${
          collapsed ? "max-h-12" : "max-h-[80vh]"
        } md:w-96`}
      >
        {/* Header */}
        <div
          className="text-white p-3 font-bold text-sm flex items-center gap-2 shrink-0 justify-between cursor-pointer"
          style={{ background: "linear-gradient(135deg, #310775, #5a1fa8)" }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <span>🚐 Para PH</span>
          <span className="text-white/70 hover:text-white text-lg leading-none select-none">
            {collapsed ? "▲" : "▼"}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[95%] p-3 rounded-2xl text-sm ${
                  m.sender === "user"
                    ? "text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none border border-gray-100 shadow-sm"
                }`}
                style={
                  m.sender === "user"
                    ? { background: "linear-gradient(135deg, #310775, #5a1fa8)" }
                    : {}
                }
              >
                {m.sender === "bot" && i === messages.length - 1 && !loading ? (
                  <div className="whitespace-pre-wrap">
                    <TypewriterText text={m.text} />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.text}</div>
                )}

                {m.recordPrompt && (
                  <div className="mt-2">
                    <InlineRecorder onDone={() => {
                      setMessages((prev) => [...prev, { sender: "bot", text: "✅ Route recorded! Thank you for contributing to Para PH. Your route will help other commuters." }]);
                    }} />
                  </div>
                )}
                {m.routeData && (
                  <div className="mt-2 space-y-2">
                    <TripSummaryCard routeData={m.routeData} />
                    {!showTracker && (
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setActiveRouteData(m.routeData);
                            setShowTracker(true);
                          }}
                          className="w-full py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
                        >
                          🚀 Start Tracked Commute
                        </button>
                        <p className="text-[10px] text-gray-400 text-center leading-tight">
                          Your location will be tracked for safety and data training purposes.{" "}
                          <Link to="/privacy-policy" className="text-purple-600 underline hover:text-purple-800">Learn more</Link>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 text-gray-400 p-3 rounded-2xl rounded-bl-none text-sm italic">
                Naghahanap ng ruta…
              </div>
            </div>
          )}
          <span ref={messagesEndRef} />
        </div>

        {/* Commute Tracker */}
        {showTracker && activeRouteData && (
          <>
            <div className="fixed top-[15%] bottom-0 left-0 right-0 z-40 bg-black/50 rounded-t-3xl" onClick={() => setShowTracker(false)} />
            <div className="fixed top-[15%] bottom-0 left-0 right-0 z-50 flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl">
                <CommuteTracker
                  routeData={activeRouteData}
                  onComplete={(log) => {
                    console.log("Commute complete:", log);
                    setShowTracker(false);
                    setActiveRouteData(null);
                  }}
                  onCancel={() => setShowTracker(false)}
                />
              </div>
            </div>
          </>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-100 bg-white flex gap-2 shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Saan gusto mong puntahan?"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={send}
            disabled={loading}
            className="text-white px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold text-sm"
            style={{ background: "#310775" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

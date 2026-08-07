/**
 * RoutesExplorer.jsx — Browse verified and reference routes on a map.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getApiBaseUrl } from "../utils/api";
import Navbar from "../components/Navbar";
import LandingPageFooter from "../components/landingpage-footer.component.jsx";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CENTER = [14.5995, 120.9842];
const API = getApiBaseUrl();

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

export default function RoutesExplorer() {
  const isMobile = useIsMobile();
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layerRef = useRef(null);

  const [verified, setVerified] = useState([]);
  const [referenceRoutes, setReferenceRoutes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("verified");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [buildQueue, setBuildQueue] = useState([]);
  const [verifiedNames, setVerifiedNames] = useState(new Set());

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(CENTER, 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapInst.current = map;
  }, []);

  // Load routes
  useEffect(() => {
    (async () => {
      try {
        const [routesRes, refRes] = await Promise.all([
          fetch(`${API}/admin/routes/list`),
          fetch(`${API}/admin/routes/reference`),
        ]);
        const routesData = await routesRes.json();
        const refData = await refRes.json();
        const all = routesData.routes || [];
        setVerified(all.filter((r) => r.is_approved));
        
        // Build verified names set for comparison
        const vNames = new Set();
        all.filter(r => r.is_approved).forEach(r => {
          if (r.name) vNames.add(r.name.toLowerCase().trim());
        });
        setVerifiedNames(vNames);
        
        // Deduplicate reference routes and mark matched/unmatched
        const seen = new Set();
        const uniqueRef = [];
        (refData.routes || []).forEach(r => {
          const name = (r.route_name || "").trim();
          const lower = name.toLowerCase();
          if (!lower || seen.has(lower)) return;
          seen.add(lower);
          
          // Check if matches any verified name
          let matched = false;
          vNames.forEach(vName => {
            if (lower.includes(vName) || vName.includes(lower)) matched = true;
          });
          
          uniqueRef.push({ ...r, route_name: name, is_matched: matched });
        });
        setReferenceRoutes(uniqueRef);
        setFiltered(all.filter((r) => r.is_approved));
      } catch (e) {
        console.error("Failed to load routes:", e);
      } finally {
        setListLoading(false);
      }
    })();
  }, []);

  // Filter by search
  useEffect(() => {
    const source = tab === "verified" ? verified : referenceRoutes;
    if (!search.trim()) { setFiltered(source); return; }
    const q = search.toLowerCase();
    setFiltered(source.filter((r) => (r.name || r.route_name || "").toLowerCase().includes(q)));
  }, [search, tab, verified, referenceRoutes]);

  useEffect(() => { if (!isMobile && mobileOpen) setMobileOpen(false); }, [isMobile, mobileOpen]);

  const drawRoute = useCallback(async (routeId) => {
    try {
      const res = await fetch(`${API}/admin/routes/geojson?route_id=${routeId}`);
      if (!res.ok) throw new Error("No geometry");
      const geo = await res.json();
      layerRef.current?.clearLayers();
      L.geoJSON(geo, { style: { color: "#3e00a6", weight: 4, opacity: 0.9 } }).addTo(layerRef.current);
      const bounds = L.geoJSON(geo).getBounds();
      if (bounds.isValid()) mapInst.current?.fitBounds(bounds, { padding: [60, 60] });
    } catch (e) {
      console.error("Failed to load route geometry:", e);
      layerRef.current?.clearLayers();
    }
  }, []);

  const selectRoute = useCallback(async (route) => {
    const id = route.route_uuid || route.id;
    const name = route.name || route.route_name || "";
    if (!id && !name) return;

    const currentId = selected?.route_uuid || selected?.id;
    const currentName = selected?.route_name || selected?.name || "";
    if (currentId === id || currentName === name) {
      setSelected(null);
      layerRef.current?.clearLayers();
      return;
    }
    setSelected(route);
    setMobileOpen(false);
    setLoading(true);

    if ((tab === "reference" && !id) || (!id && !route.route_uuid)) {
      layerRef.current?.clearLayers();
      const parts = name.split(" - ");
      const origin = parts[0]?.trim();
      const dest = parts[1]?.trim();
      const bounds = L.latLngBounds([]);
      for (const [i, place] of [origin, dest].entries()) {
        if (!place) continue;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}, Metro Manila&limit=1`);
          const data = await res.json();
          if (data[0]) {
            const ll = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            L.circleMarker(ll, { radius: 8, fillColor: i === 0 ? "#22c55e" : "#ef4444", color: "#fff", weight: 2, fillOpacity: 1 })
              .addTo(layerRef.current).bindTooltip(i === 0 ? `Origin: ${place}` : `Dest: ${place}`, { permanent: true, direction: "top" });
            bounds.extend(ll);
          }
        } catch {}
      }
      if (bounds.isValid()) mapInst.current?.fitBounds(bounds, { padding: [60, 60] });
    } else {
      await drawRoute(id || route.route_uuid);
    }
    setLoading(false);
  }, [selected, drawRoute, tab]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    layerRef.current?.clearLayers();
    mapInst.current?.setView(CENTER, 12);
  }, []);

  // Sidebar
  const sidebar = (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3.5 shrink-0 bg-gradient-to-r from-purple-800 to-purple-600">
        <p className="text-sm font-bold text-white mb-0.5">🚐 Transit Routes</p>
        <p className="text-[11px] text-purple-200">Metro Manila, Philippines</p>
        <div className="flex gap-2 mt-2">
          <div className="flex-1 bg-white/15 rounded-lg py-1.5 px-2.5 text-center">
            <div className="text-[15px] font-extrabold text-white">{verified.length}</div>
            <div className="text-[10px] text-purple-200">Verified</div>
          </div>
          <div className="flex-1 bg-white/15 rounded-lg py-1.5 px-2.5 text-center">
            <div className="text-[15px] font-extrabold text-white">{referenceRoutes.filter(r => r.is_matched).length}/{referenceRoutes.length}</div>
            <div className="text-[10px] text-purple-200">Mapped</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 shrink-0">
        {[["verified", "✓ Verified"], ["reference", "📋 Reference"], ["build", "🔧 Build"]].map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); clearSelection(); }}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${tab === id ? "text-purple-800 border-purple-800" : "text-gray-400 border-transparent hover:text-gray-500"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-100 shrink-0">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search route name..."
          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-purple-400" />
      </div>

      {/* Build Tab */}
      {tab === "build" && (
        <div className="p-3 space-y-3 flex-1 overflow-y-auto">
          <div className="flex gap-2">
            <button onClick={() => setBuildQueue([...verified])} className="flex-1 py-1.5 text-[10px] font-semibold rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200">See All Routes ({verified.length})</button>
            <button onClick={() => { setBuildQueue([]); layerRef.current?.clearLayers(); }} className="flex-1 py-1.5 text-[10px] font-semibold rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">Clear All</button>
          </div>
          <p className="text-[11px] text-gray-400">Click routes below to build a custom trip chain on the map.</p>
          {buildQueue.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Trip Queue ({buildQueue.length})</p>
              {buildQueue.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-purple-50 rounded-lg p-2">
                  <span className="w-5 h-5 rounded-full bg-purple-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                  <span className="text-gray-700 truncate">{r.name}</span>
                  <button onClick={() => setBuildQueue(prev => prev.filter((_, j) => j !== i))} className="ml-auto text-red-400 text-lg shrink-0">×</button>
                </div>
              ))}
              <button onClick={async () => {
                if (buildQueue.length < 1) return;
                setLoading(true);
                layerRef.current?.clearLayers();
                const bounds = L.latLngBounds([]);
                for (const route of buildQueue) {
                  try {
                    const res = await fetch(`${API}/admin/routes/geojson?route_id=${route.route_uuid}`);
                    if (!res.ok) continue;
                    const geo = await res.json();
                    const layer = L.geoJSON(geo, { style: { color: "#3e00a6", weight: 3, opacity: 0.7 } }).addTo(layerRef.current);
                    layer.bindTooltip(route.name, { sticky: true });
                    const b = layer.getBounds();
                    if (b.isValid()) bounds.extend(b);
                  } catch {}
                }
                if (bounds.isValid()) mapInst.current?.fitBounds(bounds, { padding: [60, 60] });
                setLoading(false);
              }} className="w-full py-2 bg-purple-800 text-white rounded-xl font-bold text-xs mt-2">🚀 Show Combined Route</button>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 max-h-60 overflow-y-auto">
            {verified.map((item) => {
              const inQueue = buildQueue.find(q => q.route_uuid === item.route_uuid);
              return (
                <button key={item.route_uuid} onClick={() => {
                  if (inQueue) { setBuildQueue(prev => prev.filter(q => q.route_uuid !== item.route_uuid)); }
                  else { setBuildQueue(prev => [...prev, item]); }
                }} className={`w-full text-left p-2 rounded-lg flex items-start gap-2 mb-0.5 text-xs ${inQueue ? "bg-purple-100" : "hover:bg-gray-50"}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 mt-0.5 ${inQueue ? "bg-purple-800 text-white" : "bg-gray-200 text-gray-500"}`}>{inQueue ? "✓" : "+"}</span>
                  <span className="truncate text-gray-700">{item.name}</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => { setBuildQueue([]); layerRef.current?.clearLayers(); }} className="w-full py-2 border border-gray-200 text-gray-500 rounded-lg text-xs">Clear All</button>
        </div>
      )}

      {/* Route list (verified + reference tabs) */}
      {tab !== "build" && (
        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="text-center py-8 text-gray-400 text-xs">Loading routes…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">No routes found</div>
          ) : (
            <div className="p-2">
              <p className="text-[11px] text-gray-400 px-1 py-1.5">{filtered.length} route{filtered.length !== 1 ? "s" : ""} — click to view on map</p>
              {filtered.map((route) => {
                const id = route.route_uuid || route.id;
                const name = route.name || route.route_name || "Unknown";
                const mode = route.mode || route.agency || "";
                const active = (selected?.route_uuid || selected?.id) === id;
                const isMatched = tab === "reference" ? route.is_matched : route.is_approved;
                return (
                  <button key={id || name} onClick={() => selectRoute(route)}
                    className="w-full text-left p-2.5 rounded-lg flex items-start gap-2 mb-0.5"
                    style={{ background: active ? "#f3f0ff" : "transparent" }}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 mt-0.5 ${
                      tab === "reference" 
                        ? (isMatched ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")
                        : "bg-green-100 text-green-700"
                    }`}>
                      {tab === "reference" ? (isMatched ? "✓" : "✗") : "✓"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-gray-900">{name}</p>
                      {mode && <p className="text-[10px] text-gray-400 truncate capitalize">{mode}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="p-3 border-t border-gray-100 bg-gray-50 shrink-0">
        <Link to="/" className="flex items-center justify-center gap-2 py-2.5 bg-purple-800 text-white rounded-xl font-semibold text-[13px] no-underline">🚐 Commute</Link>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="fixed inset-0 flex z-40 bg-gray-100" style={{ top: "4rem" }}>
        {!isMobile && <aside className="w-80 shrink-0 h-full border-r border-gray-200 shadow-lg z-10">{sidebar}</aside>}
        {isMobile && mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/50 z-50" />}
        {isMobile && (
          <aside className={`fixed top-0 left-0 bottom-0 w-80 z-50 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
            {sidebar}
          </aside>
        )}
        <div className="flex-1 relative min-w-0">
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} className="absolute top-4 left-4 z-30 bg-white rounded-2xl px-3.5 py-2 shadow-md font-semibold text-[13px] text-purple-800">☰ Routes</button>
          )}
          <Link to="/" className="absolute top-4 right-4 z-30 bg-white rounded-2xl px-3.5 py-2 shadow-md text-gray-700 font-medium text-[13px] no-underline">Home</Link>
          <div ref={mapRef} className="absolute inset-0 z-0" />
          {loading && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
              <div className="bg-white rounded-2xl shadow-xl px-5 py-3.5 flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-purple-100 border-t-purple-800 rounded-full animate-spin" />
                <p className="text-[13px] font-bold text-gray-900">Loading route…</p>
              </div>
            </div>
          )}
          {selected && !loading && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-[min(90vw,400px)]">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-purple-800 to-purple-600 px-4 py-3 flex items-center gap-2.5">
                  <div className="flex-1">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                      {selected.mode || selected.agency || "transit"}
                    </span>
                  </div>
                  <button onClick={clearSelection} className="bg-white/20 rounded-lg w-7 h-7 flex items-center justify-center text-white text-sm">✕</button>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{selected.name || selected.route_name}</h3>
                  <Link to="/" className="flex items-center justify-center gap-2 py-2.5 mt-3 bg-purple-800 text-white rounded-xl font-bold text-[13px] no-underline">🚐 Commute</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <LandingPageFooter />
    </>
  );
}

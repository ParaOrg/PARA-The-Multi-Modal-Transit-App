import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = "";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function AdminApproval() {
  const [pending, setPending] = useState([]);
  const [commuteLogs, setCommuteLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [map, setMap] = useState(null);
  const [layerGroup, setLayerGroup] = useState(null);
  const [tab, setTab] = useState("pending");

  useEffect(() => {
    fetch(`${API}/admin/pending/list`).then(r => r.json()).then(d => setPending(d.routes || []));
    fetch(`${API}/admin/commute/logs`).then(r => r.json()).then(d => setCommuteLogs(d.logs || []));
  }, []);

  useEffect(() => {
    const el = document.getElementById("approval-map");
    if (!el) return;
    const m = L.map(el, { zoomControl: true }).setView([14.5995, 120.9842], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(m);
    setMap(m);
    return () => m.remove();
  }, []);

  const previewRoute = async (filename) => {
    const res = await fetch(`${API}/admin/pending/geojson/${filename}`);
    const data = await res.json();
    setSelected(data);
    
    if (!map) return;
    if (layerGroup) map.removeLayer(layerGroup);
    const lg = L.layerGroup().addTo(map);
    setLayerGroup(lg);
    
    data.features?.forEach((feat) => {
      const coords = feat.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      L.polyline(coords, { color: "#f59e0b", weight: 4, opacity: 0.8 }).addTo(lg);
      L.circleMarker(coords[0], { radius: 6, fillColor: "#22c55e", color: "#fff", weight: 2, fillOpacity: 1 }).addTo(lg).bindTooltip("START", { permanent: true });
      L.circleMarker(coords[coords.length-1], { radius: 6, fillColor: "#ef4444", color: "#fff", weight: 2, fillOpacity: 1 }).addTo(lg).bindTooltip("END", { permanent: true });
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    });
  };

  const approve = async (filename) => {
    const res = await fetch(`${API}/admin/pending/approve?filename=${encodeURIComponent(filename)}`, { method: "POST" });
    const data = await res.json();
    alert(data.message);
    setPending(prev => prev.filter(r => r.file !== filename));
    setSelected(null);
  };

  const reject = async (filename) => {
    const reason = prompt("Rejection reason (optional):") || "";
    const res = await fetch(`${API}/admin/pending/reject?filename=${encodeURIComponent(filename)}&reason=${encodeURIComponent(reason)}`, { method: "POST" });
    const data = await res.json();
    alert(data.message);
    setPending(prev => prev.filter(r => r.file !== filename));
    setSelected(null);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel */}
      <div className="w-96 flex-shrink-0 flex flex-col border-r bg-white">
        <div className="p-4 border-b bg-amber-50">
          <h1 className="text-lg font-bold text-amber-800">📋 Admin Approval</h1>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setTab("pending")} className={`px-3 py-1 rounded text-xs font-bold ${tab==="pending"?"bg-amber-600 text-white":"bg-gray-100"}`}>
              🕐 Pending ({pending.length})
            </button>
            <button onClick={() => setTab("logs")} className={`px-3 py-1 rounded text-xs font-bold ${tab==="logs"?"bg-purple-600 text-white":"bg-gray-100"}`}>
              📊 Commute Logs ({commuteLogs.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "pending" && pending.map((r, i) => (
            <div key={i} onClick={() => previewRoute(r.file)} className={`px-4 py-3 border-b cursor-pointer hover:bg-amber-50 ${selected?.file===r.file?"bg-amber-100 border-l-4 border-l-amber-600":""}`}>
              <div className="font-medium text-sm">{r.name}</div>
              <div className="flex gap-1 mt-1 text-[10px]">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded capitalize">{r.type}</span>
                {r.loop && <span className="bg-blue-100 px-1.5 py-0.5 rounded">loop</span>}
                {r.bidirectional && <span className="bg-green-100 px-1.5 py-0.5 rounded">bidir</span>}
                <span className="text-gray-400">{r.coords_count} pts</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{r.saved_at}</div>
            </div>
          ))}
          
          {tab === "logs" && commuteLogs.map((l, i) => (
            <div key={i} className="px-4 py-3 border-b text-sm">
              <div className="font-medium">{l.route || "Unknown route"}</div>
              <div className="text-xs text-gray-500">
                {Math.floor(l.time/60)}m {l.time%60}s • {(l.distance/1000).toFixed(2)}km • {l.gps_points} GPS pts
              </div>
            </div>
          ))}
          
          {tab === "pending" && pending.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No pending routes</div>
          )}
        </div>

        {/* Action buttons */}
        {selected && tab === "pending" && (
          <div className="p-3 border-t bg-gray-50 flex gap-2">
            <button onClick={() => approve(selected.file || "")} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600">
              ✅ Approve
            </button>
            <button onClick={() => reject(selected.file || "")} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600">
              ❌ Reject
            </button>
          </div>
        )}
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1 relative">
        <div id="approval-map" className="absolute inset-0" />
        {selected && (
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 rounded-lg shadow-lg p-3 max-w-xs text-xs">
            <div className="font-bold text-amber-800">{selected.features?.[0]?.properties?.route_long_name || "Route"}</div>
            <div className="text-gray-500 mt-1">
              {selected.features?.[0]?.properties?.type} • 
              {selected.features?.[0]?.properties?.loop ? " Loop" : " Point-to-point"} •
              {selected.features?.[0]?.properties?.bidirectional ? " Bidirectional" : " One-way"}
            </div>
            <div className="text-gray-400 mt-0.5">{selected.features?.[0]?.geometry?.coordinates?.length || 0} coordinates</div>
          </div>
        )}
      </div>
    </div>
  );
}

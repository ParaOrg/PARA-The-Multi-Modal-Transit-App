import { useState, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = "";
const MANILA = [14.5995, 120.9842];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function RouteUploader() {
  const [step, setStep] = useState(1); // 1=photo, 2=track, 3=details, 4=done
  const [photo, setPhoto] = useState(null);
  const [routeName, setRouteName] = useState("");
  const [isLoop, setIsLoop] = useState(null);
  const [isBidirectional, setIsBidirectional] = useState(false);
  const [vehicleType, setVehicleType] = useState("jeep");
  const [tracking, setTracking] = useState(false);
  const [track, setTrack] = useState([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const trackLine = useRef(null);
  const watchId = useRef(null);

  // Init map
  useEffect(() => {
    const t = setTimeout(() => {
      const el = document.getElementById("uploader-map");
      if (!el || mapInstance.current) return;
      const map = L.map(el, { zoomControl: true }).setView(MANILA, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: "&copy; OSM",
      }).addTo(map);
      mapInstance.current = map;
    }, 300);
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not available");
      return;
    }
    setTracking(true);
    setTrack([]);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt = [pos.coords.latitude, pos.coords.longitude];
        setTrack(prev => [...prev, pt]);
        // Draw on map
        const map = mapInstance.current;
        if (map) {
          if (trackLine.current) map.removeLayer(trackLine.current);
          trackLine.current = L.polyline([...track, pt], { color: "#310775", weight: 4, opacity: 0.9 }).addTo(map);
          map.setView(pt, 16);
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const stopTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTracking(false);
    setStep(3);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(URL.createObjectURL(file));
      setStep(2);
    }
  };

  const saveRoute = async () => {
    if (!routeName.trim()) {
      alert("Please enter a route name");
      return;
    }
    if (track.length < 2) {
      alert("Need at least 2 GPS points");
      return;
    }

    setSaving(true);
    try {
      // Build GeoJSON
      const geojson = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: {
            route_long_name: routeName,
            route_name: routeName,
            type: vehicleType,
            mode: vehicleType,
            bidirectional: isBidirectional,
            loop: isLoop,
            oneway: isLoop || !isBidirectional,
            last_updated: new Date().toISOString().split("T")[0],
            notes: notes,
            source: "community",
            verified: false,
          },
          geometry: {
            type: "LineString",
            coordinates: track.map(([lat, lng]) => [lng, lat]),
          },
        }],
      };

      // Save via API
      const res = await fetch(`${API}/admin/routes/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geojson),
      });
      
      if (res.ok) {
        setStep(4);
      } else {
        // Fallback: download as file
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${routeName.replace(/\s+/g, "_")}.geojson`;
        a.click();
        alert("Route saved as download! Place it in geojson_data/ folder.");
        setStep(4);
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b shadow-sm">
        <h1 className="text-lg font-bold text-purple-900">🛤️ Route Uploader</h1>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${step >= s ? "bg-purple-600" : "bg-gray-200"}`} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>Photo</span><span>Track</span><span>Details</span><span>Done</span>
        </div>
      </div>

      {/* Step 1: Photo Upload */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-600 mb-6 text-center">Take a photo of the jeepney sign or route board</p>
          <label className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold cursor-pointer hover:bg-purple-700">
            📷 Upload Photo
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
          </label>
          <button onClick={() => setStep(2)} className="mt-4 text-sm text-gray-400 underline">
            Skip photo → go to tracking
          </button>
        </div>
      )}

      {/* Step 2: GPS Tracking */}
      {step === 2 && (
        <div className="flex-1 flex flex-col">
          {photo && (
            <div className="h-32 bg-black flex items-center justify-center overflow-hidden">
              <img src={photo} alt="Jeepney sign" className="max-h-full object-contain" />
            </div>
          )}
          <div className="flex-1 relative">
            <div id="uploader-map" className="absolute inset-0" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
              {!tracking ? (
                <button onClick={startTracking} className="px-8 py-3 bg-green-500 text-white rounded-full font-bold shadow-lg hover:bg-green-600">
                  ▶ Start Tracking
                </button>
              ) : (
                <button onClick={stopTracking} className="px-8 py-3 bg-red-500 text-white rounded-full font-bold shadow-lg hover:bg-red-600 animate-pulse">
                  ⏹ Stop ({track.length} pts)
                </button>
              )}
            </div>
            {track.length > 0 && !tracking && (
              <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow p-2 text-xs">
                {track.length} points recorded
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Route Details */}
      {step === 3 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="text-sm font-semibold text-gray-700">Route Name *</label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g., Cubao - Lagro via East Ave"
              className="w-full p-3 border border-gray-200 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="text-sm font-semibold text-gray-700">Vehicle Type</label>
            <div className="flex gap-2 mt-2">
              {["jeep", "bus", "uv", "train"].map((t) => (
                <button
                  key={t}
                  onClick={() => setVehicleType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${vehicleType === t ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="text-sm font-semibold text-gray-700">Route Type</label>
            <p className="text-xs text-gray-400 mt-1">Does this route run in a loop (circle back) or point-to-point?</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { setIsLoop(true); setIsBidirectional(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${isLoop === true ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                🔄 Loop (one-way)
              </button>
              <button
                onClick={() => { setIsLoop(false); setIsBidirectional(true); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${isLoop === false ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                ↔ Bidirectional
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="text-sm font-semibold text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional info about this route..."
              className="w-full p-3 border border-gray-200 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-purple-500 h-20"
            />
          </div>

          <button
            onClick={saveRoute}
            disabled={saving}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save Route"}
          </button>
          <button onClick={() => setStep(2)} className="w-full py-2 text-sm text-gray-400 underline">
            ← Back to tracking
          </button>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-xl font-bold text-green-700">Route Saved!</p>
          <p className="text-gray-500 mt-2 text-center">
            {routeName}<br/>
            {track.length} GPS points • {vehicleType} • {isLoop ? "Loop" : "Bidirectional"}
          </p>
          <button
            onClick={() => { setStep(1); setPhoto(null); setRouteName(""); setTrack([]); setIsLoop(null); }}
            className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
          >
            ➕ Add Another Route
          </button>
        </div>
      )}
    </div>
  );
}

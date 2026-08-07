/**
 * RouteUploader.jsx — One-tap GPS route recording for community submissions.
 * Press Record → ride your commute → press Stop → route auto-saved.
 */

import { useState, useRef, useCallback } from "react";
import { getApiBaseUrl } from "../utils/api";

const API = getApiBaseUrl();

export default function RouteUploader({ onSuccess }) {
  const [recording, setRecording] = useState(false);
  const [gpsPoints, setGpsPoints] = useState([]);
  const [routeName, setRouteName] = useState("");
  const [mode, setMode] = useState("jeepney");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const watchRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const MODES = ["jeepney", "bus", "train", "lrt", "mrt", "uv_express"];

  // Start recording GPS
  const startRecording = () => {
    if (!navigator.geolocation) {
      setError("GPS not available on this device");
      return;
    }
    setError(null);
    setGpsPoints([]);
    setRecording(true);
    startTimeRef.current = Date.now();
    
    // Update elapsed time
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Watch GPS
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPoints(prev => [...prev, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        }]);
      },
      (err) => setError("GPS error: " + err.message),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
  };

  // Stop recording and save
  const stopRecording = async () => {
    // Stop GPS
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);

    if (gpsPoints.length < 3) {
      setError("Need at least 3 GPS points to save a route. Try recording a longer ride.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Build GeoJSON from GPS points
      const coords = gpsPoints.map(p => [p.lng, p.lat]);
      const geojson = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: {
            route_long_name: routeName.trim() || `Recorded Route ${new Date().toLocaleDateString()}`,
            type: mode,
            recorded_at: new Date().toISOString(),
            gps_points: gpsPoints.length,
            duration_sec: elapsed,
          },
          geometry: {
            type: "LineString",
            coordinates: coords,
          },
        }],
      };

      const res = await fetch(`${API}/admin/routes/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geojson),
      });

      if (!res.ok) throw new Error("Save failed");
      setSuccess(true);
      if (onSuccess) setTimeout(onSuccess, 1500);
    } catch (e) {
      setError(e.message || "Failed to save route");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setRecording(false);
    setGpsPoints([]);
    setRouteName("");
    setMode("jeepney");
    setError(null);
    setSuccess(false);
    setElapsed(0);
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <p className="text-3xl mb-2">✅</p>
        <h3 className="text-lg font-bold text-green-800">Route Saved!</h3>
        <p className="text-sm text-green-600 mt-1">{gpsPoints.length} GPS points · {Math.floor(elapsed / 60)}m {elapsed % 60}s</p>
        <button onClick={reset} className="mt-4 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">Record Another</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h2 className="text-lg font-bold text-gray-900">📡 Record a Route</h2>
      <p className="text-sm text-gray-500">
        Press Record, ride your commute, then press Stop. Your GPS trace is automatically saved as a route.
      </p>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">⚠️ {error}</div>}

      {/* Route name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Route Name (optional)</label>
        <input type="text" value={routeName} onChange={(e) => setRouteName(e.target.value)}
          placeholder="e.g., Cubao to Makati" disabled={recording}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100" />
      </div>

      {/* Mode */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Transit Mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)} disabled={recording}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 capitalize disabled:bg-gray-100">
          {MODES.map((m) => (<option key={m} value={m} className="capitalize">{m.replace("_", " ")}</option>))}
        </select>
      </div>

      {/* Recording status */}
      {recording && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-bold text-red-700">Recording</span>
          </div>
          <p className="text-3xl font-black text-red-600 tabular-nums">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
          </p>
          <p className="text-sm text-red-500 mt-1">{gpsPoints.length} GPS points</p>
        </div>
      )}

      {/* Buttons */}
      {!recording ? (
        <button onClick={startRecording}
          className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors">
          🔴 Start Recording
        </button>
      ) : (
        <button onClick={stopRecording} disabled={saving}
          className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : "⏹ Stop & Save Route"}
        </button>
      )}

      {!recording && gpsPoints.length > 0 && (
        <button onClick={reset} className="w-full py-2 border border-gray-300 text-gray-500 rounded-lg text-xs hover:bg-gray-50">Clear</button>
      )}

      <p className="text-xs text-gray-400">
        Your GPS trace will be submitted for review. Make sure you're actually riding the route for accurate data.
      </p>
    </div>
  );
}

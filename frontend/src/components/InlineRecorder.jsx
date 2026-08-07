/**
 * InlineRecorder.jsx — Compact GPS recorder embedded in chat panel.
 * Flow: Start Recording → Ride → Stop → Auto-save
 */

import { useState, useRef, useEffect } from "react";
import { getApiBaseUrl } from "../utils/api";

const API = getApiBaseUrl();

export default function InlineRecorder({ onDone }) {
  const [step, setStep] = useState("start"); // start | recording | saving | done
  const [gpsPoints, setGpsPoints] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const watchRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const start = () => {
    if (!navigator.geolocation) {
      setError("GPS not available");
      return;
    }
    setError(null);
    setGpsPoints([]);
    setStep("recording");
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPoints(prev => [...prev, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
        }]);
      },
      (err) => setError("GPS: " + err.message),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
  };

  const stop = async () => {
    if (watchRef.current) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setStep("saving");

    if (gpsPoints.length < 3) {
      setError("Need more GPS points. Try a longer ride.");
      setStep("start");
      return;
    }

    try {
      const coords = gpsPoints.map(p => [p.lng, p.lat]);
      const geojson = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: {
            route_long_name: `Recorded ${new Date().toLocaleDateString()}`,
            type: "jeepney",
            recorded_at: new Date().toISOString(),
            gps_points: gpsPoints.length,
            duration_sec: elapsed,
          },
          geometry: { type: "LineString", coordinates: coords },
        }],
      };

      await fetch(`${API}/admin/routes/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geojson),
      });
      setStep("done");
      if (onDone) setTimeout(onDone, 1000);
    } catch (e) {
      setError("Save failed: " + e.message);
      setStep("start");
    }
  };

  if (step === "done") {
    return (
      <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
        <p className="text-lg mb-1">✅</p>
        <p className="text-sm font-bold text-green-800">Route Saved!</p>
        <p className="text-xs text-green-600">{gpsPoints.length} GPS points · {Math.floor(elapsed / 60)}m {elapsed % 60}s</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-purple-200 rounded-xl p-4 space-y-3">
      {error && <div className="bg-red-50 rounded-lg p-2 text-xs text-red-600">⚠️ {error}</div>}

      {step === "start" && (
        <div className="text-center">
          <p className="text-sm font-bold text-purple-900 mb-3">📡 Record a New Route</p>
          <button onClick={start}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors">
            🔴 Start Recording
          </button>
          <p className="text-[10px] text-gray-400 mt-2">Keep app open while riding. Press stop at your destination.</p>
        </div>
      )}

      {step === "recording" && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-bold text-red-700 text-sm">Recording Route</span>
          </div>
          <p className="text-3xl font-black text-red-600 tabular-nums">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
          </p>
          <p className="text-xs text-red-500 mt-1">{gpsPoints.length} GPS points captured</p>
          <button onClick={stop}
            className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 mt-3 transition-colors">
            ⏹ Stop & Save
          </button>
        </div>
      )}

      {step === "saving" && (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-3 border-purple-200 border-t-purple-800 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Saving route…</p>
        </div>
      )}
    </div>
  );
}

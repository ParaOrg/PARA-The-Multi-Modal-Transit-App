/**
 * CommuteTracker.jsx — Live commute tracking with:
 *   - Wait time timer (before first segment)
 *   - Hop on / hop off per segment
 *   - GPS tracking (if available)
 *   - Evaluation/rating at the end
 *
 * Props:
 *   routeData — { segments, total_fare, total_time_min, message }
 *   onComplete — callback(commuteLog) when commute is finished
 *   onCancel — callback to exit tracker
 */

import { useState, useEffect, useRef, useCallback } from "react";

export default function CommuteTracker({ routeData, onComplete, onCancel }) {
  const rawSegments = routeData?.segments || [];
  const segments = rawSegments.filter(
    (seg) => seg.route !== "WALK_TO_ROUTE" && seg.route !== "WALK_TO_DEST" && seg.route !== "WALK_TRANSFER"
  );
  const [phase, setPhase] = useState("waiting"); // waiting | riding | done
  const [currentSegment, setCurrentSegment] = useState(0);
  const [waitStart] = useState(Date.now());
  const [segmentStart, setSegmentStart] = useState(null);
  const [waitTime, setWaitTime] = useState(0);
  const [segmentTimes, setSegmentTimes] = useState(segments.map(() => 0));
  const [gpsPoints, setGpsPoints] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [gpsError, setGpsError] = useState(null);
  const watchId = useRef(null);
  const timerRef = useRef(null);

  // ── Wait timer ─────────────────────────────────────
  useEffect(() => {
    if (phase !== "waiting") return;
    timerRef.current = setInterval(() => {
      setWaitTime(Math.floor((Date.now() - waitStart) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, waitStart]);

  // ── Segment timer ──────────────────────────────────
  useEffect(() => {
    if (phase !== "riding" || !segmentStart) return;
    timerRef.current = setInterval(() => {
      setSegmentTimes((prev) => {
        const next = [...prev];
        next[currentSegment] = Math.floor((Date.now() - segmentStart) / 1000);
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, segmentStart, currentSegment]);

  // ── GPS tracking ───────────────────────────────────
  const startGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS not available on this device");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPoints((prev) => [
          ...prev,
          {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          },
        ]);
        setGpsError(null);
      },
      (err) => setGpsError(`GPS error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }, []);

  const stopGps = useCallback(() => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  // Start GPS when tracker opens, stop when it closes
  useEffect(() => {
    startGps();
    return () => stopGps();
  }, [startGps, stopGps]);

  // ── Actions ────────────────────────────────────────
  const hopOn = () => {
    setSegmentStart(Date.now());
    setPhase("riding");
  };

  const hopOff = () => {
    setSegmentStart(null);
    const next = currentSegment + 1;
    if (next >= segments.length) {
      // Last segment — done
      setPhase("done");
      stopGps();
    } else {
      setCurrentSegment(next);
      setPhase("waiting");
    }
  };

  const finish = () => {
    const commuteLog = {
      routeData,
      waitTimeSec: waitTime,
      segmentTimesSec: segmentTimes,
      totalTimeSec: waitTime + segmentTimes.reduce((a, b) => a + b, 0),
      gpsPoints,
      rating,
      comment,
      completedAt: new Date().toISOString(),
    };
    if (onComplete) onComplete(commuteLog);
  };

  // ── Render ─────────────────────────────────────────
  const currentSeg = segments[currentSegment];
  const isLastSegment = currentSegment >= segments.length - 1;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
      {/* Header — fixed */}
      <div className="bg-purple-800 text-white px-4 py-3 flex items-center justify-between shrink-0 rounded-t-3xl">
        <div>
          <p className="font-bold text-sm">🚀 Tracked Commute</p>
          <p className="text-purple-200 text-xs">{routeData?.message}</p>
        </div>
        <button onClick={onCancel} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
      {/* GPS status */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2 text-xs">
        <span className={`w-2 h-2 rounded-full ${gpsPoints.length > 0 ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
        <span className="text-gray-500">
          {gpsError ? (
            <span>
              {gpsError}{" "}
              <button onClick={() => {
                navigator.geolocation?.getCurrentPosition(
                  () => { setGpsError(null); startGps(); },
                  (err) => setGpsError(`GPS: ${err.message}`),
                  { timeout: 5000 }
                );
              }} className="text-purple-700 underline font-semibold">Retry</button>
            </span>
          ) : gpsPoints.length > 0 ? (
            `GPS active (${gpsPoints.length} points)`
          ) : (
            "GPS starting…"
          )}
        </span>
      </div>

      {/* Segments progress */}
      <div className="px-4 py-2 flex gap-1">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${
              i < currentSegment ? "bg-green-500"
              : i === currentSegment ? "bg-purple-500 animate-pulse"
              : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Content by phase */}
      <div className="p-4 space-y-3">
        {phase === "waiting" && (
          <div className="text-center">
            <p className="text-3xl font-black text-purple-800 tabular-nums">
              {Math.floor(waitTime / 60)}:{(waitTime % 60).toString().padStart(2, "0")}
            </p>
            <p className="text-sm text-gray-500 mt-1">Waiting for your ride</p>
            <p className="text-xs text-gray-400 mt-2 truncate">
              Next: {currentSeg?.route || "Transit"} — {currentSeg?.time_min} min est.
            </p>
            <button
              onClick={hopOn}
              className="mt-4 w-full py-3 bg-purple-800 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors"
            >
              🚌 Hop On — {currentSeg?.route || "Start Ride"}
            </button>
          </div>
        )}

        {phase === "riding" && (
          <div className="text-center">
            <p className="text-3xl font-black text-green-600 tabular-nums">
              {Math.floor((segmentTimes[currentSegment] || 0) / 60)}:
              {((segmentTimes[currentSegment] || 0) % 60).toString().padStart(2, "0")}
            </p>
            <p className="text-sm text-gray-500 mt-1">Riding — {currentSeg?.route || "Transit"}</p>
            <p className="text-xs text-gray-400 mt-2">
              {currentSeg?.time_min} min estimated · ₱{currentSeg?.fare}
            </p>
            <button
              onClick={hopOff}
              className="mt-4 w-full py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors"
            >
              {isLastSegment ? "🏁 Hop Off — Finish Ride" : "🚏 Hop Off — Transfer"}
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl mb-1">🎉</p>
              <p className="font-bold text-gray-800">Commute Complete!</p>
              <p className="text-sm text-gray-500 mt-1">
                Total: {Math.floor((waitTime + segmentTimes.reduce((a, b) => a + b, 0)) / 60)} min
                · {gpsPoints.length} GPS points
              </p>
            </div>

            {/* Evaluation */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Rate your commute</p>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${star <= rating ? "text-amber-400" : "text-gray-300 hover:text-amber-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any notes about this commute? (optional)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Segment breakdown */}
            <div className="text-xs space-y-1">
              <p className="font-semibold text-gray-600">Segment breakdown</p>
              <div className="flex items-center gap-2 text-gray-500">
                <span>⏳ Wait:</span>
                <span>{Math.floor(waitTime / 60)}m {waitTime % 60}s</span>
              </div>
              {segments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-500">
                  <span>{seg.is_transfer ? "🚶" : "🚌"}</span>
                  <span className="truncate">{seg.route || "Transit"}:</span>
                  <span>{Math.floor((segmentTimes[i] || 0) / 60)}m {(segmentTimes[i] || 0) % 60}s</span>
                </div>
              ))}
            </div>

            <button
              onClick={finish}
              className="w-full py-3 bg-purple-800 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors"
            >
              💾 Save & Finish
            </button>

            <button
              onClick={() => {
                alert("Share to community coming soon! Your route will be submitted for others to use.");
              }}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors"
            >
              📤 Share Route to Community
            </button>

            <button
              onClick={() => {
                finish();
                onCancel();
              }}
              className="w-full py-3 border-2 border-purple-800 text-purple-800 rounded-xl font-bold text-sm hover:bg-purple-50 transition-colors"
            >
              🚐 Commute Again
            </button>

            <button
              onClick={onCancel}
              className="w-full py-2 border border-gray-300 text-gray-500 rounded-lg text-xs hover:bg-gray-50"
            >
              Discard
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

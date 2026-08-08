import { useState, useEffect } from "react";

export default function GpsPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!window.__userLocation) setShow(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show || window.__userLocation) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full">
        <span className="text-5xl">📍</span>
        <h2 className="text-xl font-black text-[#381D65] mt-4">Enable Location</h2>
        <p className="text-sm text-gray-500 mt-2">
          Para PH needs your location to find routes from where you are.
        </p>
        <button onClick={() => {
          setShow(false);
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                window.__userLocation = [pos.coords.latitude, pos.coords.longitude];
              },
              () => {
                alert("Please enable Location Services in Settings → Privacy → Location Services → Safari");
              },
              { enableHighAccuracy: true, timeout: 15000 }
            );
          }
        }} className="w-full mt-6 py-3 bg-[#7A4BC8] text-white rounded-xl font-bold text-sm">
          Enable Location
        </button>
        <button onClick={() => setShow(false)} className="w-full mt-2 py-2 text-gray-400 text-xs">
          Not now
        </button>
      </div>
    </div>
  );
}

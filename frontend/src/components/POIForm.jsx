import { useState } from "react";
import { getApiBaseUrl } from "../utils/api";

const API = getApiBaseUrl();

const CATEGORIES = ["terminal", "station", "landmark", "mall", "school", "church", "government"];

export default function POIForm({ onSuccess }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("terminal");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [useGPS, setUseGPS] = useState(false);

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
          setUseGPS(true);
        },
        () => setMsg({ ok: false, text: "GPS not available" })
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !lat || !lng) {
      setMsg({ ok: false, text: "Please fill all fields" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/poi/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canonical_name: name.trim(),
          category,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        }),
      });
      if (res.ok) {
        setMsg({ ok: true, text: "POI added successfully!" });
        setName(""); setCategory("terminal"); setLat(""); setLng("");
        if (onSuccess) setTimeout(onSuccess, 1500);
      } else {
        throw new Error("Failed");
      }
    } catch (e) {
      setMsg({ ok: false, text: "Failed to save POI" });
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <h3 className="font-bold text-[#381D65] text-sm">📍 Add a Place</h3>
      
      {msg && (
        <div className={`text-xs p-2 rounded-lg ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </div>
      )}

      <input value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Place name (e.g., Cubao Terminal)"
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#7A4BC8]" />

      <select value={category} onChange={(e) => setCategory(e.target.value)}
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none">
        {CATEGORIES.map(c => (
          <option key={c} value={c} className="capitalize">{c}</option>
        ))}
      </select>

      <div className="flex gap-2">
        <input value={lat} onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude" type="number" step="any"
          className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#7A4BC8]" />
        <input value={lng} onChange={(e) => setLng(e.target.value)}
          placeholder="Longitude" type="number" step="any"
          className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#7A4BC8]" />
      </div>

      <button onClick={useCurrentLocation}
        className="w-full py-1.5 text-xs border border-[#7A4BC8] text-[#7A4BC8] rounded-lg font-medium">
        📍 Use My Current Location
      </button>

      <button onClick={handleSubmit} disabled={saving}
        className="w-full py-2 bg-[#7A4BC8] text-white rounded-lg text-xs font-bold">
        {saving ? "Saving..." : "Save Place"}
      </button>
    </div>
  );
}

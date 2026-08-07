/**
 * map_component.jsx — Leaflet with high-res tiles from Stadia Maps (free).
 */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_CENTER = [14.5995, 120.9842];

// High-res tiles from multiple fast CDNs
const TILE_URLS = [
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png",
];

export default function MapComponent({ markers = [], polylines = [], showLegend = true, fitBounds = true, onMapReady }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
      .setView(DEFAULT_CENTER, 13);
    L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}@2x.png", { maxZoom: 20, detectRetina: true, attribution: "&copy; Stadia Maps &copy; OpenStreetMap" }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstance.current = map;
    setReady(true);
    if (onMapReady) onMapReady(map);
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !ready) return;
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.LayerGroup) {
        map.removeLayer(layer);
      }
    });
    const bounds = L.latLngBounds([]);
    markers.forEach((m) => {
      const lat = m.lat ?? m.latitude ?? m.position?.[0];
      const lng = m.lng ?? m.longitude ?? m.position?.[1];
      if (lat == null || lng == null) return;
      const color = m.type === "origin" ? "#22c55e" : m.type === "destination" ? "#ef4444" : "#7A4BC8";
      const icon = L.divIcon({
        className: "", html: `<div style="width:14px;height:14px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      });
      L.marker([lat, lng], { icon }).addTo(map);
      bounds.extend([lat, lng]);
    });
    polylines.forEach((line) => {
      const coords = Array.isArray(line) ? line : line?.coordinates;
      if (!coords || coords.length < 2) return;
      L.polyline(coords, {
        color: line?.color || "#7A4BC8", weight: line?.weight || 4,
        opacity: line?.opacity ?? 0.8, dashArray: line?.dashed ? "8, 5" : null,
      }).addTo(map);
      coords.forEach(c => bounds.extend(c));
    });
    if (fitBounds && bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [markers, polylines, ready, fitBounds]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-xl" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            <span className="text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  );
}
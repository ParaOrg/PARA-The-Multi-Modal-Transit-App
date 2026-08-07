/**
 * map_component.jsx — Leaflet map wrapper.
 *
 * Props:
 *   center?          — [lat, lng] default center
 *   markers?         — [{ lat, lng, type, label }]  type: "origin"|"destination"|"poi"
 *   polylines?       — [[[lat, lng], ...]]  array of coordinate arrays
 *   fitBounds?       — auto-fit map to markers/polylines
 *   showLegend?      — toggle legend overlay
 *   onMapReady?      — callback receiving map instance
 *   children?        — React children rendered inside map container
 */

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import RouteLegend from "./RouteLegend";

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Custom icons ───────────────────────────────────────

const ORIGIN_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;
    background:#22c55e;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const DEST_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;
    background:#ef4444;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const POI_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:12px;height:12px;
    background:#7c3aed;
    border:2px solid white;
    border-radius:50%;
    box-shadow:0 1px 4px rgba(0,0,0,0.25);
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function iconForType(type) {
  if (type === "origin") return ORIGIN_ICON;
  if (type === "destination") return DEST_ICON;
  return POI_ICON;
}

// ── Default center ─────────────────────────────────────
const DEFAULT_CENTER = [14.5995, 120.9842]; // Manila

export default function MapComponent({
  center,
  markers = [],
  polylines = [],
  fitBounds = true,
  showLegend = true,
  onMapReady,
  children,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [ready, setReady] = useState(false);

  // ── Initialize map once ──────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(center || DEFAULT_CENTER, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;
    setReady(true);
    if (onMapReady) onMapReady(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // ── Update center ────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !center) return;
    mapInstance.current.setView(center, 13);
  }, [center]);

  // ── Render markers + polylines ───────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !ready) return;

    // Clear previous dynamic layers (keep tile layer)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.LayerGroup) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);

    // Place markers
    markers.forEach((m) => {
      const lat = m.lat ?? m.latitude ?? m.position?.[0];
      const lng = m.lng ?? m.longitude ?? m.position?.[1];
      if (lat == null || lng == null) return;

      const icon = iconForType(m.type);
      const marker = L.marker([lat, lng], { icon }).addTo(map);

      const label = m.label || m.name || "";
      if (label) {
        marker.bindTooltip(label, { direction: "top", offset: [0, -8] });
      }

      bounds.extend([lat, lng]);
    });

    // Draw polylines — support both raw coordinate arrays and {coordinates, color, weight} objects
    polylines.forEach((line) => {
      // Accept { coordinates: [[lat,lng],...], color, weight, dashed } format
      const coords = Array.isArray(line) ? line : line?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return;
      L.polyline(coords, {
        color: line?.color || "#7c3aed",
        weight: line?.weight || 4,
        opacity: line?.opacity ?? 0.8,
        dashArray: line?.dashed ? "8, 5" : null,
      }).addTo(map);
      coords.forEach((c) => bounds.extend(c));
    });

    // Fit bounds
    if (fitBounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [markers, polylines, ready, fitBounds]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-xl shadow-lg" />

      {showLegend && <RouteLegend markers={markers} />}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            <span className="text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

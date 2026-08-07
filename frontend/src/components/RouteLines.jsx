/**
 * RouteLines.jsx — Purple polyline for route geometry.
 *
 * Props:
 *   map     — Leaflet map instance
 *   lines   — array of { coordinates: [[lat,lng],...], color?, weight?, dashed? }
 */

import { useEffect, useRef } from "react";
import L from "leaflet";

export default function RouteLines({ map, lines = [] }) {
  const layerGroup = useRef(null);

  useEffect(() => {
    if (!map || !lines.length) return;

    // Clear previous lines
    if (layerGroup.current) {
      map.removeLayer(layerGroup.current);
    }

    const group = L.layerGroup().addTo(map);
    layerGroup.current = group;

    lines.forEach((lineData) => {
      // Accept both formats: { coordinates } or { points: [{lat,lng}] }
      let coords = lineData.coordinates;
      if (!coords && lineData.points) {
        coords = lineData.points.map((p) => [p.lat ?? p.latitude, p.lng ?? p.longitude]);
      }
      if (!coords || coords.length < 2) return;

      L.polyline(coords, {
        color: lineData.color || "#7c3aed",
        weight: lineData.weight || 4,
        opacity: lineData.opacity ?? 0.8,
        dashArray: lineData.dashed ? "8, 5" : null,
      }).addTo(group);
    });

    return () => {
      if (layerGroup.current) {
        map.removeLayer(layerGroup.current);
      }
    };
  }, [map, lines]);

  return null;
}

/**
 * RouteMarkers.jsx — Green pin for origin, red pin for destination.
 *
 * Props:
 *   map       — Leaflet map instance
 *   origin    — { lat, lng, label? }
 *   destination — { lat, lng, label? }
 */

import { useEffect, useRef } from "react";
import L from "leaflet";

const ORIGIN_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;
    background:#22c55e;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 2px 10px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const DEST_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;
    background:#ef4444;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 2px 10px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function RouteMarkers({ map, origin, destination }) {
  const layerGroup = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Clear previous markers
    if (layerGroup.current) {
      map.removeLayer(layerGroup.current);
    }

    const group = L.layerGroup().addTo(map);
    layerGroup.current = group;
    const bounds = L.latLngBounds([]);

    // Origin — green
    if (origin?.lat != null && origin?.lng != null) {
      const marker = L.marker([origin.lat, origin.lng], { icon: ORIGIN_ICON }).addTo(group);
      if (origin.label) marker.bindTooltip(origin.label, { direction: "top", offset: [0, -10] });
      bounds.extend([origin.lat, origin.lng]);
    }

    // Destination — red
    if (destination?.lat != null && destination?.lng != null) {
      const marker = L.marker([destination.lat, destination.lng], { icon: DEST_ICON }).addTo(group);
      if (destination.label) marker.bindTooltip(destination.label, { direction: "top", offset: [0, -10] });
      bounds.extend([destination.lat, destination.lng]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }

    return () => {
      if (layerGroup.current) {
        map.removeLayer(layerGroup.current);
      }
    };
  }, [map, origin, destination]);

  return null;
}

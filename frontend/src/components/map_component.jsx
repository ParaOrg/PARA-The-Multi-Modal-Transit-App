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

export default function MapComponent({ markers = [], polylines = [], showLegend = true, fitBounds = true, onMapReady }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [ready, setReady] = useState(false);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (mapRef.current._leaflet_id) return;
    
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true })
      .setView(DEFAULT_CENTER, 13);

    L.tileLayer("https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
      maxZoom: 20,
      attribution: '&copy; CartoDB &copy; OpenStreetMap',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    
    
    
    mapInstance.current = map;
    window.__paraMap = map;
    setReady(true);
// GPS tracking with marker after map is ready
    map.whenReady(() => {
      if (navigator.geolocation) {
        let userMarker = null;
        navigator.geolocation.watchPosition(
          (pos) => {
            const latlng = [pos.coords.latitude, pos.coords.longitude];
            window.__userLocation = latlng;
            if (!userMarker) {
              userMarker = L.circleMarker(latlng, {
                radius: 8,
                fillColor: "#4285F4",
                color: "#fff",
                weight: 3,
                fillOpacity: 1,
              }).addTo(map).bindTooltip("You are here", { direction: "top" });
              map.setView(latlng, 15);
            } else {
              userMarker.setLatLng(latlng);
            }
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
      }
    });
    if (onMapReady) onMapReady(map);
    
    return () => {
      window.__paraMap = null;
      window.__userLocation = null;
      window.__userMarker = null;
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Route markers in separate layer
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !ready) return;
    
    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
    routeLayerRef.current = L.layerGroup().addTo(map);
    
    markers.forEach((m) => {
      const lat = m.lat ?? m.latitude ?? m.position?.[0];
      const lng = m.lng ?? m.longitude ?? m.position?.[1];
      if (lat == null || lng == null) return;
      const color = m.type === "origin" ? "#22c55e" : m.type === "destination" ? "#ef4444" : "#7A4BC8";
      const icon = L.divIcon({ className: "", html: '<div style="width:14px;height:14px;background:' + color + ';border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>', iconSize: [14,14], iconAnchor: [7,7] });
      L.marker([lat, lng], { icon }).addTo(routeLayerRef.current);
    });
  }, [markers, ready]);

  // Polylines in separate layer
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !ready) return;
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline) map.removeLayer(layer);
    });
    const bounds = L.latLngBounds([]);
    polylines.forEach((line) => {
      const coords = Array.isArray(line) ? line : line?.coordinates;
      if (!coords || coords.length < 2) return;
      L.polyline(coords, { color: line?.color || "#7A4BC8", weight: line?.weight || 4, opacity: line?.opacity ?? 0.8, dashArray: line?.dashed ? "8,5" : null }).addTo(map);
      coords.forEach(c => bounds.extend(c));
    });
    if (fitBounds && polylines.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
    }
  }, [polylines, ready, fitBounds]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-xl" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}

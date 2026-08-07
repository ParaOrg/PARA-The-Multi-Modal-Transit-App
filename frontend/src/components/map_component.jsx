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

// GPS pin — white border, blue fill
const GPS_ICON = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function MapComponent({ markers = [], polylines = [], showLegend = true, fitBounds = true, onMapReady }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [ready, setReady] = useState(false);
  const gpsMarkerRef = useRef(null);
  const initRef = useRef(false);

  // Init map ONCE
  useEffect(() => {
    if (initRef.current) return;
    if (!mapRef.current) return;
    initRef.current = true;

    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true }).setView(DEFAULT_CENTER, 13);
    L.tileLayer("https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
      maxZoom: 20, attribution: '&copy; CartoDB &copy; OpenStreetMap',
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstance.current = map;
    window.__paraMap = map;
    setReady(true);
    if (onMapReady) onMapReady(map);

    // GPS tracking — store position only
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          window.__userLocation = [pos.coords.latitude, pos.coords.longitude];
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    return () => {
      initRef.current = false;
      window.__paraMap = null;
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // GPS marker — check continuously until location is available
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !ready) return;
    
    const check = setInterval(() => {
      const loc = window.__userLocation;
      if (loc) {
        clearInterval(check);
        if (!gpsMarkerRef.current) {
          gpsMarkerRef.current = L.marker(loc, { icon: GPS_ICON, zIndexOffset: 9999 }).addTo(map).bindTooltip("You are here");
          map.setView(loc, 15);
        } else {
          gpsMarkerRef.current.setLatLng(loc);
        }
      }
    }, 500);
    
    return () => clearInterval(check);
  }, [ready]);

  // Polylines FIRST (under markers)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !ready) return;
    map.eachLayer(l => { if (l instanceof L.Polyline) map.removeLayer(l); });
    const bounds = L.latLngBounds([]);
    console.log("MapComponent polylines:", polylines.length, polylines.map(l => ({dashed: l.dashed, pts: l.coordinates?.length, color: l.color})));
    polylines.forEach(line => {
      const coords = Array.isArray(line) ? line : line?.coordinates;
      if (!coords || coords.length < 2) return;
      L.polyline(coords, {
        color: line?.color || "#7A4BC8",
        weight: line?.weight || 4,
        opacity: line?.opacity ?? 0.8,
        dashArray: line?.dashed ? "10, 5" : null,
      }).addTo(map);
      coords.forEach(c => bounds.extend(c));
    });
    if (fitBounds && polylines.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [polylines, ready, fitBounds]);

  // Markers SECOND (on top of polylines)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !ready) return;
    map.eachLayer(l => {
      if ((l instanceof L.Marker || l instanceof L.CircleMarker) && l !== gpsMarkerRef.current) {
        map.removeLayer(l);
      }
    });
    markers.forEach(m => {
      const lat = m.lat ?? m.latitude ?? m.position?.[0];
      const lng = m.lng ?? m.longitude ?? m.position?.[1];
      if (lat == null || lng == null) return;
      const color = m.type === "origin" ? "#22c55e" : m.type === "destination" ? "#ef4444" : "#7A4BC8";
      L.circleMarker([lat, lng], { radius: 7, fillColor: color, color: "#fff", weight: 3, fillOpacity: 1 }).addTo(map);
    });
  }, [markers, ready]);

  // GPS marker
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !ready) return;
    const check = setInterval(() => {
      const loc = window.__userLocation;
      if (loc && !gpsMarkerRef.current) {
        clearInterval(check);
        const icon = L.divIcon({ className: '', html: '<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
        gpsMarkerRef.current = L.marker(loc, { icon, zIndexOffset: 9999 }).addTo(map).bindTooltip("You are here");
        map.setView(loc, 15);
      }
    }, 500);
    return () => clearInterval(check);
  }, [ready]);


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

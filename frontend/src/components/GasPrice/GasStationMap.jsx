import { useState } from 'react';
import { Map } from '@vis.gl/react-google-maps';
import GasStationMarker from './GasStationMarker';
import { useGasStations } from './useGasStations';
import { getGoogleMapsApiKey } from '../../config/googleMaps';

const API_KEY = getGoogleMapsApiKey();

const METRO_MANILA = { lat: 14.5995, lng: 120.9842 };

const BRANDS = {
  shell:     { name: 'Shell',         color: '#E8C200' },
  seaoil:    { name: 'SeaOil',        color: '#1A56DB' },
  caltex:    { name: 'Caltex',        color: '#C8102E' },
  ptt:       { name: 'PTT',           color: '#009A44' },
  cleanfuel: { name: 'Cleanfuel',     color: '#00B2A9' },
  total:     { name: 'TotalEnergies', color: '#EF3340' },
  petron:    { name: 'Petron',        color: '#003087' },
};

export default function GasStationMap() {
  const { stations, loading, error } = useGasStations();
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeBrands, setActiveBrands] = useState(new Set(Object.keys(BRANDS)));

  const toggleBrand = (brand) => {
    setActiveBrands(prev => {
      const next = new Set(prev);
      next.has(brand) ? next.delete(brand) : next.add(brand);
      return next;
    });
  };

  const visibleStations = stations.filter(s => activeBrands.has(s.brand));

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">

      {/* Brand filter bar — horizontally scrollable on mobile */}
      <div className="px-4 py-3.5 flex gap-2 overflow-x-auto border-b border-gray-100 bg-gray-50/80"
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <span className="text-xs text-gray-500 font-semibold self-center mr-1 shrink-0">Filter:</span>
        {Object.entries(BRANDS).map(([brand, { name, color }]) => (
          <button
            key={brand}
            onClick={() => toggleBrand(brand)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 border cursor-pointer"
            style={{
              backgroundColor: activeBrands.has(brand) ? color : '#f3f4f6',
              color: activeBrands.has(brand) ? '#fff' : '#6b7280',
              borderColor: activeBrands.has(brand) ? color : '#e5e7eb',
              boxShadow: activeBrands.has(brand) ? '0 6px 14px rgba(15,23,42,0.12)' : 'none',
            }}
            aria-pressed={activeBrands.has(brand)}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Map area */}
      {!API_KEY ? (
        <div className="h-96 flex flex-col items-center justify-center bg-gray-50 gap-2">
          <span className="text-3xl">🗺️</span>
          <p className="text-gray-400 text-sm text-center px-6">
            Google Maps API key not configured.<br />
            Set <code className="bg-gray-100 px-1 rounded text-xs">VITE_GOOGLE_MAPS_API_KEY</code> in your <code className="bg-gray-100 px-1 rounded text-xs">.env.frontend.dev</code> file.
          </p>
        </div>
      ) : (
        <div style={{ height: 'clamp(420px, 58vw, 620px)', position: 'relative' }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="w-7 h-7 border-4 border-purple-800 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <Map
            defaultCenter={METRO_MANILA}
            defaultZoom={12}
            mapId="paraph-gas-stations"
            gestureHandling="greedy"
            clickableIcons={false}
            mapTypeControl={false}
            fullscreenControl={false}
            streetViewControl={false}
            style={{ width: '100%', height: '100%' }}
          >
            {visibleStations.map(station => (
              <GasStationMarker
                key={station.id}
                station={station}
                isSelected={selectedStation?.id === station.id}
                onSelect={setSelectedStation}
              />
            ))}
          </Map>
        </div>
      )}

      {error && (
        <p className="text-center text-red-400 text-xs py-2 border-t border-gray-100">
          Could not load stations: {error}
        </p>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/70">
        <p className="text-xs text-gray-400">
          {loading ? 'Loading stations…' : `${visibleStations.length} station${visibleStations.length !== 1 ? 's' : ''} shown`}
        </p>
        <p className="text-xs text-gray-400 hidden sm:block">Tap a marker to view prices &amp; report</p>
      </div>
    </div>
  );
}

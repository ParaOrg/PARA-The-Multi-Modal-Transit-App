import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useGasStations } from './useGasStations';
import { usePriceSubmit } from './usePriceSubmit';
import { getApiBaseUrl } from '../../config/api';

const API_BASE = getApiBaseUrl();

const BRANDS = {
  shell:     { name: 'Shell',         color: '#E8C200' },
  seaoil:    { name: 'SeaOil',        color: '#1A56DB' },
  caltex:    { name: 'Caltex',        color: '#C8102E' },
  ptt:       { name: 'PTT',           color: '#009A44' },
  cleanfuel: { name: 'Cleanfuel',     color: '#00B2A9' },
  total:     { name: 'TotalEnergies', color: '#EF3340' },
  petron:    { name: 'Petron',        color: '#003087' },
};

const FUEL_LABELS = {
  ron91:          'Gasoline RON 91',
  ron95:          'Gasoline RON 95',
  ron97:          'Gasoline RON 97',
  xcs:            'Petron XCS',
  diesel:         'Diesel',
  diesel_premium: 'Diesel Premium',
  kerosene:       'Kerosene',
};

const BRAND_FUELS = {
  shell:     ['ron91','ron95','ron97','diesel','diesel_premium'],
  seaoil:    ['ron91','ron95','diesel','diesel_premium','kerosene'],
  caltex:    ['ron91','ron95','ron97','diesel','diesel_premium'],
  ptt:       ['ron91','ron95','diesel'],
  cleanfuel: ['ron91','ron95','diesel'],
  total:     ['ron91','ron95','ron97','diesel','diesel_premium'],
  petron:    ['ron91','ron95','ron97','xcs','diesel','diesel_premium'],
};

const REPORT_PRIMARY_BTN =
  'w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-purple-900 hover:bg-pink-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors';

function getDistanceM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Step 1: Select a nearby station ──────────────────────────────────────────

function StationSelectStep({ stations, coords, onSelect, onAdd }) {
  const nearby = stations
    .map(s => ({
      ...s,
      dist: (s.lat && s.lng && coords)
        ? getDistanceM(coords.lat, coords.lng, s.lat, s.lng)
        : Infinity,
    }))
    .filter(s => s.dist <= 2000)
    .sort((a, b) => a.dist - b.dist);

  return (
    <div className="flex min-h-full flex-col">
      <p className="text-sm text-gray-500 mb-3">
        {!coords
          ? 'No location available.'
          : nearby.length > 0
            ? `${nearby.length} station${nearby.length !== 1 ? 's' : ''} found within 2 km of you`
            : 'No registered stations found within 2 km.'}
      </p>

      <div className="space-y-2 overflow-y-auto pr-0.5" style={{ maxHeight: 'min(44dvh, 420px)' }}>
        {nearby.map(s => {
          const brand = BRANDS[s.brand];
          const distLabel = s.dist < 1000
            ? `${Math.round(s.dist)} m`
            : `${(s.dist / 1000).toFixed(1)} km`;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-300 hover:bg-purple-50/50 transition-colors cursor-pointer bg-white"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: brand?.color ?? '#888' }}
              >
                <img src={`/logos/${s.brand}.svg`} alt={s.brand} className="w-6 h-6 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-gray-800 truncate">{s.name}</p>
                <p className="text-xs text-gray-400 truncate">{s.address}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                {distLabel}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onAdd}
        className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-purple-400 hover:text-purple-900 transition-colors cursor-pointer bg-transparent"
      >
        <span className="font-bold text-lg leading-none">+</span>
        <span className="text-center leading-snug">
          {nearby.length > 0 ? "Don't see your station? Add it" : 'Add the station you\'re at'}
        </span>
      </button>
    </div>
  );
}

// ── Places autocomplete (must be inside APIProvider context) ─────────────────

function PlacesSearch({ onPlaceSelect }) {
  const inputRef = useRef(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;
    const ac = new places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ph' },
      fields: ['name', 'formatted_address', 'geometry'],
    });
    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (place.geometry?.location) {
        onPlaceSelect({
          name: place.name ?? '',
          address: place.formatted_address ?? '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
        // Show chosen name in the input
        if (inputRef.current) inputRef.current.value = place.name ?? '';
      }
    });
    return () => window.google?.maps?.event?.removeListener(listener);
  }, [places]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={places ? 'Search for the station…' : 'Loading Maps…'}
      disabled={!places}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-50 disabled:text-gray-400"
    />
  );
}

// ── Step 2: Add a new station ─────────────────────────────────────────────────

function AddStationStep({ onStationAdded, onBack }) {
  const [brand, setBrand] = useState(null);
  const [place, setPlace] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSave = async () => {
    if (!brand || !place) return;
    if (!API_BASE) {
      setSaveError('API is not configured for this environment.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/gas-prices/stations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, name: place.name, address: place.address, lat: place.lat, lng: place.lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save station');
      onStationAdded(data);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs text-gray-400 mb-5 hover:text-gray-600 cursor-pointer bg-transparent border-0 p-0"
      >
        ← Back to stations
      </button>

      {/* Brand picker */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Brand</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(BRANDS).map(([key, { name, color }]) => (
            <button
              key={key}
              onClick={() => { setBrand(key); setPlace(null); }}
              className="rounded-full px-3 py-1.5 text-xs font-semibold border-0 cursor-pointer transition-all duration-150"
              style={{
                backgroundColor: brand === key ? color : '#f3f4f6',
                color: brand === key ? '#fff' : '#6b7280',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Places search */}
      {brand && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Find on Google Maps</p>
          <PlacesSearch onPlaceSelect={setPlace} />
          <p className="text-xs text-gray-400 mt-1.5">Search by station name or address — address is pulled from Google Maps</p>
        </div>
      )}

      {/* Confirmed place */}
      {place && (
        <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: BRANDS[brand]?.color }}
          >
            <img src={`/logos/${brand}.svg`} alt={brand} className="w-5 h-5 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-800 truncate">{place.name}</p>
            <p className="text-xs text-gray-400 truncate">{place.address}</p>
          </div>
        </div>
      )}

      {saveError && (
        <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2 mb-3">{saveError}</p>
      )}

      <button
        onClick={handleSave}
        disabled={!brand || !place || saving}
        className={REPORT_PRIMARY_BTN}
      >
        {saving ? 'Saving…' : 'Save & Continue →'}
      </button>
    </div>
  );
}

// ── Step 3: Report price for selected station ─────────────────────────────────

function PriceReportStep({ station, onClose, onBack }) {
  const { submit, submitting, result, clearResult, cancelSubmit } = usePriceSubmit();
  const fuels = BRAND_FUELS[station.brand] ?? Object.keys(FUEL_LABELS);
  const [fuel, setFuel] = useState(fuels[0]);
  const [price, setPrice] = useState('');
  const brandColor = BRANDS[station.brand]?.color ?? '#310775';

  useEffect(() => {
    setFuel(fuels[0]);
    setPrice('');
    clearResult();
  }, [station.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (result?.success) {
      const t = setTimeout(onClose, 2500);
      return () => clearTimeout(t);
    }
  }, [result?.success, onClose]);

  const handleBack = () => {
    cancelSubmit();
    setPrice('');
    setFuel(fuels[0]);
    clearResult();
    onBack();
  };

  const handleCancelAndClose = () => {
    cancelSubmit();
    setPrice('');
    setFuel(fuels[0]);
    clearResult();
    onClose();
  };

  return (
    <div>
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1 text-xs text-gray-400 mb-4 hover:text-gray-600 cursor-pointer bg-transparent border-0 p-0"
      >
        ← Back to stations
      </button>

      {/* Station header */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: brandColor }}
        >
          <img src={`/logos/${station.brand}.svg`} alt={station.brand} className="w-7 h-7 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-800 truncate">{station.name}</p>
          <p className="text-xs text-gray-400 truncate">{station.address}</p>
        </div>
      </div>

      {result?.success ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-bold text-green-600 text-base">Thank you!</p>
          <p className="text-sm text-gray-500 mt-1">{result.message}</p>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); submit(station.id, fuel, price); }} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Fuel Type
            </label>
            <select
              value={fuel}
              onChange={e => setFuel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-purple-400"
            >
              {fuels.map(k => (
                <option key={k} value={k}>{FUEL_LABELS[k]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Price per Liter
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm pointer-events-none select-none">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                min="30"
                max="200"
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          {result?.error && (
            <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{result.error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={REPORT_PRIMARY_BTN}
          >
            {submitting ? 'Submitting…' : 'Submit Price Report'}
          </button>

          <button
            type="button"
            onClick={handleCancelAndClose}
            className="w-full py-3 rounded-xl font-semibold text-sm text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <p className="text-center text-xs text-gray-400">No account needed · Helps the community</p>
        </form>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function ReportModal({ isOpen, onClose, coords }) {
  const { stations, loading } = useGasStations();
  const [step, setStep] = useState('selecting');
  const [selectedStation, setSelectedStation] = useState(null);

  const resetModalState = () => {
    setStep('selecting');
    setSelectedStation(null);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Ensure Places autocomplete dropdown renders above modal
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'pac-z-override';
    style.textContent = '.pac-container { z-index: 10000 !important; }';
    document.head.appendChild(style);
    return () => document.getElementById('pac-z-override')?.remove();
  }, []);

  if (!isOpen) return null;

  const STEP_TITLES = {
    selecting: 'Report a Fuel Price',
    adding:    'Add a Station',
    reporting: selectedStation?.name ?? 'Report Price',
  };

  const modalContent = (
    <div className="fixed inset-0 z-[220] flex items-end sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Sheet — bottom sheet on mobile, centred dialog on sm+ */}
      <div
        className="relative w-screen max-w-none h-svh sm:w-full sm:max-w-md sm:h-auto sm:max-h-[90dvh] bg-white rounded-none sm:rounded-2xl shadow-2xl flex flex-col pb-[env(safe-area-inset-bottom)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
          <h2 className="font-bold text-gray-900 text-base leading-tight truncate pr-2">
            {STEP_TITLES[step]}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer border-0 bg-transparent text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain px-5 py-4 flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-purple-800 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : step === 'selecting' ? (
            <StationSelectStep
              stations={stations}
              coords={coords}
              onSelect={s => { setSelectedStation(s); setStep('reporting'); }}
              onAdd={() => setStep('adding')}
            />
          ) : step === 'adding' ? (
            <AddStationStep
              onStationAdded={s => { setSelectedStation(s); setStep('reporting'); }}
              onBack={() => setStep('selecting')}
            />
          ) : (
            <PriceReportStep
              station={selectedStation}
              onClose={handleClose}
              onBack={() => setStep('selecting')}
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

import { useState } from 'react';
import { usePriceSubmit } from './usePriceSubmit';

const FUEL_LABELS = {
  ron91:          'RON 91',
  ron95:          'RON 95',
  ron97:          'RON 97',
  xcs:            'Petron XCS',
  diesel:         'Diesel',
  diesel_premium: 'Diesel Premium',
  kerosene:       'Kerosene',
};

const BRAND_COLORS = {
  shell:     '#E8C200',
  seaoil:    '#1A56DB',
  caltex:    '#C8102E',
  ptt:       '#009A44',
  cleanfuel: '#00B2A9',
  total:     '#EF3340',
  petron:    '#003087',
};

// Fuel types available per brand (XCS only at Petron)
const BRAND_FUELS = {
  shell:     ['ron91','ron95','ron97','diesel','diesel_premium'],
  seaoil:    ['ron91','ron95','diesel','diesel_premium','kerosene'],
  caltex:    ['ron91','ron95','ron97','diesel','diesel_premium'],
  ptt:       ['ron91','ron95','diesel'],
  cleanfuel: ['ron91','ron95','diesel'],
  total:     ['ron91','ron95','ron97','diesel','diesel_premium'],
  petron:    ['ron91','ron95','ron97','xcs','diesel','diesel_premium'],
};

// Uses inline styles throughout — this renders inside Google Maps overlay DOM
// where Tailwind utility classes are not guaranteed to apply.
export default function StationInfoPanel({ station }) {
  const { submit, submitting, result, clearResult } = usePriceSubmit();
  const availableFuels = BRAND_FUELS[station.brand] ?? Object.keys(FUEL_LABELS);
  const [selectedFuel, setSelectedFuel] = useState(availableFuels[1] ?? availableFuels[0]);
  const [priceInput, setPriceInput]     = useState('');
  const [showForm, setShowForm]         = useState(false);

  const color = BRAND_COLORS[station.brand] ?? '#666';
  const communityPrices = station.community_prices ?? {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!priceInput || isNaN(parseFloat(priceInput))) return;
    await submit(station.id, selectedFuel, priceInput);
    setPriceInput('');
    // Auto-collapse after success
    if (result?.success) setTimeout(() => { setShowForm(false); clearResult(); }, 2500);
  };

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minWidth: 240, maxWidth: 300, fontSize: 13 }}>

      {/* Station header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', backgroundColor: color, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={`/logos/${station.brand}.svg`} alt={station.brand}
               style={{ width: 22, height: 22, objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{station.name}</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>{station.address}</div>
        </div>
      </div>

      {/* Community prices table */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#999', letterSpacing: '0.05em', marginBottom: 5 }}>
          COMMUNITY PRICES
        </div>
        {availableFuels.map(key => {
          const cp = communityPrices[key];
          return (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 3 }}>
              <span style={{ color: '#555', fontSize: 12 }}>{FUEL_LABELS[key]}</span>
              {cp ? (
                <span style={{ fontSize: 12 }}>
                  <strong>₱{cp.community_avg.toFixed(2)}</strong>
                  <span style={{ color: '#aaa', marginLeft: 4, fontSize: 11 }}>
                    ({cp.report_count} {cp.report_count === 1 ? 'report' : 'reports'})
                  </span>
                </span>
              ) : (
                <span style={{ color: '#ccc', fontSize: 12 }}>No reports yet</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit form toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 6, border: 'none',
            backgroundColor: color, color: '#fff', fontWeight: 700,
            fontSize: 12, cursor: 'pointer', letterSpacing: '0.02em',
          }}
        >
          Report a price
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ borderTop: '1px solid #eee', paddingTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#999', letterSpacing: '0.05em', marginBottom: 6 }}>
            SUBMIT PRICE REPORT
          </div>

          <select
            value={selectedFuel}
            onChange={e => setSelectedFuel(e.target.value)}
            style={{
              width: '100%', padding: '6px 8px', borderRadius: 5,
              border: '1px solid #ddd', marginBottom: 8, fontSize: 12,
              backgroundColor: '#fff',
            }}
          >
            {availableFuels.map(key => (
              <option key={key} value={key}>{FUEL_LABELS[key]}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, color: '#666', pointerEvents: 'none',
              }}>₱</span>
              <input
                type="number"
                step="0.01"
                min="30"
                max="200"
                placeholder="per liter"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                required
                style={{
                  width: '100%', padding: '6px 8px 6px 20px', borderRadius: 5,
                  border: '1px solid #ddd', fontSize: 12, boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '6px 14px', borderRadius: 5, border: 'none', flexShrink: 0,
                backgroundColor: submitting ? '#ccc' : color,
                color: '#fff', fontWeight: 700, fontSize: 12, cursor: submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? '…' : 'Send'}
            </button>
          </div>

          {result?.success && (
            <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>
              {result.message}
            </div>
          )}
          {result?.error && (
            <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 4 }}>
              {result.error}
            </div>
          )}

          <button
            type="button"
            onClick={() => { setShowForm(false); clearResult(); setPriceInput(''); }}
            style={{
              fontSize: 11, color: '#888', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

import { useAdvancedMarkerRef, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import StationInfoPanel from './StationInfoPanel';

const BRAND_COLORS = {
  shell:     '#E8C200',
  seaoil:    '#1A56DB',
  caltex:    '#C8102E',
  ptt:       '#009A44',
  cleanfuel: '#00B2A9',
  total:     '#EF3340',
  petron:    '#003087',
};

export default function GasStationMarker({ station, isSelected, onSelect }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const color = BRAND_COLORS[station.brand] ?? '#555';

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: station.lat, lng: station.lng }}
        title={station.name}
        onClick={() => onSelect(isSelected ? null : station)}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          backgroundColor: color,
          border: isSelected ? '3px solid #fff' : '2.5px solid rgba(255,255,255,0.85)',
          boxShadow: isSelected
            ? `0 0 0 2px ${color}, 0 4px 10px rgba(0,0,0,0.4)`
            : '0 2px 6px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transform: isSelected ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}>
          <img
            src={`/logos/${station.brand}.svg`}
            alt={station.brand}
            style={{ width: 24, height: 24, objectFit: 'contain' }}
          />
        </div>
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => onSelect(null)}
          maxWidth={320}
        >
          <StationInfoPanel station={station} />
        </InfoWindow>
      )}
    </>
  );
}

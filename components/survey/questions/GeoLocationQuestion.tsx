import { useRef, useState } from 'react';
import LocationMapPicker, {
  LocationMapPickerRef,
} from '@/components/ui/LocationMapPicker';

const Ms = ({
  icon,
  style = {},
}: {
  icon: string;
  style?: React.CSSProperties;
}) => (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: 18, lineHeight: 1, verticalAlign: 'middle', ...style }}
  >
    {icon}
  </span>
);

export type GeoValue = { latitude: number; longitude: number } | null;

export default function GeoLocationQuestion({
  value,
  onChange,
}: {
  value: GeoValue;
  onChange: (v: GeoValue) => void;
}) {
  const mapRef = useRef<LocationMapPickerRef>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const coords =
    value &&
    typeof value === 'object' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number'
      ? value
      : null;

  const capture = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        // Drop the pin on the map; its onPick will propagate via onChange.
        mapRef.current?.setLocation(lat, lng);
      },
      (err) => {
        setLoading(false);
        setError(err.message || 'Could not retrieve your location.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        type="button"
        onClick={capture}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          borderRadius: 8,
          border: '1px solid #10b981',
          background: coords ? '#fff' : '#10b981',
          color: coords ? '#0f766e' : '#fff',
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        <Ms
          icon={loading ? 'progress_activity' : 'my_location'}
          style={{ fontSize: 16, color: coords ? '#0f766e' : '#fff' }}
        />
        {loading
          ? 'Locating…'
          : coords
            ? 'Update with my current location'
            : 'Use my current location'}
      </button>

      {error && (
        <p style={{ fontSize: 11, color: '#ef4444', margin: 0 }}>{error}</p>
      )}

      <LocationMapPicker
        ref={mapRef}
        initialLat={coords?.latitude}
        initialLng={coords?.longitude}
        onPick={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
      />
    </div>
  );
}

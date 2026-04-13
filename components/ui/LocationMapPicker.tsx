'use client';
import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';

interface Props {
  initialLat?: number;
  initialLng?: number;
  onPick: (lat: number, lng: number) => void;
}

export interface LocationMapPickerRef {
  searchAddress: (address: string) => void;
}

const LocationMapPicker = forwardRef<LocationMapPickerRef, Props>(
  ({ initialLat, initialLng, onPick }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletRef = useRef<any>(null);
    const mapInstance = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
      initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
    );
    const [error, setError] = useState('');

    const makeIcon = (L: any) =>
      L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

    const placeMarker = (L: any, lat: number, lng: number) => {
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = L.marker([lat, lng], {
        icon: makeIcon(L),
        draggable: true,
      }).addTo(mapInstance.current);
      markerRef.current.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        const r = {
          lat: parseFloat(pos.lat.toFixed(6)),
          lng: parseFloat(pos.lng.toFixed(6)),
        };
        setCoords(r);
        onPick(r.lat, r.lng);
      });
      const r = {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
      };
      setCoords(r);
      onPick(r.lat, r.lng);
    };

    const geocode = async (q: string) => {
      if (!q.trim() || !leafletRef.current || !mapInstance.current) return;
      setSearching(true);
      setError('');
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
          { headers: { 'Accept-Language': 'en' } },
        );
        const data = await res.json();
        if (!data.length) {
          setError('Location not found. Try a different address.');
          return;
        }
        const { lat, lon } = data[0];
        placeMarker(leafletRef.current, parseFloat(lat), parseFloat(lon));
        mapInstance.current.setView([parseFloat(lat), parseFloat(lon)], 16);
      } catch {
        setError('Search failed. Check your connection.');
      } finally {
        setSearching(false);
      }
    };

    useImperativeHandle(ref, () => ({
      searchAddress: (address: string) => {
        setQuery(address);
        geocode(address);
      },
    }));

    useEffect(() => {
      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const loadLeaflet = () =>
        new Promise<any>((resolve) => {
          if ((window as any).L) {
            resolve((window as any).L);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve((window as any).L);
          document.head.appendChild(script);
        });

      loadLeaflet().then((L) => {
        leafletRef.current = L;
        if (!mapRef.current || mapInstance.current) return;

        const center: [number, number] =
          initialLat && initialLng
            ? [initialLat, initialLng]
            : [25.7617, -80.1918];

        const map = L.map(mapRef.current).setView(center, initialLat ? 15 : 11);
        mapInstance.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        if (initialLat && initialLng) {
          markerRef.current = L.marker([initialLat, initialLng], {
            icon: makeIcon(L),
            draggable: true,
          }).addTo(map);
          markerRef.current.on('dragend', (e: any) => {
            const pos = e.target.getLatLng();
            const r = {
              lat: parseFloat(pos.lat.toFixed(6)),
              lng: parseFloat(pos.lng.toFixed(6)),
            };
            setCoords(r);
            onPick(r.lat, r.lng);
          });
        }

        map.on('click', (e: any) => {
          placeMarker(L, e.latlng.lat, e.latlng.lng);
        });
      });

      return () => {
        mapInstance.current?.remove();
        mapInstance.current = null;
      };
    }, []);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Manual search bar */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && (e.preventDefault(), geocode(query))
            }
            placeholder="Refine or type a different address…"
            style={{
              flex: 1,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              padding: '7px 10px',
              fontSize: 12,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="button"
            onClick={() => geocode(query)}
            disabled={searching}
            style={{
              borderRadius: 8,
              border: 'none',
              background: '#0f172a',
              color: '#fff',
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {searching ? '…' : 'Search'}
          </button>
        </div>

        {error && (
          <p style={{ fontSize: 11, color: '#ef4444', margin: 0 }}>{error}</p>
        )}

        {/* Map */}
        <div
          ref={mapRef}
          style={{
            height: 220,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            zIndex: 0,
          }}
        />

        {/* Coords */}
        {coords ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p
              style={{
                fontSize: 11,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#64748b',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14, color: '#64748b' }}
              >
                location_on
              </span>
              <strong style={{ color: '#0f172a' }}>Lat:</strong> {coords.lat}{' '}
              &nbsp;
              <strong style={{ color: '#0f172a' }}>Lng:</strong> {coords.lng}
            </p>
            <p
              style={{
                fontSize: 11,
                margin: 0,
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14, color: '#b45309' }}
              >
                warning
              </span>
              Please confirm this is the correct location. If not, click the map
              or drag the marker to adjust.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
            Use "Find on Map" or type an address and search to pin the location.
          </p>
        )}
      </div>
    );
  },
);

LocationMapPicker.displayName = 'LocationMapPicker';
export default LocationMapPicker;

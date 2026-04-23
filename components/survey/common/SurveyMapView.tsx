'use client';

import { useEffect, useRef } from 'react';
import type * as LeafletNS from 'leaflet';

type LeafletStatic = typeof LeafletNS;

/**
 * Read-only Leaflet map centred on a site survey's coordinates.
 *
 * Leaflet is loaded lazily from unpkg (script + CSS injected on
 * first mount) so the bundle stays small and SSR is unaffected.
 */
export default function SurveyMapView({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletNS.Map | null>(null);

  useEffect(() => {
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const load = () =>
      new Promise<LeafletStatic>((resolve) => {
        const w = window as unknown as { L?: LeafletStatic };
        if (w.L) {
          resolve(w.L);
          return;
        }
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload = () => resolve(w.L!);
        document.head.appendChild(s);
      });
    load().then((L) => {
      if (!mapRef.current || mapInstance.current) return;
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], 15);
      mapInstance.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      L.marker([lat, lng], {
        icon: L.icon({
          iconUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      })
        .addTo(map)
        .bindPopup(label)
        .openPopup();
    });
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [lat, lng, label]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        ref={mapRef}
        style={{
          height: 240,
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          zIndex: 0,
        }}
      />
      <p
        style={{
          fontSize: 11,
          color: '#64748b',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
          location_on
        </span>
        Lat: {lat} · Lng: {lng}
      </p>
    </div>
  );
}

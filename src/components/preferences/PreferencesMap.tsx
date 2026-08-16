import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, ZoomIn, ZoomOut, Locate } from 'lucide-react';
import { triggerHaptic } from '../../lib/capacitor';

interface PreferencesMapProps {
  lat: number;
  lng: number;
  maxDistanceKm: number;
  locationName: string;
  onLocationChange: (lat: number, lng: number) => void;
  isLocating?: boolean;
}

export const PreferencesMap: React.FC<PreferencesMapProps> = ({
  lat,
  lng,
  maxDistanceKm,
  locationName,
  onLocationChange,
  isLocating = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: maxDistanceKm > 100 ? 7 : maxDistanceKm > 40 ? 9 : 11,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark-themed CartoDB tiles (clean, sleek, matches the dark UI perfectly)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Custom glowing pink pin marker
    const pinIcon = L.divIcon({
      className: 'custom-crest-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: grab;">
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(233, 139, 208, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #FF4058 0%, #E98BD0 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(255, 64, 88, 0.6); border: 2px solid #ffffff;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    // Marker (Draggable)
    const marker = L.marker([lat, lng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      triggerHaptic('light');
      onLocationChange(position.lat, position.lng);
    });

    // Discovery radius circle
    const circle = L.circle([lat, lng], {
      radius: maxDistanceKm * 1000,
      color: '#FF4058',
      weight: 2,
      opacity: 0.85,
      dashArray: '6, 6',
      fillColor: '#E98BD0',
      fillOpacity: 0.18,
    }).addTo(map);

    // Click map to reposition marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      triggerHaptic('light');
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;
    setMapReady(true);

    // Invalidate map size after animation/render
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center, marker, and circle when coordinates change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;

    const currentMarkerPos = markerRef.current.getLatLng();
    if (Math.abs(currentMarkerPos.lat - lat) > 0.0001 || Math.abs(currentMarkerPos.lng - lng) > 0.0001) {
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.6 });
    }
  }, [lat, lng]);

  // Update circle radius when maxDistanceKm changes
  useEffect(() => {
    if (!circleRef.current || !mapInstanceRef.current) return;
    circleRef.current.setRadius(maxDistanceKm * 1000);
  }, [maxDistanceKm]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      triggerHaptic('light');
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      triggerHaptic('light');
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      triggerHaptic('light');
      mapInstanceRef.current.setView([lat, lng], maxDistanceKm > 100 ? 7 : maxDistanceKm > 40 ? 9 : 11, {
        animate: true,
      });
    }
  };

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-white/10 bg-[#171819] shadow-inner">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Pin Hint */}
      <div className="absolute top-2.5 left-2.5 z-10 px-3 py-1 rounded-full bg-[#101112]/85 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-gray-200 flex items-center gap-1.5 shadow-md">
        <span className="w-2 h-2 rounded-full bg-[#FF4058] animate-pulse" />
        <span className="truncate max-w-[170px]">{locationName}</span>
        <span className="text-gray-400 font-mono text-[10px]">({maxDistanceKm}km radius)</span>
      </div>

      {/* Action overlay controls */}
      <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleRecenter}
          className="w-8 h-8 rounded-xl bg-[#101112]/85 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all shadow-md"
          title="Recenter pin"
        >
          <Locate className="w-4 h-4 text-[#E98BD0]" />
        </button>
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-xl bg-[#101112]/85 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all shadow-md"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-gray-200" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-xl bg-[#101112]/85 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all shadow-md"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-gray-200" />
        </button>
      </div>

      {/* Tap / Drag hint bottom banner */}
      <div className="absolute bottom-2 inset-x-2 z-10 px-3 py-1.5 rounded-xl bg-[#101112]/90 backdrop-blur-md border border-white/10 text-[11px] text-center text-gray-300 flex items-center justify-center gap-1.5 shadow-md">
        <Navigation className="w-3.5 h-3.5 text-[#E98BD0] shrink-0" />
        <span>Drag pin or tap anywhere on the map to set location</span>
      </div>

      {/* Loading Overlay */}
      {isLocating && (
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex items-center justify-center">
          <div className="px-4 py-2 rounded-2xl bg-[#171819] border border-white/10 text-white text-xs font-bold flex items-center gap-2 shadow-xl">
            <div className="w-4 h-4 border-2 border-[#E98BD0] border-t-transparent rounded-full animate-spin" />
            <span>Detecting exact location...</span>
          </div>
        </div>
      )}
    </div>
  );
};

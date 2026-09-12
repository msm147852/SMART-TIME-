// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { apiUrl } from '../../services/apiConfig';
import { MapPin, Navigation, Crosshair, Check, Loader2, RefreshCw } from 'lucide-react';
import { TripLocation, LocationPickerMode } from './types';

interface MapLocationPickerProps {
  mode: LocationPickerMode;
  initialLocation?: TripLocation | null;
  onConfirm: (location: TripLocation) => void;
  language?: 'ar' | 'en';
}

// Subcomponent to handle map click events and updates
const MapClickDetector: React.FC<{
  onLocationChange: (lat: number, lng: number) => void;
}> = ({ onLocationChange }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onLocationChange(e.latLng.lat(), e.latLng.lng());
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onLocationChange]);

  return null;
};

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  mode,
  initialLocation,
  onConfirm,
  language = 'ar',
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const isRtl = language === 'ar';

  // Default coordinates: Cairo, Egypt
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number }>({
    lat: initialLocation?.latitude || (mode === 'pickup' ? 30.0561 : 30.0131),
    lng: initialLocation?.longitude || (mode === 'pickup' ? 31.3301 : 31.4289),
  });

  const [address, setAddress] = useState<string>(
    initialLocation?.address ||
      (mode === 'pickup' ? 'مدينة نصر، القاهرة' : 'التجمع الخامس، القاهرة الجديدة')
  );
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Reverse geocoding on position change
  const fetchAddressForPos = useCallback(async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const res = await fetch(apiUrl(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`));
      const data = await res.json();
      if (data.address) {
        setAddress(data.address);
      } else {
        setAddress(`موقع محدد (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch {
      setAddress(`موقع محدد (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  const handlePositionSelect = (lat: number, lng: number) => {
    setSelectedPos({ lat, lng });
    fetchAddressForPos(lat, lng);
  };

  // Get current device GPS location
  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      alert(isRtl ? 'الموقع الجغرافي غير مدعوم في هذا المتصفح' : 'Geolocation is not supported');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedPos({ lat, lng });
        fetchAddressForPos(lat, lng);
        setIsGettingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    onConfirm({
      address: address.trim() || `الموقع المحدد (${selectedPos.lat.toFixed(4)}, ${selectedPos.lng.toFixed(4)})`,
      latitude: selectedPos.lat,
      longitude: selectedPos.lng,
    });
  };

  return (
    <div className="flex flex-col h-[480px] sm:h-[540px] w-full bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-700">
      {/* Map Area */}
      <div className="flex-1 relative w-full h-full bg-slate-950">
        {apiKey ? (
          <APIProvider
            apiKey={apiKey}
            language={language}
            region="EG"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            <Map
              style={{ width: '100%', height: '100%' }}
              center={selectedPos}
              zoom={14}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              <MapClickDetector onLocationChange={handlePositionSelect} />
              <AdvancedMarker position={selectedPos} title={address}>
                <Pin
                  background={mode === 'pickup' ? '#10b981' : '#f43f5e'}
                  glyphColor="#ffffff"
                  scale={1.3}
                >
                  <span className="text-white text-xs font-black">
                    {mode === 'pickup' ? '📍' : '🏁'}
                  </span>
                </Pin>
              </AdvancedMarker>
            </Map>
          </APIProvider>
        ) : (
          /* Interactive Fallback Map Pin Canvas */
          <div
            className="w-full h-full relative cursor-crosshair bg-slate-900 flex items-center justify-center p-4 select-none"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              // Map click position to slight coordinate offset around Cairo
              const latOffset = (y / rect.height - 0.5) * -0.08;
              const lngOffset = (x / rect.width - 0.5) * 0.08;
              const newLat = 30.0444 + latOffset;
              const newLng = 31.2357 + lngOffset;
              handlePositionSelect(newLat, newLng);
            }}
          >
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(#38bdf8 1.5px, transparent 1.5px), radial-gradient(#6366f1 1.5px, #0f172a 1.5px)',
                backgroundSize: '32px 32px',
                backgroundPosition: '0 0, 16px 16px',
              }}
            />

            {/* Quick preset landmark buttons for rapid testing */}
            <div className="absolute top-3 inset-x-3 flex flex-wrap items-center gap-1.5 z-10">
              <span className="text-[11px] font-bold text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg backdrop-blur">
                {isRtl ? 'نقاط سريعة:' : 'Landmarks:'}
              </span>
              {[
                { name: 'مدينة نصر', lat: 30.0561, lng: 31.3301 },
                { name: 'مطار القاهرة', lat: 30.1219, lng: 31.4056 },
                { name: 'التجمع الخامس', lat: 30.0131, lng: 31.4289 },
                { name: 'المعادي', lat: 29.9602, lng: 31.2569 },
                { name: 'المهندسين', lat: 30.0588, lng: 31.2003 },
              ].map((lm) => (
                <button
                  key={lm.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePositionSelect(lm.lat, lm.lng);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-accent-500 hover:text-white border border-slate-700 text-slate-200 text-xs font-semibold shadow-sm transition-all"
                >
                  {lm.name}
                </button>
              ))}
            </div>

            {/* Center interactive marker */}
            <div className="relative z-10 flex flex-col items-center animate-bounce">
              <div
                className={`p-3 rounded-full text-white shadow-xl ${
                  mode === 'pickup' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
                }`}
              >
                <MapPin className="w-7 h-7" />
              </div>
              <span className="mt-1 px-2.5 py-0.5 rounded-full bg-black/80 text-white text-[11px] font-bold shadow-md">
                {mode === 'pickup' ? 'نقطة الانطلاق 📍' : 'نقطة النزول 🏁'}
              </span>
            </div>

            <div className="absolute bottom-3 end-3 text-[11px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg backdrop-blur">
              {isRtl ? 'انقر في أي مكان لتغيير الموقع' : 'Click anywhere to adjust location'}
            </div>
          </div>
        )}

        {/* Current GPS Floating Button */}
        <button
          onClick={handleGetCurrentGps}
          disabled={isGettingGps}
          className="absolute top-14 end-3 sm:top-4 sm:end-4 z-20 p-3 rounded-2xl bg-white text-slate-800 hover:bg-accent-50 shadow-xl border border-slate-200 font-bold text-xs flex items-center gap-2 transition-transform active:scale-95"
          title={isRtl ? 'استخدام موقعي الحالي' : 'Use Current Location'}
          aria-label={isRtl ? 'موقعي الحالي' : 'My Current Location'}
        >
          {isGettingGps ? (
            <Loader2 className="w-4 h-4 text-accent-600 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4 text-accent-600" />
          )}
          <span className="hidden sm:inline">{isRtl ? 'موقعي الحالي' : 'My Location'}</span>
        </button>
      </div>

      {/* Bottom Confirmation Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>{isRtl ? 'الموقع المحدد:' : 'Selected Location:'}</span>
            {isLoadingAddress && (
              <span className="text-accent-400 inline-flex items-center gap-1 text-[11px]">
                <Loader2 className="w-3 h-3 animate-spin" />
                {isRtl ? 'جاري جلب العنوان...' : 'Locating...'}
              </span>
            )}
          </div>
          <div className="text-sm font-extrabold text-white truncate bg-slate-850 p-2.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
            <span className={mode === 'pickup' ? 'text-emerald-400' : 'text-rose-400'}>
              {mode === 'pickup' ? '📍' : '🏁'}
            </span>
            <span className="truncate">{address}</span>
          </div>
        </div>

        {/* Confirmation Button */}
        <button
          onClick={handleConfirm}
          disabled={isLoadingAddress}
          className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 ${
            mode === 'pickup'
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
          }`}
          aria-label={isRtl ? 'تأكيد الموقع المحدد' : 'Confirm Selected Location'}
        >
          <Check className="w-4 h-4" />
          <span>{isRtl ? 'تأكيد الموقع' : 'Confirm Location'}</span>
        </button>
      </div>
    </div>
  );
};

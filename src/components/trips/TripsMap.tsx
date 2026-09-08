// Source: Google Maps Platform Code Assist
import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Compass, AlertCircle, RefreshCw, Layers, ZoomIn, ZoomOut, CheckCircle2 } from 'lucide-react';
import { TripLocation } from './types';

interface TripsMapProps {
  pickup: TripLocation | null;
  dropoff: TripLocation | null;
  onSelectPickup?: () => void;
  onSelectDropoff?: () => void;
  language?: 'ar' | 'en';
}

// Helper component to adjust bounds to include both points
const MapBoundsAdjuster: React.FC<{ pickup: TripLocation | null; dropoff: TripLocation | null }> = ({
  pickup,
  dropoff,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (pickup && dropoff) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: pickup.latitude, lng: pickup.longitude });
      bounds.extend({ lat: dropoff.latitude, lng: dropoff.longitude });
      map.fitBounds(bounds, 50);
    } else if (pickup) {
      map.panTo({ lat: pickup.latitude, lng: pickup.longitude });
      map.setZoom(14);
    } else if (dropoff) {
      map.panTo({ lat: dropoff.latitude, lng: dropoff.longitude });
      map.setZoom(14);
    }
  }, [map, pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude]);

  return null;
};

export const TripsMap: React.FC<TripsMapProps> = ({
  pickup,
  dropoff,
  onSelectPickup,
  onSelectDropoff,
  language = 'ar',
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Default center: Cairo, Egypt
  const defaultCenter = {
    lat: pickup?.latitude || 30.0444,
    lng: pickup?.longitude || 31.2357,
  };

  const isRtl = language === 'ar';

  return (
    <div className="w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700/60 shadow-xl relative text-white">
      {/* Map Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-900/90 backdrop-blur border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-accent-500/20 text-accent-400 border border-accent-500/30">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span>{isRtl ? 'خريطة مسار الرحلة التفاعلية' : 'Interactive Trip Map'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Google Maps Live
              </span>
            </h2>
          </div>
        </div>

        {/* Quick Map Location Indicators */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onSelectPickup}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              pickup
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-white'
            }`}
            title={isRtl ? 'تعديل نقطة الانطلاق' : 'Edit pickup'}
            aria-label={isRtl ? 'نقطة الانطلاق، اضغط لتحديد مكان الانطلاق' : 'Pickup location'}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">{isRtl ? 'الانطلاق:' : 'Pickup:'}</span>
            <span className="max-w-[100px] truncate font-medium">
              {pickup ? pickup.address.split(',')[0] : isRtl ? 'حدد من الخريطة' : 'Set location'}
            </span>
          </button>

          <button
            onClick={onSelectDropoff}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              dropoff
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-rose-500/50 hover:text-white'
            }`}
            title={isRtl ? 'تعديل نقطة النزول' : 'Edit dropoff'}
            aria-label={isRtl ? 'نقطة النزول، اضغط لتحديد مكان الوصول' : 'Destination location'}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-bold">{isRtl ? 'النزول:' : 'Dropoff:'}</span>
            <span className="max-w-[100px] truncate font-medium">
              {dropoff ? dropoff.address.split(',')[0] : isRtl ? 'حدد من الخريطة' : 'Set location'}
            </span>
          </button>
        </div>
      </div>

      {/* Map Canvas View */}
      <div className="w-full h-64 sm:h-80 md:h-96 relative bg-slate-950">
        {apiKey && !loadError ? (
          <APIProvider
            key={retryCount}
            apiKey={apiKey}
            language={language}
            region="EG"
            onError={() => setLoadError(true)}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            <Map
              style={{ width: '100%', height: '100%' }}
              defaultCenter={defaultCenter}
              defaultZoom={12}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              disableDefaultUI={false}
              fullscreenControl={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              <MapBoundsAdjuster pickup={pickup} dropoff={dropoff} />

              {/* Pickup Marker */}
              {pickup && (
                <AdvancedMarker
                  position={{ lat: pickup.latitude, lng: pickup.longitude }}
                  title={pickup.address}
                >
                  <Pin background="#10b981" glyphColor="#ffffff" borderColor="#065f46" scale={1.2}>
                    <span className="text-white text-xs font-black">📍</span>
                  </Pin>
                </AdvancedMarker>
              )}

              {/* Dropoff Marker */}
              {dropoff && (
                <AdvancedMarker
                  position={{ lat: dropoff.latitude, lng: dropoff.longitude }}
                  title={dropoff.address}
                >
                  <Pin background="#f43f5e" glyphColor="#ffffff" borderColor="#9f1239" scale={1.2}>
                    <span className="text-white text-xs font-black">🏁</span>
                  </Pin>
                </AdvancedMarker>
              )}
            </Map>
          </APIProvider>
        ) : (
          /* Interactive Fallback Map Canvas */
          <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950">
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#6366f1 1px, #0f172a 1px)',
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 20px 20px',
              }}
            />

            {/* SVG Visual Route Connectors */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="w-full h-full max-w-lg opacity-60">
                <defs>
                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
                <path
                  d="M 120 180 Q 250 80, 380 180"
                  fill="none"
                  stroke="url(#routeGrad)"
                  strokeWidth="4"
                  strokeDasharray="8,6"
                  className="animate-pulse"
                />
              </svg>
            </div>

            {/* Interactive Points on Visual Map */}
            <div className="relative z-10 max-w-md w-full bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700/80 shadow-2xl text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2.5 rounded-full bg-accent-500/20 text-accent-400 border border-accent-500/30">
                  <Compass className="w-6 h-6 animate-spin-slow" />
                </div>
                <div className="text-start">
                  <div className="text-sm font-extrabold text-white">
                    {isRtl ? 'خريطة SMART TIME التفاعلية' : 'SMART TIME Route Canvas'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {pickup && dropoff
                      ? isRtl
                        ? `مسار محدد: ${pickup.address.split(',')[0]} ⬅️ ${dropoff.address.split(',')[0]}`
                        : `Route active: ${pickup.address.split(',')[0]} to ${dropoff.address.split(',')[0]}`
                      : isRtl
                      ? 'حدد نقطة الانطلاق والوصول لبدء الرحلة'
                      : 'Choose pickup and destination points'}
                  </div>
                </div>
              </div>

              {/* Action Buttons to trigger the 3-option picker */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={onSelectPickup}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
                  aria-label={isRtl ? 'تحديد من على الخريطة لنقطة الانطلاق' : 'Set pickup location'}
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>{pickup ? (isRtl ? 'تعديل الانطلاق' : 'Edit Pickup') : isRtl ? 'تحديد الانطلاق' : 'Set Pickup'}</span>
                </button>

                <button
                  onClick={onSelectDropoff}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
                  aria-label={isRtl ? 'تحديد من على الخريطة لنقطة النزول' : 'Set destination location'}
                >
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>{dropoff ? (isRtl ? 'تعديل النزول' : 'Edit Dropoff') : isRtl ? 'تحديد النزول' : 'Set Dropoff'}</span>
                </button>
              </div>

              {loadError && (
                <button
                  onClick={() => {
                    setLoadError(false);
                    setRetryCount((c) => c + 1);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 underline font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إعادة محاولة تحميل Google Maps SDK' : 'Retry Google Maps Load'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

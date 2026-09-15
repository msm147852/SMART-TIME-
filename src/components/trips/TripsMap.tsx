import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Crosshair, Route, Loader2, Layers, Maximize2 } from 'lucide-react';
import { TripLocation } from './types';
import { apiUrl } from '../../services/apiConfig';

interface TripsMapProps {
  pickup: TripLocation | null;
  dropoff: TripLocation | null;
  onSelectPickup?: () => void;
  onSelectDropoff?: () => void;
  onCurrentLocation?: (location: TripLocation) => void;
  language?: 'ar' | 'en';
}

const pickupIcon = L.divIcon({
  className: 'smart-trip-marker',
  html: '<div class="smart-trip-marker-pin smart-trip-marker-pickup">📍</div>',
  iconSize: [42, 42], iconAnchor: [21, 38],
});
const dropoffIcon = L.divIcon({
  className: 'smart-trip-marker',
  html: '<div class="smart-trip-marker-pin smart-trip-marker-dropoff">🏁</div>',
  iconSize: [42, 42], iconAnchor: [21, 38],
});

export const TripsMap: React.FC<TripsMapProps> = ({ pickup, dropoff, onSelectPickup, onSelectDropoff, onCurrentLocation, language = 'ar' }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [mapMode, setMapMode] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [modeOpen, setModeOpen] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm?: number; durationMins?: number } | null>(null);
  const isRtl = language === 'ar';
  const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY || '';
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null);

  const center = useMemo<[number, number]>(() => [pickup?.latitude || 30.0444, pickup?.longitude || 31.2357], [pickup?.latitude, pickup?.longitude]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: true }).setView(center, 12);
    const tileUrl = maptilerKey
      ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 20, attribution: maptilerKey ? '&copy; MapTiler &copy; OpenStreetMap contributors' : '&copy; OpenStreetMap contributors' }).addTo(map);
    markers.current = L.layerGroup().addTo(map);
    leafletMap.current = map;
    setTimeout(() => map.invalidateSize(), 150);
    return () => { userLocationMarkerRef.current?.remove(); map.remove(); leafletMap.current = null; markers.current = null; tileLayerRef.current = null; userLocationMarkerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = leafletMap.current;
    if (!map || !markers.current) return;
    markers.current.clearLayers();
    if (pickup) L.marker([pickup.latitude, pickup.longitude], { icon: pickupIcon }).bindTooltip(pickup.address, { direction: 'top' }).addTo(markers.current);
    if (dropoff) L.marker([dropoff.latitude, dropoff.longitude], { icon: dropoffIcon }).bindTooltip(dropoff.address, { direction: 'top' }).addTo(markers.current);
    const points: L.LatLngExpression[] = [];
    if (pickup) points.push([pickup.latitude, pickup.longitude]);
    if (dropoff) points.push([dropoff.latitude, dropoff.longitude]);
    if (points.length === 2) map.fitBounds(L.latLngBounds(points), { padding: [35, 35] });
    else if (points.length === 1) map.setView(points[0], 14);
  }, [pickup, dropoff]);

  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;
    routeLayer.current?.remove();
    routeLayer.current = null;
    setRouteInfo(null);
    if (!pickup || !dropoff) return;
    let cancelled = false;
    setRouteLoading(true);
    fetch(apiUrl(`/api/maps/route?from=${pickup.latitude},${pickup.longitude}&to=${dropoff.latitude},${dropoff.longitude}`))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('route failed')))
      .then(data => {
        if (cancelled || !data.coordinates?.length) return;
        const line = L.polyline(data.coordinates as [number, number][], { color: '#08a7d8', weight: 6, opacity: 0.88, lineCap: 'round', lineJoin: 'round' }).addTo(map);
        routeLayer.current = line;
        map.fitBounds(line.getBounds(), { padding: [45, 45] });
        setRouteInfo({ distanceKm: data.distanceKm, durationMins: data.durationMins });
      })
      .catch(() => { if (!cancelled) setRouteInfo(null); })
      .finally(() => { if (!cancelled) setRouteLoading(false); });
    return () => { cancelled = true; };
  }, [pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude]);


  const changeMapMode = (mode: 'street' | 'satellite' | 'terrain') => {
    const map = leafletMap.current;
    if (!map) return;
    tileLayerRef.current?.remove();
    const urls: Record<typeof mode, string> = maptilerKey ? {
      street: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}`,
      satellite: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${maptilerKey}`,
      terrain: `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${maptilerKey}`,
    } : {
      street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    };
    tileLayerRef.current = L.tileLayer(urls[mode], { maxZoom: 20, attribution: maptilerKey ? '&copy; MapTiler &copy; OpenStreetMap contributors' : '&copy; OpenStreetMap contributors' }).addTo(map);
    setMapMode(mode);
    setModeOpen(false);
  };

  const fullscreen = () => {
    const el = mapRef.current?.parentElement;
    if (el && document.fullscreenEnabled && !document.fullscreenElement) el.requestFullscreen?.();
    else if (document.fullscreenElement) document.exitFullscreen?.();
  };

  const locateMe = () => {
    const map = leafletMap.current;
    if (!map) return;
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      window.alert(isRtl ? 'زر موقعي يحتاج اتصال HTTPS. افتح التطبيق عبر HTTPS أو جرّبه على localhost.' : 'My location requires HTTPS. Open the app over HTTPS or test it on localhost.');
      return;
    }
    if (!navigator.geolocation) {
      window.alert(isRtl ? 'الموقع الجغرافي غير متاح في هذا المتصفح.' : 'Geolocation is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const latLng: [number, number] = [latitude, longitude];
        map.setView(latLng, 16, { animate: true });
        userLocationMarkerRef.current?.remove();
        userLocationMarkerRef.current = L.circleMarker(latLng, {
          radius: 8,
          color: '#0ea5e9',
          weight: 3,
          fillColor: '#38bdf8',
          fillOpacity: 0.85,
        }).bindTooltip(isRtl ? 'موقعي الحالي' : 'My location', { direction: 'top' }).addTo(map).openTooltip();

        // زر «موقعي» لا يعيد تمركز الخريطة فقط؛ بل يمكنه أيضًا جعل الموقع الحالي
        // نقطة الانطلاق حتى تظل المقارنة متزامنة مع المكان الذي اختاره المستخدم.
        let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const response = await fetch(apiUrl(`/api/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`));
          const data = await response.json();
          if (response.ok && data?.address) address = String(data.address);
        } catch { /* الإحداثيات نفسها كافية إذا تعذر العنوان */ }

        onCurrentLocation?.({
          address,
          name: isRtl ? 'موقعي الحالي' : 'My current location',
          latitude,
          longitude,
        });
      },
      error => {
        const message = error?.code === 1
          ? (isRtl ? 'اسمح للمتصفح بالوصول إلى موقعك، ثم اضغط «موقعي» مرة أخرى.' : 'Allow browser location access, then tap My location again.')
          : (isRtl ? 'تعذر تحديد موقعك الحالي. تأكد من تشغيل الموقع على الهاتف.' : 'Unable to determine your current location. Make sure location is enabled.');
        window.alert(message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  };

  return (
    <section className="smart-trips-map-card" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="smart-trips-map-head">
        <div className="flex items-center gap-3">
          <div className="smart-trips-map-icon"><Navigation className="w-5 h-5" /></div>
          <div>
            <h2>{isRtl ? 'خريطة الرحلة' : 'Trip Map'}</h2>
            <p>{isRtl ? 'خريطة حقيقية تفاعلية لتحديد المسار بدقة' : 'Real interactive map for accurate routing'}</p>
          </div>
        </div>
        <span className="smart-map-live"><span /> {maptilerKey ? 'MapTiler Live' : 'OpenStreetMap Live'}</span>
      </div>
      <div className="smart-map-canvas-wrap">
        <div ref={mapRef} className="smart-map-canvas" />
        <div className="smart-map-top-controls smart-map-top-controls-clean">
          <button onClick={() => setModeOpen(v => !v)} className="smart-map-tool" title="أوضاع الخريطة"><Layers className="w-4 h-4" /></button>
          <button onClick={fullscreen} className="smart-map-tool" title="ملء الشاشة"><Maximize2 className="w-4 h-4" /></button>
        </div>
        {modeOpen && <div className="smart-map-mode-menu">
          <button className={mapMode === 'street' ? 'active' : ''} onClick={() => changeMapMode('street')}>الخريطة</button>
          <button className={mapMode === 'satellite' ? 'active' : ''} onClick={() => changeMapMode('satellite')}>القمر الصناعي</button>
          <button className={mapMode === 'terrain' ? 'active' : ''} onClick={() => changeMapMode('terrain')}>التضاريس</button>
        </div>}
        <button onClick={locateMe} className="smart-map-locate" title={isRtl ? 'موقعي الحالي' : 'My location'} aria-label={isRtl ? 'العودة إلى موقعي الحالي' : 'Center on my location'}><Crosshair className="w-4 h-4" /><span>{isRtl ? 'موقعي' : 'My location'}</span></button>
        {routeLoading && <div className="smart-map-status"><Loader2 className="w-4 h-4 animate-spin" /> {isRtl ? 'جاري رسم المسار...' : 'Drawing route...'}</div>}
        {routeInfo && <div className="smart-map-route-info"><Route className="w-4 h-4" /> {Number(routeInfo.distanceKm || 0).toFixed(1)} كم · {Math.round(Number(routeInfo.durationMins || 0))} دقيقة</div>}
        {!pickup && !dropoff && <div className="smart-map-empty"><MapPin className="w-8 h-8" /><b>{isRtl ? 'حدد نقطتي الانطلاق والوصول' : 'Choose pickup and destination'}</b></div>}
      </div>
    </section>
  );
};

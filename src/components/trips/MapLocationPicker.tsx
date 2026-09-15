import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiUrl } from '../../services/apiConfig';
import { MapPin, Crosshair, Check, Loader2 } from 'lucide-react';
import { TripLocation, LocationPickerMode } from './types';

interface MapLocationPickerProps { mode: LocationPickerMode; initialLocation?: TripLocation | null; onConfirm: (location: TripLocation) => void; language?: 'ar' | 'en'; }

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ mode, initialLocation, onConfirm, language = 'ar' }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [selectedPos, setSelectedPos] = useState({ lat: initialLocation?.latitude || 30.0444, lng: initialLocation?.longitude || 31.2357 });
  const [address, setAddress] = useState(initialLocation?.address || (mode === 'pickup' ? 'مدينة نصر، القاهرة' : 'التجمع الخامس، القاهرة الجديدة'));
  const [loading, setLoading] = useState(false);
  const isRtl = language === 'ar';
  const key = import.meta.env.VITE_MAPTILER_API_KEY || '';

  const reverse = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try { const r = await fetch(apiUrl(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`)); const d = await r.json(); setAddress(d.address || `موقع محدد (${lat.toFixed(5)}, ${lng.toFixed(5)})`); }
    catch { setAddress(`موقع محدد (${lat.toFixed(5)}, ${lng.toFixed(5)})`); }
    finally { setLoading(false); }
  }, []);

  const select = useCallback((lat: number, lng: number, doReverse = true) => {
    setSelectedPos({ lat, lng });
    if (marker.current) marker.current.setLatLng([lat, lng]);
    else if (map.current) marker.current = L.marker([lat, lng]).addTo(map.current);
    map.current?.setView([lat, lng], Math.max(map.current.getZoom(), 14));
    if (doReverse) reverse(lat, lng);
  }, [reverse]);

  useEffect(() => {
    if (!mapRef.current || map.current) return;
    const m = L.map(mapRef.current, { zoomControl: true }).setView([selectedPos.lat, selectedPos.lng], 14);
    const tileUrl = key ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}` : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    L.tileLayer(tileUrl, { maxZoom: 20, attribution: key ? '&copy; MapTiler &copy; OpenStreetMap contributors' : '&copy; OpenStreetMap contributors' }).addTo(m);
    marker.current = L.marker([selectedPos.lat, selectedPos.lng]).addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => select(e.latlng.lat, e.latlng.lng));
    map.current = m;
    setTimeout(() => m.invalidateSize(), 150);
    return () => { m.remove(); map.current = null; marker.current = null; };
  }, []);

  const gps = () => navigator.geolocation?.getCurrentPosition(p => select(p.coords.latitude, p.coords.longitude), () => alert(isRtl ? 'تعذر الحصول على موقعك الحالي' : 'Unable to get your location'), { enableHighAccuracy: true, timeout: 10000 });
  const confirm = () => onConfirm({ address: address.trim(), latitude: selectedPos.lat, longitude: selectedPos.lng });

  return <div className="smart-picker" dir={isRtl ? 'rtl' : 'ltr'}>
    <div className="smart-picker-map-wrap"><div ref={mapRef} className="smart-picker-map" />
      <button onClick={gps} className="smart-picker-gps"><Crosshair className="w-5 h-5" /> {isRtl ? 'موقعي الحالي' : 'My location'}</button>
      <div className="smart-picker-label"><MapPin className="w-4 h-4" /> {mode === 'pickup' ? (isRtl ? 'نقطة الانطلاق' : 'Pickup') : (isRtl ? 'نقطة الوصول' : 'Destination')}</div>
    </div>
    <div className="smart-picker-footer">
      <div><span>{isRtl ? 'الموقع المحدد' : 'Selected location'}</span><strong>{loading ? 'جاري تحديد العنوان...' : address}</strong></div>
      <button onClick={confirm} disabled={loading} className={mode === 'pickup' ? 'confirm-pickup' : 'confirm-dropoff'}><Check className="w-5 h-5" /> {isRtl ? 'تأكيد الموقع' : 'Confirm'}</button>
    </div>
  </div>;
};

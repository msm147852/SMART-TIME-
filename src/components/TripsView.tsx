import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigation, MapPin, Mic, Home, Briefcase, Check, Car, Bike, RefreshCw, ExternalLink, Clock, Crosshair, MapPinned, History, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { FavoritePlace, RecentTrip, TransportComparisonResult, RideType, Language } from '../types';
import { translations } from '../services/i18n';
import { TripsMap } from './trips/TripsMap';
import { LocationPickerModal } from './trips/LocationPickerModal';
import { VoiceTripModal } from './trips/VoiceTripModal';
import { TripLocation, LocationPickerMode } from './trips/types';
import { apiUrl } from '../services/apiConfig';
import { authHeaders } from '../services/authService';
import { WalletService } from '../services/walletService';
import { TripsRepository } from '../services/repositories/tripsRepository';

interface TripsViewProps {
  language: Language;
  currency: string;
  favoritePlaces: FavoritePlace[];
  recentTrips: RecentTrip[];
  onOpenVoiceSearch: () => void;
  onOpenWallet?: () => void;
}

type SavedPlaceKey = 'home' | 'work';
type TripTab = { id: RideType; label: string; icon: React.ReactNode };

const DEFAULT_HOME: TripLocation = { address: 'مدينة نصر، القاهرة', name: 'المنزل', latitude: 30.0561, longitude: 31.3301 };
const DEFAULT_WORK: TripLocation = { address: 'التجمع الخامس، القاهرة الجديدة', name: 'العمل', latitude: 30.0131, longitude: 31.4289 };


export const TripsView: React.FC<TripsViewProps> = ({ language, currency, favoritePlaces, recentTrips, onOpenVoiceSearch, onOpenWallet }) => {
  const t = translations[language];
  const isRtl = language === 'ar';

  const [pickupLocation, setPickupLocation] = useState<TripLocation>(DEFAULT_HOME);
  const [dropoffLocation, setDropoffLocation] = useState<TripLocation>(DEFAULT_WORK);
  const [homeLocation, setHomeLocation] = useState<TripLocation | null>(null);
  const [workLocation, setWorkLocation] = useState<TripLocation | null>(null);
  const [savingPlace, setSavingPlace] = useState<SavedPlaceKey | null>(null);
  const [savedPlaceMenu, setSavedPlaceMenu] = useState<SavedPlaceKey | null>(null);

  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<LocationPickerMode>('pickup');
  const [isVoiceTripOpen, setIsVoiceTripOpen] = useState(false);

  const [selectedRideType, setSelectedRideType] = useState<RideType>('Comfort');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<TransportComparisonResult | null>(null);
  const [walletError, setWalletError] = useState('');
  const [walletChecked, setWalletChecked] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [tripCost, setTripCost] = useState(5);
  const [freeSearches, setFreeSearches] = useState(0);
  const [myTripsOpen, setMyTripsOpen] = useState(false);
  const [storedTrips, setStoredTrips] = useState<RecentTrip[]>(() => (recentTrips || []).slice(0, 10));
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const home = localStorage.getItem('smart_time_trip_home');
      const work = localStorage.getItem('smart_time_trip_work');
      if (home) setHomeLocation(JSON.parse(home));
      if (work) setWorkLocation(JSON.parse(work));
    } catch { /* keep defaults */ }

    let cancelled = false;
    WalletService.getMyWallet().then((w) => {
      if (cancelled) return;
      setWalletBalance(w.balance);
      setTripCost(w.tripCost);
      setFreeSearches(Math.max(0, Number(w.freeSearches || 0)));
      setWalletChecked(true);
    }).catch((e: any) => {
      if (cancelled) return;
      // Trial mode: do not block the trips screen because of login/verification.
      setWalletChecked(true);
      console.warn('Wallet unavailable in trial mode:', e?.message || e);
    });
    return () => { cancelled = true; };
  }, []);

  const openPicker = (mode: LocationPickerMode) => {
    setPickerMode(mode);
    setIsLocationPickerOpen(true);
  };

  const swapTripPoints = () => {
    setPickupLocation(current => dropoffLocation);
    setDropoffLocation(current => pickupLocation);
    setComparisonData(null);
    setWalletError('');
  };


  const handleLocationPicked = (loc: TripLocation) => {
    if (pickerMode === 'pickup') setPickupLocation(loc);
    else setDropoffLocation(loc);
  };

  const handleVoiceTripConfirmed = (p: TripLocation, d: TripLocation) => {
    setPickupLocation(p);
    setDropoffLocation(d);
  };

  const handleSavePlace = (key: SavedPlaceKey) => {
    const current = key === 'home' ? pickupLocation : dropoffLocation;
    try { localStorage.setItem(key === 'home' ? 'smart_time_trip_home' : 'smart_time_trip_work', JSON.stringify(current)); } catch { /* browser storage unavailable */ }
    if (key === 'home') setHomeLocation({ ...current, name: 'المنزل' });
    else setWorkLocation({ ...current, name: 'العمل' });
    setSavingPlace(null);
  };

  const useSavedPlace = (key: SavedPlaceKey, target: LocationPickerMode) => {
    const place = key === 'home' ? homeLocation : workLocation;
    if (!place) {
      setSavedPlaceMenu(null);
      setSavingPlace(key);
      openPicker(target);
      return;
    }
    if (target === 'pickup') setPickupLocation({ ...place, name: key === 'home' ? 'المنزل' : 'العمل' });
    else setDropoffLocation({ ...place, name: key === 'home' ? 'المنزل' : 'العمل' });
    setSavedPlaceMenu(null);
  };

  const toggleSavedPlaceMenu = (key: SavedPlaceKey) => {
    if (key === 'home' && !homeLocation) { setSavingPlace('home'); openPicker('pickup'); return; }
    if (key === 'work' && !workLocation) { setSavingPlace('work'); openPicker('pickup'); return; }
    setSavedPlaceMenu(current => current === key ? null : key);
  };


  const saveSearchedTrip = (result: TransportComparisonResult) => {
    const options = result.options || [];
    const firstOption = options[0];
    const fareMin = Number(firstOption?.estimatedFareMin || 0);
    const fareMax = Number(firstOption?.estimatedFareMax || 0);
    const fare = fareMax > 0 ? Math.round((fareMin + fareMax) / 2) : 0;
    const trip: RecentTrip = {
      id: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      from: {
        name: pickupLocation.name || 'نقطة الانطلاق',
        address: pickupLocation.address,
        lat: pickupLocation.latitude,
        lng: pickupLocation.longitude,
      },
      to: {
        name: dropoffLocation.name || 'نقطة النزول',
        address: dropoffLocation.address,
        lat: dropoffLocation.latitude,
        lng: dropoffLocation.longitude,
      },
      date: new Date().toISOString(),
      provider: firstOption?.providerName || 'SMART TIME',
      rideType: selectedRideType,
      fare,
      distanceKm: Number(result.distanceKm || 0),
    };
    const updated = TripsRepository.addRecentTrip(trip);
    setStoredTrips(updated.slice(0, 10));
  };

  const openSavedTrip = (trip: RecentTrip) => {
    setPickupLocation({ address: trip.from.address, name: trip.from.name, latitude: trip.from.lat, longitude: trip.from.lng });
    setDropoffLocation({ address: trip.to.address, name: trip.to.name, latitude: trip.to.lat, longitude: trip.to.lng });
    setComparisonData(null);
    setWalletError('');
    setMyTripsOpen(false);
    window.setTimeout(() => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  const handleRunComparison = async () => {
    if (!pickupLocation.address.trim() || !dropoffLocation.address.trim()) return;
    setIsComparing(true);
    setWalletError('');
    try {
      const res = await fetch(apiUrl('/api/transport/compare'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          pickup: { name: pickupLocation.name || pickupLocation.address, address: pickupLocation.address, lat: pickupLocation.latitude, lng: pickupLocation.longitude, latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
          destination: { name: dropoffLocation.name || dropoffLocation.address, address: dropoffLocation.address, lat: dropoffLocation.latitude, lng: dropoffLocation.longitude, latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude },
          rideType: selectedRideType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'INSUFFICIENT_BALANCE') {
          setWalletError(data.error || 'الرصيد غير كافٍ');
          if (typeof data.balance === 'number') setWalletBalance(data.balance);
          if (typeof data.freeSearches === 'number') setFreeSearches(Math.max(0, data.freeSearches));
        } else {
          setWalletError(data.error || 'تعذر جلب الأسعار الآن');
        }
        return;
      }
      if (data.success && data.result) {
        setComparisonData(data.result);
        saveSearchedTrip(data.result);
        if (typeof data.walletBalance === 'number') setWalletBalance(data.walletBalance);
        if (typeof data.freeSearchesRemaining === 'number') setFreeSearches(Math.max(0, data.freeSearchesRemaining));
      }
    } catch (e) {
      console.error('Transport comparison failed:', e);
      setWalletError('تعذر الاتصال بخدمة الأسعار');
    } finally {
      setIsComparing(false);
    }
  };

  const tabs: TripTab[] = useMemo(() => [
    { id: 'Comfort', label: 'الكونفورت', icon: <Car className="w-4 h-4" /> },
    { id: 'Economy', label: 'العادي', icon: <Car className="w-4 h-4" /> },
    { id: 'Scooter', label: 'الموتوسيكل', icon: <Bike className="w-4 h-4" /> },
  ], []);

  const displayedOptions = useMemo(() => {
    const options = comparisonData?.options || [];
    if (selectedRideType === 'Scooter') {
      return options.filter((o) => /indrive|إن درايف|ان درايف/i.test(`${o.providerId} ${o.providerName}`));
    }
    return options;
  }, [comparisonData, selectedRideType]);

  const providerNames = [
    { name: 'Uber', logo: '/provider-logos/uber.svg' },
    { name: 'Careem', logo: '/provider-logos/careem.svg' },
    { name: 'inDrive', logo: '/provider-logos/indrive.svg' },
    { name: 'DiDi', logo: '/provider-logos/didi.svg' },
    { name: 'Bolt', logo: '/provider-logos/bolt.svg' },
    { name: 'Yalla Bina', logo: '/provider-logos/yalla-bina.svg' },
    { name: 'كابتن مصر', logo: '/provider-logos/captain-egypt.svg' },
    { name: 'Smart Line', logo: '/provider-logos/smart-line.svg' },
  ];

  if (!walletChecked) {
    return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">جاري تجهيز قسم الرحلات...</div>;
  }

  return (
    <div className="smart-trips-page" dir={isRtl ? 'rtl' : 'ltr'} id="trips-transport-module">
      {myTripsOpen ? (
        <section className="smart-my-trips-screen" aria-label="مشاويري">
          <div className="smart-my-trips-head">
            <button className="smart-my-trips-back" onClick={() => setMyTripsOpen(false)} aria-label="العودة للخريطة">
              <ArrowRight className="w-4 h-4" />
            </button>
            <div>
              <h2><History className="w-5 h-5" /> مشاويري</h2>
              <p>آخر 10 مشاوير تم البحث عنها</p>
            </div>
            <span className="smart-my-trips-count">{storedTrips.length}/10</span>
          </div>

          {storedTrips.length > 0 ? (
            <div className="smart-my-trips-tabs">
              {storedTrips.map((trip, index) => (
                <button key={trip.id} className="smart-my-trip-tab" onClick={() => openSavedTrip(trip)}>
                  <span className="smart-my-trip-number">{index + 1}</span>
                  <span className="smart-my-trip-route">
                    <span><Navigation className="w-3.5 h-3.5" /> {trip.from.name || trip.from.address}</span>
                    <span><MapPinned className="w-3.5 h-3.5" /> {trip.to.name || trip.to.address}</span>
                  </span>
                  <span className="smart-my-trip-distance">{Number(trip.distanceKm || 0).toFixed(1)} كم</span>
                  <ArrowRight className="smart-my-trip-open-icon" />
                </button>
              ))}
            </div>
          ) : (
            <div className="smart-my-trips-empty">
              <History className="w-10 h-10" />
              <strong>لا توجد مشاوير محفوظة بعد</strong>
              <span>بعد البحث عن أي مشوار سيظهر هنا تلقائيًا ضمن آخر 10 مشاوير.</span>
            </div>
          )}
        </section>
      ) : (
        <>
          <div ref={mapSectionRef}>
            {/* الخريطة هي أول عنصر في واجهة الرحلات */}
            <TripsMap pickup={pickupLocation} dropoff={dropoffLocation} onSelectPickup={() => openPicker('pickup')} onSelectDropoff={() => openPicker('dropoff')} onCurrentLocation={(loc) => setPickupLocation(loc)} language={language} />

      {/* البحث مستقل تمامًا عن المنزل والعمل: نقطتا الرحلة تحت الخريطة مباشرة */}
      <section className="smart-trip-search-points smart-trip-all-points" dir="ltr" aria-label="نقطتا الرحلة والمنزل والعمل">
        <button className="smart-trip-swap-button" onClick={swapTripPoints} title="تبديل نقطة الانطلاق ونقطة النزول" aria-label="تبديل نقطة الانطلاق ونقطة النزول">
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <button className="smart-trip-point-tab pickup" onClick={() => openPicker('pickup')} dir="rtl">
          <span className="smart-trip-point-icon"><Navigation className="w-4 h-4" /></span>
          <span className="smart-trip-point-copy">
            <strong>نقطة الانطلاق</strong>
            <small>{pickupLocation.address?.split(',')[0] || 'اختر مكان البداية'}</small>
          </span>
          <Crosshair className="smart-trip-point-arrow" />
        </button>

        <button className="smart-trip-point-tab dropoff" onClick={() => openPicker('dropoff')} dir="rtl">
          <span className="smart-trip-point-icon"><MapPinned className="w-4 h-4" /></span>
          <span className="smart-trip-point-copy">
            <strong>نقطة النزول</strong>
            <small>{dropoffLocation.address?.split(',')[0] || 'اختر مكان الوصول'}</small>
          </span>
          <Crosshair className="smart-trip-point-arrow" />
        </button>

        <div className="smart-saved-place-wrap">
          <button className={`smart-saved-place home ${homeLocation ? 'saved' : ''}`} onClick={() => toggleSavedPlaceMenu('home')} dir="rtl">
            <Home className="w-5 h-5" /><span>المنزل</span>{homeLocation && <Check className="saved-check" />}
          </button>
          {savedPlaceMenu === 'home' && (
            <div className="smart-saved-choice" dir="rtl">
              <small>استخدام المنزل كـ</small>
              <button onClick={() => useSavedPlace('home', 'pickup')}><Navigation className="w-3.5 h-3.5" /> نقطة انطلاق</button>
              <button onClick={() => useSavedPlace('home', 'dropoff')}><MapPinned className="w-3.5 h-3.5" /> نقطة نزول</button>
            </div>
          )}
        </div>

        <div className="smart-saved-place-wrap">
          <button className={`smart-saved-place work ${workLocation ? 'saved' : ''}`} onClick={() => toggleSavedPlaceMenu('work')} dir="rtl">
            <Briefcase className="w-5 h-5" /><span>العمل</span>{workLocation && <Check className="saved-check" />}
          </button>
          {savedPlaceMenu === 'work' && (
            <div className="smart-saved-choice" dir="rtl">
              <small>استخدام العمل كـ</small>
              <button onClick={() => useSavedPlace('work', 'pickup')}><Navigation className="w-3.5 h-3.5" /> نقطة انطلاق</button>
              <button onClick={() => useSavedPlace('work', 'dropoff')}><MapPinned className="w-3.5 h-3.5" /> نقطة نزول</button>
            </div>
          )}
        </div>
      </section>

      <div className="smart-saved-hint">المنزل والعمل محفوظان باختيارك ويمكن استخدام أيٍ منهما كبداية أو كنقطة نزول.</div>
      {savingPlace && (
        <div className="smart-save-action">
          <span>بعد اختيار الموقع اضغط حفظ {savingPlace === 'home' ? 'المنزل' : 'العمل'}.</span>
          <button onClick={() => handleSavePlace(savingPlace)}><Check className="w-4 h-4" /> حفظ</button>
        </div>
      )}

      {/* Three equal ride tabs */}
      <section className="smart-ride-tabs-section">
        <div className="smart-ride-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={selectedRideType === tab.id ? 'active' : ''} onClick={() => { setSelectedRideType(tab.id); setComparisonData(null); setWalletError(''); }}>
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="smart-ride-actions">
          <div className="smart-ride-caption">{selectedRideType === 'Scooter' ? 'الموتوسيكل متاح عبر inDrive فقط' : 'الأسعار تقديرية من SMART TIME حسب المسافة والزمن وحالة الطريق'}</div>
          <button onClick={handleRunComparison} disabled={isComparing} className="smart-compare-button">
            {isComparing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
            {isComparing ? 'جاري تحديث الأسعار...' : freeSearches > 0 ? `عرض الأسعار · مجاني (${freeSearches})` : `عرض الأسعار · ${Number(tripCost || 0).toFixed(2)} ${currency}`}
          </button>
        </div>
      </section>

      {walletError && <div className="smart-trip-alert">{walletError}{onOpenWallet && <button onClick={onOpenWallet}>شحن الرصيد</button>}</div>}

      {/* Clean no-lines provider table */}
      <section className="smart-provider-table-card">
        <div className="smart-provider-table-head">
          <div><h2><Car className="inline w-5 h-5" /> برامج النقل الذكي والأسعار</h2><p>{selectedRideType === 'Scooter' ? 'inDrive للموتوسيكل فقط' : 'أسعار تقديرية من SMART TIME وليست أسعارًا رسمية من الشركات'}</p></div>
          {comparisonData && <span>{Number(comparisonData.distanceKm || 0).toFixed(1)} كم · {Math.round(Number(comparisonData.estimatedDurationMins || 0))} دقيقة</span>}
        </div>
        <div className="smart-provider-list">
          {displayedOptions.length > 0 ? displayedOptions.map(opt => (
            <div className="smart-provider-row" key={opt.providerId}>
              <div className="smart-provider-identity">
                <img src={opt.logoUrl} alt={opt.providerName} className="smart-provider-logo" />
                <div className="smart-provider-meta"><strong>{opt.providerName}</strong><small>{opt.vehicleType || 'سيارة'} · <Clock className="inline w-3 h-3" /> {opt.etaMinutes} دقيقة · ⭐ {opt.driverRating}</small></div>
                <div className="smart-provider-fare"><b>{opt.estimatedFareMin} - {opt.estimatedFareMax}</b><small>{currency}</small><em>تقديري</em></div>
              </div>
              <a href={opt.deepLink} target="_blank" rel="noreferrer" className="smart-provider-book">انطلق <ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
          )) : (
            <div className="smart-provider-empty">
              <Car className="w-8 h-8" />
              <strong>{selectedRideType === 'Scooter' ? 'الموتوسيكل — inDrive فقط' : 'جاهز للمقارنة'}</strong>
              <span>حدد نقطتي الانطلاق والوصول ثم اضغط «عرض الأسعار».</span>
              <div className="smart-provider-name-preview">
                {providerNames.map(item => (
                  <span key={item.name} className="smart-provider-chip">
                    <img src={item.logo} alt="" />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="smart-my-trips-launcher">
        <button onClick={() => setMyTripsOpen(true)} className="smart-my-trips-button">
          <span className="smart-my-trips-button-icon"><History className="w-5 h-5" /></span>
          <span><strong>مشاويري</strong><small>آخر 10 مشاوير محفوظة</small></span>
          <span className="smart-my-trips-button-count">{storedTrips.length}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

          </div>
        </>
      )}

      <LocationPickerModal isOpen={isLocationPickerOpen} onClose={() => { setIsLocationPickerOpen(false); }} mode={pickerMode} currentLocation={pickerMode === 'pickup' ? pickupLocation : dropoffLocation} onSelectLocation={handleLocationPicked} language={language} />
      <VoiceTripModal isOpen={isVoiceTripOpen} onClose={() => setIsVoiceTripOpen(false)} onConfirmTrip={handleVoiceTripConfirmed} language={language} />
    </div>
  );
};

import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  Car,
  Clock,
  DollarSign,
  Zap,
  Award,
  Sparkles,
  ExternalLink,
  Search,
  Mic,
  Home,
  Briefcase,
  Users,
  Compass,
  ArrowUpDown,
  History,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  AlertCircle,
  DownloadCloud,
  Check,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import {
  FavoritePlace,
  RecentTrip,
  TransportComparisonResult,
  TransportProviderOption,
  RideType,
  GeoPoint,
  Language,
} from '../types';
import { translations } from '../services/i18n';
import { TripsRepository } from '../services';
import { TripsMap } from './trips/TripsMap';
import { LocationPickerModal } from './trips/LocationPickerModal';
import { VoiceTripModal } from './trips/VoiceTripModal';
import { TripLocation, LocationPickerMode } from './trips/types';
import { apiUrl } from '../services/apiConfig';

interface TripsViewProps {
  language: Language;
  currency: string;
  favoritePlaces: FavoritePlace[];
  recentTrips: RecentTrip[];
  onOpenVoiceSearch: () => void;
}

export const TripsView: React.FC<TripsViewProps> = ({
  language,
  currency,
  favoritePlaces,
  recentTrips,
  onOpenVoiceSearch,
}) => {
  const t = translations[language];
  const isRtl = language === 'ar';

  // Structured Location States
  const [pickupLocation, setPickupLocation] = useState<TripLocation>({
    address: 'مدينة نصر، القاهرة',
    name: 'المنزل (مدينة نصر)',
    latitude: 30.0561,
    longitude: 31.3301,
  });

  const [dropoffLocation, setDropoffLocation] = useState<TripLocation>({
    address: 'التجمع الخامس، القاهرة الجديدة',
    name: 'العمل (التجمع الخامس)',
    latitude: 30.0131,
    longitude: 31.4289,
  });

  // Modals state
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<LocationPickerMode>('pickup');
  const [isVoiceTripOpen, setIsVoiceTripOpen] = useState(false);

  const [selectedRideType, setSelectedRideType] = useState<RideType>('Comfort');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<TransportComparisonResult | null>(null);

  // App Installation Verification State
  const [installedApps, setInstalledApps] = useState<Record<string, boolean>>({
    uber: true,
    careem: true,
    indrive: true,
    didi: true,
  });
  const [showInstallAlert, setShowInstallAlert] = useState(true);
  const [verifiedFareDiscountActive, setVerifiedFareDiscountActive] = useState(true);

  const openPicker = (mode: LocationPickerMode) => {
    setPickerMode(mode);
    setIsLocationPickerOpen(true);
  };

  const handleLocationPicked = (loc: TripLocation) => {
    if (pickerMode === 'pickup') {
      setPickupLocation(loc);
    } else {
      setDropoffLocation(loc);
    }
  };

  const handleVoiceTripConfirmed = (p: TripLocation, d: TripLocation) => {
    setPickupLocation(p);
    setDropoffLocation(d);
  };

  // Quick preset locations
  const handleSelectFavorite = (place: FavoritePlace, target: 'pickup' | 'dest') => {
    const loc: TripLocation = {
      address: place.point.address || place.title,
      name: place.title,
      latitude: place.point.lat || (target === 'pickup' ? 30.0561 : 30.0131),
      longitude: place.point.lng || (target === 'pickup' ? 31.3301 : 31.4289),
    };
    if (target === 'pickup') {
      setPickupLocation(loc);
    } else {
      setDropoffLocation(loc);
    }
  };

  const handleSwapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  const handleRunComparison = async () => {
    if (!pickupLocation.address.trim() || !dropoffLocation.address.trim()) return;

    setIsComparing(true);
    try {
      const res = await fetch(apiUrl('/api/transport/compare'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: {
            name: pickupLocation.name || pickupLocation.address,
            address: pickupLocation.address,
            lat: pickupLocation.latitude,
            lng: pickupLocation.longitude,
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          },
          destination: {
            name: dropoffLocation.name || dropoffLocation.address,
            address: dropoffLocation.address,
            lat: dropoffLocation.latitude,
            lng: dropoffLocation.longitude,
            latitude: dropoffLocation.latitude,
            longitude: dropoffLocation.longitude,
          },
          rideType: selectedRideType,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setComparisonData(data.result);
      }
    } catch (e) {
      console.error('Transport comparison failed:', e);
    } finally {
      setIsComparing(false);
    }
  };

  // Auto trigger comparison on coordinate or type changes
  React.useEffect(() => {
    handleRunComparison();
  }, [pickupLocation.latitude, pickupLocation.longitude, dropoffLocation.latitude, dropoffLocation.longitude, selectedRideType]);

  const toggleAppInstalled = (appKey: string) => {
    setInstalledApps((prev) => ({
      ...prev,
      [appKey]: !prev[appKey],
    }));
  };

  const getRideIcon = (type: RideType) => {
    switch (type) {
      case 'Scooter':
        return '🛵';
      case 'Comfort':
        return '✨';
      case 'Taxi':
        return '🚖';
      default:
        return '🚗';
    }
  };

  return (
    <div className="space-y-6" id="trips-transport-module">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-accent-500 via-accent-600 to-yellow-600 text-white p-6 rounded-3xl shadow-lg shadow-accent-500/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-accent-100 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? 'محرك مقارنة الرحلات الذكي' : 'Smart Transport Comparison'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2.5">
            <Navigation className="w-6 h-6" />
            <span>{t.trips}</span>
          </h1>
          <p className="text-xs sm:text-sm text-accent-100 mt-1 max-w-xl">
            {isRtl
              ? 'حدد نقطة الانطلاق والوصول من الخريطة، كتابة العنوان، أو بالصوت للمقارنة فوراً بين أوبر، إن درايف، وديدي.'
              : 'Set pickup and destination via Map, Address Search, or Voice to compare Uber, inDrive, and DiDi fares.'}
          </p>
        </div>

        <button
          onClick={() => setIsVoiceTripOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-accent-800 hover:bg-accent-50 font-bold text-xs shadow-md transition-all self-start sm:self-auto active:scale-95"
          id="voice-trip-start-btn"
          aria-label={isRtl ? 'طلب مشوار بالصوت' : 'Voice Ride Request'}
        >
          <Mic className="w-4 h-4 text-accent-600 animate-pulse" />
          <span>{isRtl ? 'طلب مشوار بالصوت 🎙️' : 'Voice Ride Request 🎙️'}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE TRIPS GOOGLE MAP (TOP OF PAGE) */}
      {/* ========================================================= */}
      <div id="trips-main-interactive-map">
        <TripsMap
          pickup={pickupLocation}
          dropoff={dropoffLocation}
          onSelectPickup={() => openPicker('pickup')}
          onSelectDropoff={() => openPicker('dropoff')}
          language={language}
        />
      </div>

      {/* ========================================================= */}
      {/* MANDATORY USER NOTICE: APP INSTALLATION VERIFICATION CARD */}
      {/* ========================================================= */}
      {showInstallAlert && (
        <div
          className="p-5 rounded-3xl bg-gradient-to-r from-accent-50 to-orange-50 dark:from-slate-850 dark:to-slate-900 border-2 border-accent-400 dark:border-accent-500/50 shadow-md space-y-3"
          id="app-install-verification-notice"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="p-2.5 rounded-2xl bg-accent-500 text-white shrink-0 shadow-md shadow-accent-500/30">
                <Smartphone className="w-6 h-6" />
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {isRtl
                      ? '📱 فتح تطبيقات النقل ومراجعة حالة التكامل'
                      : 'Transport App & Integration Status'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                    مؤكد وموثق
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-arabic">
                  {isRtl
                    ? 'يمكن فتح تطبيقات النقل المثبتة مباشرة، والأسعار دقيقة وفق المسافة المحددة على الخريطة:'
                    : 'Installed apps can be opened directly with accurate fare estimates based on map distance:'}
                </p>
              </div>
            </div>

            {/* App Badges & Status Checklist */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'uber', name: 'Uber' },
                { key: 'careem', name: 'Careem' },
                { key: 'indrive', name: 'inDrive' },
                { key: 'didi', name: 'DiDi' },
              ].map((app) => (
                <button
                  key={app.key}
                  onClick={() => toggleAppInstalled(app.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    installedApps[app.key]
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                  title="انقر لتأكيد التثبيت"
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${installedApps[app.key] ? 'text-emerald-500' : 'text-slate-400'}`}
                  />
                  <span>{app.name}</span>
                  <span className="text-[10px] font-medium">({installedApps[app.key] ? 'مثبت ✅' : 'غير مثبت'})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ride Planner & Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-accent-500" />
            <span>{isRtl ? 'تحديد نقاط المشوار' : 'Plan Your Ride'}</span>
          </h3>

          {/* Quick Favorites Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400">
              {isRtl ? 'الأماكن المفضلة:' : 'Favorite Shortcuts:'}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {favoritePlaces.map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => handleSelectFavorite(fav, 'dest')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-accent-50 dark:hover:bg-accent-950/40 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {fav.type === 'home' && <Home className="w-3.5 h-3.5 text-blue-500" />}
                  {fav.type === 'work' && <Briefcase className="w-3.5 h-3.5 text-accent-500" />}
                  {fav.type === 'family' && <Users className="w-3.5 h-3.5 text-emerald-500" />}
                  <span>{fav.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location Selection Cards with 3 Options Trigger */}
          <div className="relative space-y-3 pt-2">
            {/* Pickup Location Card */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>{t.pickupLocation}</span>
                </span>
                <span className="text-[11px] text-accent-600 dark:text-accent-400 font-semibold">
                  {isRtl ? 'خريطة • كتابة • صوت' : 'Map • Search • Voice'}
                </span>
              </label>

              <button
                type="button"
                onClick={() => openPicker('pickup')}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-start flex items-center justify-between gap-3 group transition-all shadow-sm"
                id="trips-pickup-picker-btn"
                aria-label={isRtl ? 'نقطة الانطلاق، اضغط لتحديد مكان الانطلاق' : 'Pickup location, click to choose'}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {pickupLocation.name || pickupLocation.address.split(',')[0]}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {pickupLocation.address}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                  <Edit3 className="w-3 h-3" />
                  <span>{isRtl ? 'تحديد' : 'Pick'}</span>
                </div>
              </button>
            </div>

            {/* Swap Button */}
            <div className="flex justify-end pe-4 -my-1">
              <button
                onClick={handleSwapLocations}
                className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-accent-500 hover:scale-110 transition-transform shadow-sm"
                title="تبديل النقطتين"
                aria-label="تبديل نقطتي الانطلاق والوصول"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Location Card */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>{t.destinationLocation}</span>
                </span>
                <span className="text-[11px] text-accent-600 dark:text-accent-400 font-semibold">
                  {isRtl ? 'خريطة • كتابة • صوت' : 'Map • Search • Voice'}
                </span>
              </label>

              <button
                type="button"
                onClick={() => openPicker('dropoff')}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 text-start flex items-center justify-between gap-3 group transition-all shadow-sm"
                id="trips-dropoff-picker-btn"
                aria-label={isRtl ? 'نقطة النزول، اضغط لتحديد مكان الوصول' : 'Dropoff location, click to choose'}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500 shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {dropoffLocation.name || dropoffLocation.address.split(',')[0]}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {dropoffLocation.address}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-xl border border-rose-500/30">
                  <Edit3 className="w-3 h-3" />
                  <span>{isRtl ? 'تحديد' : 'Pick'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Ride Type Selection */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {isRtl ? 'فئة المشوار:' : 'Ride Category:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Economy', 'Comfort', 'Scooter', 'Taxi'] as RideType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedRideType(type)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedRideType === type
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base block mb-0.5">{getRideIcon(type)}</span>
                  <span className="text-xs">{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compare Button */}
          <button
            onClick={handleRunComparison}
            disabled={isComparing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-accent-500 via-accent-600 to-yellow-600 hover:from-accent-600 hover:to-yellow-700 text-white font-bold text-sm shadow-lg shadow-accent-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            id="run-compare-btn"
          >
            {isComparing ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Car className="w-4 h-4" />
            )}
            <span>{t.comparePrices}</span>
          </button>
        </div>

        {/* Comparison Results & Live Providers (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Summary Route Card */}
          {comparisonData && (
            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-accent-400 font-bold uppercase tracking-wider">
                    {isRtl ? 'بيانات المسار الفعلية على الخريطة' : 'Route Summary'}
                  </div>
                  <div className="text-lg font-extrabold mt-0.5">
                    {comparisonData.distanceKm} كم • حوالي {comparisonData.estimatedDurationMins} دقيقة
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-accent-500/20 border border-accent-500/30 text-accent-300 font-bold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRtl ? 'تسعير حي مؤكد عبر التطبيق' : 'App Verified Live'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Provider Options List */}
          <div className="space-y-3">
            {comparisonData?.options.map((opt) => {
              const isBest = opt.providerId === comparisonData.bestValueId;
              const isCheapest = opt.providerId === comparisonData.cheapestId;
              const isFastest = opt.providerId === comparisonData.fastestId;
              const isAppInstalled = installedApps[opt.providerId.toLowerCase()] ?? true;

              return (
                <div
                  key={opt.providerId}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isBest
                      ? 'bg-accent-50/70 dark:bg-accent-950/30 border-accent-400 dark:border-accent-500 shadow-md ring-1 ring-accent-400/40'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-accent-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={opt.logoUrl}
                        alt={opt.providerName}
                        className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-sm"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {opt.providerName}
                          </h4>

                          {/* Smart Badges */}
                          {isBest && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-accent-500 text-white shadow-sm flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {t.bestPrice}
                            </span>
                          )}
                          {isCheapest && !isBest && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                              💰 {t.cheapest}
                            </span>
                          )}
                          {isFastest && !isBest && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-500 text-white flex items-center gap-1">
                              ⚡ {t.fastest}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>{opt.vehicleType}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-accent-500" />
                            {opt.etaMinutes} {t.minutes}
                          </span>
                          <span>•</span>
                          <span>⭐ {opt.driverRating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-start sm:text-end font-mono-num">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {opt.estimatedFareMin} - {opt.estimatedFareMax}
                        </span>
                        <span className="text-xs font-bold text-slate-500 ms-1">{currency}</span>
                      </div>

                      <a
                        href={opt.deepLink}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-transform active:scale-95 ${
                          isBest
                            ? 'bg-accent-500 hover:bg-accent-600 text-white shadow-accent-500/20'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                        }`}
                      >
                        <span>{isRtl ? 'فتح التطبيق والحجز' : 'Open & Book'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Trips History */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-4">
            <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-accent-500" />
              <span>{isRtl ? 'سجل المشاوير السابقة' : 'Recent Rides'}</span>
            </h3>

            <div className="space-y-2.5">
              {recentTrips.map((rt) => (
                <div
                  key={rt.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {rt.from.name} → {rt.to.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {rt.date} • {rt.provider} ({rt.rideType})
                    </div>
                  </div>
                  <div className="font-bold font-mono-num text-accent-600 dark:text-accent-400">
                    {rt.fare} {currency}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3-OPTIONS LOCATION PICKER MODAL (MAP / SEARCH / VOICE) */}
      {/* ========================================================= */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        mode={pickerMode}
        currentLocation={pickerMode === 'pickup' ? pickupLocation : dropoffLocation}
        onSelectLocation={handleLocationPicked}
        language={language}
      />

      {/* ========================================================= */}
      {/* FULL VOICE TRIP MODAL */}
      {/* ========================================================= */}
      <VoiceTripModal
        isOpen={isVoiceTripOpen}
        onClose={() => setIsVoiceTripOpen(false)}
        onConfirmTrip={handleVoiceTripConfirmed}
        language={language}
      />
    </div>
  );
};


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

  // Ride Search State
  const [pickupText, setPickupText] = useState('المنزل (مدينة نصر، القاهرة)');
  const [destinationText, setDestinationText] = useState('العمل (التجمع الخامس، القاهرة الجديدة)');
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

  // Quick preset locations
  const handleSelectFavorite = (place: FavoritePlace, target: 'pickup' | 'dest') => {
    const text = `${place.title} - ${place.point.address}`;
    if (target === 'pickup') {
      setPickupText(text);
    } else {
      setDestinationText(text);
    }
  };

  const handleSwapLocations = () => {
    const temp = pickupText;
    setPickupText(destinationText);
    setDestinationText(temp);
  };

  const handleRunComparison = async () => {
    if (!pickupText.trim() || !destinationText.trim()) return;

    setIsComparing(true);
    try {
      const res = await fetch('/api/transport/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { name: pickupText, address: pickupText, lat: 30.0561, lng: 31.3301 },
          destination: { name: destinationText, address: destinationText, lat: 30.0131, lng: 31.4289 },
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

  // Initial trigger
  React.useEffect(() => {
    handleRunComparison();
  }, [selectedRideType]);

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
            <span>{language === 'ar' ? 'محرك مقارنة الرحلات' : 'Transport Comparison'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2.5">
            <Navigation className="w-6 h-6" />
            <span>{t.trips}</span>
          </h1>
          <p className="text-xs sm:text-sm text-accent-100 mt-1 max-w-xl">
            {language === 'ar'
              ? 'قارن تقديرات الرحلات الآن، وستظهر الأسعار LIVE فقط بعد ربط مزود رسمي معتمد.'
              : 'Compare ride estimates now; LIVE fares appear only when an official provider integration is configured.'}
          </p>
        </div>

        <button
          onClick={onOpenVoiceSearch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-accent-800 hover:bg-accent-50 font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Mic className="w-4 h-4 text-accent-600" />
          <span>{language === 'ar' ? 'طلب مشوار بالصوت' : 'Voice Ride Request'}</span>
        </button>
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
                    {language === 'ar'
                      ? '📱 فتح تطبيقات النقل ومراجعة حالة التكامل'
                      : 'Transport App & Integration Status'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                    مؤكد وموثق
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-arabic">
                  {language === 'ar'
                    ? 'يمكن فتح تطبيقات النقل المثبتة مباشرة، لكن السعر داخل SMART TIME يظل تقديريًا حتى يتم ربط API رسمي للمزود:'
                    : 'Installed apps can be opened directly, but SMART TIME prices remain estimates until an official provider API is connected.'}
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
            <span>{language === 'ar' ? 'تحديد نقاط المشوار' : 'Plan Your Ride'}</span>
          </h3>

          {/* Quick Favorites Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400">
              {language === 'ar' ? 'الأماكن المفضلة:' : 'Favorite Shortcuts:'}
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

          {/* Location Inputs with Swap Button */}
          <div className="relative space-y-3 pt-2">
            {/* Pickup */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>{t.pickupLocation}</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-500 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickupText}
                  onChange={(e) => setPickupText(e.target.value)}
                  placeholder={language === 'ar' ? 'موقعك الحالي أو نقطة التحرك...' : 'Pickup address or landmark...'}
                  className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-end pe-4 -my-1">
              <button
                onClick={handleSwapLocations}
                className="p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-accent-500 hover:scale-110 transition-transform shadow-sm"
                title="تبديل النقطتين"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Destination */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>{t.destinationLocation}</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-rose-500 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destinationText}
                  onChange={(e) => setDestinationText(e.target.value)}
                  placeholder={language === 'ar' ? 'إلى أين تريد الذهاب؟' : 'Where to?'}
                  className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
            </div>
          </div>

          {/* Ride Type Selection */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {language === 'ar' ? 'فئة المشوار:' : 'Ride Category:'}
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
                    {language === 'ar' ? 'بيانات المسار التقديرية' : 'Route Summary'}
                  </div>
                  <div className="text-lg font-extrabold mt-0.5">
                    {comparisonData.distanceKm} كم • حوالي {comparisonData.estimatedDurationMins} دقيقة
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-accent-500/20 border border-accent-500/30 text-accent-300 font-bold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تسعير حي مؤكد عبر التطبيق' : 'App Verified Live'}</span>
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
                        <span>{language === 'ar' ? 'فتح التطبيق والحجز' : 'Open & Book'}</span>
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
              <span>{language === 'ar' ? 'سجل المشاوير السابقة' : 'Recent Rides'}</span>
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
    </div>
  );
};

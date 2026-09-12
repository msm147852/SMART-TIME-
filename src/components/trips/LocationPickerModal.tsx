import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Mic,
  X,
  ArrowRight,
  ArrowLeft,
  Navigation,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { TripLocation, LocationPickerMode } from './types';
import { MapLocationPicker } from './MapLocationPicker';
import { TextSearchLocationPicker } from './TextSearchLocationPicker';
import { VoiceLocationPicker } from './VoiceLocationPicker';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: LocationPickerMode;
  currentLocation?: TripLocation | null;
  onSelectLocation: (location: TripLocation) => void;
  language?: 'ar' | 'en';
}

type PickerTab = 'menu' | 'map' | 'text' | 'voice';

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  mode,
  currentLocation,
  onSelectLocation,
  language = 'ar',
}) => {
  const isRtl = language === 'ar';
  const [activeTab, setActiveTab] = useState<PickerTab>('menu');

  if (!isOpen) return null;

  const handleSelectAndClose = (loc: TripLocation) => {
    onSelectLocation(loc);
    setActiveTab('menu');
    onClose();
  };

  const modalTitle =
    mode === 'pickup'
      ? isRtl
        ? 'حدد نقطة الانطلاق'
        : 'Select Pickup Location'
      : isRtl
      ? 'حدد نقطة النزول'
      : 'Select Dropoff Destination';

  const modalSubtitle =
    mode === 'pickup'
      ? isRtl
        ? 'اختر الطريقة الأنسب لك لتحديد مكان تحركك'
        : 'Choose your preferred method to set pickup spot'
      : isRtl
      ? 'اختر الطريقة الأنسب لك لتحديد مكان وصولك'
      : 'Choose your preferred method to set destination spot';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      id="location-picker-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-picker-modal-title"
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white"
        id="location-picker-modal-container"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {activeTab !== 'menu' && (
              <button
                onClick={() => setActiveTab('menu')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title={isRtl ? 'الرجوع للخيارات' : 'Back'}
                aria-label={isRtl ? 'رجوع' : 'Back'}
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <span
                className={`p-2 rounded-xl text-white shadow-md ${
                  mode === 'pickup' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'
                }`}
              >
                <MapPin className="w-4 h-4" />
              </span>
              <div>
                <h2
                  id="location-picker-modal-title"
                  className="font-extrabold text-base text-white flex items-center gap-2"
                >
                  <span>{modalTitle}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      mode === 'pickup'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {mode === 'pickup' ? (isRtl ? 'نقطة الانطلاق 📍' : 'Pickup') : isRtl ? 'نقطة النزول 🏁' : 'Dropoff'}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">{modalSubtitle}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('menu');
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={isRtl ? 'إغلاق' : 'Close'}
            aria-label={isRtl ? 'إغلاق النافذة' : 'Close modal'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation pills (when active in a subview) */}
        {activeTab !== 'menu' && (
          <div className="flex items-center justify-center gap-2 p-2.5 bg-slate-950/70 border-b border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'map'
                  ? 'bg-accent-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              aria-label={isRtl ? 'تحديد من على الخريطة' : 'Map Picker'}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الخريطة' : 'Map'}</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'text'
                  ? 'bg-accent-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              aria-label={isRtl ? 'كتابة العنوان' : 'Search Address'}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isRtl ? 'كتابة العنوان' : 'Search'}</span>
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'voice'
                  ? 'bg-accent-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              aria-label={isRtl ? 'البحث الصوتي' : 'Voice Search'}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isRtl ? 'البحث الصوتي' : 'Voice'}</span>
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {/* Main 3 Options Selection Menu */}
          {activeTab === 'menu' && (
            <div className="space-y-4 py-2" id="location-picker-options-menu">
              {/* Option 1: تحديد من على الخريطة */}
              <button
                onClick={() => setActiveTab('map')}
                className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-850 to-slate-800 hover:from-slate-800 hover:to-slate-750 border-2 border-slate-700 hover:border-accent-500 transition-all flex items-center justify-between group shadow-lg active:scale-98 text-start"
                id="pick-from-map-option-btn"
                aria-label={isRtl ? 'تحديد من على الخريطة. اختر مكان الانطلاق من الخريطة' : 'Pick from map'}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-md">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white group-hover:text-accent-300">
                      {isRtl ? '📍 تحديد من على الخريطة' : '📍 Pick from Map'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {mode === 'pickup'
                        ? isRtl
                          ? 'اختر مكان الانطلاق من الخريطة التفاعلية بدقة'
                          : 'Choose pickup point precisely from interactive map'
                        : isRtl
                        ? 'اختر مكان الوصول من الخريطة التفاعلية بدقة'
                        : 'Choose dropoff destination precisely from interactive map'}
                    </p>
                  </div>
                </div>
                <div className="text-slate-500 group-hover:text-accent-400 transition-colors">
                  {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              {/* Option 2: كتابة العنوان */}
              <button
                onClick={() => setActiveTab('text')}
                className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-850 to-slate-800 hover:from-slate-800 hover:to-slate-750 border-2 border-slate-700 hover:border-accent-500 transition-all flex items-center justify-between group shadow-lg active:scale-98 text-start"
                id="search-address-option-btn"
                aria-label={isRtl ? 'كتابة العنوان. ابحث عن المكان بالكتابة' : 'Search address by typing'}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-md">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white group-hover:text-accent-300">
                      {isRtl ? '🔎 كتابة العنوان' : '🔎 Type Address or Place'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isRtl
                        ? 'ابحث عن اسم المكان أو المعلم أو الشارع بالكتابة المباشرة'
                        : 'Search by place name, street, mall, or landmark'}
                    </p>
                  </div>
                </div>
                <div className="text-slate-500 group-hover:text-accent-400 transition-colors">
                  {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              {/* Option 3: البحث الصوتي */}
              <button
                onClick={() => setActiveTab('voice')}
                className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-850 to-slate-800 hover:from-slate-800 hover:to-slate-750 border-2 border-slate-700 hover:border-accent-500 transition-all flex items-center justify-between group shadow-lg active:scale-98 text-start"
                id="voice-search-option-btn"
                aria-label={isRtl ? 'البحث الصوتي. قل اسم مكان الانطلاق أو الوصول' : 'Voice Search'}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-accent-500/20 text-accent-400 border border-accent-500/40 group-hover:scale-110 group-hover:bg-accent-500 group-hover:text-white transition-all shadow-md">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white group-hover:text-accent-300">
                      {isRtl ? '🎙️ البحث الصوتي' : '🎙️ Voice Search'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {mode === 'pickup'
                        ? isRtl
                          ? 'قل اسم مكان الانطلاق بالصوت وسنحدده لك فوراً'
                          : 'Speak your pickup location name'
                        : isRtl
                        ? 'قل اسم مكان الوصول بالصوت وسنحدده لك فوراً'
                        : 'Speak your destination place name'}
                    </p>
                  </div>
                </div>
                <div className="text-slate-500 group-hover:text-accent-400 transition-colors">
                  {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>
            </div>
          )}

          {/* Subview 1: Map Picker */}
          {activeTab === 'map' && (
            <MapLocationPicker
              mode={mode}
              initialLocation={currentLocation}
              onConfirm={handleSelectAndClose}
              language={language}
            />
          )}

          {/* Subview 2: Text Search */}
          {activeTab === 'text' && (
            <TextSearchLocationPicker
              mode={mode}
              onSelect={handleSelectAndClose}
              language={language}
            />
          )}

          {/* Subview 3: Voice Picker */}
          {activeTab === 'voice' && (
            <VoiceLocationPicker
              mode={mode}
              onSelect={handleSelectAndClose}
              language={language}
            />
          )}
        </div>
      </div>
    </div>
  );
};

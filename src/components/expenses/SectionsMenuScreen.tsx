import React from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Home,
  Briefcase,
  Car,
  BookOpen,
  DollarSign,
  BarChart3,
  ChevronLeft,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import { formatMoney } from '../../services/financeCalculations';
import { Language } from '../../types';

interface SectionsMenuScreenProps {
  language: Language;
  currency: string;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onBack: () => void;
  onSelectSection: (section: 'house' | 'work' | 'vehicle' | 'education' | 'income_certs' | 'reports') => void;
  houseTotal: number;
  houseCount: number;
  workTotal: number;
  workCount: number;
  vehicleTotal: number;
  vehicleCount: number;
  educationTotal: number;
  educationCount: number;
  monthlyIncome: number;
  certsCount: number;
  monthlyExpenses: number;
  netIncome: number;
}

export const SectionsMenuScreen: React.FC<SectionsMenuScreenProps> = ({
  language,
  currency,
  selectedMonth,
  onSelectMonth,
  onBack,
  onSelectSection,
  houseTotal,
  houseCount,
  workTotal,
  workCount,
  vehicleTotal,
  vehicleCount,
  educationTotal,
  educationCount,
  monthlyIncome,
  certsCount,
  monthlyExpenses,
  netIncome,
}) => {
  const isAr = language === 'ar';
  const BackIcon = isAr ? ArrowRight : ArrowLeft;
  const isSurplus = netIncome >= 0;

  const sections = [
    {
      id: 'house' as const,
      title: isAr ? 'مصروفات المنزل' : 'Home Expenses',
      desc: isAr ? 'فطار، غداء، عشاء، صيانة وسباكة، مفروشات وأجهزة منزلية' : 'Groceries, dining, home maintenance, appliances',
      icon: Home,
      total: houseTotal,
      count: houseCount,
      countLabel: isAr ? 'عملية' : 'items',
      badgeColor: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
      accentHover: 'hover:border-cyan-400 dark:hover:border-cyan-600',
    },
    {
      id: 'work' as const,
      title: isAr ? 'مصروفات العمل' : 'Work Expenses',
      desc: isAr ? 'أدوات مكتبية، صيانة أجهزة، اشتراكات برمجيات وضيافة' : 'Office supplies, equipment, software, hospitality',
      icon: Briefcase,
      total: workTotal,
      count: workCount,
      countLabel: isAr ? 'عملية' : 'items',
      badgeColor: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
      accentHover: 'hover:border-sky-400 dark:hover:border-sky-600',
    },
    {
      id: 'vehicle' as const,
      title: isAr ? 'المركبة' : 'Vehicle Expenses',
      desc: isAr ? 'استهلاك الوقود، الصيانة، الحوادث وكاميرا قراءة العداد' : 'Fuel logs, maintenance, accident reports, odometer OCR',
      icon: Car,
      total: vehicleTotal,
      count: vehicleCount,
      countLabel: isAr ? 'سجل' : 'records',
      badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
      accentHover: 'hover:border-teal-400 dark:hover:border-teal-600',
    },
    {
      id: 'education' as const,
      title: isAr ? 'التعليم' : 'Education Expenses',
      desc: isAr ? 'ملفات الطلاب، مصاريف المدارس، الدروس، الكتب والباص' : 'Student profiles, tuition, tutoring, textbooks, school bus',
      icon: BookOpen,
      total: educationTotal,
      count: educationCount,
      countLabel: isAr ? 'بند' : 'records',
      badgeColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
      accentHover: 'hover:border-indigo-400 dark:hover:border-indigo-600',
    },
    {
      id: 'income_certs' as const,
      title: isAr ? 'الدخل والشهادات' : 'Income & Certificates',
      desc: isAr ? 'الرواتب، مصادر الدخل، الشهادات البنكية وحساب الأرباح' : 'Salaries, income streams, bank certificates & profit engine',
      icon: DollarSign,
      total: monthlyIncome,
      count: certsCount,
      countLabel: isAr ? 'شهادة' : 'certs',
      badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      accentHover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
      isIncome: true,
    },
    {
      id: 'reports' as const,
      title: isAr ? 'التقارير والتحليلات' : 'Reports & Analytics',
      desc: isAr ? 'الرسوم البيانية، مقارنة الدخل بالمصروفات والتصدير' : 'Visual charts, income vs expenses comparisons & export',
      icon: BarChart3,
      total: monthlyExpenses,
      count: 0,
      countLabel: isAr ? 'تحليل شامل' : 'Master analysis',
      badgeColor: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
      accentHover: 'hover:border-cyan-400 dark:hover:border-cyan-600',
      isReport: true,
    },
  ];

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header with Back Button */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-200 hover:text-cyan-600 flex items-center justify-center transition-all active:scale-95"
            title={isAr ? 'الرجوع للملخص' : 'Back to summary'}
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>{isAr ? 'أقسام الدخل والمصروفات' : 'Income & Expenses Sections'}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'اختر القسم المطلوب لإدارته واستعراض بياناته بالتفصيل' : 'Select a section to manage its data in full screen'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* 2. Top Fast Balance Strip */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <span className="text-slate-500 text-[10px] block">{isAr ? 'الدخل' : 'Income'}</span>
          <span className="font-black text-emerald-600 dark:text-emerald-400">{formatMoney(monthlyIncome)} {currency}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <span className="text-slate-500 text-[10px] block">{isAr ? 'المصروفات' : 'Expenses'}</span>
          <span className="font-black text-rose-600 dark:text-rose-400">{formatMoney(monthlyExpenses)} {currency}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <span className="text-slate-500 text-[10px] block">{isAr ? 'الصافي' : 'Net'}</span>
          <span className={`font-black ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isSurplus ? '+' : ''}{formatMoney(netIncome)} {currency}
          </span>
        </div>
      </div>

      {/* 3. 2-Column Grid of 6 Section Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              onClick={() => onSelectSection(sec.id)}
              className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md ${sec.accentHover} group relative overflow-hidden flex flex-col justify-between`}
            >
              <div>
                {/* Top card bar: icon + count badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${sec.badgeColor} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {sec.isReport ? sec.countLabel : `${sec.count} ${sec.countLabel}`}
                  </span>
                </div>

                {/* Section title & description */}
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {sec.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {sec.desc}
                </p>
              </div>

              {/* Bottom value + Open Section button */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {sec.isIncome ? (isAr ? 'إجمالي الدخل الشهري' : 'Total Monthly Income') : sec.isReport ? (isAr ? 'الحالة' : 'Status') : (isAr ? 'مصروفات هذا الشهر' : 'This month expenses')}
                  </span>
                  <div className={`text-base font-black ${sec.isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {sec.isReport ? (isAr ? 'محدث وفوري' : 'Live analytics') : `${formatMoney(sec.total)} ${currency}`}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-[-3px] transition-transform">
                  <span>{isAr ? 'فتح' : 'Open'}</span>
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

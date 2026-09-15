import React from 'react';
import { ArrowRight, ArrowLeft, Home, UserRound, Car, BookOpen, DollarSign, BarChart3, Layers, Calendar, Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatMoney } from '../../services/financeCalculations';
import { Language, UserProfile } from '../../types';

interface SectionsMenuScreenProps {
  language: Language;
  currency: string;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onBack: () => void;
  onSelectSection: (section: 'house' | 'work' | 'personal' | 'vehicle' | 'education' | 'income_certs' | 'reports') => void;
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
  certificatesProfit?: number;
  currentAccountNet?: number;
  userProfile?: UserProfile;
}

export const SectionsMenuScreen: React.FC<SectionsMenuScreenProps> = ({
  language, currency, selectedMonth, onSelectMonth, onBack, onSelectSection,
  houseTotal, houseCount, workTotal, workCount, vehicleTotal, vehicleCount,
  educationTotal, educationCount, monthlyIncome, certsCount, monthlyExpenses,
  netIncome, certificatesProfit = 0, currentAccountNet = 0, userProfile,
}) => {
  const isAr = language === 'ar';
  const BackIcon = isAr ? ArrowRight : ArrowLeft;
  const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatMoney(Math.abs(value))}`;
  const isSurplus = netIncome >= 0;

  const sections = [
    { id: 'vehicle' as const, title: isAr ? 'سيارتي' : 'My Car', icon: Car, total: -Math.abs(vehicleTotal), count: vehicleCount, desc: isAr ? `${userProfile?.vehiclePreferences?.vehicleType || userProfile?.vehiclePreferences?.primaryVehicleName || 'السيارة الأساسية'} • ${userProfile?.vehiclePreferences?.vehicleShape || 'سيدان'}` : 'Vehicle expenses' },
    { id: 'income_certs' as const, title: isAr ? 'الدخل والشهادات' : 'Income & Certificates', icon: DollarSign, total: monthlyIncome, count: certsCount, desc: isAr ? 'الدخل، الشهادات البنكية والحساب الجاري' : 'Income, certificates and current account' },
    { id: 'education' as const, title: isAr ? 'التعليم' : 'Education', icon: BookOpen, total: -Math.abs(educationTotal), count: educationCount, desc: isAr ? 'مصاريف التعليم والطلاب' : 'Education expenses' },
    { id: 'house' as const, title: isAr ? 'مصروفات المنزل' : 'Home Expenses', icon: Home, total: -Math.abs(houseTotal), count: houseCount, desc: isAr ? 'كل مصروفات المنزل' : 'All home expenses' },
    { id: 'personal' as const, title: isAr ? 'المصروفات الشخصية' : 'Personal Expenses', icon: UserRound, total: -Math.abs(workTotal), count: workCount, desc: isAr ? 'المصروفات الشخصية اليومية' : 'Personal daily expenses' },
    { id: 'reports' as const, title: isAr ? 'التقارير' : 'Reports', icon: BarChart3, total: 0, count: 0, desc: isAr ? 'التقارير والتحليلات والتصدير' : 'Reports, analytics and export', noMoney: true },
  ];

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Master section title */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-cyan-50 transition-all active:scale-95">
            <BackIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <div className="font-black text-lg flex items-center justify-center gap-2"><Layers className="w-5 h-5 text-cyan-600" />{isAr ? 'أقسام الدخل والمصروفات' : 'Income & Expenses Sections'}</div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Income data tab */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="w-full py-3 text-center font-black text-sm bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">{isAr ? 'بيانات الدخل' : 'Income Data'}</div>
        <div className="grid grid-cols-3 gap-2 p-3 text-center">
          <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900"><div className="text-[11px] font-bold text-slate-500">الدخل</div><div className="font-black text-emerald-600">+{formatMoney(monthlyIncome)} {currency}</div></div>
          <div className="rounded-xl p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900"><div className="text-[11px] font-bold text-slate-500">المصروفات</div><div className="font-black text-rose-600">-{formatMoney(Math.abs(monthlyExpenses))} {currency}</div></div>
          <div className={`rounded-xl p-3 border ${isSurplus ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}><div className="text-[11px] font-bold text-slate-500">الصافي</div><div className={`font-black ${isSurplus ? 'text-emerald-600' : 'text-rose-600'}`}>{signed(netIncome)} {currency}</div></div>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {sections.map(sec => {
          const Icon = sec.icon;
          const positive = sec.total > 0;
          return <button key={sec.id} onClick={() => onSelectSection(sec.id)} className="text-right bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-cyan-400 hover:shadow-md transition-all active:scale-[.99]">
            <div className="flex items-center justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center"><Icon className="w-5 h-5 text-cyan-600" /></div>
              {!sec.noMoney && <span className={`font-black text-sm ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>{signed(sec.total)} {currency}</span>}
            </div>
            <div className="mt-3"><div className="font-black text-base">{sec.title}</div><div className="text-xs text-slate-500 mt-1">{sec.desc}</div></div>
            {!sec.noMoney && <div className="mt-3 text-[11px] text-slate-400">{sec.count} {isAr ? 'عملية/سجل' : 'records'}</div>}
          </button>;
        })}
      </div>

      {/* Master financial summary */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="w-full py-3 text-center font-black text-sm bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"><Wallet className="w-4 h-4 text-cyan-600" />{isAr ? 'الملخص المالي والمصروفات' : 'Financial Summary & Expenses'}</div>
        <div className="p-3 space-y-2 text-sm">
          <SummaryRow label="الدخل والشهادات والحساب الجاري" value={monthlyIncome} positive />
          <SummaryRow label="سيارتي" value={-Math.abs(vehicleTotal)} />
          <SummaryRow label="التعليم" value={-Math.abs(educationTotal)} />
          <SummaryRow label="مصروفات المنزل" value={-Math.abs(houseTotal)} />
          <SummaryRow label="المصروفات الشخصية" value={-Math.abs(workTotal)} />
          <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700"><SummaryRow label="الإجمالي بعد المصروفات" value={netIncome} positive={netIncome >= 0} bold /></div>
          <div className="text-[11px] text-slate-400 pt-1">{isAr ? `أرباح الشهادات: +${formatMoney(certificatesProfit)} • صافي حركة الحساب الجاري: ${signed(currentAccountNet)}` : `Certificate profit: +${formatMoney(certificatesProfit)} • Current account net: ${signed(currentAccountNet)}`}</div>
        </div>
      </div>


    </div>
  );
};

const SummaryRow: React.FC<{ label: string; value: number; positive?: boolean; bold?: boolean }> = ({ label, value, positive, bold }) => {
  const cls = value > 0 || positive ? 'text-emerald-600' : value < 0 ? 'text-rose-600' : 'text-slate-500';
  return <div className={`flex items-center justify-between gap-3 ${bold ? 'font-black' : 'font-bold'}`}><span>{label}</span><span className={cls}>{value > 0 ? '+' : value < 0 ? '-' : ''}{formatMoney(Math.abs(value))}</span></div>;
};

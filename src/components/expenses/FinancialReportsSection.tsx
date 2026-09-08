import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';
import { formatMoney } from '../../services/financeCalculations';
import { Language } from '../../types';

interface FinancialReportsSectionProps {
  language: Language;
  currency: string;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onBack: () => void;
  monthlyIncome: number;
  monthlyExpenses: number;
  netIncome: number;
  houseTotal: number;
  workTotal: number;
  vehicleTotal: number;
  educationTotal: number;
}

export const FinancialReportsSection: React.FC<FinancialReportsSectionProps> = ({
  language,
  currency,
  selectedMonth,
  onSelectMonth,
  onBack,
  monthlyIncome,
  monthlyExpenses,
  netIncome,
  houseTotal,
  workTotal,
  vehicleTotal,
  educationTotal,
}) => {
  const isAr = language === 'ar';
  const BackIcon = isAr ? ArrowRight : ArrowLeft;
  const isSurplus = netIncome >= 0;

  const totalCalculated = houseTotal + workTotal + vehicleTotal + educationTotal || 1;
  const housePct = Math.round((houseTotal / totalCalculated) * 100);
  const workPct = Math.round((workTotal / totalCalculated) * 100);
  const vehiclePct = Math.round((vehicleTotal / totalCalculated) * 100);
  const educationPct = Math.round((educationTotal / totalCalculated) * 100);

  const expenseRatio = monthlyIncome > 0 ? Math.round((monthlyExpenses / monthlyIncome) * 100) : 100;

  const exportExcel = () => {
    const headers = ['البيان / القسم', 'المبلغ بالجنيه', 'النسبة من إجمالي المصروفات'];
    const rows = [
      ['إجمالي الدخل الشهري', monthlyIncome, '100%'],
      ['إجمالي المصروفات الشهرية', monthlyExpenses, `${expenseRatio}% من الدخل`],
      ['صافي الفائض / العجز', netIncome, `${100 - expenseRatio}%`],
      ['---', '---', '---'],
      ['مصروفات المنزل', houseTotal, `${housePct}%`],
      ['مصروفات العمل والمكتب', workTotal, `${workPct}%`],
      ['مصروفات المركبة والوقود', vehicleTotal, `${vehiclePct}%`],
      ['مصروفات التعليم والطلاب', educationTotal, `${educationPct}%`],
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${selectedMonth}.csv`;
    a.click();
  };

  const exportWord = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>تقرير المصروفات</title><meta charset='utf-8'></head>
      <body dir='rtl' style='font-family: Arial, sans-serif; padding: 20px;'>
        <h1 style='color: #0891b2;'>تقرير الدخل والمصروفات - Smart Time Gold</h1>
        <p><strong>الشهر المالي:</strong> ${selectedMonth}</p>
        <hr/>
        <h3>الملخص المالي الرئيسي:</h3>
        <ul>
          <li><strong>إجمالي الدخل:</strong> ${formatMoney(monthlyIncome)} ${currency}</li>
          <li><strong>إجمالي المصروفات:</strong> ${formatMoney(monthlyExpenses)} ${currency}</li>
          <li><strong>صافي الدخل:</strong> ${formatMoney(netIncome)} ${currency}</li>
        </ul>
        <hr/>
        <h3>توزيع أقسام المصروفات:</h3>
        <table border='1' cellspacing='0' cellpadding='8' style='width:100%; border-collapse: collapse;'>
          <tr style='background-color: #f1f5f9;'>
            <th>القسم</th>
            <th>المبلغ</th>
            <th>النسبة</th>
          </tr>
          <tr><td>مصروفات المنزل</td><td>${formatMoney(houseTotal)} ${currency}</td><td>${housePct}%</td></tr>
          <tr><td>مصروفات العمل والمكتب</td><td>${formatMoney(workTotal)} ${currency}</td><td>${workPct}%</td></tr>
          <tr><td>مصروفات المركبة والوقود</td><td>${formatMoney(vehicleTotal)} ${currency}</td><td>${vehiclePct}%</td></tr>
          <tr><td>مصروفات التعليم والطلاب</td><td>${formatMoney(educationTotal)} ${currency}</td><td>${educationPct}%</td></tr>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${selectedMonth}.doc`;
    a.click();
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header with Back Button */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-200 hover:text-cyan-600 flex items-center justify-center transition-all active:scale-95"
            title={isAr ? 'رجوع' : 'Back'}
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {isAr ? 'التقارير المالية والتحليلات' : 'Financial Reports & Analytics'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'مقارنات بيانية وتصدير للبيانات المالية' : 'Visual breakdown and comprehensive data exports'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={exportExcel}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={exportWord}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Word</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-600" />
            <span>{isAr ? 'طباعة' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Financial Balance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block mb-1">{isAr ? 'إجمالي الدخل الشهري' : 'Total Monthly Income'}</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatMoney(monthlyIncome)} <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {isAr ? 'شامل أرباح الشهادات' : 'Includes cert profits'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block mb-1">{isAr ? 'إجمالي المصروفات' : 'Total Expenses'}</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatMoney(monthlyExpenses)} <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {expenseRatio}% {isAr ? 'من إجمالي الدخل' : 'of monthly income'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block mb-1">{isAr ? 'صافي الدخل / الفائض' : 'Net Surplus'}</span>
          <div className={`text-2xl font-black ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isSurplus ? '+' : ''}{formatMoney(netIncome)} <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isSurplus ? (isAr ? 'فائض مالي إيجابي ممتاز' : 'Positive surplus') : (isAr ? 'عجز يتطلب مراجعة المصروفات' : 'Deficit')}
          </span>
        </div>
      </div>

      {/* 3. Visual Breakdown Progress Bars */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-600" />
            <span>{isAr ? 'توزيع المصروفات حسب الأقسام' : 'Expense Distribution by Section'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">{formatMoney(monthlyExpenses)} {currency}</span>
        </div>

        {/* Multi-color segment bar */}
        <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div style={{ width: `${housePct}%` }} className="bg-cyan-500 h-full transition-all" title={`المنزل: ${housePct}%`} />
          <div style={{ width: `${workPct}%` }} className="bg-sky-500 h-full transition-all" title={`العمل: ${workPct}%`} />
          <div style={{ width: `${vehiclePct}%` }} className="bg-teal-500 h-full transition-all" title={`المركبة: ${vehiclePct}%`} />
          <div style={{ width: `${educationPct}%` }} className="bg-indigo-500 h-full transition-all" title={`التعليم: ${educationPct}%`} />
        </div>

        {/* Section Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-md bg-cyan-500"></span>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{isAr ? 'مصروفات المنزل' : 'Home'}</span>
                <span className="text-[10px] text-slate-400">{housePct}% {isAr ? 'من الإجمالي' : 'of total'}</span>
              </div>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">{formatMoney(houseTotal)} {currency}</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-md bg-sky-500"></span>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{isAr ? 'مصروفات العمل والمكتب' : 'Work'}</span>
                <span className="text-[10px] text-slate-400">{workPct}% {isAr ? 'من الإجمالي' : 'of total'}</span>
              </div>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">{formatMoney(workTotal)} {currency}</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-md bg-teal-500"></span>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{isAr ? 'مصروفات المركبة والوقود' : 'Vehicle'}</span>
                <span className="text-[10px] text-slate-400">{vehiclePct}% {isAr ? 'من الإجمالي' : 'of total'}</span>
              </div>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">{formatMoney(vehicleTotal)} {currency}</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-md bg-indigo-500"></span>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{isAr ? 'مصروفات التعليم والطلاب' : 'Education'}</span>
                <span className="text-[10px] text-slate-400">{educationPct}% {isAr ? 'من الإجمالي' : 'of total'}</span>
              </div>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">{formatMoney(educationTotal)} {currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

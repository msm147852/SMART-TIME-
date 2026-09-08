import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Building,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Percent,
  Calculator,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  X,
  Sparkles,
  CheckCircle2,
  Coins,
  Receipt,
  Layers,
} from 'lucide-react';
import {
  formatMoney,
  calculateCertificateProfits,
  getCertificatesProfitForMonth,
  getPrimaryIncomeForMonth,
} from '../../services/financeCalculations';
import {
  Language,
  MonthlyIncome,
  BankCertificate,
  CertificateProfitFrequency,
  IncomeSourceItem,
} from '../../types';

interface IncomeAndCertificatesSectionProps {
  language: Language;
  currency: string;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onBack: () => void;
  incomeList: MonthlyIncome[];
  onSaveIncome: (list: MonthlyIncome[]) => void;
  certificates: BankCertificate[];
  onSaveCertificates: (list: BankCertificate[]) => void;
  onIncomeChanged?: () => void;
}

export const IncomeAndCertificatesSection: React.FC<IncomeAndCertificatesSectionProps> = ({
  language,
  currency,
  selectedMonth,
  onSelectMonth,
  onBack,
  incomeList,
  onSaveIncome,
  certificates,
  onSaveCertificates,
}) => {
  const isAr = language === 'ar';
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  const [activeTab, setActiveTab] = useState<'income' | 'certificates' | 'all'>('income');

  // --- 1. INCOME SOURCES STATE ---
  const currentMonthDoc = useMemo(() => {
    return incomeList.find((i) => i.month === selectedMonth);
  }, [incomeList, selectedMonth]);

  const currentSources: IncomeSourceItem[] = useMemo(() => {
    if (currentMonthDoc?.sources && currentMonthDoc.sources.length > 0) {
      return currentMonthDoc.sources;
    }
    // Fallback migration from legacy fields
    const legacy: IncomeSourceItem[] = [];
    if (currentMonthDoc?.salary && currentMonthDoc.salary > 0) {
      legacy.push({
        id: `src_sal_${selectedMonth}`,
        source: isAr ? 'الراتب الأساسي' : 'Base Salary',
        amount: currentMonthDoc.salary,
        date: `${selectedMonth}-01`,
        type: 'salary',
        notes: isAr ? 'الراتب الشهري' : 'Monthly Salary',
        createdAt: currentMonthDoc.createdAt || new Date().toISOString(),
      });
    }
    if (currentMonthDoc?.bonuses && currentMonthDoc.bonuses > 0) {
      legacy.push({
        id: `src_bon_${selectedMonth}`,
        source: isAr ? 'مكافآت وحوافز' : 'Bonuses',
        amount: currentMonthDoc.bonuses,
        date: `${selectedMonth}-01`,
        type: 'bonus',
        notes: isAr ? 'مكافآت شهرية' : 'Bonuses',
        createdAt: currentMonthDoc.createdAt || new Date().toISOString(),
      });
    }
    if (currentMonthDoc?.otherIncome && currentMonthDoc.otherIncome > 0) {
      legacy.push({
        id: `src_oth_${selectedMonth}`,
        source: isAr ? 'دخل إضافي' : 'Other Income',
        amount: currentMonthDoc.otherIncome,
        date: `${selectedMonth}-01`,
        type: 'extra',
        notes: currentMonthDoc.otherIncomeNote || (isAr ? 'دخل إضافي' : 'Other income'),
        createdAt: currentMonthDoc.createdAt || new Date().toISOString(),
      });
    }
    return legacy;
  }, [currentMonthDoc, selectedMonth, isAr]);

  // Modals
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [sourceAmount, setSourceAmount] = useState('');
  const [sourceDate, setSourceDate] = useState(`${selectedMonth}-01`);
  const [sourceType, setSourceType] = useState('salary');
  const [sourceNotes, setSourceNotes] = useState('');

  // --- 2. BANK CERTIFICATES STATE ---
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);

  const [certBankName, setCertBankName] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [certAmount, setCertAmount] = useState('');
  const [certAnnualRate, setCertAnnualRate] = useState('18');
  const [certDuration, setCertDuration] = useState('1 سنة');
  const [certIssueDate, setCertIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [certMaturityDate, setCertMaturityDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [certProfitDate, setCertProfitDate] = useState(new Date().toISOString().split('T')[0]);
  const [certFrequency, setCertFrequency] = useState<CertificateProfitFrequency>('monthly');
  const [certReturnType, setCertReturnType] = useState<'simple' | 'compound' | 'variable'>('simple');
  const [certNotes, setCertNotes] = useState('');

  // Live profit calculation inside Certificate Modal
  const calculatedProfits = useMemo(() => {
    const amt = parseFloat(certAmount) || 0;
    const rate = parseFloat(certAnnualRate) || 0;
    return calculateCertificateProfits(amt, rate, certFrequency, certDuration);
  }, [certAmount, certAnnualRate, certFrequency, certDuration]);

  // Auto update maturity date when issueDate or duration changes
  const handleDurationChange = (val: string) => {
    setCertDuration(val);
    try {
      const issue = new Date(certIssueDate);
      if (!isNaN(issue.getTime())) {
        if (val.includes('3')) {
          issue.setFullYear(issue.getFullYear() + 3);
        } else if (val.includes('2')) {
          issue.setFullYear(issue.getFullYear() + 2);
        } else if (val.includes('6') && val.includes('شهر')) {
          issue.setMonth(issue.getMonth() + 6);
        } else {
          issue.setFullYear(issue.getFullYear() + 1);
        }
        setCertMaturityDate(issue.toISOString().split('T')[0]);
      }
    } catch {}
  };

  // --- 3. TOTALS & LINKING CALCULATIONS ---
  const primaryIncomeTotal = currentSources.reduce((s, src) => s + (Number(src.amount) || 0), 0);
  const monthlyCertsProfit = getCertificatesProfitForMonth(certificates, selectedMonth);
  const grandTotalIncome = primaryIncomeTotal + monthlyCertsProfit;

  // --- SAVE INCOME SOURCE ---
  const handleSaveSource = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(sourceAmount);
    if (isNaN(p) || p <= 0 || !sourceName.trim()) return;

    const newSource: IncomeSourceItem = {
      id: editingSourceId || `src_${Date.now()}`,
      source: sourceName.trim(),
      amount: p,
      date: sourceDate,
      type: sourceType,
      notes: sourceNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    let updatedSources: IncomeSourceItem[];
    if (editingSourceId) {
      updatedSources = currentSources.map((s) => (s.id === editingSourceId ? newSource : s));
    } else {
      updatedSources = [newSource, ...currentSources];
    }

    // Update or create MonthlyIncome document
    const salary = updatedSources.filter((s) => s.type === 'salary').reduce((s, x) => s + x.amount, 0);
    const bonuses = updatedSources.filter((s) => s.type === 'bonus').reduce((s, x) => s + x.amount, 0);
    const otherIncome = updatedSources.filter((s) => s.type !== 'salary' && s.type !== 'bonus').reduce((s, x) => s + x.amount, 0);

    const newMonthDoc: MonthlyIncome = {
      id: currentMonthDoc?.id || `income_${selectedMonth}`,
      month: selectedMonth,
      salary,
      bonuses,
      otherIncome,
      sources: updatedSources,
      createdAt: currentMonthDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextIncomeList = currentMonthDoc
      ? incomeList.map((doc) => (doc.month === selectedMonth ? newMonthDoc : doc))
      : [newMonthDoc, ...incomeList];

    onSaveIncome(nextIncomeList);
    setIsIncomeModalOpen(false);
  };

  const handleDeleteSource = (id: string) => {
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف مصدر الدخل هذا؟' : 'Delete this income source?')) {
      const updatedSources = currentSources.filter((s) => s.id !== id);
      const salary = updatedSources.filter((s) => s.type === 'salary').reduce((s, x) => s + x.amount, 0);
      const bonuses = updatedSources.filter((s) => s.type === 'bonus').reduce((s, x) => s + x.amount, 0);
      const otherIncome = updatedSources.filter((s) => s.type !== 'salary' && s.type !== 'bonus').reduce((s, x) => s + x.amount, 0);

      const newMonthDoc: MonthlyIncome = {
        id: currentMonthDoc?.id || `income_${selectedMonth}`,
        month: selectedMonth,
        salary,
        bonuses,
        otherIncome,
        sources: updatedSources,
        createdAt: currentMonthDoc?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const nextIncomeList = currentMonthDoc
        ? incomeList.map((doc) => (doc.month === selectedMonth ? newMonthDoc : doc))
        : [newMonthDoc, ...incomeList];

      onSaveIncome(nextIncomeList);
    }
  };

  // --- SAVE CERTIFICATE ---
  const handleSaveCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(certAmount);
    const rate = parseFloat(certAnnualRate);
    if (isNaN(amt) || amt <= 0 || !certBankName.trim()) return;

    const calc = calculateCertificateProfits(amt, rate || 0, certFrequency, certDuration);

    const newCert: BankCertificate = {
      id: editingCertId || `cert_${Date.now()}`,
      bankName: certBankName.trim(),
      certificateNumber: certNumber.trim() || undefined,
      duration: certDuration.trim(),
      amount: amt,
      annualRate: rate || 0,
      annualProfit: calc.annualProfit,
      periodicProfit: calc.periodicProfit,
      monthlyEquivalentProfit: calc.monthlyEquivalent,
      returnType: certReturnType,
      issueDate: certIssueDate,
      maturityDate: certMaturityDate,
      profitDate: certProfitDate,
      profitAmount: calc.periodicProfit,
      profitFrequency: certFrequency,
      notes: certNotes.trim() || undefined,
      createdAt: editingCertId ? certificates.find((c) => c.id === editingCertId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextCerts = editingCertId
      ? certificates.map((c) => (c.id === editingCertId ? newCert : c))
      : [newCert, ...certificates];

    onSaveCertificates(nextCerts);
    setIsCertModalOpen(false);
  };

  const handleDeleteCert = (id: string) => {
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الشهادة البنكية؟' : 'Delete this certificate?')) {
      const nextCerts = certificates.filter((c) => c.id !== id);
      onSaveCertificates(nextCerts);
    }
  };

  const openEditCert = (c: BankCertificate) => {
    setEditingCertId(c.id);
    setCertBankName(c.bankName);
    setCertNumber(c.certificateNumber || '');
    setCertAmount(String(c.amount));
    setCertAnnualRate(String(c.annualRate || '18'));
    setCertDuration(c.duration);
    setCertIssueDate(c.issueDate);
    setCertMaturityDate(c.maturityDate);
    setCertProfitDate(c.profitDate);
    setCertFrequency(c.profitFrequency || 'monthly');
    setCertReturnType(c.returnType || 'simple');
    setCertNotes(c.notes || '');
    setIsCertModalOpen(true);
  };

  const exportData = (type: 'csv' | 'print') => {
    if (type === 'csv') {
      const headers = ['النوع', 'المصدر/البنك', 'القيمة', 'التاريخ/الدورية', 'الأرباح/الملاحظات'];
      const rows = [
        ...currentSources.map((s) => ['دخل شهري', s.source, s.amount, s.date, s.notes || '']),
        ...certificates.map((c) => [
          'شهادة بنكية',
          c.bankName,
          c.amount,
          `عائد ${c.annualRate || 0}% - ${c.profitFrequency}`,
          `ربح شهري: ${c.monthlyEquivalentProfit || 0} ${currency}`,
        ]),
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
      a.download = `income-and-certificates-${selectedMonth}.csv`;
      a.click();
    } else {
      window.print();
    }
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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {isAr ? 'الدخل الشهري والشهادات البنكية' : 'Income & Bank Certificates'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'إدارة مصادر الدخل المتعددة، الشهادات وحساب الأرباح الآلي' : 'Manage income sources, bank certificates & automated returns'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingSourceId(null);
              setSourceName('');
              setSourceAmount('');
              setSourceDate(`${selectedMonth}-01`);
              setSourceType('salary');
              setSourceNotes('');
              setIsIncomeModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-800 dark:text-slate-200 hover:text-emerald-600 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'مصدر دخل +' : 'Add Income +'}</span>
          </button>

          <button
            onClick={() => {
              setEditingCertId(null);
              setCertBankName('');
              setCertNumber('');
              setCertAmount('');
              setCertAnnualRate('18');
              setCertDuration('1 سنة');
              setCertFrequency('monthly');
              setCertNotes('');
              setIsCertModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Building className="w-3.5 h-3.5" />
            <span>{isAr ? 'شهادة بنكية +' : 'Add Certificate +'}</span>
          </button>
        </div>
      </div>

      {/* 2. Monthly Grand Total Breakdown Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm bg-gradient-to-br from-white via-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            {isAr ? 'إجمالي الدخل المحسوب لهذا الشهر' : 'Total Monthly Income'}
          </span>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
            {isAr ? 'مربوط بالـ Dashboard' : 'Synced with Dashboard'}
          </span>
        </div>

        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
          {formatMoney(grandTotalIncome)}{' '}
          <span className="text-sm font-semibold text-slate-500">{currency}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-500">{isAr ? 'مصادر الدخل (رواتب وأعمال):' : 'Primary Income Streams:'}</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatMoney(primaryIncomeTotal)} {currency} ({currentSources.length} {isAr ? 'مصدر' : 'sources'})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">
              {isAr ? 'أرباح الشهادات البنكية المحسوبة:' : 'Bank Certificate Returns:'}
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              +{formatMoney(monthlyCertsProfit)} {currency} ({certificates.length} {isAr ? 'شهادة' : 'certs'})
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub Tabs: Income Streams vs Bank Certificates */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-1.5">
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'income'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>{isAr ? 'مصادر الدخل الشهري' : 'Income Sources'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{currentSources.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'certificates'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>{isAr ? 'الشهادات البنكية والأرباح' : 'Bank Certificates'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{certificates.length}</span>
        </button>
      </div>

      {/* 4. Tab 1: Income Sources */}
      {activeTab === 'income' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'قائمة مصادر الدخل لهذا الشهر' : 'Income Streams This Month'}</span>
            </h2>
            <button
              onClick={() => {
                setEditingSourceId(null);
                setSourceName('');
                setSourceAmount('');
                setSourceDate(`${selectedMonth}-01`);
                setSourceType('salary');
                setSourceNotes('');
                setIsIncomeModalOpen(true);
              }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة مصدر دخل' : 'Add Source'}</span>
            </button>
          </div>

          {currentSources.length === 0 ? (
            <div className="p-10 text-center text-slate-400 space-y-2">
              <Coins className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs">{isAr ? 'لم يتم تسجيل أي مصدر دخل لهذا الشهر' : 'No income sources recorded for this month'}</p>
              <button
                onClick={() => {
                  setEditingSourceId(null);
                  setSourceName(isAr ? 'الراتب الأساسي' : 'Salary');
                  setSourceAmount('25000');
                  setSourceDate(`${selectedMonth}-01`);
                  setSourceType('salary');
                  setSourceNotes('');
                  setIsIncomeModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة الراتب الأساسي' : 'Add Salary'}</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentSources.map((src) => (
                <div
                  key={src.id}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{src.source}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {src.type === 'salary'
                            ? isAr ? 'راتب' : 'Salary'
                            : src.type === 'bonus'
                            ? isAr ? 'مكافأة' : 'Bonus'
                            : src.type === 'investment'
                            ? isAr ? 'استثمار' : 'Investment'
                            : isAr ? 'دخل إضافي' : 'Extra'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {src.date} {src.notes && `• ${src.notes}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      +{formatMoney(src.amount)}{' '}
                      <span className="text-[10px] font-normal text-slate-500">{currency}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingSourceId(src.id);
                          setSourceName(src.source);
                          setSourceAmount(String(src.amount));
                          setSourceDate(src.date);
                          setSourceType(src.type);
                          setSourceNotes(src.notes || '');
                          setIsIncomeModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Bank Certificates with Calculations */}
      {activeTab === 'certificates' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {isAr ? 'إجمالي أصل الشهادات البنكية المحفوظة' : 'Total Certificates Principal'}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatMoney(certificates.reduce((s, c) => s + (Number(c.amount) || 0), 0))}{' '}
                <span className="text-xs font-semibold text-slate-500">{currency}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                {isAr ? 'العائد الشهري المحسوب' : 'Monthly Profit Synced'}
              </span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                +{formatMoney(monthlyCertsProfit)} {currency}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certificates.length === 0 ? (
              <div className="col-span-2 bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-2">
                <Building className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs">{isAr ? 'لا توجد شهادات بنكية مضافة بعد' : 'No bank certificates added yet'}</p>
                <button
                  onClick={() => {
                    setEditingCertId(null);
                    setCertBankName(isAr ? 'البنك الأهلي المصري' : 'National Bank');
                    setCertAmount('240000');
                    setCertAnnualRate('18');
                    setCertDuration('1 سنة');
                    setCertFrequency('monthly');
                    setIsCertModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة شهادة تجريبية (مثال 240 ألف)' : 'Add Sample Certificate'}</span>
                </button>
              </div>
            ) : (
              certificates.map((cert) => {
                const calc = calculateCertificateProfits(
                  cert.amount,
                  cert.annualRate || 0,
                  cert.profitFrequency,
                  cert.duration
                );
                return (
                  <div
                    key={cert.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{cert.bankName}</h3>
                            {cert.certificateNumber && (
                              <span className="text-[10px] text-slate-400 block">{cert.certificateNumber}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditCert(cert)}
                            className="p-1 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCert(cert.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Principal & Rate */}
                      <div className="flex items-baseline justify-between mt-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isAr ? 'قيمة الشهادة' : 'Principal'}</span>
                          <span className="text-base font-black text-slate-900 dark:text-slate-100">
                            {formatMoney(cert.amount)} {currency}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">{isAr ? 'العائد السنوي' : 'Annual Rate'}</span>
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            {cert.annualRate || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Profit Calculations Box */}
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div className="p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                          <span className="text-[10px] text-slate-500 block">{isAr ? 'الربح السنوي المتوقع' : 'Annual Return'}</span>
                          <span className="font-black text-emerald-700 dark:text-emerald-300">
                            {formatMoney(calc.annualProfit)} {currency}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                          <span className="text-[10px] text-slate-500 block">
                            {isAr ? `الربح الشهري (${cert.profitFrequency === 'monthly' ? 'شهري' : cert.profitFrequency})` : 'Monthly Eq.'}
                          </span>
                          <span className="font-black text-emerald-700 dark:text-emerald-300">
                            {formatMoney(calc.monthlyEquivalent)} {currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer dates */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{cert.duration}</span>
                      <span>إصدار: {cert.issueDate} • استحقاق: {cert.maturityDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT INCOME SOURCE --- */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                {editingSourceId ? (isAr ? 'تعديل مصدر الدخل' : 'Edit Income Source') : isAr ? 'إضافة مصدر دخل جديد' : 'New Income Source'}
              </h3>
              <button onClick={() => setIsIncomeModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSource} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">{isAr ? 'مصدر الدخل / المسمى *' : 'Income Source Name *'}</label>
                <input
                  type="text"
                  required
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder={isAr ? 'مثال: الراتب الشهري، عمل حر، تجارة' : 'e.g. Base Salary, Freelance'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">{isAr ? 'قيمة الدخل *' : 'Amount *'}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={sourceAmount}
                    onChange={(e) => setSourceAmount(e.target.value)}
                    placeholder="25000"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">{isAr ? 'التاريخ *' : 'Date *'}</label>
                  <input
                    type="date"
                    required
                    value={sourceDate}
                    onChange={(e) => setSourceDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">{isAr ? 'نوع الدخل' : 'Income Category'}</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="salary">{isAr ? 'راتب أساسي' : 'Base Salary'}</option>
                  <option value="extra">{isAr ? 'دخل إضافي / عمل حر' : 'Extra Income / Freelance'}</option>
                  <option value="bonus">{isAr ? 'مكافآت وحوافز' : 'Bonuses'}</option>
                  <option value="investment">{isAr ? 'أرباح استثمار وتجارة' : 'Investment'}</option>
                  <option value="other">{isAr ? 'أخرى' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">{isAr ? 'ملاحظات (اختياري)' : 'Notes'}</label>
                <input
                  type="text"
                  value={sourceNotes}
                  onChange={(e) => setSourceNotes(e.target.value)}
                  placeholder={isAr ? 'ملاحظات وتفاصيل...' : 'Optional notes...'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm"
              >
                {editingSourceId ? (isAr ? 'حفظ التعديل' : 'Update') : isAr ? 'حفظ مصدر الدخل' : 'Save Source'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD / EDIT BANK CERTIFICATE (WITH REALTIME AUTO CALCULATION) --- */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {editingCertId ? (isAr ? 'تعديل الشهادة البنكية' : 'Edit Certificate') : isAr ? 'إضافة شهادة بنكية جديدة' : 'Add Bank Certificate'}
                </h3>
              </div>
              <button onClick={() => setIsCertModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCertificate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">{isAr ? 'اسم البنك *' : 'Bank Name *'}</label>
                  <input
                    type="text"
                    required
                    value={certBankName}
                    onChange={(e) => setCertBankName(e.target.value)}
                    placeholder={isAr ? 'مثال: البنك الأهلي، بنك مصر' : 'e.g. NBE, Banque Misr'}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">{isAr ? 'رقم الشهادة (اختياري)' : 'Certificate No.'}</label>
                  <input
                    type="text"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    placeholder="CERT-10293"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">{isAr ? 'قيمة الشهادة (الأصل) *' : 'Certificate Amount *'}</label>
                  <input
                    type="number"
                    step="1000"
                    min="1"
                    required
                    value={certAmount}
                    onChange={(e) => setCertAmount(e.target.value)}
                    placeholder="240000"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">{isAr ? 'نسبة العائد السنوية % *' : 'Annual Rate % *'}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={certAnnualRate}
                      onChange={(e) => setCertAnnualRate(e.target.value)}
                      placeholder="18"
                      className="w-full p-2.5 pr-7 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">{isAr ? 'مدة الشهادة *' : 'Duration *'}</label>
                  <select
                    value={certDuration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
                  >
                    <option value="1 سنة">{isAr ? 'سنة واحدة (12 شهر)' : '1 Year'}</option>
                    <option value="2 سنة">{isAr ? 'سنتان (24 شهر)' : '2 Years'}</option>
                    <option value="3 سنوات">{isAr ? '3 سنوات (36 شهر)' : '3 Years'}</option>
                    <option value="6 شهور">{isAr ? '6 شهور' : '6 Months'}</option>
                    <option value="5 سنوات">{isAr ? '5 سنوات' : '5 Years'}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">{isAr ? 'دورية صرف الأرباح *' : 'Profit Frequency *'}</label>
                  <select
                    value={certFrequency}
                    onChange={(e) => setCertFrequency(e.target.value as CertificateProfitFrequency)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
                  >
                    <option value="monthly">{isAr ? 'شهري (كل شهر)' : 'Monthly'}</option>
                    <option value="quarterly">{isAr ? 'ربع سنوي (كل 3 شهور)' : 'Quarterly'}</option>
                    <option value="semiannual">{isAr ? 'نصف سنوي (كل 6 شهور)' : 'Semi-Annual'}</option>
                    <option value="annual">{isAr ? 'سنوي (كل سنة)' : 'Annual'}</option>
                    <option value="maturity">{isAr ? 'عند الاستحقاق (نهاية المدة)' : 'At Maturity'}</option>
                  </select>
                </div>
              </div>

              {/* LIVE PROFIT PREVIEW BOX */}
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Calculator className="w-4 h-4" />
                  <span>{isAr ? 'محرك الحساب التلقائي للأرباح' : 'Automated Returns Engine'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">{isAr ? 'الربح السنوي المتوقع' : 'Annual Return'}</span>
                    <span className="font-black text-emerald-600 text-sm">
                      {formatMoney(calculatedProfits.annualProfit)} {currency}
                    </span>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">
                      {isAr ? `الربح لكل دورية (${certFrequency})` : 'Per Period Return'}
                    </span>
                    <span className="font-black text-emerald-600 text-sm">
                      {formatMoney(calculatedProfits.periodicProfit)} {currency}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? `* يتم احتساب ${formatMoney(calculatedProfits.monthlyEquivalent)} ${currency} كعائد شهري تلقائي ضمن ملخص الدخل في الـ Dashboard.`
                    : `* ${formatMoney(calculatedProfits.monthlyEquivalent)} ${currency} will be included in monthly income.`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">{isAr ? 'تاريخ الإصدار *' : 'Issue Date *'}</label>
                  <input
                    type="date"
                    required
                    value={certIssueDate}
                    onChange={(e) => setCertIssueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">{isAr ? 'تاريخ الاستحقاق *' : 'Maturity Date *'}</label>
                  <input
                    type="date"
                    required
                    value={certMaturityDate}
                    onChange={(e) => setCertMaturityDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">{isAr ? 'ملاحظات (اختياري)' : 'Notes'}</label>
                <input
                  type="text"
                  value={certNotes}
                  onChange={(e) => setCertNotes(e.target.value)}
                  placeholder={isAr ? 'شروط الاسترداد، حساب الصرف...' : 'Optional notes...'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm"
              >
                {editingCertId ? (isAr ? 'حفظ التعديلات' : 'Update Certificate') : isAr ? 'حفظ الشهادة وتفعيل الأرباح' : 'Save & Link Certificate'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

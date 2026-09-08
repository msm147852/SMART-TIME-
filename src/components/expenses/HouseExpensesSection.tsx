import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Home,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Banknote,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  Sparkles,
} from 'lucide-react';
import { formatMoney, isDateInMonth } from '../../services/financeCalculations';
import { Language } from '../../types';

export interface SpecializedExpense {
  id: string;
  section: 'house' | 'work';
  type: string;
  customType?: string;
  amount: number;
  paymentType?: 'supply' | 'labor';
  date: string;
  notes?: string;
}

interface HouseExpensesSectionProps {
  language: Language;
  currency: string;
  selectedMonth: string;
  onBack: () => void;
  expenses: SpecializedExpense[];
  onSaveExpenses: (list: SpecializedExpense[]) => void;
}

export const HouseExpensesSection: React.FC<HouseExpensesSectionProps> = ({
  language,
  currency,
  selectedMonth,
  onBack,
  expenses,
  onSaveExpenses,
}) => {
  const isAr = language === 'ar';
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState('فطار');
  const [customType, setCustomType] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'supply' | 'labor'>('supply');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const houseTypesOptions = [
    'فطار',
    'غداء',
    'عشاء',
    'إصلاحات كهربائية',
    'إصلاحات سباكة',
    'إصلاحات دهان',
    'شراء أجهزة منزلية',
    'شراء مفروشات',
    'فواتير ومستحقات منزلية',
    'منظفات ومستلزمات',
    'أخرى (مخصص)',
  ];

  const currentMonthExpenses = expenses.filter((e) => isDateInMonth(e.date, selectedMonth));
  const monthTotal = currentMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const supplyTotal = currentMonthExpenses.filter((e) => e.paymentType === 'supply').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const laborTotal = currentMonthExpenses.filter((e) => e.paymentType === 'labor').reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const filteredList = expenses.filter((item) => {
    const matchesSearch =
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customType && item.customType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = selectedTypeFilter === 'all' || item.type === selectedTypeFilter;
    return matchesSearch && matchesFilter;
  });

  const openAddModal = () => {
    setEditingId(null);
    setType('فطار');
    setCustomType('');
    setAmount('');
    setPaymentType('supply');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: SpecializedExpense) => {
    setEditingId(item.id);
    setType(item.type);
    setCustomType(item.customType || '');
    setAmount(String(item.amount));
    setPaymentType(item.paymentType || 'supply');
    setDate(item.date);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newItem: SpecializedExpense = {
      id: editingId || `house_${Date.now()}`,
      section: 'house',
      type: type === 'أخرى (مخصص)' && customType.trim() ? customType.trim() : type,
      customType: type === 'أخرى (مخصص)' ? customType.trim() : undefined,
      amount: numAmount,
      paymentType,
      date,
      notes: notes.trim() || undefined,
    };

    let updated: SpecializedExpense[];
    if (editingId) {
      updated = expenses.map((e) => (e.id === editingId ? newItem : e));
    } else {
      updated = [newItem, ...expenses];
    }

    onSaveExpenses(updated);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذا المصروف؟' : 'Delete this expense?')) {
      const updated = expenses.filter((e) => e.id !== id);
      onSaveExpenses(updated);
    }
  };

  const exportData = (type: 'csv' | 'excel' | 'print') => {
    const headers = ['التاريخ', 'التصنيف', 'النوع', 'المبلغ', 'الملاحظات'];
    const rows = filteredList.map((e) => [
      e.date,
      e.type,
      e.paymentType === 'labor' ? 'مصنعية/أجرة' : 'مشتريات/مستلزمات',
      e.amount,
      e.notes || '',
    ]);

    if (type === 'csv' || type === 'excel') {
      const csvContent =
        '\uFEFF' +
        [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join(
          '\n'
        );
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `house-expenses-${selectedMonth}.csv`;
      a.click();
    } else if (type === 'print') {
      window.print();
    }
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header with Back Button & Action */}
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
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {isAr ? 'مصروفات المنزل' : 'Home Expenses'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'متابعة طعام، إصلاحات، مفروشات ومستلزمات البيت' : 'Track groceries, repairs, home utilities & furnishings'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة مصروف +' : 'Add Expense +'}</span>
        </button>
      </div>

      {/* 2. Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'إجمالي مصروفات المنزل لهذا الشهر' : 'Total Home Expenses'}
          </span>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {formatMoney(monthTotal)} <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {currentMonthExpenses.length} {isAr ? 'عملية مسجلة' : 'records in selected month'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'مشتريات ومستلزمات طعام ومواد' : 'Supplies & Groceries'}
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatMoney(supplyTotal)} <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{isAr ? 'بند مستلزمات' : 'items'}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'مصنعيات وأجور صيانة وتركيب' : 'Labor & Services'}
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatMoney(laborTotal)} <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{isAr ? 'خدمات مصنعية' : 'labor services'}</span>
        </div>
      </div>

      {/* 3. Search & Filter & Export Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isAr ? 'بحث في المصروفات أو الملاحظات...' : 'Search home expenses...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">{isAr ? 'جميع التصنيفات' : 'All Categories'}</option>
            {houseTypesOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => exportData('csv')}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => exportData('print')}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Print"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-600" />
            <span>{isAr ? 'طباعة' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* 4. Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>{isAr ? 'سجل عمليات مصروفات المنزل' : 'Home Expenses Records'}</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            {filteredList.length} {isAr ? 'عملية' : 'items'}
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <Home className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs">{isAr ? 'لا توجد مصروفات مسجلة' : 'No expenses recorded yet'}</p>
            <button
              onClick={openAddModal}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 text-white font-bold text-xs inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة أول مصروف' : 'Add First Expense'}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.type}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.paymentType === 'labor'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300'
                        }`}
                      >
                        {item.paymentType === 'labor' ? (isAr ? 'مصنعية' : 'Labor') : isAr ? 'مستلزمات' : 'Supply'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{item.date}</span>
                      {item.notes && <span>• {item.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-base font-black text-slate-900 dark:text-slate-100">
                    {formatMoney(item.amount)}{' '}
                    <span className="text-[10px] font-normal text-slate-500">{currency}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={isAr ? 'تعديل' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={isAr ? 'حذف' : 'Delete'}
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

      {/* 5. Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600">
                  <Home className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {editingId ? (isAr ? 'تعديل مصروف منزل' : 'Edit Home Expense') : isAr ? 'إضافة مصروف منزل جديد' : 'New Home Expense'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'تصنيف المصروف *' : 'Expense Category *'}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                >
                  {houseTypesOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {type === 'أخرى (مخصص)' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'اكتب اسم المصروف المخصص *' : 'Custom Expense Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder={isAr ? 'مثال: صيانة فلتر المياه' : 'e.g. Water filter maintenance'}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Amount & Date in 2 columns */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المبلغ *' : 'Amount *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'التاريخ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Type: Supply or Labor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'نوع الصرف' : 'Payment Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('supply')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      paymentType === 'supply'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isAr ? 'مشتريات ومستلزمات' : 'Supplies / Goods'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('labor')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      paymentType === 'labor'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isAr ? 'مصنعية وأجرة يد' : 'Labor / Service Fee'}
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'ملاحظات وتفاصيل' : 'Notes & Details'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isAr ? 'تفاصيل إضافية...' : 'Optional notes...'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  {editingId ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : isAr ? 'إضافة المصروف' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

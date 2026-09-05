import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  TrendingUp,
  PieChart,
  Trash2,
  Edit,
  Download,
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod, Language } from '../types';
import { translations } from '../services/i18n';
import { ExpensesRepository } from '../services';

interface ExpensesViewProps {
  language: Language;
  currency: string;
  expenses: Expense[];
  onUpdateExpenses: (expenses: Expense[]) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  language,
  currency,
  expenses,
  onUpdateExpenses,
}) => {
  const t = translations[language];

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'all' | 'this_month' | 'this_week'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('food');
  const [formPayment, setFormPayment] = useState<PaymentMethod>('card');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formReceipt, setFormReceipt] = useState('');

  // Monthly Budget Target (default 15,000)
  const monthlyBudget = 15000;

  // Filter expenses
  const filteredExpenses = expenses.filter((exp) => {
    if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;
    if (selectedPayment !== 'all' && exp.paymentMethod !== selectedPayment) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exp.title.toLowerCase().includes(q);
      const matchNotes = exp.notes?.toLowerCase().includes(q);
      return matchTitle || matchNotes;
    }
    return true;
  });

  const totalSpent = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  // Category totals for breakdown
  const categoryTotals: Record<ExpenseCategory, number> = {
    food: 0,
    vehicle: 0,
    education: 0,
    bills: 0,
    transport: 0,
    health: 0,
    shopping: 0,
    entertainment: 0,
    other: 0,
  };

  expenses.forEach((item) => {
    if (categoryTotals[item.category] !== undefined) {
      categoryTotals[item.category] += item.amount;
    }
  });

  const handleOpenAddModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormTitle(expense.title);
      setFormAmount(expense.amount.toString());
      setFormCategory(expense.category);
      setFormPayment(expense.paymentMethod);
      setFormDate(expense.date);
      setFormNotes(expense.notes || '');
      setFormReceipt(expense.receiptUrl || '');
    } else {
      setEditingExpense(null);
      setFormTitle('');
      setFormAmount('');
      setFormCategory('food');
      setFormPayment('card');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormNotes('');
      setFormReceipt('');
    }
    setShowAddModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (!formTitle.trim() || isNaN(amountNum) || amountNum <= 0) return;

    if (editingExpense) {
      const updated = expenses.map((item) =>
        item.id === editingExpense.id
          ? {
              ...item,
              title: formTitle,
              amount: amountNum,
              category: formCategory,
              paymentMethod: formPayment,
              date: formDate,
              notes: formNotes,
              receiptUrl: formReceipt,
            }
          : item
      );
      onUpdateExpenses(updated);
      ExpensesRepository.saveExpenses(updated);
    } else {
      const newExp: Expense = {
        id: 'exp_' + Date.now(),
        title: formTitle,
        amount: amountNum,
        category: formCategory,
        paymentMethod: formPayment,
        date: formDate,
        notes: formNotes,
        receiptUrl: formReceipt,
        createdAt: new Date().toISOString(),
      };
      const updated = [newExp, ...expenses];
      onUpdateExpenses(updated);
      ExpensesRepository.saveExpenses(updated);
    }
    setShowAddModal(false);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    onUpdateExpenses(updated);
    ExpensesRepository.saveExpenses(updated);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Amount', 'Category', 'PaymentMethod', 'Date', 'Notes'];
    const rows = filteredExpenses.map((e) => [
      e.id,
      `"${e.title.replace(/"/g, '""')}"`,
      e.amount,
      e.category,
      e.paymentMethod,
      e.date,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_time_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryColor = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'food':
        return '#f97316';
      case 'vehicle':
        return '#0284c7';
      case 'education':
        return '#10b981';
      case 'bills':
        return '#6366f1';
      case 'transport':
        return '#eab308';
      case 'health':
        return '#ec4899';
      case 'shopping':
        return '#8b5cf6';
      case 'entertainment':
        return '#06b6d4';
      default:
        return '#64748b';
    }
  };

  return (
    <div className="space-y-6" id="expenses-module">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
              <Wallet className="w-5 h-5" />
            </span>
            {t.expenses}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'متابعة المصروفات اليومية، الميزانية الشهرية، والتقارير المالية التحليلية'
              : 'Track daily expenses, monthly budget, and analytical financial reports'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
            title="تصدير CSV"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">{language === 'ar' ? 'تصدير كشف حساب' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all"
            id="add-expense-btn"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addExpense}</span>
          </button>
        </div>
      </div>

      {/* Analytics & Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expenses Card */}
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</span>
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-500">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 font-mono-num">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalSpent.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-500 ms-1.5">{currency}</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            {filteredExpenses.length} {language === 'ar' ? 'معاملة مسجلة في القائمة' : 'records in view'}
          </div>
        </div>

        {/* Monthly Budget Tracker */}
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{language === 'ar' ? 'الميزانية الشهرية المقدرة' : 'Monthly Budget'}</span>
            <span className="text-xs font-bold text-amber-500">
              {((totalSpent / monthlyBudget) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between font-mono-num">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {totalSpent.toLocaleString()} / {monthlyBudget.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">{currency}</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all ${
                  totalSpent > monthlyBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                }`}
                style={{ width: `${Math.min(100, (totalSpent / monthlyBudget) * 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {totalSpent > monthlyBudget ? (
              <span className="text-rose-500 font-semibold">
                ⚠️ {language === 'ar' ? 'تجاوزت الميزانية المحددة' : 'Budget exceeded'}
              </span>
            ) : (
              <span>
                {language === 'ar' ? 'متبقي من الميزانية:' : 'Remaining:'}{' '}
                {(monthlyBudget - totalSpent).toLocaleString()} {currency}
              </span>
            )}
          </div>
        </div>

        {/* Highest Category */}
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{language === 'ar' ? 'أعلى فئة إنفاق' : 'Top Category'}</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-500">
              <PieChart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900 dark:text-white capitalize">
              {t.categories.education}
            </span>
            <p className="text-xs text-slate-500 font-mono-num mt-0.5">
              {categoryTotals.education.toLocaleString()} {currency} (
              {((categoryTotals.education / (totalSpent || 1)) * 100).toFixed(0)}%)
            </p>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {language === 'ar' ? 'مصاريف المدارس والكورسات والدروس' : 'Tuitions and study courses'}
          </div>
        </div>
      </div>

      {/* Category Breakdown Badges */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          {language === 'ar' ? 'توزيع الإنفاق حسب الفئات' : 'Category Distribution'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
            const amount = categoryTotals[cat];
            const percent = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(0) : 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                className={`p-2.5 rounded-xl border text-start transition-all ${
                  selectedCategory === cat
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getCategoryColor(cat) }}
                  />
                  <span className="text-[10px] font-bold text-slate-400">{percent}%</span>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 capitalize truncate">
                  {t.categories[cat] || cat}
                </div>
                <div className="text-[11px] font-bold font-mono-num text-slate-500 dark:text-slate-400 mt-0.5">
                  {amount.toLocaleString()} {currency}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث في تفاصيل المصروفات...' : 'Search expense records...'}
            className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Payment Method Filter */}
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="text-xs rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2"
          >
            <option value="all">{language === 'ar' ? 'جميع طرق الدفع' : 'All Payments'}</option>
            <option value="cash">{t.paymentMethods.cash}</option>
            <option value="card">{t.paymentMethods.card}</option>
            <option value="wallet">{t.paymentMethods.wallet}</option>
          </select>
        </div>
      </div>

      {/* Expenses Table / List */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-16 p-4">
              <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-slate-500 font-medium">
                {language === 'ar' ? 'لا توجد مصروفات مسجلة بهذه الشروط' : 'No matching expenses'}
              </p>
            </div>
          ) : (
            filteredExpenses.map((exp) => {
              return (
                <div
                  key={exp.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: getCategoryColor(exp.category) }}
                    >
                      {t.categories[exp.category]?.[0] || '💰'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {exp.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                          {t.categories[exp.category] || exp.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exp.date}</span>
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.paymentMethods[exp.paymentMethod] || exp.paymentMethod}</span>
                        </span>
                        {exp.notes && <span className="text-slate-400 truncate max-w-xs">({exp.notes})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-end font-mono-num">
                      <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
                        -{exp.amount.toLocaleString()} {currency}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAddModal(exp)}
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        title={t.edit}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-500" />
                <span>{editingExpense ? t.edit : t.addExpense}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'عنوان المصروف / البيان' : 'Expense Title'} *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: مشتريات سوبرماركت، صيانة...' : 'e.g. Supermarket grocery'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'المبلغ' : 'Amount'} ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono-num font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'التاريخ' : 'Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'الفئة' : 'Category'}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="food">{t.categories.food}</option>
                    <option value="vehicle">{t.categories.vehicle}</option>
                    <option value="education">{t.categories.education}</option>
                    <option value="bills">{t.categories.bills}</option>
                    <option value="transport">{t.categories.transport}</option>
                    <option value="health">{t.categories.health}</option>
                    <option value="shopping">{t.categories.shopping}</option>
                    <option value="entertainment">{t.categories.entertainment}</option>
                    <option value="other">{t.categories.other}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                  </label>
                  <select
                    value={formPayment}
                    onChange={(e) => setFormPayment(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="cash">{t.paymentMethods.cash}</option>
                    <option value="card">{t.paymentMethods.card}</option>
                    <option value="wallet">{t.paymentMethods.wallet}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'ملاحظات إضافية' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'أية تفاصيل إضافية عن المعاملة...' : 'Any optional details...'}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

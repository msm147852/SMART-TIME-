import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  UserPlus,
  Plus,
  Search,
  Trash2,
  Edit2,
  Calendar,
  FileSpreadsheet,
  Printer,
  X,
  Sparkles,
  User,
} from 'lucide-react';
import { formatMoney, isDateInMonth } from '../../services/financeCalculations';
import { Language, StudentProfile, StudentExpenseRecord } from '../../types';

interface EducationExpensesSectionProps {
  language: Language;
  currency: string;
  selectedMonth: string;
  onBack: () => void;
  students: StudentProfile[];
  onSaveStudents: (list: StudentProfile[]) => void;
  expenses: StudentExpenseRecord[];
  onSaveExpenses: (list: StudentExpenseRecord[]) => void;
}

export const EducationExpensesSection: React.FC<EducationExpensesSectionProps> = ({
  language,
  currency,
  selectedMonth,
  onBack,
  students,
  onSaveStudents,
  expenses,
  onSaveExpenses,
}) => {
  const isAr = language === 'ar';
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Expense Form
  const [targetStudentId, setTargetStudentId] = useState(students[0]?.id || 'std_salma');
  const [subCategory, setSubCategory] = useState<'lessons' | 'school' | 'books' | 'transport' | 'personal'>('lessons');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Student Form
  const [stdName, setStdName] = useState('');
  const [stdStage, setStdStage] = useState(isAr ? 'إعدادي' : 'Preparatory');
  const [stdAge, setStdAge] = useState('');
  const [stdNatId, setStdNatId] = useState('');

  const subCategoryLabels: Record<string, string> = {
    lessons: isAr ? 'دروس ومجموعات' : 'Tutoring & Lessons',
    school: isAr ? 'مصاريف المدرسة' : 'School Tuition',
    books: isAr ? 'كتب ومذكرات' : 'Books & Supplies',
    transport: isAr ? 'باص ومواصلات' : 'School Bus',
    personal: isAr ? 'مصروف شخصي' : 'Personal Allowance',
  };

  const currentMonthExpenses = expenses.filter((e) => isDateInMonth(e.date, selectedMonth));
  const monthTotal = currentMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const filteredList = expenses.filter((e) => {
    const matchesStudent = selectedStudentId === 'all' || e.studentId === selectedStudentId;
    const matchesCategory = selectedCategory === 'all' || e.subCategory === selectedCategory;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStudent && matchesCategory && matchesSearch;
  });

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(amount);
    if (isNaN(p) || p <= 0) return;

    const item: StudentExpenseRecord = {
      id: editingExpId || `edu_${Date.now()}`,
      studentId: targetStudentId,
      subCategory,
      title: title.trim(),
      amount: p,
      date,
    };

    const next = editingExpId ? expenses.map((x) => (x.id === editingExpId ? item : x)) : [item, ...expenses];
    onSaveExpenses(next);
    setIsExpenseModalOpen(false);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stdName.trim()) return;

    const newStudent: StudentProfile = {
      id: `std_${Date.now()}`,
      name: stdName.trim(),
      stage: stdStage,
      age: stdAge.trim() || undefined,
      nationalId: stdNatId.trim() || undefined,
    };

    onSaveStudents([...students, newStudent]);
    setIsAddStudentModalOpen(false);
    setStdName('');
  };

  const exportData = (type: 'csv' | 'print') => {
    if (type === 'csv') {
      const headers = ['الطالب', 'النوع', 'البند', 'التاريخ', 'المبلغ'];
      const rows = filteredList.map((e) => {
        const std = students.find((s) => s.id === e.studentId);
        return [std?.name || e.studentId, subCategoryLabels[e.subCategory] || e.subCategory, e.title, e.date, e.amount];
      });
      const csvContent =
        '\uFEFF' +
        [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join(
          '\n'
        );
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `education-expenses-${selectedMonth}.csv`;
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
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {isAr ? 'مصروفات التعليم والطلاب' : 'Education & Student Expenses'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'متابعة مصاريف المدارس، الدروس، والكتب لكل طالب' : 'Tuition, lessons & school expenses per student'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddStudentModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة طالب' : 'Add Student'}</span>
          </button>
          <button
            onClick={() => {
              setEditingExpId(null);
              setTitle('');
              setAmount('');
              setDate(new Date().toISOString().split('T')[0]);
              setIsExpenseModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'مصروف تعليمي +' : 'Add Expense +'}</span>
          </button>
        </div>
      </div>

      {/* 2. Monthly Summary Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'إجمالي مصروفات التعليم لهذا الشهر' : 'Total Education Expenses This Month'}
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {formatMoney(monthTotal)} <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl block">
            {students.length} {isAr ? 'طلاب مسجلين' : 'students'}
          </span>
        </div>
      </div>

      {/* 3. Students Chips Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedStudentId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedStudentId === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {isAr ? 'جميع الطلاب' : 'All Students'}
        </button>

        {students.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStudentId(s.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              selectedStudentId === s.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <User className="w-3 h-3" />
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* 4. Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isAr ? 'سجل المصروفات التعليمية' : 'Education Records'}</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            {filteredList.length} {isAr ? 'بند' : 'items'}
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs">{isAr ? 'لا توجد مصروفات تعليمية مسجلة' : 'No records yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredList.map((e) => {
              const std = students.find((s) => s.id === e.studentId);
              return (
                <div key={e.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{e.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {subCategoryLabels[e.subCategory] || e.subCategory}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {std?.name || 'طالب'} • {e.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                      {formatMoney(e.amount)} <span className="text-[10px] font-normal text-slate-500">{currency}</span>
                    </div>
                    <button
                      onClick={() => onSaveExpenses(expenses.filter((x) => x.id !== e.id))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{isAr ? 'إضافة مصروف تعليمي' : 'Add Education Expense'}</h3>
              <button onClick={() => setIsExpenseModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold">{isAr ? 'الطالب *' : 'Student *'}</label>
                <select value={targetStudentId} onChange={(e) => setTargetStudentId(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1">
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.stage})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold">{isAr ? 'النوع *' : 'Type *'}</label>
                <select value={subCategory} onChange={(e) => setSubCategory(e.target.value as any)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1">
                  <option value="lessons">{isAr ? 'دروس خصوصية ومجموعات' : 'Lessons'}</option>
                  <option value="school">{isAr ? 'أقساط ومصاريف مدرسية' : 'School'}</option>
                  <option value="books">{isAr ? 'كتب ومذكرات خارجية' : 'Books'}</option>
                  <option value="transport">{isAr ? 'اشتراك باص ومواصلات' : 'Bus'}</option>
                  <option value="personal">{isAr ? 'مصروف شخصي' : 'Allowance'}</option>
                </select>
              </div>
              <div>
                <label className="font-bold">{isAr ? 'بيان المصروف *' : 'Title *'}</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: دروس الرياضيات واللغات" className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold">{isAr ? 'المبلغ *' : 'Amount *'}</label>
                  <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
                </div>
                <div>
                  <label className="font-bold">{isAr ? 'التاريخ *' : 'Date *'}</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold">{isAr ? 'حفظ المصروف' : 'Save'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{isAr ? 'إضافة ملف طالب جديد' : 'Add New Student'}</h3>
              <button onClick={() => setIsAddStudentModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold">{isAr ? 'اسم الطالب *' : 'Student Name *'}</label>
                <input required value={stdName} onChange={(e) => setStdName(e.target.value)} placeholder="مثال: يوسف ممدوح" className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
              </div>
              <div>
                <label className="font-bold">{isAr ? 'المرحلة الدراسية' : 'Stage'}</label>
                <select value={stdStage} onChange={(e) => setStdStage(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1">
                  <option value="رياض أطفال">{isAr ? 'رياض أطفال (KG)' : 'KG'}</option>
                  <option value="ابتدائي">{isAr ? 'ابتدائي' : 'Primary'}</option>
                  <option value="إعدادي">{isAr ? 'إعدادي' : 'Preparatory'}</option>
                  <option value="ثانوي">{isAr ? 'ثانوي' : 'Secondary'}</option>
                  <option value="جامعي">{isAr ? 'جامعي' : 'University'}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold">{isAr ? 'العمر' : 'Age'}</label>
                  <input value={stdAge} onChange={(e) => setStdAge(e.target.value)} placeholder="14" className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
                </div>
                <div>
                  <label className="font-bold">{isAr ? 'الرقم القومي (اختياري)' : 'National ID'}</label>
                  <input value={stdNatId} onChange={(e) => setStdNatId(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold">{isAr ? 'حفظ ملف الطالب' : 'Save Student'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

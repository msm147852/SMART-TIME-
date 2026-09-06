import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Banknote,
  TrendingUp,
  PieChart,
  Trash2,
  Edit,
  Download,
  Camera,
  Check,
  X,
  Home,
  Briefcase,
  Car,
  BookOpen,
  FileText,
  DollarSign,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  User,
  Shield,
  Layers,
  Fuel,
  Wrench,
  Activity,
  BarChart2,
  Printer,
  Eye,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  Language,
  VehicleAccidentRecord,
  StudentProfile,
  StudentExpenseRecord,
} from '../types';
import { translations } from '../services/i18n';
import { ExpensesRepository, VehiclesRepository, StorageAdapter, VaultRepository } from '../services';
import { VehicleCameraModal } from './VehicleCameraModal';
import { ReportPreviewModal } from './ReportPreviewModal';
import { ExpenseEditModal, ExpenseEditItem } from './ExpenseEditModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { IncomeCertificatesView } from './IncomeCertificatesView';

interface ExpensesViewProps {
  language: Language;
  currency: string;
  expenses: Expense[];
  onUpdateExpenses: (expenses: Expense[]) => void;
}

interface VehicleFuelRecord {
  id: string;
  fuelType: string;
  price: number;
  odometer: number;
  dateTime: string;
}

interface VehicleMaintenanceRecord {
  id: string;
  maintenanceType: string;
  description: string;
  supplyName: string;
  supplyPrice: number;
  laborDescription: string;
  laborPrice: number;
  total: number;
  date: string;
}

interface SpecializedExpense {
  id: string;
  section: 'house' | 'work';
  type: string;
  customType?: string;
  amount: number;
  paymentType?: 'supply' | 'labor';
  date: string;
  notes?: string;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  language,
  currency,
  expenses,
  onUpdateExpenses,
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  // Main Tabs: 'house' | 'work' | 'vehicle' | 'education' | 'reports'
  const [activeMainTab, setActiveMainTab] = useState<'house' | 'work' | 'vehicle' | 'education' | 'income' | 'reports'>('house');

  // --- 1. HOUSE EXPENSES STATE ---
  const [houseType, setHouseType] = useState('فطار');
  const [houseCustomType, setHouseCustomType] = useState('');
  const [houseAmount, setHouseAmount] = useState('');
  const [housePaymentType, setHousePaymentType] = useState<'supply' | 'labor'>('supply');
  const [houseDate, setHouseDate] = useState(new Date().toISOString().split('T')[0]);
  const [houseList, setHouseList] = useState<SpecializedExpense[]>(() => {
    return StorageAdapter.getItem<SpecializedExpense[]>('smart_time_house_expenses', [
      { id: 'h1', section: 'house', type: 'فطار', amount: 150, paymentType: 'supply', date: new Date().toISOString().split('T')[0] },
      { id: 'h2', section: 'house', type: 'إصلاحات كهربائية', amount: 450, paymentType: 'labor', date: new Date().toISOString().split('T')[0] },
    ]);
  });

  const houseTypesOptions = [
    isAr ? 'فطار' : 'Breakfast',
    isAr ? 'غداء' : 'Lunch',
    isAr ? 'عشاء' : 'Dinner',
    isAr ? 'إصلاحات كهربائية' : 'Electrical Repairs',
    isAr ? 'إصلاحات دهان' : 'Painting Repairs',
    isAr ? 'إصلاحات سباكة' : 'Plumbing Repairs',
    isAr ? 'شراء أجهزة منزلية' : 'Home Appliances',
    isAr ? 'شراء مفروشات' : 'Furnishing',
    isAr ? 'شراء أخرى (أخرى)' : 'Other (Custom)',
  ];

  // --- 2. WORK EXPENSES STATE ---
  const [workType, setWorkType] = useState(isAr ? 'أدوات مكتبية' : 'Office Supplies');
  const [workAmount, setWorkAmount] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workNotes, setWorkNotes] = useState('');
  const [workList, setWorkList] = useState<SpecializedExpense[]>(() => {
    return StorageAdapter.getItem<SpecializedExpense[]>('smart_time_work_expenses', [
      { id: 'w1', section: 'work', type: isAr ? 'أدوات مكتبية' : 'Office Supplies', amount: 300, date: new Date().toISOString().split('T')[0], notes: 'أوراق طباعة وأقلام' },
    ]);
  });

  const workTypesOptions = [
    isAr ? 'أدوات مكتبية' : 'Office Supplies',
    isAr ? 'صيانة أجهزة العمل' : 'Work Gear Maintenance',
    isAr ? 'اشتراكات برمجيات' : 'Software Subscriptions',
    isAr ? 'ضيافة واجتماعات' : 'Meetings & Hospitality',
    isAr ? 'أخرى' : 'Other',
  ];

  // --- 3. VEHICLE EXPENSES STATE ---
  const [vehicleSubTab, setVehicleSubTab] = useState<'fuel' | 'maintenance' | 'accidents'>('fuel');
  
  // Accidents
  const [accidentList, setAccidentList] = useState<VehicleAccidentRecord[]>(() => {
    return VehiclesRepository.getAccidentRecords();
  });

  // Camera Modal State (تصوير حادث / تصوير عداد كم مع عداد زمني للتصوير)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraModalMode, setCameraModalMode] = useState<'accident' | 'odometer'>('accident');

  const openAccidentCamera = () => {
    setCameraModalMode('accident');
    setIsCameraModalOpen(true);
  };

  const openOdometerCamera = () => {
    setCameraModalMode('odometer');
    setIsCameraModalOpen(true);
  };

  // Report Preview Modal State (معاينة قبل التصدير)
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const [previewPeriod, setPreviewPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [previewSection, setPreviewSection] = useState<'all' | 'house' | 'work' | 'vehicle' | 'education' | 'students'>('all');
  const [previewStudentId, setPreviewStudentId] = useState<string>('');

  const openReportPreview = (
    period: 'day' | 'week' | 'month' | 'all' = 'month',
    section: 'all' | 'house' | 'work' | 'vehicle' | 'education' | 'students' = 'all',
    studentId?: string
  ) => {
    setPreviewPeriod(period);
    setPreviewSection(section);
    if (studentId) {
      setPreviewStudentId(studentId);
    }
    setIsReportPreviewOpen(true);
  };
  
  // Fuel
  const [fuelType, setFuelType] = useState('بنزين 92');
  const [fuelPrice, setFuelPrice] = useState('');
  const [fuelOdometer, setFuelOdometer] = useState('');
  const [fuelDateTime, setFuelDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [fuelList, setFuelList] = useState<VehicleFuelRecord[]>(() => {
    return StorageAdapter.getItem<VehicleFuelRecord[]>('smart_time_vehicle_fuel', [
      { id: 'f1', fuelType: 'بنزين 92', price: 650, odometer: 45200, dateTime: new Date().toISOString().slice(0, 16) },
    ]);
  });
  const [fuelFilter, setFuelFilter] = useState('all');

  // OCR Simulation for Odometer
  const [isScanningOdometer, setIsScanningOdometer] = useState(false);
  const simulateOdometerOCR = () => {
    setIsScanningOdometer(true);
    setTimeout(() => {
      const randomOdom = Math.floor(45000 + Math.random() * 2000);
      setFuelOdometer(randomOdom.toString());
      setIsScanningOdometer(false);
    }, 1200);
  };

  // Maintenance
  const [maintType, setMaintType] = useState('دهان');
  const [maintDesc, setMaintDesc] = useState('');
  const [supplyName, setSupplyName] = useState('');
  const [supplyPrice, setSupplyPrice] = useState('');
  const [laborDesc, setLaborDesc] = useState('');
  const [laborPrice, setLaborPrice] = useState('');
  const [customTotal, setCustomTotal] = useState('');
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintList, setMaintList] = useState<VehicleMaintenanceRecord[]>(() => {
    return StorageAdapter.getItem<VehicleMaintenanceRecord[]>('smart_time_vehicle_maint', [
      { id: 'm1', maintenanceType: 'كهرباء', description: 'تغيير شمعات الإشعال', supplyName: 'بوجيهات أصلية', supplyPrice: 800, laborDescription: 'تركيب وفحص', laborPrice: 200, total: 1000, date: new Date().toISOString().split('T')[0] },
    ]);
  });
  const [maintFilter, setMaintFilter] = useState('all');

  const maintenanceTypesOptions = [
    'دهان', 'سمكرة', 'كهرباء', 'عفشة', 'نظام التبريد', 'نظام التكييف',
    'المحرك', 'الغاز', 'الكاوتش', 'السروجي', 'الزجاج', 'الشكمان', 'الحساسات'
  ];

  // Calculated Maintenance Total
  const calculatedMaintTotal = (parseFloat(supplyPrice) || 0) + (parseFloat(laborPrice) || 0);

  // --- 4. EDUCATIONAL EXPENSES STATE ---
  const [students, setStudents] = useState<StudentProfile[]>(() => {
    const defaultStudents: StudentProfile[] = [
      { id: 'std_salma', name: isAr ? 'سلمى ممدوح سعد' : 'Salma Mamdouh Saad', nationalId: '31406150102468', age: '14', stage: isAr ? 'إعدادي' : 'Preparatory' },
      { id: 'std_1', name: isAr ? 'يوسف محمد' : 'Youssef Mohamed', nationalId: '31205120102034', age: '16', stage: isAr ? 'ثانوي' : 'Secondary' },
      { id: 'std_2', name: isAr ? 'فاطمة محمد' : 'Fatma Mohamed', nationalId: '31808220105068', age: '11', stage: isAr ? 'ابتدائي' : 'Primary' },
    ];
    const stored = StorageAdapter.getItem<StudentProfile[]>('smart_time_students', defaultStudents);
    if (!stored || stored.length === 0) return defaultStudents;
    const hasSalma = stored.some(s => s.name.includes('سلمى'));
    if (!hasSalma) {
      const updated = [
        { id: 'std_salma', name: isAr ? 'سلمى ممدوح سعد' : 'Salma Mamdouh Saad', nationalId: '31406150102468', age: '14', stage: isAr ? 'إعدادي' : 'Preparatory' },
        ...stored,
      ];
      StorageAdapter.setItem('smart_time_students', updated);
      return updated;
    }
    return stored;
  });
  const [activeStudentId, setActiveStudentId] = useState<string | null>(() => {
    return 'std_salma';
  });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStdName, setNewStdName] = useState('');
  const [newStdNatId, setNewStdNatId] = useState('');
  const [newStdAge, setNewStdAge] = useState('');
  const [newStdStage, setNewStdStage] = useState(isAr ? 'إعدادي' : 'Preparatory');

  const [studentSubTab, setStudentSubTab] = useState<'lessons' | 'personal' | 'transport' | 'school' | 'books'>('lessons');
  const [studentExpenseTitle, setStudentExpenseTitle] = useState('');
  const [studentExpenseAmount, setStudentExpenseAmount] = useState('');
  const [studentExpenseDate, setStudentExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const [studentExpensesList, setStudentExpensesList] = useState<StudentExpenseRecord[]>(() => {
    const today = new Date().toISOString().split('T')[0];
    const defaultExpenses: StudentExpenseRecord[] = [
      { id: 'se_s1', studentId: 'std_salma', subCategory: 'lessons', title: isAr ? 'دروس الرياضيات واللغات' : 'Math & Languages Tutoring', amount: 850, date: today },
      { id: 'se_s2', studentId: 'std_salma', subCategory: 'school', title: isAr ? 'قسط المصروفات المدرسية' : 'School Tuition Installment', amount: 3200, date: today },
      { id: 'se_s3', studentId: 'std_salma', subCategory: 'books', title: isAr ? 'كتب ومذكرات خارجية' : 'Textbooks & Study Guides', amount: 450, date: today },
      { id: 'se_s4', studentId: 'std_salma', subCategory: 'transport', title: isAr ? 'اشتراك باص المدرسة الشهري' : 'School Bus Monthly Fee', amount: 600, date: today },
      { id: 'se_s5', studentId: 'std_salma', subCategory: 'personal', title: isAr ? 'مصروف شخصي شهري' : 'Personal Allowance', amount: 300, date: today },
      { id: 'se1', studentId: 'std_1', subCategory: 'lessons', title: 'دروس الرياضيات والفيزياء', amount: 900, date: today },
      { id: 'se2', studentId: 'std_1', subCategory: 'school', title: 'مصاريف المدرسة الفصلية', amount: 3500, date: today },
    ];
    const stored = StorageAdapter.getItem<StudentExpenseRecord[]>('smart_time_student_expenses', defaultExpenses);
    if (!stored || stored.length === 0) return defaultExpenses;
    const hasSalmaExp = stored.some(e => e.studentId === 'std_salma');
    if (!hasSalmaExp) {
      const updated = [
        { id: 'se_s1', studentId: 'std_salma', subCategory: 'lessons', title: isAr ? 'دروس الرياضيات واللغات' : 'Math & Languages Tutoring', amount: 850, date: today },
        { id: 'se_s2', studentId: 'std_salma', subCategory: 'school', title: isAr ? 'قسط المصروفات المدرسية' : 'School Tuition Installment', amount: 3200, date: today },
        { id: 'se_s3', studentId: 'std_salma', subCategory: 'books', title: isAr ? 'كتب ومذكرات خارجية' : 'Textbooks & Study Guides', amount: 450, date: today },
        { id: 'se_s4', studentId: 'std_salma', subCategory: 'transport', title: isAr ? 'اشتراك باص المدرسة الشهري' : 'School Bus Monthly Fee', amount: 600, date: today },
        { id: 'se_s5', studentId: 'std_salma', subCategory: 'personal', title: isAr ? 'مصروف شخصي شهري' : 'Personal Allowance', amount: 300, date: today },
        ...stored,
      ];
      StorageAdapter.setItem('smart_time_student_expenses', updated);
      return updated;
    }
    return stored;
  });

  // Report states
  const [reportSubTab, setReportSubTab] = useState<'master' | 'sections' | 'students'>('master');
  const [reportSectionChoice, setReportSectionChoice] = useState<'house' | 'work' | 'vehicle' | 'education'>('house');
  const [reportStudentChoice, setReportStudentChoice] = useState<string>('std_salma');
  const [studentReportPeriod, setStudentReportPeriod] = useState<'day' | 'week' | 'month' | 'all'>('all');
  const [studentReportToast, setStudentReportToast] = useState<string | null>(null);

  // --- PERSISTENCE HELPERS ---
  const saveHouse = (list: SpecializedExpense[]) => {
    setHouseList(list);
    StorageAdapter.setItem('smart_time_house_expenses', list);
  };
  const saveWork = (list: SpecializedExpense[]) => {
    setWorkList(list);
    StorageAdapter.setItem('smart_time_work_expenses', list);
  };
  const saveFuel = (list: VehicleFuelRecord[]) => {
    setFuelList(list);
    StorageAdapter.setItem('smart_time_vehicle_fuel', list);
  };
  const saveMaint = (list: VehicleMaintenanceRecord[]) => {
    setMaintList(list);
    StorageAdapter.setItem('smart_time_vehicle_maint', list);
  };
  const saveAccidents = (list: VehicleAccidentRecord[]) => {
    setAccidentList(list);
    VehiclesRepository.saveAccidentRecords(list);
  };
  const saveStudents = (list: StudentProfile[]) => {
    setStudents(list);
    StorageAdapter.setItem('smart_time_students', list);
  };
  const saveStudentExpenses = (list: StudentExpenseRecord[]) => {
    setStudentExpensesList(list);
    StorageAdapter.setItem('smart_time_student_expenses', list);
  };

  // --- EDIT & DELETE MODAL STATES & HANDLERS ---
  const [editingItem, setEditingItem] = useState<ExpenseEditItem | null>(null);
  const [studentEditInitialTab, setStudentEditInitialTab] = useState<'profile' | 'addExpense' | 'expensesList'>('profile');
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'house' | 'work' | 'fuel' | 'maintenance' | 'accident' | 'student' | 'studentExpense';
    id: string;
    name: string;
  } | null>(null);

  const handleOpenStudentModal = (
    student: StudentProfile,
    initialTab: 'profile' | 'addExpense' | 'expensesList' = 'profile'
  ) => {
    setStudentEditInitialTab(initialTab);
    setEditingItem({
      kind: 'student',
      item: student,
    });
  };

  const handleAddStudentExpenseFromModal = (newExp: Omit<StudentExpenseRecord, 'id'>) => {
    const item: StudentExpenseRecord = {
      id: 'se_' + Date.now(),
      ...newExp,
    };
    saveStudentExpenses([item, ...studentExpensesList]);
  };

  const handleUpdateStudentExpenseFromModal = (updated: StudentExpenseRecord) => {
    saveStudentExpenses(studentExpensesList.map((x) => (x.id === updated.id ? updated : x)));
  };

  const handleDeleteStudentExpenseFromModal = (id: string) => {
    saveStudentExpenses(studentExpensesList.filter((x) => x.id !== id));
  };

  const handleSaveEditedItem = (updated: ExpenseEditItem) => {
    switch (updated.kind) {
      case 'house':
        saveHouse(houseList.map((item) => (item.id === updated.item.id ? updated.item : item)));
        break;
      case 'work':
        saveWork(workList.map((item) => (item.id === updated.item.id ? updated.item : item)));
        break;
      case 'fuel':
        saveFuel(fuelList.map((item) => (item.id === updated.item.id ? updated.item : item)));
        break;
      case 'maintenance':
        saveMaint(maintList.map((item) => (item.id === updated.item.id ? updated.item : item)));
        break;
      case 'accident':
        saveAccidents(accidentList.map((item) => (item.id === updated.item.id ? updated.item : item)));
        break;
      case 'student':
        saveStudents(students.map((item) => (item.id === updated.item.id ? updated.item : item)));
        break;
      case 'studentExpense':
        saveStudentExpenses(
          studentExpensesList.map((item) => (item.id === updated.item.id ? updated.item : item))
        );
        break;
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    switch (deleteTarget.type) {
      case 'house':
        saveHouse(houseList.filter((x) => x.id !== deleteTarget.id));
        break;
      case 'work':
        saveWork(workList.filter((x) => x.id !== deleteTarget.id));
        break;
      case 'fuel':
        saveFuel(fuelList.filter((x) => x.id !== deleteTarget.id));
        break;
      case 'maintenance':
        saveMaint(maintList.filter((x) => x.id !== deleteTarget.id));
        break;
      case 'accident':
        saveAccidents(accidentList.filter((x) => x.id !== deleteTarget.id));
        break;
      case 'student':
        saveStudents(students.filter((x) => x.id !== deleteTarget.id));
        saveStudentExpenses(studentExpensesList.filter((x) => x.studentId !== deleteTarget.id));
        if (activeStudentId === deleteTarget.id) {
          const remaining = students.filter((x) => x.id !== deleteTarget.id);
          setActiveStudentId(remaining[0]?.id || null);
        }
        break;
      case 'studentExpense':
        saveStudentExpenses(studentExpensesList.filter((x) => x.id !== deleteTarget.id));
        break;
    }

    setDeleteTarget(null);
  };

  // Handlers for House
  const handleAddHouseExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(houseAmount);
    if (isNaN(amt) || amt <= 0) return;
    const finalType = houseType.includes('أخرى') && houseCustomType ? houseCustomType : houseType;
    const newItem: SpecializedExpense = {
      id: 'h_' + Date.now(),
      section: 'house',
      type: finalType,
      amount: amt,
      paymentType: housePaymentType,
      date: houseDate,
    };
    saveHouse([newItem, ...houseList]);
    setHouseAmount('');
    setHouseCustomType('');
  };

  // Handlers for Work
  const handleAddWorkExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(workAmount);
    if (isNaN(amt) || amt <= 0) return;
    const newItem: SpecializedExpense = {
      id: 'w_' + Date.now(),
      section: 'work',
      type: workType,
      amount: amt,
      date: workDate,
      notes: workNotes,
    };
    saveWork([newItem, ...workList]);
    setWorkAmount('');
    setWorkNotes('');
  };

  // Handlers for Fuel
  const handleAddFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(fuelPrice);
    const odomNum = parseInt(fuelOdometer);
    if (isNaN(priceNum) || priceNum <= 0) return;
    const newFuel: VehicleFuelRecord = {
      id: 'f_' + Date.now(),
      fuelType,
      price: priceNum,
      odometer: isNaN(odomNum) ? 0 : odomNum,
      dateTime: fuelDateTime,
    };
    saveFuel([newFuel, ...fuelList]);
    setFuelPrice('');
    setFuelOdometer('');
  };

  // Handlers for Maintenance
  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const supP = parseFloat(supplyPrice) || 0;
    const labP = parseFloat(laborPrice) || 0;
    const finalTotal = customTotal !== '' ? parseFloat(customTotal) || (supP + labP) : (supP + labP);
    if (finalTotal <= 0) return;

    const newMaint: VehicleMaintenanceRecord = {
      id: 'm_' + Date.now(),
      maintenanceType: maintType,
      description: maintDesc,
      supplyName,
      supplyPrice: supP,
      laborDescription: laborDesc,
      laborPrice: labP,
      total: finalTotal,
      date: maintDate,
    };
    saveMaint([newMaint, ...maintList]);
    setMaintDesc('');
    setSupplyName('');
    setSupplyPrice('');
    setLaborDesc('');
    setLaborPrice('');
    setCustomTotal('');
  };

  // Handlers for Students & Student Expenses
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStdName.trim()) return;
    const newStd: StudentProfile = {
      id: 'std_' + Date.now(),
      name: newStdName,
      nationalId: newStdNatId || 'N/A',
      age: newStdAge || '0',
      stage: newStdStage,
    };
    const updated = [...students, newStd];
    saveStudents(updated);
    setActiveStudentId(newStd.id);
    setNewStdName('');
    setNewStdNatId('');
    setNewStdAge('');
    setShowAddStudentModal(false);
  };

  const handleAddStudentExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentId || !studentExpenseTitle.trim()) return;
    const amt = parseFloat(studentExpenseAmount);
    if (isNaN(amt) || amt <= 0) return;

    const newRec: StudentExpenseRecord = {
      id: 'se_' + Date.now(),
      studentId: activeStudentId,
      subCategory: studentSubTab,
      title: studentExpenseTitle,
      amount: amt,
      date: studentExpenseDate,
    };
    saveStudentExpenses([newRec, ...studentExpensesList]);
    setStudentExpenseTitle('');
    setStudentExpenseAmount('');
  };

  // Export helper
  const exportDataCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Totals Calculation
  const totalHouseSpent = houseList.reduce((s, x) => s + x.amount, 0);
  const totalWorkSpent = workList.reduce((s, x) => s + x.amount, 0);
  const totalFuelSpent = fuelList.reduce((s, x) => s + x.price, 0);
  const totalMaintSpent = maintList.reduce((s, x) => s + x.total, 0);
  const totalVehicleSpent = totalFuelSpent + totalMaintSpent;
  const totalEduSpent = studentExpensesList.reduce((s, x) => s + x.amount, 0);
  const grandTotal = totalHouseSpent + totalWorkSpent + totalVehicleSpent + totalEduSpent;

  return (
    <div className="space-y-6" id="expenses-gold-module" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-accent-500/40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 border border-accent-500/50 text-accent-500 flex items-center justify-center font-bold shadow-md">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              {isAr ? 'إدارة المصروفات الذكية (Smart Time Gold)' : 'Smart Expenses Management'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr ? 'المنزل، العمل، المركبات، التعليم، والتقارير المالية المتقدمة' : 'House, Work, Vehicles, Education & Financial Reports'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-accent-500/10 border border-accent-500/30 text-end">
            <span className="text-[10px] text-accent-300 block">{isAr ? 'الإجمالي العام' : 'Grand Total'}</span>
            <span className="text-base sm:text-lg font-black text-accent-500 font-mono-num">
              {grandTotal.toLocaleString()} {currency}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[#161616] p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'house', label: isAr ? 'مصروفات المنزل' : 'House', icon: Home },
          { id: 'work', label: isAr ? 'مصروفات العمل' : 'Work', icon: Briefcase },
          { id: 'vehicle', label: isAr ? 'المركبة' : 'Vehicle', icon: Car },
          { id: 'education', label: isAr ? 'التعليم' : 'Education', icon: BookOpen },
          { id: 'income', label: isAr ? 'الدخل والشهادات' : 'Income & Certificates', icon: TrendingUp },
          { id: 'reports', label: isAr ? 'التقارير والتحليلات' : 'Reports', icon: BarChart2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-accent-500 to-accent-700 text-slate-950 shadow-lg shadow-accent-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= 1. HOUSE EXPENSES TAB ================= */}
      {activeMainTab === 'house' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <div className="lg:col-span-5 bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Home className="w-4 h-4 text-accent-500" />
                <span>{isAr ? 'تسجيل مصروف منزلي جديد' : 'New House Expense'}</span>
              </h3>

              <form onSubmit={handleAddHouseExpense} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {isAr ? 'نوع المصروف' : 'Expense Type'} *
                  </label>
                  <select
                    value={houseType}
                    onChange={(e) => setHouseType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-accent-500"
                  >
                    {houseTypesOptions.map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {houseType.includes('أخرى') && (
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isAr ? 'وصف المصروف الآخر' : 'Custom Expense Description'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={houseCustomType}
                      onChange={(e) => setHouseCustomType(e.target.value)}
                      placeholder={isAr ? 'اكتب الوصف هنا...' : 'Type description here...'}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-accent-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isAr ? 'المبلغ' : 'Amount'} ({currency}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={houseAmount}
                      onChange={(e) => setHouseAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono-num font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isAr ? 'التاريخ' : 'Date'} *
                    </label>
                    <input
                      type="date"
                      required
                      value={houseDate}
                      onChange={(e) => setHouseDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {isAr ? 'طبيعة الدفع' : 'Payment Nature'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'supply', label: isAr ? '📦 توريد (شراء مواد/قطع)' : 'Supply' },
                      { id: 'labor', label: isAr ? '🛠️ مصنعية (أجور وعمل)' : 'Labor' },
                    ].map((pt) => (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setHousePaymentType(pt.id as any)}
                        className={`p-2 rounded-xl font-bold border transition-all text-center ${
                          housePaymentType === pt.id
                            ? 'bg-accent-500 text-slate-950 border-accent-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 hover:from-accent-600 hover:to-accent-800 text-slate-950 font-extrabold text-xs shadow-lg shadow-accent-500/20 transition-all active:scale-95"
                  >
                    {isAr ? 'حفظ المصروف المنزلي' : 'Save House Expense'}
                  </button>
                </div>
              </form>
            </div>

            {/* List & Total */}
            <div className="lg:col-span-7 bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-accent-500" />
                    <span>{isAr ? 'سجل مصروفات المنزل' : 'House Expenses Record'}</span>
                  </h3>
                  <span className="text-xs font-bold font-mono-num text-accent-500">
                    {isAr ? 'الإجمالي:' : 'Total:'} {totalHouseSpent.toLocaleString()} {currency}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {houseList.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      {isAr ? 'لا توجد مصروفات منزلية مسجلة' : 'No house expenses recorded'}
                    </div>
                  ) : (
                    houseList.map((item) => (
                      <div key={item.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-500 flex items-center justify-center font-bold">
                            🏠
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">{item.type}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{item.date}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold ${item.paymentType === 'supply' ? 'bg-blue-500/10 text-blue-400' : 'bg-accent-500/10 text-accent-300'}`}>
                                {item.paymentType === 'supply' ? (isAr ? 'توريد' : 'Supply') : (isAr ? 'مصنعية' : 'Labor')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-accent-500 font-mono-num">
                            -{item.amount.toLocaleString()} {currency}
                          </span>
                          <button
                            onClick={() => setEditingItem({ kind: 'house', item })}
                            title={isAr ? 'تعديل المصروف' : 'Edit Expense'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-accent-500 hover:bg-slate-800 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: 'house',
                                id: item.id,
                                name: `${item.type} (${item.amount} ${currency})`,
                              })
                            }
                            title={isAr ? 'حذف المصروف' : 'Delete Expense'}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => exportDataCSV('house_expenses', ['ID', 'Type', 'Amount', 'PaymentType', 'Date'], houseList.map(x => [x.id, x.type, x.amount, x.paymentType || '', x.date]))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-accent-500 font-bold text-xs border border-accent-500/30"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تصدير السجل (CSV)' : 'Export CSV'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. WORK EXPENSES TAB ================= */}
      {activeMainTab === 'work' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <div className="lg:col-span-5 bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Briefcase className="w-4 h-4 text-accent-500" />
                <span>{isAr ? 'تسجيل مصروف عمل جديد' : 'New Work Expense'}</span>
              </h3>

              <form onSubmit={handleAddWorkExpense} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {isAr ? 'نوع المصروف' : 'Expense Type'} *
                  </label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-accent-500"
                  >
                    {workTypesOptions.map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isAr ? 'المبلغ' : 'Amount'} ({currency}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={workAmount}
                      onChange={(e) => setWorkAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono-num font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isAr ? 'التاريخ' : 'Date'} *
                    </label>
                    <input
                      type="date"
                      required
                      value={workDate}
                      onChange={(e) => setWorkDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {isAr ? 'ملاحظات اختيارية' : 'Optional Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={workNotes}
                    onChange={(e) => setWorkNotes(e.target.value)}
                    placeholder={isAr ? 'تفاصيل إضافية...' : 'Additional details...'}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 hover:from-accent-600 hover:to-accent-800 text-slate-950 font-extrabold text-xs shadow-lg shadow-accent-500/20 transition-all active:scale-95"
                  >
                    {isAr ? 'حفظ مصروف العمل' : 'Save Work Expense'}
                  </button>
                </div>
              </form>
            </div>

            {/* List & Total */}
            <div className="lg:col-span-7 bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-accent-500" />
                    <span>{isAr ? 'سجل مصروفات العمل' : 'Work Expenses Record'}</span>
                  </h3>
                  <span className="text-xs font-bold font-mono-num text-accent-500">
                    {isAr ? 'الإجمالي:' : 'Total:'} {totalWorkSpent.toLocaleString()} {currency}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {workList.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      {isAr ? 'لا توجد مصروفات عمل مسجلة' : 'No work expenses recorded'}
                    </div>
                  ) : (
                    workList.map((item) => (
                      <div key={item.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
                            💼
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">{item.type}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{item.date}</span>
                              {item.notes && <span>• {item.notes}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-accent-500 font-mono-num">
                            -{item.amount.toLocaleString()} {currency}
                          </span>
                          <button
                            onClick={() => setEditingItem({ kind: 'work', item })}
                            title={isAr ? 'تعديل المصروف' : 'Edit Expense'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-accent-500 hover:bg-slate-800 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: 'work',
                                id: item.id,
                                name: `${item.type} (${item.amount} ${currency})`,
                              })
                            }
                            title={isAr ? 'حذف المصروف' : 'Delete Expense'}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => exportDataCSV('work_expenses', ['ID', 'Type', 'Amount', 'Date', 'Notes'], workList.map(x => [x.id, x.type, x.amount, x.date, x.notes || '']))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-accent-500 font-bold text-xs border border-accent-500/30"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تصدير السجل (CSV)' : 'Export CSV'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. VEHICLE EXPENSES TAB ================= */}
      {activeMainTab === 'vehicle' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub-tabs & Camera Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-[#161616] p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto">
              <button
                onClick={() => setVehicleSubTab('fuel')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  vehicleSubTab === 'fuel' ? 'bg-accent-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Fuel className="w-3.5 h-3.5" />
                <span>{isAr ? 'التموين (وقود)' : 'Fuel'}</span>
              </button>
              <button
                onClick={() => setVehicleSubTab('maintenance')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  vehicleSubTab === 'maintenance' ? 'bg-accent-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{isAr ? 'الصيانة والإصلاح' : 'Maintenance'}</span>
              </button>
              <button
                onClick={() => setVehicleSubTab('accidents')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  vehicleSubTab === 'accidents' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isAr ? '🚨 سجل الحوادث والتصوير' : 'Accidents & Camera'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={openAccidentCamera}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-extrabold text-xs border border-red-500/40 shadow-sm active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>{isAr ? '🚨 تصوير حادث (مؤقت)' : 'Accident Camera'}</span>
              </button>
              <button
                type="button"
                onClick={openOdometerCamera}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-500 font-extrabold text-xs border border-accent-500/40 shadow-sm active:scale-95 transition-all"
              >
                <Activity className="w-4 h-4" />
                <span>{isAr ? '📸 تصوير العداد' : 'Odometer Scan'}</span>
              </button>
            </div>
          </div>

          {/* A) FUEL SUB-TAB */}
          {vehicleSubTab === 'fuel' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl space-y-4">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Fuel className="w-4 h-4 text-accent-500" />
                  <span>{isAr ? 'تسجيل عملية تموين وقود' : 'New Fuel Entry'}</span>
                </h3>

                <form onSubmit={handleAddFuel} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isAr ? 'نوع الوقود' : 'Fuel Type'} *
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-accent-500"
                    >
                      {['بنزين 80', 'بنزين 92', 'بنزين 95', 'سولار', 'غاز طبيعي'].map((f, i) => (
                        <option key={i} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        {isAr ? 'سعر التموين' : 'Price'} ({currency}) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={fuelPrice}
                        onChange={(e) => setFuelPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono-num font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        {isAr ? 'تاريخ ووقت التموين' : 'Date & Time'} *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={fuelDateTime}
                        onChange={(e) => setFuelDateTime(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-300">
                        {isAr ? 'رقم العداد (Odometer)' : 'Odometer Reading'}
                      </label>
                      <button
                        type="button"
                        onClick={openOdometerCamera}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-500/20 text-accent-500 text-[10px] font-bold border border-accent-500/40 hover:bg-accent-500/30 transition-all active:scale-95"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{isAr ? 'تصوير العداد بالكاميرا (مؤقت)' : 'Camera Odometer'}</span>
                      </button>
                    </div>
                    <input
                      type="number"
                      value={fuelOdometer}
                      onChange={(e) => setFuelOdometer(e.target.value)}
                      placeholder="e.g. 45200"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono-num font-bold"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 text-slate-950 font-extrabold text-xs shadow-lg shadow-accent-500/20 transition-all active:scale-95"
                    >
                      {isAr ? 'حفظ عملية التموين' : 'Save Fuel Record'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-7 bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-accent-500" />
                      <span>{isAr ? 'سجل التموين' : 'Fuel Records'}</span>
                    </h3>
                    <span className="text-xs font-bold font-mono-num text-accent-500">
                      {isAr ? 'إجمالي الوقود:' : 'Total Fuel:'} {totalFuelSpent.toLocaleString()} {currency}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {fuelList.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        {isAr ? 'لا توجد عمليات تموين مسجلة' : 'No fuel records found'}
                      </div>
                    ) : (
                      fuelList.map((f) => (
                        <div key={f.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center font-bold">
                              ⛽
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white">{f.fuelType}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{f.dateTime.replace('T', ' ')}</span>
                                {f.odometer > 0 && <span>• العداد: {f.odometer} كم</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-accent-500 font-mono-num">
                              -{f.price.toLocaleString()} {currency}
                            </span>
                            <button
                              onClick={() => setEditingItem({ kind: 'fuel', item: f })}
                              title={isAr ? 'تعديل التموين' : 'Edit Fuel Record'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-accent-500 hover:bg-slate-800 transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'fuel',
                                  id: f.id,
                                  name: `${f.fuelType} (${f.price} ${currency})`,
                                })
                              }
                              title={isAr ? 'حذف سجل التموين' : 'Delete Fuel Record'}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => exportDataCSV('vehicle_fuel', ['ID', 'FuelType', 'Price', 'Odometer', 'DateTime'], fuelList.map(x => [x.id, x.fuelType, x.price, x.odometer, x.dateTime]))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-accent-500 font-bold text-xs border border-accent-500/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'تصدير (CSV / Excel)' : 'Export CSV'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* B) MAINTENANCE SUB-TAB */}
          {vehicleSubTab === 'maintenance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl space-y-4">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Wrench className="w-4 h-4 text-accent-500" />
                  <span>{isAr ? 'تسجيل صيانة مركبة جديدة' : 'New Maintenance Entry'}</span>
                </h3>

                <form onSubmit={handleAddMaintenance} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isAr ? 'نوع الصيانة' : 'Maintenance Type'} *
                    </label>
                    <select
                      value={maintType}
                      onChange={(e) => setMaintType(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-accent-500"
                    >
                      {maintenanceTypesOptions.map((m, i) => (
                        <option key={i} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {isAr ? 'وصف تفصيلي للصيانة' : 'Detailed Description'}
                    </label>
                    <input
                      type="text"
                      value={maintDesc}
                      onChange={(e) => setMaintDesc(e.target.value)}
                      placeholder={isAr ? 'مثال: تغيير طقم دبرياج...' : 'e.g. clutch replacement...'}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>

                  {/* Supply & Labor Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div>
                      <label className="block font-bold text-slate-300 text-[11px] mb-1">
                        {isAr ? 'اسم القطعة (توريد)' : 'Supply Name'}
                      </label>
                      <input
                        type="text"
                        value={supplyName}
                        onChange={(e) => setSupplyName(e.target.value)}
                        placeholder="قطعة غيار..."
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 text-[11px] mb-1">
                        {isAr ? 'سعر التوريد' : 'Supply Price'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={supplyPrice}
                        onChange={(e) => setSupplyPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono-num text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div>
                      <label className="block font-bold text-slate-300 text-[11px] mb-1">
                        {isAr ? 'وصف العمل (مصنعية)' : 'Labor Description'}
                      </label>
                      <input
                        type="text"
                        value={laborDesc}
                        onChange={(e) => setLaborDesc(e.target.value)}
                        placeholder="أجور ميكانيكي..."
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 text-[11px] mb-1">
                        {isAr ? 'سعر المصنعية' : 'Labor Price'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={laborPrice}
                        onChange={(e) => setLaborPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono-num text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        {isAr ? 'إجمالي الصيانة (محسوب/تعديل)' : 'Total Maintenance'} *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={customTotal !== '' ? customTotal : calculatedMaintTotal}
                        onChange={(e) => setCustomTotal(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-accent-500/50 text-accent-500 font-mono-num font-bold text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        {isAr ? 'التاريخ' : 'Date'} *
                      </label>
                      <input
                        type="date"
                        required
                        value={maintDate}
                        onChange={(e) => setMaintDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 text-slate-950 font-extrabold text-xs shadow-lg shadow-accent-500/20 transition-all active:scale-95"
                    >
                      {isAr ? 'حفظ سجل الصيانة' : 'Save Maintenance Record'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-7 bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-accent-500" />
                      <span>{isAr ? 'سجل الصيانة والإصلاح' : 'Maintenance Records'}</span>
                    </h3>
                    <span className="text-xs font-bold font-mono-num text-accent-500">
                      {isAr ? 'إجمالي الصيانة:' : 'Total Maint:'} {totalMaintSpent.toLocaleString()} {currency}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {maintList.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        {isAr ? 'لا توجد سجلات صيانة' : 'No maintenance records found'}
                      </div>
                    ) : (
                      maintList.map((m) => (
                        <div key={m.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                              🔧
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white">{m.maintenanceType} - {m.description || 'صيانة عامة'}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{m.date}</span>
                                {m.supplyName && <span>• توريد: {m.supplyName} ({m.supplyPrice} {currency})</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-accent-500 font-mono-num">
                              -{m.total.toLocaleString()} {currency}
                            </span>
                            <button
                              onClick={() => setEditingItem({ kind: 'maintenance', item: m })}
                              title={isAr ? 'تعديل الصيانة' : 'Edit Maintenance'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-accent-500 hover:bg-slate-800 transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'maintenance',
                                  id: m.id,
                                  name: `${m.maintenanceType}: ${m.description || 'صيانة'} (${m.total} ${currency})`,
                                })
                              }
                              title={isAr ? 'حذف سجل الصيانة' : 'Delete Maintenance'}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => exportDataCSV('vehicle_maintenance', ['ID', 'Type', 'Description', 'Supply', 'SupplyPrice', 'Labor', 'LaborPrice', 'Total', 'Date'], maintList.map(x => [x.id, x.maintenanceType, x.description, x.supplyName, x.supplyPrice, x.laborDescription, x.laborPrice, x.total, x.date]))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-accent-500 font-bold text-xs border border-accent-500/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'تصدير كامل (PDF / Excel / CSV)' : 'Export All Formats'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* C) ACCIDENTS SUB-TAB */}
          {vehicleSubTab === 'accidents' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Banner & Quick Actions */}
              <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-accent-950/30 p-6 rounded-3xl border border-red-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-start">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-black border border-red-500/40">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isAr ? 'توثيق وتصوير الحوادث الميدانية مع مؤقت زمني' : 'Field Accident Documentation & Timer'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {isAr ? 'سجل وتوثيق حوادث المركبة' : 'Vehicle Accident Records'}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl">
                    {isAr
                      ? 'التقاط صور الحوادث فورياً بالكاميرا أو بعداد تنازلي (3 / 5 / 10 ثواني)، مع حفظ تلقائي في الخزنة الرقمية المشفرة وتوثيق الأضرار والموقع والتكاليف التقديرية.'
                      : 'Capture accident photos directly with countdown timer (3/5/10s), auto-saved in the digital vault with damage estimations and notes.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={openAccidentCamera}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-red-900/30 border border-red-400/40 active:scale-95 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    <span>{isAr ? '🚨 تصوير حادث (مع عداد زمني)' : '🚨 Capture Accident (Timer)'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const newAcc: VehicleAccidentRecord = {
                        id: 'acc_' + Date.now(),
                        title: isAr ? 'توثيق حادث جديد' : 'New Accident',
                        photoUrl: '',
                        date: new Date().toISOString().slice(0, 10),
                        time: new Date().toTimeString().slice(0, 5),
                        estimatedDamage: 0,
                        savedToVault: true,
                        createdAt: new Date().toISOString(),
                      };
                      setEditingItem({ kind: 'accident', item: newAcc });
                    }}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent-500/15 hover:bg-accent-500/25 text-accent-500 font-bold text-xs sm:text-sm border border-accent-500/40 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? '➕ تسجيل حادث يدوياً' : 'Add Accident Manually'}</span>
                  </button>
                  <button
                    onClick={openOdometerCamera}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-accent-500 font-bold text-xs sm:text-sm border border-accent-500/40 active:scale-95 transition-all"
                  >
                    <Activity className="w-4 h-4" />
                    <span>{isAr ? '📸 تصوير العداد (OCR)' : '📸 Scan Odometer'}</span>
                  </button>
                </div>
              </div>

              {/* Accident Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-red-500/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-black">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{isAr ? 'إجمالي الحوادث المسجلة' : 'Total Accidents'}</span>
                    <span className="text-xl font-black text-white font-mono-num">{accidentList.length}</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-accent-500/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-500/10 text-accent-400 flex items-center justify-center font-black">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{isAr ? 'إجمالي التلفيات التقديرية' : 'Est. Damage Total'}</span>
                    <span className="text-xl font-black text-accent-500 font-mono-num">
                      {accidentList.reduce((sum, a) => sum + (a.estimatedDamage || 0), 0).toLocaleString()} {currency}
                    </span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-emerald-500/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{isAr ? 'محفوظ بالخزنة الرقمية' : 'Saved in Vault'}</span>
                    <span className="text-xl font-black text-emerald-400 font-mono-num">
                      {accidentList.filter(a => a.savedToVault).length} {isAr ? 'ملف آمن' : 'Files'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accidents List / Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent-500" />
                    <span>{isAr ? 'سجلات الحوادث الموثقة بالصور' : 'Documented Accident Records'}</span>
                  </h4>
                  {accidentList.length > 0 && (
                    <button
                      onClick={() => openReportPreview('all', 'vehicle')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-500/10 hover:bg-accent-500/20 text-accent-500 font-bold text-xs border border-accent-500/30 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? 'معاينة تقرير الحوادث والمركبة' : 'Preview Vehicle Report'}</span>
                    </button>
                  )}
                </div>

                {accidentList.length === 0 ? (
                  <div className="bg-[#1a1a1a] p-10 rounded-3xl border border-dashed border-slate-800 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-base">
                        {isAr ? 'لا توجد حوادث مسجلة (الحمد لله)' : 'No accident records found'}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {isAr
                          ? 'يمكنك استخدام زر الكاميرا أدناه لتجربة أو توثيق أي واقعة أو تصوير خدوش وتلفيات السيارة مع عداد زمني للتصوير وحفظها في الخزنة الرقمية.'
                          : 'Use the camera button to test or document any incident with countdown timer and vault storage.'}
                      </p>
                    </div>
                    <button
                      onClick={openAccidentCamera}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-900/40"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isAr ? 'فتح الكاميرا والتقاط حادث الآن' : 'Open Camera & Capture Now'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {accidentList.map((acc) => (
                      <div
                        key={acc.id}
                        className="bg-[#1a1a1a] rounded-3xl border border-slate-800 hover:border-red-500/40 transition-all shadow-xl overflow-hidden flex flex-col justify-between"
                      >
                        {/* Image Preview Container */}
                        <div className="relative h-48 bg-slate-950 border-b border-slate-800 group overflow-hidden">
                          {acc.photoDataUrl ? (
                            <img
                              src={acc.photoDataUrl}
                              alt={acc.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                              <Camera className="w-8 h-8 mb-1" />
                              <span className="text-[11px]">{isAr ? 'لا توجد صورة' : 'No photo'}</span>
                            </div>
                          )}
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            {acc.savedToVault && (
                              <span className="px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{isAr ? 'محفوظ بالخزنة' : 'Vault'}</span>
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg text-slate-300 text-[10px] font-mono">
                            {acc.dateTime}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <h5 className="font-extrabold text-sm text-white line-clamp-1">
                              {acc.title}
                            </h5>
                            {acc.location && (
                              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                <span className="text-accent-500">📍</span>
                                <span className="line-clamp-1">{acc.location}</span>
                              </div>
                            )}
                            {acc.notes && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                                {acc.notes}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-500 block">{isAr ? 'التلفيات المقدرة' : 'Est. Damage'}</span>
                              <span className="text-sm font-black text-rose-400 font-mono-num">
                                {acc.estimatedDamage ? `${acc.estimatedDamage.toLocaleString()} ${currency}` : (isAr ? 'غير محدد' : 'N/A')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setVehicleSubTab('maintenance');
                                  setMaintType('سمكرة');
                                  setMaintDesc(`إصلاح حادث: ${acc.title}`);
                                  setCustomTotal(acc.estimatedDamage ? acc.estimatedDamage.toString() : '');
                                }}
                                title={isAr ? 'إضافة كبند صيانة' : 'Add as maintenance'}
                                className="px-2 py-1.5 rounded-xl bg-accent-500/10 hover:bg-accent-500/20 text-accent-500 text-[11px] font-bold border border-accent-500/30 transition-all flex items-center gap-1"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>{isAr ? 'صيانة' : 'Repair'}</span>
                              </button>
                              <button
                                onClick={() => setEditingItem({ kind: 'accident', item: acc })}
                                title={isAr ? 'تعديل بيانات الحادث' : 'Edit Accident Record'}
                                className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-accent-500 text-[11px] font-bold border border-slate-700 transition-all flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                <span>{isAr ? 'تعديل' : 'Edit'}</span>
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'accident',
                                    id: acc.id,
                                    name: `${acc.title} (${acc.dateTime})`,
                                  })
                                }
                                title={isAr ? 'حذف سجل الحادث' : 'Delete'}
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 4. EDUCATIONAL EXPENSES TAB ================= */}
      {activeMainTab === 'education' && (
        <div className="space-y-6 animate-fade-in">
          {/* Students Header & Add Student Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {isAr ? 'سجلات الطلاب والمصاريف التعليمية' : 'Students & Educational Records'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'إدارة مستقلة لمصاريف الدروس، المدرسة، والمواصلات لكل طالب' : 'Independent tuition & lesson records per student'}
              </p>
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 text-slate-950 font-bold text-xs shadow-md shadow-accent-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة طالب جديد' : 'Add Student'}</span>
            </button>
          </div>

          {/* Student Cards Carousel / Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {students.map((std) => {
              const stdTotal = studentExpensesList
                .filter((x) => x.studentId === std.id)
                .reduce((sum, item) => sum + item.amount, 0);
              const isSelected = activeStudentId === std.id;

              return (
                <div
                  key={std.id}
                  onClick={() => setActiveStudentId(std.id)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-accent-500/15 border-accent-500 shadow-xl scale-[1.02]'
                      : 'bg-[#1a1a1a] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent-500/20 text-accent-500 flex items-center justify-center font-bold">
                      🎓
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        {std.stage}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStudentModal(std, 'addExpense');
                        }}
                        title={isAr ? 'إضافة مصروف لهذا الطالب' : 'Add Expense'}
                        className="px-2 py-1 rounded-lg text-accent-500 bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/30 transition-all flex items-center gap-0.5 text-[10px] font-bold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isAr ? 'مصروف' : 'Expense'}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStudentModal(std, 'profile');
                        }}
                        title={isAr ? 'تعديل بيانات وحساب الطالب' : 'Edit Student & Account'}
                        className="p-1 rounded-lg text-slate-400 hover:text-accent-500 hover:bg-slate-800 transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({
                            type: 'student',
                            id: std.id,
                            name: `${std.name} (${std.stage})`,
                          });
                        }}
                        title={isAr ? 'حذف الطالب وسجلاته' : 'Delete Student'}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-sm text-white truncate">{std.name}</h4>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isAr ? 'السن:' : 'Age:'} {std.age} {isAr ? 'سنة' : 'yrs'} • {std.nationalId}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isAr ? 'إجمالي المصاريف:' : 'Total:'}</span>
                      <span className="font-bold text-sm text-accent-500 font-mono-num">
                        {stdTotal.toLocaleString()} {currency}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReportPreview('month', 'students', std.id);
                      }}
                      title={isAr ? `معاينة وطباعة تقرير ${std.name}` : `View & print report for ${std.name}`}
                      className="px-2.5 py-1.5 rounded-xl bg-accent-500/15 hover:bg-accent-500/25 text-accent-500 text-[11px] font-bold border border-accent-500/30 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isAr ? 'التقرير' : 'Report'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Student Detailed Expenses Section */}
          {activeStudentId && (
            <div className="bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl space-y-4">
              {(() => {
                const currentStd = students.find((s) => s.id === activeStudentId);
                if (!currentStd) return null;

                const stdRecords = studentExpensesList.filter((x) => x.studentId === activeStudentId);

                return (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                          <span>{currentStd.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-accent-500/20 text-accent-500 font-bold">
                            {currentStd.stage}
                          </span>
                        </h4>

                        <button
                          onClick={() => handleOpenStudentModal(currentStd, 'addExpense')}
                          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إضافة مصروف' : 'Add Expense'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenStudentModal(currentStd, 'profile')}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-accent-500 text-xs font-bold border border-accent-500/30 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تعديل الحساب' : 'Edit Account'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setReportSubTab('students');
                            setReportStudentChoice(currentStd.id);
                            setActiveMainTab('reports');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{isAr ? 'لوحة تقرير الطالب' : 'Student Report Board'}</span>
                        </button>

                        <button
                          onClick={() => openReportPreview('month', 'students', currentStd.id)}
                          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 hover:from-[#c29d27] hover:to-[#967b25] text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{isAr ? 'معاينة وطباعة التقرير' : 'Preview & Print'}</span>
                        </button>
                      </div>

                      {/* Sub-tabs for Student Expenses */}
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
                        {[
                          { id: 'lessons', label: isAr ? 'دروس خصوصية' : 'Lessons' },
                          { id: 'personal', label: isAr ? 'مصاريف شخصية' : 'Personal' },
                          { id: 'transport', label: isAr ? 'مواصلات' : 'Transport' },
                          { id: 'school', label: isAr ? 'مصاريف مدرسية' : 'School' },
                          { id: 'books', label: isAr ? 'كتب خارجية' : 'Books' },
                        ].map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setStudentSubTab(sub.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                              studentSubTab === sub.id
                                ? 'bg-accent-500 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Add Form & Records Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Form */}
                      <div className="lg:col-span-5 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                        <form onSubmit={handleAddStudentExpense} className="space-y-3 text-xs">
                          <h5 className="font-bold text-accent-400 mb-2">
                            {isAr ? `إضافة مصروف في قسم: ${studentSubTab}` : `Add to ${studentSubTab}`}
                          </h5>

                          <div>
                            <label className="block font-bold text-slate-300 mb-1">
                              {isAr ? 'وصف أو بيان المصروف' : 'Description'} *
                            </label>
                            <input
                              type="text"
                              required
                              value={studentExpenseTitle}
                              onChange={(e) => setStudentExpenseTitle(e.target.value)}
                              placeholder={isAr ? 'مثال: اشتراك شهر سبتمبر...' : 'e.g. September fee...'}
                              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-bold text-slate-300 mb-1">
                                {isAr ? 'المبلغ' : 'Amount'} ({currency}) *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={studentExpenseAmount}
                                onChange={(e) => setStudentExpenseAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono-num font-bold"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-300 mb-1">
                                {isAr ? 'التاريخ' : 'Date'} *
                              </label>
                              <input
                                type="date"
                                required
                                value={studentExpenseDate}
                                onChange={(e) => setStudentExpenseDate(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-slate-950 font-extrabold text-xs shadow-md"
                          >
                            {isAr ? 'حفظ المصروف التعليمي' : 'Save Record'}
                          </button>
                        </form>
                      </div>

                      {/* List */}
                      <div className="lg:col-span-7 bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {stdRecords.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-xs">
                              {isAr ? 'لا توجد مصاريف مسجلة لهذا الطالب' : 'No records for this student'}
                            </div>
                          ) : (
                            stdRecords.map((rec) => (
                              <div key={rec.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-xs text-white">{rec.title}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span className="px-1.5 py-0.2 rounded bg-accent-500/10 text-accent-300 font-bold uppercase">{rec.subCategory}</span>
                                    <span>{rec.date}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-accent-500 font-mono-num">
                                    -{rec.amount.toLocaleString()} {currency}
                                  </span>
                                  <button
                                    onClick={() => setEditingItem({ kind: 'studentExpense', item: rec })}
                                    title={isAr ? 'تعديل المصروف' : 'Edit Expense'}
                                    className="p-1 rounded-lg text-slate-400 hover:text-accent-500 hover:bg-slate-900 transition-all"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: 'studentExpense',
                                        id: rec.id,
                                        name: `${rec.title} (${rec.amount} ${currency})`,
                                      })
                                    }
                                    title={isAr ? 'حذف المصروف' : 'Delete Expense'}
                                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                          <span className="text-slate-400">{isAr ? 'إجمالي القسم الحالي:' : 'Subtotal:'}</span>
                          <span className="font-extrabold text-accent-500 font-mono-num">
                            {stdRecords.reduce((s, r) => s + r.amount, 0).toLocaleString()} {currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Modal: Add Student */}
          {showAddStudentModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#1c1c1c] border border-accent-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-white">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-extrabold text-sm">{isAr ? 'إضافة ملف طالب جديد' : 'Add Student Profile'}</h3>
                  <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">{isAr ? 'اسم الطالب' : 'Student Name'} *</label>
                    <input
                      type="text"
                      required
                      value={newStdName}
                      onChange={(e) => setNewStdName(e.target.value)}
                      placeholder={isAr ? 'اسم الطالب الرباعي' : 'Full Name'}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">{isAr ? 'السن' : 'Age'}</label>
                      <input
                        type="number"
                        value={newStdAge}
                        onChange={(e) => setNewStdAge(e.target.value)}
                        placeholder="14"
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">{isAr ? 'المرحلة الدراسية' : 'Stage'}</label>
                      <select
                        value={newStdStage}
                        onChange={(e) => setNewStdStage(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                      >
                        {[
                          isAr ? 'ابتدائي' : 'Primary',
                          isAr ? 'إعدادي' : 'Preparatory',
                          isAr ? 'ثانوي' : 'Secondary',
                          isAr ? 'جامعي' : 'University',
                        ].map((st, i) => (
                          <option key={i} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">{isAr ? 'الرقم القومي (اختياري)' : 'National ID'}</label>
                    <input
                      type="text"
                      value={newStdNatId}
                      onChange={(e) => setNewStdNatId(e.target.value)}
                      placeholder="312..."
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono-num"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStudentModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-slate-950 font-bold"
                    >
                      {isAr ? 'حفظ الطالب' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 5. INCOME & BANK CERTIFICATES TAB ================= */}
      {activeMainTab === 'income' && (
        <div className="animate-fade-in">
          <IncomeCertificatesView language={language} currency={currency} onOpenReports={() => setActiveMainTab('reports')} />
        </div>
      )}

      {/* ================= 5. REPORTS TAB ================= */}
      {activeMainTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Report Controls & Live Preview Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-[#161616] to-slate-900 p-4 rounded-3xl border border-accent-500/40 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-accent-500" />
                <span>{isAr ? 'الفترة الزمنية للتقرير:' : 'Report Period:'}</span>
              </span>
              {[
                { id: 'day', label: isAr ? 'يومي (اليوم)' : 'Daily' },
                { id: 'week', label: isAr ? 'أسبوعي (7 أيام)' : 'Weekly' },
                { id: 'month', label: isAr ? 'شهري (30 يوم)' : 'Monthly' },
                { id: 'all', label: isAr ? 'شامل (الكل)' : 'All Time' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPreviewPeriod(p.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    previewPeriod === p.id
                      ? 'bg-accent-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openReportPreview(previewPeriod, 'all')}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-slate-950 font-black text-xs shadow-lg shadow-accent-900/30 active:scale-95 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>{isAr ? '🔍 معاينة التقرير الشامل قبل التصدير' : 'Preview Master Report'}</span>
              </button>
            </div>
          </div>

          {/* Report Sub-Tabs */}
          <div className="flex items-center gap-2 bg-[#161616] p-1.5 rounded-2xl border border-slate-800 max-w-xl">
            {[
              { id: 'master', label: isAr ? '📊 التقرير الشامل والرسوم البيانية' : 'Master & Charts' },
              { id: 'sections', label: isAr ? '📁 تقارير الأقسام' : 'Section Reports' },
              { id: 'students', label: isAr ? '🎓 تقارير الطلاب' : 'Student Reports' },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setReportSubTab(sub.id as any)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all text-center ${
                  reportSubTab === sub.id
                    ? 'bg-gradient-to-r from-accent-500 to-accent-700 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* 1) MASTER REPORT & CHARTS */}
          {reportSubTab === 'master' && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl">
                  <div className="text-xs text-slate-400 mb-1">{isAr ? 'مصروفات المنزل' : 'House'}</div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono-num">
                    {totalHouseSpent.toLocaleString()} <span className="text-xs text-accent-500">{currency}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>{grandTotal > 0 ? ((totalHouseSpent / grandTotal) * 100).toFixed(0) : 0}% {isAr ? 'من إجمالي المصاريف' : 'of total'}</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl">
                  <div className="text-xs text-slate-400 mb-1">{isAr ? 'مصروفات العمل' : 'Work'}</div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono-num">
                    {totalWorkSpent.toLocaleString()} <span className="text-xs text-accent-500">{currency}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-cyan-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>{grandTotal > 0 ? ((totalWorkSpent / grandTotal) * 100).toFixed(0) : 0}% {isAr ? 'من إجمالي المصاريف' : 'of total'}</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl">
                  <div className="text-xs text-slate-400 mb-1">{isAr ? 'مصروفات المركبات' : 'Vehicles'}</div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono-num">
                    {totalVehicleSpent.toLocaleString()} <span className="text-xs text-accent-500">{currency}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-accent-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>{grandTotal > 0 ? ((totalVehicleSpent / grandTotal) * 100).toFixed(0) : 0}% {isAr ? 'من إجمالي المصاريف' : 'of total'}</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl">
                  <div className="text-xs text-slate-400 mb-1">{isAr ? 'المصروفات التعليمية' : 'Education'}</div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono-num">
                    {totalEduSpent.toLocaleString()} <span className="text-xs text-accent-500">{currency}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-rose-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>{grandTotal > 0 ? ((totalEduSpent / grandTotal) * 100).toFixed(0) : 0}% {isAr ? 'من إجمالي المصاريف' : 'of total'}</span>
                  </div>
                </div>
              </div>

              {/* Recharts Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bar Chart */}
                <div className="lg:col-span-7 bg-[#1a1a1a] p-6 rounded-3xl border border-accent-500/30 shadow-xl space-y-4">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-accent-500" />
                    <span>{isAr ? 'مقارنة مصروفات الأقسام (رسم بياني أعمدة)' : 'Sections Bar Chart'}</span>
                  </h3>
                  <div className="h-[280px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: isAr ? 'المنزل' : 'House', amount: totalHouseSpent, fill: '#fbbf24' },
                          { name: isAr ? 'العمل' : 'Work', amount: totalWorkSpent, fill: '#38bdf8' },
                          { name: isAr ? 'المركبة' : 'Vehicle', amount: totalVehicleSpent, fill: '#34d399' },
                          { name: isAr ? 'التعليم' : 'Education', amount: totalEduSpent, fill: '#f43f5e' },
                        ]}
                      >
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                        />
                        <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="lg:col-span-5 bg-[#1a1a1a] p-6 rounded-3xl border border-accent-500/30 shadow-xl space-y-4 flex flex-col justify-between">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-accent-500" />
                    <span>{isAr ? 'نسب التوزيع (رسم بياني دائري)' : 'Distribution Pie Chart'}</span>
                  </h3>
                  <div className="h-[220px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={[
                            { name: isAr ? 'المنزل' : 'House', value: totalHouseSpent },
                            { name: isAr ? 'العمل' : 'Work', value: totalWorkSpent },
                            { name: isAr ? 'المركبة' : 'Vehicle', value: totalVehicleSpent },
                            { name: isAr ? 'التعليم' : 'Education', value: totalEduSpent },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {['#fbbf24', '#38bdf8', '#34d399', '#f43f5e'].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
                    {isAr ? 'الإجمالي العام المجمع:' : 'Grand Total Combined:'} <span className="font-bold text-accent-500 font-mono-num">{grandTotal.toLocaleString()} {currency}</span>
                  </div>
                </div>
              </div>

              {/* Period Comparison & Export */}
              <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-accent-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white">{isAr ? 'مقارنة مع الشهر السابق والمؤشرات' : 'Period Comparison & Analytics'}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isAr ? 'ارتفاع بنسبة 4.2% مقارنة بالشهر الماضي (ضمن النطاق الآمن للميزانية)' : '+4.2% compared to last month (within safe budget)'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportDataCSV('master_financial_report', ['Section', 'TotalSpent', 'Percentage'], [
                      ['House', totalHouseSpent, grandTotal > 0 ? (totalHouseSpent/grandTotal*100).toFixed(1) : 0],
                      ['Work', totalWorkSpent, grandTotal > 0 ? (totalWorkSpent/grandTotal*100).toFixed(1) : 0],
                      ['Vehicle', totalVehicleSpent, grandTotal > 0 ? (totalVehicleSpent/grandTotal*100).toFixed(1) : 0],
                      ['Education', totalEduSpent, grandTotal > 0 ? (totalEduSpent/grandTotal*100).toFixed(1) : 0],
                    ])}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 text-slate-950 font-extrabold text-xs shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'تصدير التقرير الشامل (CSV)' : 'Export Master Report'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2) SECTION REPORTS */}
          {reportSubTab === 'sections' && (
            <div className="space-y-6 animate-fade-in bg-[#1a1a1a] p-6 rounded-3xl border border-accent-500/30 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent-500" />
                  <span>{isAr ? 'تقارير الأقسام التفصيلية' : 'Detailed Section Reports'}</span>
                </h3>

                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {[
                    { id: 'house', label: isAr ? 'المنزل' : 'House' },
                    { id: 'work', label: isAr ? 'العمل' : 'Work' },
                    { id: 'vehicle', label: isAr ? 'المركبة' : 'Vehicle' },
                    { id: 'education', label: isAr ? 'التعليم' : 'Education' },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setReportSectionChoice(sec.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        reportSectionChoice === sec.id
                          ? 'bg-accent-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Content */}
              <div className="space-y-4">
                {reportSectionChoice === 'house' && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-xs text-accent-300">{isAr ? 'سجل مصروفات المنزل الكامل' : 'House Expenses Log'}</h4>
                      <span className="font-mono-num text-xs font-bold text-accent-500">{totalHouseSpent.toLocaleString()} {currency}</span>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {houseList.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs">{isAr ? 'لا توجد بيانات' : 'No records'}</div>
                      ) : (
                        houseList.map((h) => (
                          <div key={h.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                            <div>
                              <div className="font-bold text-white">{h.type}</div>
                              <div className="text-[10px] text-slate-400">{h.date} • {h.paymentType}</div>
                            </div>
                            <span className="font-bold text-accent-500 font-mono-num">-{h.amount} {currency}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {reportSectionChoice === 'work' && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-xs text-cyan-400">{isAr ? 'سجل مصروفات العمل الكامل' : 'Work Expenses Log'}</h4>
                      <span className="font-mono-num text-xs font-bold text-accent-500">{totalWorkSpent.toLocaleString()} {currency}</span>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {workList.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs">{isAr ? 'لا توجد بيانات' : 'No records'}</div>
                      ) : (
                        workList.map((w) => (
                          <div key={w.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                            <div>
                              <div className="font-bold text-white">{w.type}</div>
                              <div className="text-[10px] text-slate-400">{w.date} {w.notes ? `• ${w.notes}` : ''}</div>
                            </div>
                            <span className="font-bold text-accent-500 font-mono-num">-{w.amount} {currency}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {reportSectionChoice === 'vehicle' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs text-emerald-400">{isAr ? 'تقرير المركبة (التموين والصيانة)' : 'Vehicle Report'}</h4>
                      <span className="font-mono-num text-xs font-bold text-accent-500">{totalVehicleSpent.toLocaleString()} {currency}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                        <h5 className="font-bold text-xs text-accent-300 mb-2">{isAr ? 'سجل التموين' : 'Fuel Log'} ({totalFuelSpent} {currency})</h5>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                          {fuelList.map((f) => (
                            <div key={f.id} className="p-2 rounded-lg bg-slate-950 text-xs flex justify-between">
                              <span>{f.fuelType} ({f.dateTime})</span>
                              <span className="text-accent-500 font-bold">-{f.price} {currency}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                        <h5 className="font-bold text-xs text-cyan-300 mb-2">{isAr ? 'سجل الصيانة' : 'Maintenance Log'} ({totalMaintSpent} {currency})</h5>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                          {maintList.map((m) => (
                            <div key={m.id} className="p-2 rounded-lg bg-slate-950 text-xs flex justify-between">
                              <span>{m.maintenanceType} ({m.date})</span>
                              <span className="text-accent-500 font-bold">-{m.total} {currency}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {reportSectionChoice === 'education' && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-xs text-rose-400">{isAr ? 'سجل المصروفات التعليمية الشامل' : 'Education Log'}</h4>
                      <span className="font-mono-num text-xs font-bold text-accent-500">{totalEduSpent.toLocaleString()} {currency}</span>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {studentExpensesList.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs">{isAr ? 'لا توجد بيانات' : 'No records'}</div>
                      ) : (
                        studentExpensesList.map((se) => {
                          const std = students.find(s => s.id === se.studentId);
                          return (
                            <div key={se.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                              <div>
                                <div className="font-bold text-white">{se.title} <span className="text-accent-400 font-normal">({std?.name || 'طالب'})</span></div>
                                <div className="text-[10px] text-slate-400">{se.date} • {se.subCategory}</div>
                              </div>
                              <span className="font-bold text-accent-500 font-mono-num">-{se.amount} {currency}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3) STUDENT REPORTS (تقرير لكل طالب على حدا) */}
          {reportSubTab === 'students' && (
            <div className="space-y-6 animate-fade-in">
              {/* Toast feedback notification */}
              {studentReportToast && (
                <div className="p-4 rounded-2xl bg-accent-500/20 border border-accent-500/50 text-white flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-accent-500">
                    <Sparkles className="w-4 h-4" />
                    <span>{studentReportToast}</span>
                  </div>
                  <button
                    onClick={() => setStudentReportToast(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Student Selector Cards Bar */}
              <div className="bg-[#1a1a1a] p-5 rounded-3xl border border-accent-500/30 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent-500" />
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      {isAr ? 'اختر الطالب لعرض تقريره الفردي المفصل:' : 'Select Student for Individual Report:'}
                    </h3>
                  </div>

                  <span className="text-xs text-slate-400">
                    {isAr ? `إجمالي الطلاب: ${students.length}` : `Total Students: ${students.length}`}
                  </span>
                </div>

                {/* Horizontal / Wrapped Student Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                  {students.map((s) => {
                    const isSelected = reportStudentChoice === s.id;
                    const studentTotal = studentExpensesList
                      .filter((x) => x.studentId === s.id)
                      .reduce((sum, r) => sum + r.amount, 0);

                    return (
                      <button
                        key={s.id}
                        onClick={() => setReportStudentChoice(s.id)}
                        className={`p-3.5 rounded-2xl border text-start transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                          isSelected
                            ? 'bg-gradient-to-br from-accent-500/20 via-slate-900 to-slate-900 border-accent-500 shadow-lg shadow-accent-500/10 ring-1 ring-accent-500'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                                isSelected
                                  ? 'bg-accent-500 text-slate-950 font-black'
                                  : 'bg-slate-800 text-slate-300 group-hover:bg-accent-500/20 group-hover:text-accent-500'
                              }`}
                            >
                              🎓
                            </div>
                            <div>
                              <div className="font-black text-xs sm:text-sm text-white">{s.name}</div>
                              <span className="text-[10px] text-slate-400">{s.stage}</span>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-500 text-slate-950 font-black">
                              {isAr ? 'المحدد' : 'Active'}
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-400">{isAr ? 'الإجمالي الكلي:' : 'Total:'}</span>
                          <span className="font-bold text-accent-500 font-mono-num">
                            {studentTotal.toLocaleString()} {currency}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Student Detailed Report Container */}
              {(() => {
                const selStd = students.find((s) => s.id === reportStudentChoice) || students[0];
                if (!selStd) {
                  return (
                    <div className="bg-[#1a1a1a] p-12 rounded-3xl border border-slate-800 text-center text-slate-500">
                      {isAr ? 'لا يوجد طلاب مسجلون حالياً' : 'No students found'}
                    </div>
                  );
                }

                // Date filtering logic for student records
                const todayStr = new Date().toISOString().split('T')[0];
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

                const allStdRecords = studentExpensesList.filter((x) => x.studentId === selStd.id);

                const filteredStdRecords = allStdRecords.filter((rec) => {
                  if (!rec.date) return true;
                  const d = rec.date.slice(0, 10);
                  if (studentReportPeriod === 'day') return d === todayStr;
                  if (studentReportPeriod === 'week') return d >= oneWeekAgo && d <= todayStr;
                  if (studentReportPeriod === 'month') return d >= firstDayOfMonth && d <= todayStr;
                  return true; // 'all'
                });

                const filteredStdTotal = filteredStdRecords.reduce((sum, r) => sum + r.amount, 0);

                const lessonsTotal = filteredStdRecords.filter((r) => r.subCategory === 'lessons').reduce((s, r) => s + r.amount, 0);
                const personalTotal = filteredStdRecords.filter((r) => r.subCategory === 'personal').reduce((s, r) => s + r.amount, 0);
                const transportTotal = filteredStdRecords.filter((r) => r.subCategory === 'transport').reduce((s, r) => s + r.amount, 0);
                const schoolTotal = filteredStdRecords.filter((r) => r.subCategory === 'school').reduce((s, r) => s + r.amount, 0);
                const booksTotal = filteredStdRecords.filter((r) => r.subCategory === 'books').reduce((s, r) => s + r.amount, 0);

                // Helper category name in arabic/english
                const getSubCatName = (sub: string) => {
                  switch (sub) {
                    case 'lessons': return isAr ? 'دروس خصوصية' : 'Lessons';
                    case 'personal': return isAr ? 'مصاريف شخصية' : 'Personal';
                    case 'transport': return isAr ? 'مواصلات وباص' : 'Transport';
                    case 'school': return isAr ? 'مصاريف مدرسية' : 'School Fees';
                    case 'books': return isAr ? 'كتب ومذكرات' : 'Books & Notes';
                    default: return sub;
                  }
                };

                // Export student CSV
                const handleExportStudentCSV = () => {
                  const headers = [
                    isAr ? 'تاريخ العملية' : 'Date',
                    isAr ? 'اسم الطالب' : 'Student Name',
                    isAr ? 'المرحلة الدراسية' : 'Stage',
                    isAr ? 'تصنيف المصروف' : 'Category',
                    isAr ? 'بيان المصروف' : 'Title / Description',
                    isAr ? 'المبلغ' : 'Amount',
                  ];

                  const rows = filteredStdRecords.map((r) => [
                    `"${r.date}"`,
                    `"${selStd.name}"`,
                    `"${selStd.stage}"`,
                    `"${getSubCatName(r.subCategory)}"`,
                    `"${r.title.replace(/"/g, '""')}"`,
                    r.amount,
                  ]);

                  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute(
                    'download',
                    `student_report_${selStd.name.replace(/\s+/g, '_')}_${studentReportPeriod}_${todayStr}.csv`
                  );
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  setStudentReportToast(
                    isAr
                      ? `تم تصدير تقرير الطالب (${selStd.name}) كملف Excel بنجاح`
                      : `Exported ${selStd.name}'s report to CSV`
                  );
                  setTimeout(() => setStudentReportToast(null), 4000);
                };

                // Save report summary to vault
                const handleSaveStudentToVault = () => {
                  const periodLabel =
                    studentReportPeriod === 'day'
                      ? isAr ? 'اليوم' : 'Today'
                      : studentReportPeriod === 'week'
                      ? isAr ? 'أسبوعي' : 'Weekly'
                      : studentReportPeriod === 'month'
                      ? isAr ? 'شهري' : 'Monthly'
                      : isAr ? 'شامل' : 'All Time';

                  VaultRepository.addRecord({
                    id: `vault_std_${Date.now()}`,
                    title: `📄 ${isAr ? 'تقرير مصروفات الطالب' : 'Student Report'}: ${selStd.name} (${periodLabel})`,
                    category: 'document',
                    value: `${isAr ? 'الإجمالي:' : 'Total:'} ${filteredStdTotal.toLocaleString()} ${currency} • ${isAr ? 'العمليات:' : 'Records:'} ${filteredStdRecords.length}`,
                    notes: `${isAr ? 'اسم الطالب:' : 'Student:'} ${selStd.name}\n${isAr ? 'المرحلة الدراسية:' : 'Stage:'} ${selStd.stage}\n${isAr ? 'الرقم القومي:' : 'National ID:'} ${selStd.nationalId}\n${isAr ? 'تاريخ الحفظ:' : 'Saved:'} ${new Date().toLocaleDateString('ar-EG')}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  });

                  setStudentReportToast(
                    isAr
                      ? `تم حفظ تقرير الطالب (${selStd.name}) في الخزنة الرقمية بنجاح 🔒`
                      : `Saved ${selStd.name}'s report to Digital Vault 🔒`
                  );
                  setTimeout(() => setStudentReportToast(null), 4000);
                };

                return (
                  <div className="space-y-6">
                    {/* Individual Student Report Main Box */}
                    <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-accent-500/40 shadow-2xl space-y-6">
                      {/* Top Header & Actions */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                        {/* Student Identity Information */}
                        <div className="flex items-start sm:items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 text-slate-950 flex items-center justify-center text-2xl font-black shadow-lg shadow-accent-500/20 flex-shrink-0">
                            🎓
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg sm:text-xl font-black text-white">
                                {isAr ? 'تقرير الطالب / الطالبة:' : 'Student Report:'}{' '}
                                <span className="text-accent-500">{selStd.name}</span>
                              </h3>
                              <span className="text-xs px-3 py-1 rounded-full bg-accent-500/20 text-accent-500 font-bold border border-accent-500/40">
                                {selStd.stage}
                              </span>
                            </div>

                            <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                              <span>
                                {isAr ? 'السن:' : 'Age:'}{' '}
                                <strong className="text-white">{selStd.age} {isAr ? 'سنوات' : 'yrs'}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                {isAr ? 'الرقم القومي:' : 'National ID:'}{' '}
                                <strong className="text-white font-mono">{selStd.nationalId || '-'}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                {isAr ? 'إجمالي السجلات:' : 'Records:'}{' '}
                                <strong className="text-cyan-400 font-mono">{filteredStdRecords.length}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Action Buttons for this Student */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleOpenStudentModal(selStd, 'addExpense')}
                            className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{isAr ? 'إضافة مصروف للطالب' : 'Add Expense'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenStudentModal(selStd, 'profile')}
                            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-accent-500 font-bold text-xs border border-accent-500/40 transition-all flex items-center gap-2 active:scale-95"
                          >
                            <Edit className="w-4 h-4" />
                            <span>{isAr ? 'تعديل بيانات وحساب الطالب' : 'Edit Account'}</span>
                          </button>

                          <button
                            onClick={() => openReportPreview(studentReportPeriod, 'students', selStd.id)}
                            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-700 hover:from-[#c29d27] hover:to-[#967b25] text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-accent-500/20 active:scale-95"
                          >
                            <Printer className="w-4 h-4" />
                            <span>{isAr ? 'معاينة وطباعة التقرير' : 'Preview & Print'}</span>
                          </button>

                          <button
                            onClick={handleExportStudentCSV}
                            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 active:scale-95"
                          >
                            <Download className="w-4 h-4 text-emerald-400" />
                            <span>{isAr ? 'تصدير Excel' : 'Export CSV'}</span>
                          </button>

                          <button
                            onClick={handleSaveStudentToVault}
                            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-accent-500 font-bold text-xs border border-accent-500/40 transition-all flex items-center gap-2 active:scale-95"
                          >
                            <ShieldCheck className="w-4 h-4 text-accent-500" />
                            <span>{isAr ? 'إيداع بالخزنة' : 'Save to Vault'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Period Filter for this student & Total Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                        {/* Period selector */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-slate-400 font-bold ml-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-accent-500" />
                            <span>{isAr ? 'فترة التقرير:' : 'Period:'}</span>
                          </span>
                          {[
                            { id: 'day', label: isAr ? 'اليوم' : 'Today' },
                            { id: 'week', label: isAr ? 'أسبوعي (7 أيام)' : 'Weekly' },
                            { id: 'month', label: isAr ? 'شهري (الشهر الحالي)' : 'Monthly' },
                            { id: 'all', label: isAr ? 'شامل كافة الفترات' : 'All Time' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setStudentReportPeriod(p.id as any)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                studentReportPeriod === p.id
                                  ? 'bg-accent-500 text-slate-950 shadow-sm'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        {/* Grand total for this student */}
                        <div className="flex items-center gap-3">
                          <div className="text-end">
                            <span className="text-[10px] text-accent-300 block font-bold">
                              {isAr
                                ? `إجمالي مصروفات (${selStd.name}) بالفترة`
                                : `Total for ${selStd.name}`}
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-accent-500 font-mono-num">
                              {filteredStdTotal.toLocaleString()} {currency}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Subcategory breakdown cards */}
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-300 mb-3 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-accent-500" />
                          <span>{isAr ? 'توزيع بنود مصروفات الطالب حسب الباب المالي' : 'Expense Distribution by Category'}</span>
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {[
                            {
                              label: isAr ? 'دروس خصوصية' : 'Lessons',
                              amt: lessonsTotal,
                              color: 'text-accent-400',
                              bg: 'bg-accent-500/10',
                              border: 'border-accent-500/20',
                              icon: '📚',
                            },
                            {
                              label: isAr ? 'مصاريف شخصية' : 'Personal',
                              amt: personalTotal,
                              color: 'text-cyan-400',
                              bg: 'bg-cyan-500/10',
                              border: 'border-cyan-500/20',
                              icon: '💳',
                            },
                            {
                              label: isAr ? 'مواصلات وباص' : 'Transport',
                              amt: transportTotal,
                              color: 'text-emerald-400',
                              bg: 'bg-emerald-500/10',
                              border: 'border-emerald-500/20',
                              icon: '🚌',
                            },
                            {
                              label: isAr ? 'مصاريف مدرسية' : 'School Fees',
                              amt: schoolTotal,
                              color: 'text-blue-400',
                              bg: 'bg-blue-500/10',
                              border: 'border-blue-500/20',
                              icon: '🏫',
                            },
                            {
                              label: isAr ? 'كتب ومذكرات' : 'Books & Notes',
                              amt: booksTotal,
                              color: 'text-rose-400',
                              bg: 'bg-rose-500/10',
                              border: 'border-rose-500/20',
                              icon: '📖',
                            },
                          ].map((sub, idx) => {
                            const percent = filteredStdTotal > 0 ? Math.round((sub.amt / filteredStdTotal) * 100) : 0;
                            return (
                              <div
                                key={idx}
                                className={`p-4 rounded-2xl border ${sub.bg} ${sub.border} flex flex-col justify-between`}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-base">{sub.icon}</span>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono-num">
                                      {percent}%
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-300 font-bold mb-1">{sub.label}</div>
                                </div>
                                <div className={`text-base font-black font-mono-num mt-2 ${sub.color}`}>
                                  {sub.amt.toLocaleString()} <span className="text-[10px]">{currency}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Proportional visual bar */}
                        {filteredStdTotal > 0 && (
                          <div className="mt-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                              <span>{isAr ? 'النسبة المئوية للبند من ميزانية الطالب' : 'Budget Share'}</span>
                              <span className="text-accent-500">{filteredStdTotal.toLocaleString()} {currency}</span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                              {lessonsTotal > 0 && (
                                <div
                                  style={{ width: `${(lessonsTotal / filteredStdTotal) * 100}%` }}
                                  className="bg-accent-400 h-full"
                                  title={`${isAr ? 'دروس خصوصية' : 'Lessons'}: ${Math.round((lessonsTotal / filteredStdTotal) * 100)}%`}
                                />
                              )}
                              {personalTotal > 0 && (
                                <div
                                  style={{ width: `${(personalTotal / filteredStdTotal) * 100}%` }}
                                  className="bg-cyan-400 h-full"
                                  title={`${isAr ? 'شخصية' : 'Personal'}: ${Math.round((personalTotal / filteredStdTotal) * 100)}%`}
                                />
                              )}
                              {transportTotal > 0 && (
                                <div
                                  style={{ width: `${(transportTotal / filteredStdTotal) * 100}%` }}
                                  className="bg-emerald-400 h-full"
                                  title={`${isAr ? 'مواصلات' : 'Transport'}: ${Math.round((transportTotal / filteredStdTotal) * 100)}%`}
                                />
                              )}
                              {schoolTotal > 0 && (
                                <div
                                  style={{ width: `${(schoolTotal / filteredStdTotal) * 100}%` }}
                                  className="bg-blue-400 h-full"
                                  title={`${isAr ? 'مدرسية' : 'School'}: ${Math.round((schoolTotal / filteredStdTotal) * 100)}%`}
                                />
                              )}
                              {booksTotal > 0 && (
                                <div
                                  style={{ width: `${(booksTotal / filteredStdTotal) * 100}%` }}
                                  className="bg-rose-400 h-full"
                                  title={`${isAr ? 'كتب ومذكرات' : 'Books'}: ${Math.round((booksTotal / filteredStdTotal) * 100)}%`}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Detailed Itemized Records for this Student */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="font-extrabold text-xs text-white flex items-center gap-2">
                            <span>📋</span>
                            <span>
                              {isAr
                                ? `كشف الحساب التفصيلي لعمليات الطالب (${selStd.name})`
                                : `Itemized Account Statement for ${selStd.name}`}
                            </span>
                          </h4>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenStudentModal(selStd, 'addExpense')}
                              className="px-2.5 py-1 rounded-xl bg-accent-500/15 hover:bg-accent-500/25 text-accent-500 text-[11px] font-bold border border-accent-500/30 transition-all flex items-center gap-1 active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isAr ? 'إضافة مصروف لهذا الطالب' : 'Add Expense'}</span>
                            </button>
                            <span className="text-[11px] font-bold text-slate-400">
                              {filteredStdRecords.length} {isAr ? 'سجل في الفترة المحددة' : 'records in selected period'}
                            </span>
                          </div>
                        </div>

                        {filteredStdRecords.length === 0 ? (
                          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
                            {isAr
                              ? `لا توجد مصاريف مسجلة للطالب (${selStd.name}) في الفترة المختارة`
                              : `No expense records found for ${selStd.name} in this period`}
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                            <table className="w-full text-start text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                                  <th className="p-3 text-start">#</th>
                                  <th className="p-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                                  <th className="p-3 text-start">{isAr ? 'الباب / التصنيف' : 'Category'}</th>
                                  <th className="p-3 text-start">{isAr ? 'البيان / الوصف' : 'Description'}</th>
                                  <th className="p-3 text-start">{isAr ? 'المبلغ' : 'Amount'}</th>
                                  <th className="p-3 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/80">
                                {filteredStdRecords.map((rec, idx) => {
                                  const subColors: Record<string, string> = {
                                    lessons: 'bg-accent-500/20 text-accent-300 border-accent-500/30',
                                    personal: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                                    transport: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                                    school: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                    books: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                                  };

                                  return (
                                    <tr key={rec.id} className="hover:bg-slate-800/50 transition-colors">
                                      <td className="p-3 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                                      <td className="p-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                                        {rec.date}
                                      </td>
                                      <td className="p-3 whitespace-nowrap">
                                        <span
                                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold ${
                                            subColors[rec.subCategory] || 'bg-slate-800 text-slate-300 border-slate-700'
                                          }`}
                                        >
                                          {getSubCatName(rec.subCategory)}
                                        </span>
                                      </td>
                                      <td className="p-3 font-bold text-white max-w-[200px] truncate">
                                        {rec.title}
                                      </td>
                                      <td className="p-3 font-mono-num font-black text-accent-500 whitespace-nowrap">
                                        -{rec.amount.toLocaleString()} {currency}
                                      </td>
                                      <td className="p-3 text-end whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            onClick={() =>
                                              setEditingItem({
                                                kind: 'studentExpense',
                                                item: rec,
                                              })
                                            }
                                            title={isAr ? 'تعديل السجل' : 'Edit record'}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-accent-500 hover:bg-slate-800 transition-all"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              setDeleteTarget({
                                                type: 'studentExpense',
                                                id: rec.id,
                                                name: `${rec.title} (${rec.amount} ${currency})`,
                                              })
                                            }
                                            title={isAr ? 'حذف السجل' : 'Delete record'}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* All Students Comparative Table (مقارنة مصروفات كافة الطلاب) */}
                    <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                          <span>📊</span>
                          <span>{isAr ? 'جدول مقارنة مصروفات كافة الطلاب' : 'All Students Expense Comparison'}</span>
                        </h4>
                        <span className="text-xs text-slate-400">
                          {isAr ? 'اضغط على "عرض التقرير" للانتقال السريع لتقرير أي طالب' : 'Click "View Report" to focus any student'}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
                        <table className="w-full text-start text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                              <th className="p-3 text-start">{isAr ? 'اسم الطالب' : 'Student Name'}</th>
                              <th className="p-3 text-start">{isAr ? 'المرحلة' : 'Stage'}</th>
                              <th className="p-3 text-start">{isAr ? 'السن' : 'Age'}</th>
                              <th className="p-3 text-start">{isAr ? 'عدد العمليات' : 'Records'}</th>
                              <th className="p-3 text-start">{isAr ? 'إجمالي المصروفات' : 'Total Spent'}</th>
                              <th className="p-3 text-end">{isAr ? 'إجراء' : 'Action'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80">
                            {students.map((s) => {
                              const sRecords = studentExpensesList.filter((x) => x.studentId === s.id);
                              const sTotal = sRecords.reduce((sum, r) => sum + r.amount, 0);
                              const isCurrent = reportStudentChoice === s.id;

                              return (
                                <tr
                                  key={s.id}
                                  className={`transition-colors ${
                                    isCurrent ? 'bg-accent-500/10' : 'hover:bg-slate-800/40'
                                  }`}
                                >
                                  <td className="p-3 font-black text-white flex items-center gap-2">
                                    <span>🎓</span>
                                    <span>{s.name}</span>
                                    {isCurrent && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-500 text-slate-950 font-bold">
                                        {isAr ? 'معروض حالياً' : 'Active'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-300 font-bold">{s.stage}</td>
                                  <td className="p-3 text-slate-400">{s.age} {isAr ? 'سنة' : 'yrs'}</td>
                                  <td className="p-3 font-mono font-bold text-cyan-400">{sRecords.length}</td>
                                  <td className="p-3 font-mono-num font-black text-accent-500">
                                    {sTotal.toLocaleString()} {currency}
                                  </td>
                                  <td className="p-3 text-end">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setReportStudentChoice(s.id)}
                                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                                          isCurrent
                                            ? 'bg-accent-500 text-slate-950 font-black'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                        }`}
                                      >
                                        {isAr ? 'اختيار' : 'Select'}
                                      </button>
                                      <button
                                        onClick={() => openReportPreview('month', 'students', s.id)}
                                        title={isAr ? `معاينة وطباعة تقرير ${s.name}` : `Preview report for ${s.name}`}
                                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-accent-500/20 text-accent-500 border border-accent-500/30 transition-all"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Vehicle Camera & Accident / Odometer Modal */}
      <VehicleCameraModal
        isOpen={isCameraModalOpen}
        initialMode={cameraModalMode}
        onClose={() => setIsCameraModalOpen(false)}
        currency={currency}
        language={language}
        onAccidentSaved={(newAcc) => {
          saveAccidents([newAcc, ...accidentList]);
          setVehicleSubTab('accidents');
        }}
        onOdometerCaptured={(km) => {
          setFuelOdometer(km.toString());
        }}
      />

      {/* Report Preview & Print/Export Modal */}
      <ReportPreviewModal
        isOpen={isReportPreviewOpen}
        onClose={() => setIsReportPreviewOpen(false)}
        currency={currency}
        language={language}
        initialPeriod={previewPeriod}
        initialSection={previewSection}
        initialStudentId={previewStudentId}
        houseList={houseList}
        workList={workList}
        fuelList={fuelList}
        maintList={maintList}
        accidentList={accidentList}
        studentExpensesList={studentExpensesList}
        students={students}
      />

      {/* Edit Expense Modal for all sections */}
      <ExpenseEditModal
        isOpen={!!editingItem}
        editItem={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEditedItem}
        currency={currency}
        language={language}
        studentExpenses={studentExpensesList}
        initialStudentTab={studentEditInitialTab}
        onAddStudentExpense={handleAddStudentExpenseFromModal}
        onUpdateStudentExpense={handleUpdateStudentExpenseFromModal}
        onDeleteStudentExpense={handleDeleteStudentExpenseFromModal}
      />

      {/* Confirmation Delete Dialog */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={isAr ? 'تأكيد عملية الحذف' : 'Confirm Deletion'}
        description={
          isAr
            ? 'هل أنت متأكد من رغبتك في حذف هذا السجل بشكل نهائي؟ لا يمكن التراجع عن هذه الخطوة.'
            : 'Are you sure you want to delete this record permanently? This action cannot be undone.'
        }
        itemName={deleteTarget?.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        language={language}
      />
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Language, Expense, VehicleAccidentRecord, StudentProfile, StudentExpenseRecord, MonthlyIncome, BankCertificate } from '../types';
import { StorageAdapter, VehiclesRepository, ExpensesRepository } from '../services';
import { isDateInMonth, getCertificatesProfitForMonth, getPrimaryIncomeForMonth } from '../services/financeCalculations';
import { FinancialDashboard } from './expenses/FinancialDashboard';
import { SectionsMenuScreen } from './expenses/SectionsMenuScreen';
import { HouseExpensesSection, SpecializedExpense } from './expenses/HouseExpensesSection';
import { WorkExpensesSection } from './expenses/WorkExpensesSection';
import { VehicleExpensesSection, VehicleFuelRecord, VehicleMaintenanceRecord } from './expenses/VehicleExpensesSection';
import { EducationExpensesSection } from './expenses/EducationExpensesSection';
import { IncomeAndCertificatesSection } from './expenses/IncomeAndCertificatesSection';
import { FinancialReportsSection } from './expenses/FinancialReportsSection';
import { AddExpenseModal } from './expenses/AddExpenseModal';
import { VehicleCameraModal } from './VehicleCameraModal';

interface ExpensesViewProps {
  language: Language;
  currency: string;
  expenses?: Expense[];
  onUpdateExpenses?: (expenses: Expense[]) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  language,
  currency,
}) => {
  const isAr = language === 'ar';

  // --- 1. CURRENT SCREEN STATE ---
  // 'dashboard' | 'sections_menu' | 'house' | 'work' | 'vehicle' | 'education' | 'income_certs' | 'reports'
  const [currentScreen, setCurrentScreen] = useState<
    'dashboard' | 'sections_menu' | 'house' | 'work' | 'vehicle' | 'education' | 'income_certs' | 'reports'
  >('dashboard');

  // Month selector (default: current year-month YYYY-MM)
  const currentYearMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);

  // Universal Add Expense Modal
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  // Camera Modal for Vehicles
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'accident' | 'odometer'>('accident');

  // --- 2. DATA STATES (PERSISTED) ---

  // House Expenses
  const [houseList, setHouseList] = useState<SpecializedExpense[]>(() => {
    return StorageAdapter.getItem<SpecializedExpense[]>('smart_time_house_expenses', [
      { id: 'h1', section: 'house', type: 'فطار', amount: 150, paymentType: 'supply', date: `${currentYearMonth}-02` },
      { id: 'h2', section: 'house', type: 'إصلاحات كهربائية', amount: 450, paymentType: 'labor', date: `${currentYearMonth}-05` },
      { id: 'h3', section: 'house', type: 'غداء', amount: 320, paymentType: 'supply', date: `${currentYearMonth}-06` },
      { id: 'h4', section: 'house', type: 'شراء مفروشات', amount: 1200, paymentType: 'supply', date: `${currentYearMonth}-08` },
    ]);
  });

  // Work Expenses
  const [workList, setWorkList] = useState<SpecializedExpense[]>(() => {
    return StorageAdapter.getItem<SpecializedExpense[]>('smart_time_work_expenses', [
      { id: 'w1', section: 'work', type: 'أدوات مكتبية', amount: 350, date: `${currentYearMonth}-03`, notes: 'أوراق طباعة وأحبار' },
      { id: 'w2', section: 'work', type: 'اشتراكات برمجيات وسيرفرات', amount: 800, date: `${currentYearMonth}-04`, notes: 'سيرفر الاستضافة السحابية' },
    ]);
  });

  // Vehicle: Fuel, Maintenance, Accidents
  const [fuelList, setFuelList] = useState<VehicleFuelRecord[]>(() => {
    return StorageAdapter.getItem<VehicleFuelRecord[]>('smart_time_vehicle_fuel', [
      { id: 'f1', fuelType: 'بنزين 92', price: 650, odometer: 45200, dateTime: `${currentYearMonth}-03T10:00` },
      { id: 'f2', fuelType: 'بنزين 92', price: 700, odometer: 45850, dateTime: `${currentYearMonth}-07T14:30` },
    ]);
  });

  const [maintList, setMaintList] = useState<VehicleMaintenanceRecord[]>(() => {
    return StorageAdapter.getItem<VehicleMaintenanceRecord[]>('smart_time_vehicle_maint', [
      { id: 'm1', maintenanceType: 'كهرباء', description: 'تغيير شمعات الإشعال وفحص البطارية', supplyName: 'بوجيهات أصلية', supplyPrice: 800, laborDescription: 'تركيب وفحص', laborPrice: 200, total: 1000, date: `${currentYearMonth}-05` },
    ]);
  });

  const [accidentList, setAccidentList] = useState<VehicleAccidentRecord[]>(() => {
    return VehiclesRepository.getAccidentRecords();
  });

  // Education: Students & Records
  const [students, setStudents] = useState<StudentProfile[]>(() => {
    const defaultStudents: StudentProfile[] = [
      { id: 'std_salma', name: 'سلمى ممدوح سعد', nationalId: '31406150102468', age: '14', stage: 'إعدادي' },
      { id: 'std_1', name: 'يوسف محمد', nationalId: '31205120102034', age: '16', stage: 'ثانوي' },
      { id: 'std_2', name: 'فاطمة محمد', nationalId: '31808220105068', age: '11', stage: 'ابتدائي' },
    ];
    return StorageAdapter.getItem<StudentProfile[]>('smart_time_students', defaultStudents);
  });

  const [studentExpensesList, setStudentExpensesList] = useState<StudentExpenseRecord[]>(() => {
    return StorageAdapter.getItem<StudentExpenseRecord[]>('smart_time_student_expenses', [
      { id: 'se_s1', studentId: 'std_salma', subCategory: 'lessons', title: 'دروس الرياضيات واللغات', amount: 850, date: `${currentYearMonth}-01` },
      { id: 'se_s2', studentId: 'std_salma', subCategory: 'school', title: 'قسط المصروفات المدرسية', amount: 3200, date: `${currentYearMonth}-03` },
      { id: 'se_s3', studentId: 'std_salma', subCategory: 'books', title: 'كتب ومذكرات خارجية', amount: 450, date: `${currentYearMonth}-04` },
      { id: 'se_s4', studentId: 'std_salma', subCategory: 'transport', title: 'اشتراك باص المدرسة الشهري', amount: 600, date: `${currentYearMonth}-05` },
    ]);
  });

  // Income Sources List
  const [incomeList, setIncomeList] = useState<MonthlyIncome[]>(() => {
    const existing = ExpensesRepository.getMonthlyIncome();
    if (existing && existing.length > 0) return existing;
    // Default initial income for current month
    const defaultIncome: MonthlyIncome = {
      id: `income_${currentYearMonth}`,
      month: currentYearMonth,
      salary: 25000,
      bonuses: 2000,
      otherIncome: 3000,
      sources: [
        { id: 'src_1', source: 'الراتب الأساسي', amount: 25000, date: `${currentYearMonth}-01`, type: 'salary', notes: 'الراتب الشهري الرئيسي', createdAt: new Date().toISOString() },
        { id: 'src_2', source: 'دخل عمل حر (Freelance)', amount: 5000, date: `${currentYearMonth}-05`, type: 'extra', notes: 'تطوير تطبيق ويب', createdAt: new Date().toISOString() },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ExpensesRepository.saveMonthlyIncome([defaultIncome]);
    return [defaultIncome];
  });

  // Bank Certificates
  const [certificates, setCertificates] = useState<BankCertificate[]>(() => {
    const existing = ExpensesRepository.getBankCertificates();
    if (existing && existing.length > 0) return existing;
    // Default initial certificate as requested in prompt (240,000 at 18% = 43,200 annual, 3,600 monthly)
    const defaultCert: BankCertificate = {
      id: 'cert_sample_1',
      bankName: 'البنك الأهلي المصري',
      certificateNumber: 'CERT-884920',
      duration: '1 سنة',
      amount: 240000,
      annualRate: 18,
      annualProfit: 43200,
      periodicProfit: 3600,
      monthlyEquivalentProfit: 3600,
      returnType: 'simple',
      issueDate: `${currentYearMonth}-01`,
      maturityDate: `${new Date().getFullYear() + 1}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
      profitDate: `${currentYearMonth}-01`,
      profitAmount: 3600,
      profitFrequency: 'monthly',
      notes: 'شهادة العائد البلاتيني الشهري 18%',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ExpensesRepository.saveBankCertificates([defaultCert]);
    return [defaultCert];
  });

  // --- 3. PERSISTENCE WRAPPERS ---
  const handleSaveHouse = (list: SpecializedExpense[]) => {
    setHouseList(list);
    StorageAdapter.setItem('smart_time_house_expenses', list);
  };

  const handleSaveWork = (list: SpecializedExpense[]) => {
    setWorkList(list);
    StorageAdapter.setItem('smart_time_work_expenses', list);
  };

  const handleSaveFuel = (list: VehicleFuelRecord[]) => {
    setFuelList(list);
    StorageAdapter.setItem('smart_time_vehicle_fuel', list);
  };

  const handleSaveMaint = (list: VehicleMaintenanceRecord[]) => {
    setMaintList(list);
    StorageAdapter.setItem('smart_time_vehicle_maint', list);
  };

  const handleSaveAccidents = (list: VehicleAccidentRecord[]) => {
    setAccidentList(list);
    VehiclesRepository.saveAccidentRecords(list);
  };

  const handleSaveStudents = (list: StudentProfile[]) => {
    setStudents(list);
    StorageAdapter.setItem('smart_time_students', list);
  };

  const handleSaveStudentExpenses = (list: StudentExpenseRecord[]) => {
    setStudentExpensesList(list);
    StorageAdapter.setItem('smart_time_student_expenses', list);
  };

  const handleSaveIncome = (list: MonthlyIncome[]) => {
    setIncomeList(list);
    ExpensesRepository.saveMonthlyIncome(list);
  };

  const handleSaveCertificates = (list: BankCertificate[]) => {
    setCertificates(list);
    ExpensesRepository.saveBankCertificates(list);
  };

  // --- 4. REAL-TIME FINANCIAL CALCULATIONS FOR SELECTED MONTH ---
  const currentMonthHouse = useMemo(
    () => houseList.filter((e) => isDateInMonth(e.date, selectedMonth)),
    [houseList, selectedMonth]
  );
  const houseTotal = useMemo(
    () => currentMonthHouse.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [currentMonthHouse]
  );

  const currentMonthWork = useMemo(
    () => workList.filter((e) => isDateInMonth(e.date, selectedMonth)),
    [workList, selectedMonth]
  );
  const workTotal = useMemo(
    () => currentMonthWork.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [currentMonthWork]
  );

  const currentMonthFuel = useMemo(
    () => fuelList.filter((f) => isDateInMonth(f.dateTime, selectedMonth)),
    [fuelList, selectedMonth]
  );
  const fuelTotal = useMemo(
    () => currentMonthFuel.reduce((s, f) => s + (Number(f.price) || 0), 0),
    [currentMonthFuel]
  );

  const currentMonthMaint = useMemo(
    () => maintList.filter((m) => isDateInMonth(m.date, selectedMonth)),
    [maintList, selectedMonth]
  );
  const maintTotal = useMemo(
    () => currentMonthMaint.reduce((s, m) => s + (Number(m.total) || 0), 0),
    [currentMonthMaint]
  );

  const currentMonthAccidents = useMemo(
    () => accidentList.filter((a) => isDateInMonth(a.date, selectedMonth)),
    [accidentList, selectedMonth]
  );
  const accidentTotal = useMemo(
    () => currentMonthAccidents.reduce((s, a) => s + (Number(a.estimatedDamage) || 0), 0),
    [currentMonthAccidents]
  );

  const vehicleTotal = fuelTotal + maintTotal + accidentTotal;

  const currentMonthEducation = useMemo(
    () => studentExpensesList.filter((e) => isDateInMonth(e.date, selectedMonth)),
    [studentExpensesList, selectedMonth]
  );
  const educationTotal = useMemo(
    () => currentMonthEducation.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [currentMonthEducation]
  );

  // Grand Total Expenses for the month
  const monthlyExpenses = houseTotal + workTotal + vehicleTotal + educationTotal;

  // Primary Income from Salary & Extra streams
  const primaryIncome = useMemo(
    () => getPrimaryIncomeForMonth(incomeList, selectedMonth),
    [incomeList, selectedMonth]
  );

  // Profit from Bank Certificates synced to current month
  const certificatesProfit = useMemo(
    () => getCertificatesProfitForMonth(certificates, selectedMonth),
    [certificates, selectedMonth]
  );

  // Total Monthly Income = Primary Income + Bank Certificates Returns
  const monthlyIncome = primaryIncome + certificatesProfit;

  // Net Income / Balance = Total Income - Total Expenses
  const netIncome = monthlyIncome - monthlyExpenses;

  // Recent Transactions Stream across all sections
  const recentTransactions = useMemo(() => {
    const list: {
      id: string;
      section: 'house' | 'work' | 'vehicle' | 'education';
      title: string;
      amount: number;
      date: string;
      badge: string;
    }[] = [];

    houseList.forEach((h) => {
      list.push({
        id: h.id,
        section: 'house',
        title: h.type,
        amount: h.amount,
        date: h.date,
        badge: h.paymentType === 'labor' ? (isAr ? 'مصنعية' : 'Labor') : isAr ? 'منزل' : 'Home',
      });
    });

    workList.forEach((w) => {
      list.push({
        id: w.id,
        section: 'work',
        title: w.type,
        amount: w.amount,
        date: w.date,
        badge: isAr ? 'عمل' : 'Work',
      });
    });

    fuelList.forEach((f) => {
      list.push({
        id: f.id,
        section: 'vehicle',
        title: `${f.fuelType} (عداد: ${f.odometer} كم)`,
        amount: f.price,
        date: f.dateTime.split('T')[0],
        badge: isAr ? 'وقود' : 'Fuel',
      });
    });

    maintList.forEach((m) => {
      list.push({
        id: m.id,
        section: 'vehicle',
        title: m.maintenanceType,
        amount: m.total,
        date: m.date,
        badge: isAr ? 'صيانة' : 'Maint',
      });
    });

    studentExpensesList.forEach((e) => {
      const std = students.find((s) => s.id === e.studentId);
      list.push({
        id: e.id,
        section: 'education',
        title: `${e.title} (${std?.name || ''})`,
        amount: e.amount,
        date: e.date,
        badge: isAr ? 'تعليم' : 'Edu',
      });
    });

    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [houseList, workList, fuelList, maintList, studentExpensesList, students, isAr]);

  // Universal Add Expense Handler
  const handleUniversalAddExpense = (data: {
    section: 'house' | 'work' | 'vehicle' | 'education';
    category: string;
    amount: number;
    date: string;
    paymentMethod: string;
    notes?: string;
  }) => {
    if (data.section === 'house') {
      const newItem: SpecializedExpense = {
        id: `h_${Date.now()}`,
        section: 'house',
        type: data.category,
        amount: data.amount,
        paymentType: 'supply',
        date: data.date,
        notes: data.notes,
      };
      handleSaveHouse([newItem, ...houseList]);
    } else if (data.section === 'work') {
      const newItem: SpecializedExpense = {
        id: `w_${Date.now()}`,
        section: 'work',
        type: data.category,
        amount: data.amount,
        date: data.date,
        notes: data.notes,
      };
      handleSaveWork([newItem, ...workList]);
    } else if (data.section === 'vehicle') {
      if (data.category.includes('وقود') || data.category.includes('بنزين') || data.category.includes('سولار')) {
        const newFuel: VehicleFuelRecord = {
          id: `f_${Date.now()}`,
          fuelType: data.category,
          price: data.amount,
          odometer: 0,
          dateTime: `${data.date}T12:00`,
        };
        handleSaveFuel([newFuel, ...fuelList]);
      } else {
        const newMaint: VehicleMaintenanceRecord = {
          id: `m_${Date.now()}`,
          maintenanceType: data.category,
          description: data.notes || data.category,
          supplyName: data.category,
          supplyPrice: data.amount,
          laborDescription: '',
          laborPrice: 0,
          total: data.amount,
          date: data.date,
        };
        handleSaveMaint([newMaint, ...maintList]);
      }
    } else if (data.section === 'education') {
      const stdId = students[0]?.id || 'std_salma';
      const newExp: StudentExpenseRecord = {
        id: `se_${Date.now()}`,
        studentId: stdId,
        subCategory: 'lessons',
        title: data.category,
        amount: data.amount,
        date: data.date,
      };
      handleSaveStudentExpenses([newExp, ...studentExpensesList]);
    }
  };

  return (
    <div className="w-full pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. SCREEN: FINANCIAL DASHBOARD (Default Main View) */}
      {currentScreen === 'dashboard' && (
        <FinancialDashboard
          language={language}
          currency={currency}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          monthlyIncome={monthlyIncome}
          monthlyExpenses={monthlyExpenses}
          netIncome={netIncome}
          onOpenSectionsMenu={() => setCurrentScreen('sections_menu')}
          onOpenAddExpense={() => setIsAddExpenseModalOpen(true)}
          onSelectSection={(sec) => setCurrentScreen(sec)}
          houseTotal={houseTotal}
          houseCount={currentMonthHouse.length}
          workTotal={workTotal}
          workCount={currentMonthWork.length}
          vehicleTotal={vehicleTotal}
          vehicleCount={currentMonthFuel.length + currentMonthMaint.length + currentMonthAccidents.length}
          educationTotal={educationTotal}
          educationCount={currentMonthEducation.length}
          certsCount={certificates.length}
          recentTransactions={recentTransactions}
        />
      )}

      {/* 2. SCREEN: SECTIONS MENU (Grid of 6 Cards) */}
      {currentScreen === 'sections_menu' && (
        <SectionsMenuScreen
          language={language}
          currency={currency}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          onBack={() => setCurrentScreen('dashboard')}
          onSelectSection={(sec) => setCurrentScreen(sec)}
          houseTotal={houseTotal}
          houseCount={currentMonthHouse.length}
          workTotal={workTotal}
          workCount={currentMonthWork.length}
          vehicleTotal={vehicleTotal}
          vehicleCount={currentMonthFuel.length + currentMonthMaint.length + currentMonthAccidents.length}
          educationTotal={educationTotal}
          educationCount={currentMonthEducation.length}
          monthlyIncome={monthlyIncome}
          certsCount={certificates.length}
          monthlyExpenses={monthlyExpenses}
          netIncome={netIncome}
        />
      )}

      {/* 3. FULL SCREEN: HOUSE EXPENSES */}
      {currentScreen === 'house' && (
        <HouseExpensesSection
          language={language}
          currency={currency}
          selectedMonth={selectedMonth}
          onBack={() => setCurrentScreen('sections_menu')}
          expenses={houseList}
          onSaveExpenses={handleSaveHouse}
        />
      )}

      {/* 4. FULL SCREEN: WORK EXPENSES */}
      {currentScreen === 'work' && (
        <WorkExpensesSection
          language={language}
          currency={currency}
          selectedMonth={selectedMonth}
          onBack={() => setCurrentScreen('sections_menu')}
          expenses={workList}
          onSaveExpenses={handleSaveWork}
        />
      )}

      {/* 5. FULL SCREEN: VEHICLE EXPENSES */}
      {currentScreen === 'vehicle' && (
        <VehicleExpensesSection
          language={language}
          currency={currency}
          selectedMonth={selectedMonth}
          onBack={() => setCurrentScreen('sections_menu')}
          fuelList={fuelList}
          onSaveFuel={handleSaveFuel}
          maintList={maintList}
          onSaveMaint={handleSaveMaint}
          accidentList={accidentList}
          onSaveAccidents={handleSaveAccidents}
          onOpenCamera={(mode) => {
            setCameraMode(mode);
            setIsCameraModalOpen(true);
          }}
        />
      )}

      {/* 6. FULL SCREEN: EDUCATION EXPENSES */}
      {currentScreen === 'education' && (
        <EducationExpensesSection
          language={language}
          currency={currency}
          selectedMonth={selectedMonth}
          onBack={() => setCurrentScreen('sections_menu')}
          students={students}
          onSaveStudents={handleSaveStudents}
          expenses={studentExpensesList}
          onSaveExpenses={handleSaveStudentExpenses}
        />
      )}

      {/* 7. FULL SCREEN: INCOME AND BANK CERTIFICATES */}
      {currentScreen === 'income_certs' && (
        <IncomeAndCertificatesSection
          language={language}
          currency={currency}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          onBack={() => setCurrentScreen('sections_menu')}
          incomeList={incomeList}
          onSaveIncome={handleSaveIncome}
          certificates={certificates}
          onSaveCertificates={handleSaveCertificates}
        />
      )}

      {/* 8. FULL SCREEN: REPORTS AND ANALYTICS */}
      {currentScreen === 'reports' && (
        <FinancialReportsSection
          language={language}
          currency={currency}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          onBack={() => setCurrentScreen('sections_menu')}
          monthlyIncome={monthlyIncome}
          monthlyExpenses={monthlyExpenses}
          netIncome={netIncome}
          houseTotal={houseTotal}
          workTotal={workTotal}
          vehicleTotal={vehicleTotal}
          educationTotal={educationTotal}
        />
      )}

      {/* --- UNIVERSAL ADD EXPENSE MODAL --- */}
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        language={language}
        currency={currency}
        selectedMonth={selectedMonth}
        onAddExpense={handleUniversalAddExpense}
      />

      {/* --- VEHICLE CAMERA MODAL --- */}
      <VehicleCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        mode={cameraMode}
        onCapture={(imgData, odomValue) => {
          if (cameraMode === 'odometer' && odomValue) {
            // Log fuel record with scanned odometer
            const newFuel: VehicleFuelRecord = {
              id: `f_${Date.now()}`,
              fuelType: 'بنزين 92',
              price: 650,
              odometer: odomValue,
              dateTime: new Date().toISOString().slice(0, 16),
            };
            handleSaveFuel([newFuel, ...fuelList]);
          } else if (cameraMode === 'accident' && imgData) {
            // Log accident record with photo
            const newAcc: VehicleAccidentRecord = {
              id: `acc_${Date.now()}`,
              vehicleId: 'default_vehicle',
              title: isAr ? 'صدمة مصورة عبر الكاميرا' : 'Camera captured incident',
              photoUrl: imgData,
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString('ar-EG'),
              estimatedDamage: 0,
              notes: isAr ? 'صورة مرفقة عبر الكاميرا' : 'Photo attached',
              createdAt: new Date().toISOString(),
            };
            handleSaveAccidents([newAcc, ...accidentList]);
          }
          setIsCameraModalOpen(false);
        }}
      />
    </div>
  );
};

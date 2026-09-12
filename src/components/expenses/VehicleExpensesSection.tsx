import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Car,
  Fuel,
  Wrench,
  AlertTriangle,
  Plus,
  Search,
  Trash2,
  Edit2,
  Calendar,
  Camera,
  FileSpreadsheet,
  Printer,
  X,
  Sparkles,
} from 'lucide-react';
import { formatMoney, isDateInMonth } from '../../services/financeCalculations';
import { Language, VehicleAccidentRecord } from '../../types';

export interface VehicleFuelRecord {
  id: string;
  fuelType: string;
  price: number;
  odometer: number;
  dateTime: string;
}

export interface VehicleMaintenanceRecord {
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

interface VehicleExpensesSectionProps {
  language: Language;
  currency: string;
  selectedMonth: string;
  onBack: () => void;
  fuelList: VehicleFuelRecord[];
  onSaveFuel: (list: VehicleFuelRecord[]) => void;
  maintList: VehicleMaintenanceRecord[];
  onSaveMaint: (list: VehicleMaintenanceRecord[]) => void;
  accidentList: VehicleAccidentRecord[];
  onSaveAccidents: (list: VehicleAccidentRecord[]) => void;
  onOpenCamera: (mode: 'accident' | 'odometer') => void;
}

export const VehicleExpensesSection: React.FC<VehicleExpensesSectionProps> = ({
  language,
  currency,
  selectedMonth,
  onBack,
  fuelList,
  onSaveFuel,
  maintList,
  onSaveMaint,
  accidentList,
  onSaveAccidents,
  onOpenCamera,
}) => {
  const isAr = language === 'ar';
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  const [subTab, setSubTab] = useState<'fuel' | 'maintenance' | 'accidents'>('fuel');
  const [searchQuery, setSearchQuery] = useState('');

  // Fuel Form
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [editingFuelId, setEditingFuelId] = useState<string | null>(null);
  const [fuelType, setFuelType] = useState('بنزين 92');
  const [fuelPrice, setFuelPrice] = useState('');
  const [fuelOdometer, setFuelOdometer] = useState('');
  const [fuelDateTime, setFuelDateTime] = useState(new Date().toISOString().slice(0, 16));

  // Maintenance Form
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [editingMaintId, setEditingMaintId] = useState<string | null>(null);
  const [maintType, setMaintType] = useState('كهرباء');
  const [maintDesc, setMaintDesc] = useState('');
  const [supplyName, setSupplyName] = useState('');
  const [supplyPrice, setSupplyPrice] = useState('');
  const [laborDesc, setLaborDesc] = useState('');
  const [laborPrice, setLaborPrice] = useState('');
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);

  // Accident Form
  const [isAccidentModalOpen, setIsAccidentModalOpen] = useState(false);
  const [editingAccidentId, setEditingAccidentId] = useState<string | null>(null);
  const [accidentDesc, setAccidentDesc] = useState('');
  const [accidentCost, setAccidentCost] = useState('');
  const [accidentDate, setAccidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [accidentLocation, setAccidentLocation] = useState('');

  // Calculations for current month
  const currentMonthFuel = fuelList.filter((f) => isDateInMonth(f.dateTime, selectedMonth));
  const currentMonthMaint = maintList.filter((m) => isDateInMonth(m.date, selectedMonth));
  const currentMonthAccidents = accidentList.filter((a) => isDateInMonth(a.date, selectedMonth));

  const fuelTotal = currentMonthFuel.reduce((s, f) => s + (Number(f.price) || 0), 0);
  const maintTotal = currentMonthMaint.reduce((s, m) => s + (Number(m.total) || 0), 0);
  const accidentTotal = currentMonthAccidents.reduce((s, a) => s + (Number(a.repairCost) || 0), 0);
  const vehicleGrandTotal = fuelTotal + maintTotal + accidentTotal;

  // Handlers for Fuel
  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(fuelPrice);
    if (isNaN(p) || p <= 0) return;

    const item: VehicleFuelRecord = {
      id: editingFuelId || `fuel_${Date.now()}`,
      fuelType,
      price: p,
      odometer: parseFloat(fuelOdometer) || 0,
      dateTime: fuelDateTime,
    };

    const next = editingFuelId ? fuelList.map((f) => (f.id === editingFuelId ? item : f)) : [item, ...fuelList];
    onSaveFuel(next);
    setIsFuelModalOpen(false);
  };

  // Handlers for Maintenance
  const handleSaveMaint = (e: React.FormEvent) => {
    e.preventDefault();
    const sPrice = parseFloat(supplyPrice) || 0;
    const lPrice = parseFloat(laborPrice) || 0;
    const total = sPrice + lPrice;
    if (total <= 0) return;

    const item: VehicleMaintenanceRecord = {
      id: editingMaintId || `maint_${Date.now()}`,
      maintenanceType: maintType,
      description: maintDesc.trim(),
      supplyName: supplyName.trim(),
      supplyPrice: sPrice,
      laborDescription: laborDesc.trim(),
      laborPrice: lPrice,
      total,
      date: maintDate,
    };

    const next = editingMaintId ? maintList.map((m) => (m.id === editingMaintId ? item : m)) : [item, ...maintList];
    onSaveMaint(next);
    setIsMaintModalOpen(false);
  };

  // Handlers for Accident
  const handleSaveAccident = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(accidentCost) || 0;
    const item: VehicleAccidentRecord = {
      id: editingAccidentId || `acc_${Date.now()}`,
      vehicleId: 'default_vehicle',
      title: accidentDesc.trim() || (isAr ? 'حادث / صدمة' : 'Accident'),
      photoUrl: '',
      date: accidentDate,
      time: new Date().toLocaleTimeString('ar-EG'),
      location: accidentLocation.trim() || undefined,
      notes: accidentDesc.trim() || undefined,
      estimatedDamage: c,
      createdAt: new Date().toISOString(),
    };

    const next = editingAccidentId ? accidentList.map((a) => (a.id === editingAccidentId ? item : a)) : [item, ...accidentList];
    onSaveAccidents(next);
    setIsAccidentModalOpen(false);
  };

  const exportData = (type: 'csv' | 'print') => {
    if (type === 'csv') {
      const headers = ['النوع', 'التاريخ', 'التفاصيل', 'المبلغ'];
      const rows = [
        ...fuelList.map((f) => ['وقود - ' + f.fuelType, f.dateTime, `عداد: ${f.odometer} كم`, f.price]),
        ...maintList.map((m) => ['صيانة - ' + m.maintenanceType, m.date, `${m.description} (قطع: ${m.supplyPrice} + مصنعية: ${m.laborPrice})`, m.total]),
        ...accidentList.map((a) => ['حادث/إصلاح', a.date, a.description, a.repairCost || 0]),
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
      a.download = `vehicle-expenses-${selectedMonth}.csv`;
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
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {isAr ? 'مصروفات المركبة والوقود' : 'Vehicle & Fuel Expenses'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'متابعة استهلاك البنزين، الصيانة الدورية وسجلات الحوادث' : 'Fuel logs, maintenance services & accident records'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'fuel' && (
            <button
              onClick={() => {
                setEditingFuelId(null);
                setFuelPrice('');
                setFuelOdometer('');
                setFuelDateTime(new Date().toISOString().slice(0, 16));
                setIsFuelModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تفويلة وقود +' : 'Add Fuel +'}</span>
            </button>
          )}

          {subTab === 'maintenance' && (
            <button
              onClick={() => {
                setEditingMaintId(null);
                setMaintDesc('');
                setSupplyName('');
                setSupplyPrice('');
                setLaborDesc('');
                setLaborPrice('');
                setMaintDate(new Date().toISOString().split('T')[0]);
                setIsMaintModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'صيانة جديدة +' : 'Add Maint +'}</span>
            </button>
          )}

          {subTab === 'accidents' && (
            <button
              onClick={() => {
                setEditingAccidentId(null);
                setAccidentDesc('');
                setAccidentCost('');
                setAccidentLocation('');
                setAccidentDate(new Date().toISOString().split('T')[0]);
                setIsAccidentModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تسجيل حادث +' : 'Log Accident +'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Monthly Grand Total Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'إجمالي مصروفات السيارة هذا الشهر' : 'Total Vehicle Expenses'}
          </span>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
            {formatMoney(vehicleGrandTotal)} <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'الوقود والبنزين' : 'Fuel'}
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatMoney(fuelTotal)} <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{currentMonthFuel.length} {isAr ? 'تفويلة' : 'fill-ups'}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'الصيانة والإصلاحات' : 'Maintenance & Repairs'}
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatMoney(maintTotal + accidentTotal)} <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{currentMonthMaint.length} {isAr ? 'عمليات صيانة' : 'services'}</span>
        </div>
      </div>

      {/* 3. Subtabs Bar */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-1.5">
        <button
          onClick={() => setSubTab('fuel')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            subTab === 'fuel'
              ? 'bg-teal-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>{isAr ? 'الوقود والبنزين' : 'Fuel'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{fuelList.length}</span>
        </button>

        <button
          onClick={() => setSubTab('maintenance')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            subTab === 'maintenance'
              ? 'bg-teal-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>{isAr ? 'الصيانة وقطع الغيار' : 'Maintenance'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{maintList.length}</span>
        </button>

        <button
          onClick={() => setSubTab('accidents')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            subTab === 'accidents'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{isAr ? 'سجلات الحوادث' : 'Accidents'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{accidentList.length}</span>
        </button>
      </div>

      {/* 4. Tab 1: Fuel List */}
      {subTab === 'fuel' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {fuelList.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Fuel className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs">{isAr ? 'لا توجد سجلات وقود' : 'No fuel logs yet'}</p>
            </div>
          ) : (
            fuelList.map((f) => (
              <div key={f.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 flex items-center justify-center text-teal-600">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">{f.fuelType}</span>
                    <span className="text-[11px] text-slate-400">
                      {f.dateTime.replace('T', ' ')} • {isAr ? `العداد: ${f.odometer.toLocaleString()} كم` : `Odometer: ${f.odometer.toLocaleString()} km`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-base font-black text-teal-600 dark:text-teal-400">
                    {formatMoney(f.price)} <span className="text-[10px] font-normal text-slate-500">{currency}</span>
                  </div>
                  <button
                    onClick={() => onSaveFuel(fuelList.filter((x) => x.id !== f.id))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. Tab 2: Maintenance List */}
      {subTab === 'maintenance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {maintList.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Wrench className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs">{isAr ? 'لا توجد سجلات صيانة' : 'No maintenance logs yet'}</p>
            </div>
          ) : (
            maintList.map((m) => (
              <div key={m.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 flex items-center justify-center text-teal-600">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">{m.maintenanceType}</span>
                    <p className="text-xs text-slate-500">{m.description || m.supplyName}</p>
                    <span className="text-[10px] text-slate-400">
                      {m.date} • قطع: {formatMoney(m.supplyPrice)} + مصنعية: {formatMoney(m.laborPrice)} {currency}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-base font-black text-slate-900 dark:text-slate-100">
                    {formatMoney(m.total)} <span className="text-[10px] font-normal text-slate-500">{currency}</span>
                  </div>
                  <button
                    onClick={() => onSaveMaint(maintList.filter((x) => x.id !== m.id))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 6. Tab 3: Accidents List */}
      {subTab === 'accidents' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {accidentList.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <AlertTriangle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs">{isAr ? 'لا توجد حوادث مسجلة، سلمك الله!' : 'No accidents recorded'}</p>
            </div>
          ) : (
            accidentList.map((a) => (
              <div key={a.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">{a.title || (isAr ? 'حادث / صدمة' : 'Accident')}</span>
                    <span className="text-[11px] text-slate-400">
                      {a.date} {a.location && `• ${a.location}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-base font-black text-rose-600 dark:text-rose-400">
                    {formatMoney(a.estimatedDamage || 0)} <span className="text-[10px] font-normal text-slate-500">{currency}</span>
                  </div>
                  <button
                    onClick={() => onSaveAccidents(accidentList.filter((x) => x.id !== a.id))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Fuel Modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{isAr ? 'تسجيل تفويلة وقود' : 'Add Fuel Record'}</h3>
              <button onClick={() => setIsFuelModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveFuel} className="space-y-3 text-xs">
              <div>
                <label className="font-bold">{isAr ? 'نوع الوقود' : 'Fuel Type'}</label>
                <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1">
                  <option value="بنزين 92">بنزين 92</option>
                  <option value="بنزين 95">بنزين 95</option>
                  <option value="بنزين 80">بنزين 80</option>
                  <option value="سولار">سولار (ديزل)</option>
                  <option value="غاز طبيعي">غاز طبيعي</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold">{isAr ? 'المبلغ *' : 'Amount *'}</label>
                  <input type="number" step="0.01" required value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
                </div>
                <div>
                  <label className="font-bold">{isAr ? 'قراءة العداد (كم)' : 'Odometer (km)'}</label>
                  <input type="number" value={fuelOdometer} onChange={(e) => setFuelOdometer(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
                </div>
              </div>
              <div>
                <label className="font-bold">{isAr ? 'التاريخ والوقت' : 'Date & Time'}</label>
                <input type="datetime-local" value={fuelDateTime} onChange={(e) => setFuelDateTime(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-500 text-white font-bold">{isAr ? 'حفظ التفويلة' : 'Save'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {isMaintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{isAr ? 'تسجيل صيانة مركبة' : 'Add Maintenance'}</h3>
              <button onClick={() => setIsMaintModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveMaint} className="space-y-3 text-xs">
              <div>
                <label className="font-bold">{isAr ? 'نوع الصيانة' : 'Type'}</label>
                <input value={maintType} onChange={(e) => setMaintType(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" placeholder="مثال: تغيير زيت، بوجيهات، فحمات" />
              </div>
              <div>
                <label className="font-bold">{isAr ? 'وصف الصيانة' : 'Description'}</label>
                <input value={maintDesc} onChange={(e) => setMaintDesc(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold">{isAr ? 'سعر قطع الغيار' : 'Supplies Price'}</label>
                  <input type="number" step="0.01" value={supplyPrice} onChange={(e) => setSupplyPrice(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
                </div>
                <div>
                  <label className="font-bold">{isAr ? 'أجرة يد / مصنعية' : 'Labor Fee'}</label>
                  <input type="number" step="0.01" value={laborPrice} onChange={(e) => setLaborPrice(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
                </div>
              </div>
              <div>
                <label className="font-bold">{isAr ? 'التاريخ' : 'Date'}</label>
                <input type="date" value={maintDate} onChange={(e) => setMaintDate(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-500 text-white font-bold">{isAr ? 'حفظ الصيانة' : 'Save'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Accident Modal */}
      {isAccidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{isAr ? 'تسجيل تقرير حادث' : 'Log Accident'}</h3>
              <button onClick={() => setIsAccidentModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveAccident} className="space-y-3 text-xs">
              <div>
                <label className="font-bold">{isAr ? 'وصف الحادث' : 'Description'}</label>
                <input required value={accidentDesc} onChange={(e) => setAccidentDesc(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold">{isAr ? 'تكلفة الإصلاح' : 'Repair Cost'}</label>
                  <input type="number" step="0.01" value={accidentCost} onChange={(e) => setAccidentCost(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
                </div>
                <div>
                  <label className="font-bold">{isAr ? 'التاريخ' : 'Date'}</label>
                  <input type="date" value={accidentDate} onChange={(e) => setAccidentDate(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
                </div>
              </div>
              <div>
                <label className="font-bold">{isAr ? 'الموقع' : 'Location'}</label>
                <input value={accidentLocation} onChange={(e) => setAccidentLocation(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border mt-1" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-bold">{isAr ? 'حفظ تقرير الحادث' : 'Save'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

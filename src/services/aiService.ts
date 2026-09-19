import { apiUrl } from './apiConfig';
import { authHeaders } from './authService';
import {
  AiMessage,
  AppNotification,
  EducationExpense,
  Expense,
  FuelRecord,
  LessonItem,
  MonthlyIncome,
  Note,
  RecentTrip,
  Student,
  Vehicle,
} from '../types';

export type SmartAiAction =
  | {
      type: 'add_expense';
      payload: {
        title: string;
        amount: number;
        category: Expense['category'];
        date?: string;
        paymentMethod?: Expense['paymentMethod'];
        notes?: string;
      };
    }
  | {
      type: 'add_education_expense';
      payload: {
        studentId?: string;
        studentName?: string;
        title: string;
        amount: number;
        category: EducationExpense['category'];
        date?: string;
        notes?: string;
      };
    }
  | {
      type: 'add_fuel_record';
      payload: {
        vehicleId?: string;
        vehicleName?: string;
        liters: number;
        pricePerLiter: number;
        totalCost?: number;
        mileage: number;
        date?: string;
        stationName?: string;
        notes?: string;
      };
    }
  | {
      type: 'add_daily_task';
      payload: {
        title: string;
        priority?: 'high' | 'medium' | 'low';
        category?: 'work' | 'personal' | 'finance' | 'health' | 'education' | 'general';
        dueDate?: string;
        dueTime?: string;
        noteId?: string;
        reminderEnabled?: boolean;
      };
    }
  | null;

export interface SmartAiResponse {
  reply: string;
  action: SmartAiAction;
  actionSummary?: string;
  requiresConfirmation?: boolean;
  needsClarification?: boolean;
  model?: string;
  provider?: string;
}

export interface SmartAiContext {
  profile: { name: string; currency: string; language: string };
  expenses: Array<Pick<Expense, 'id' | 'title' | 'amount' | 'category' | 'date' | 'paymentMethod' | 'notes'>>;
  monthlyIncome: Array<Pick<MonthlyIncome, 'id' | 'month' | 'salary' | 'bonuses' | 'otherIncome' | 'otherIncomeNote'>>;
  vehicles: Array<Pick<Vehicle, 'id' | 'name' | 'model' | 'year' | 'fuelType' | 'currentMileage'>>;
  fuelRecords: Array<Pick<FuelRecord, 'id' | 'vehicleId' | 'liters' | 'pricePerLiter' | 'totalCost' | 'mileage' | 'date' | 'stationName' | 'notes'>>;
  students: Array<Pick<Student, 'id' | 'name' | 'grade' | 'schoolName'>>;
  lessons: Array<Pick<LessonItem, 'id' | 'studentId' | 'subject' | 'title' | 'dayOfWeek' | 'time' | 'monthlyFee' | 'isPaid'>>;
  educationExpenses: Array<Pick<EducationExpense, 'id' | 'studentId' | 'title' | 'amount' | 'category' | 'date' | 'notes'>>;
  notes: Array<Pick<Note, 'id' | 'title' | 'content' | 'date'>>;
  dailyTasks: Array<Pick<AppNotification, 'id' | 'title' | 'body' | 'category' | 'date' | 'isRead'>>;
  recentTrips: Array<Pick<RecentTrip, 'id' | 'date' | 'provider' | 'rideType' | 'fare' | 'distanceKm'>>;
}

export interface AskSmartAiRequest {
  message: string;
  language: 'ar' | 'en';
  model?: string;
  conversationHistory?: Array<{ sender: 'user' | 'model'; text: string }>;
  appContext: SmartAiContext;
}

export function buildSmartAiContext(input: {
  profile: { name: string; currency: string; language: string };
  expenses: Expense[];
  monthlyIncome: MonthlyIncome[];
  vehicles: Vehicle[];
  fuelRecords: FuelRecord[];
  students: Student[];
  lessons: LessonItem[];
  educationExpenses: EducationExpense[];
  notes: Note[];
  dailyTasks: any[];
  recentTrips: RecentTrip[];
}): SmartAiContext {
  const limit = <T,>(items: T[], max: number) => items.slice(0, max);
  return {
    profile: {
      name: input.profile.name,
      currency: input.profile.currency,
      language: input.profile.language,
    },
    expenses: limit(input.expenses, 250).map(({ receiptUrl: _receipt, createdAt: _created, ...e }) => e),
    monthlyIncome: limit(input.monthlyIncome, 60).map(({ sources: _sources, createdAt: _created, updatedAt: _updated, ...m }) => m),
    vehicles: limit(input.vehicles, 30).map(({ plateNumber: _plate, color: _color, ...v }) => v),
    fuelRecords: limit(input.fuelRecords, 200).map((r) => ({ ...r })),
    students: limit(input.students, 50).map((s) => ({ id: s.id, name: s.name, grade: s.grade, schoolName: s.schoolName })),
    lessons: limit(input.lessons, 150).map((l) => ({ ...l })),
    educationExpenses: limit(input.educationExpenses, 200).map((e) => ({ ...e })),
    notes: limit(input.notes, 80).map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content.slice(0, 600),
      date: n.date,
    })),
    dailyTasks: limit(input.dailyTasks, 80).map((t) => ({
      id: t.id,
      title: t.title,
      body: t.body || '',
      category: t.category || 'system',
      date: t.dueDate || t.date || '',
      isRead: !!t.completed,
    })),
    recentTrips: limit(input.recentTrips, 150).map((t) => ({
      id: t.id,
      date: t.date,
      provider: t.provider,
      rideType: t.rideType,
      fare: t.fare,
      distanceKm: t.distanceKm,
    })),
  };
}

export async function askSmartAi(request: AskSmartAiRequest): Promise<SmartAiResponse> {
  const res = await fetch(apiUrl('/api/ai/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(request),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'تعذر الاتصال بمساعد SMART TIME');
  }
  return data as SmartAiResponse;
}

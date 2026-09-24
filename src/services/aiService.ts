import { apiUrl } from './apiConfig';
import { authHeaders } from './authService';
import {
  AiMessage,
  DailyTask,
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
        priority?: DailyTask['priority'];
        category?: DailyTask['category'];
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
  dailyTasks: Array<Pick<DailyTask, 'id' | 'title' | 'completed' | 'priority' | 'category' | 'dueDate' | 'dueTime'>>;
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
  dailyTasks: DailyTask[];
  recentTrips: RecentTrip[];
}): SmartAiContext {
  const limit = <T,>(items: T[], max: number) => items.slice(0, max);
  return {
    profile: {
      name: input.profile.name,
      currency: input.profile.currency,
      language: input.profile.language,
    },
    expenses: limit(input.expenses, 250).map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      category: e.category,
      date: e.date,
      paymentMethod: e.paymentMethod,
      notes: e.notes,
    })),
    monthlyIncome: limit(input.monthlyIncome, 60).map((m) => ({
      id: m.id,
      month: m.month,
      salary: m.salary,
      bonuses: m.bonuses,
      otherIncome: m.otherIncome,
      otherIncomeNote: m.otherIncomeNote,
    })),
    vehicles: limit(input.vehicles, 30).map((v) => ({
      id: v.id,
      name: v.name,
      model: v.model,
      year: v.year,
      fuelType: v.fuelType,
      currentMileage: v.currentMileage,
    })),
    fuelRecords: limit(input.fuelRecords, 200),
    students: limit(input.students, 50).map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      schoolName: s.schoolName,
    })),
    lessons: limit(input.lessons, 150),
    educationExpenses: limit(input.educationExpenses, 200),
    notes: limit(input.notes, 80).map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content.slice(0, 600),
      date: n.date,
    })),
    dailyTasks: limit(input.dailyTasks, 80).map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      priority: t.priority,
      category: t.category,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
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
    throw new Error(data?.error || 'تعذر الاتصال بمساعد SMART AI');
  }
  return data as SmartAiResponse;
}

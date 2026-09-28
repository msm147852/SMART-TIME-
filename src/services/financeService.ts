export interface FinanceOverview {
  source: "smart-time-finance-sqlite";
  expenses: Array<Record<string, unknown>>;
  monthlyIncome: Array<Record<string, unknown>>;
  bankCertificates: Array<Record<string, unknown>>;
  fuelRecords: Array<Record<string, unknown>>;
  maintenanceRecords: Array<Record<string, unknown>>;
  educationExpenses: Array<Record<string, unknown>>;
  fetchedAt: string;
}

export async function fetchCanonicalFinanceOverview(): Promise<FinanceOverview> {
  const response = await fetch("/api/finance/overview", {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(payload?.error || "تعذر قراءة بيانات التمويل."));
  }
  return payload as FinanceOverview;
}


import type { ExpenseType } from "../types/finance";

export interface CanonicalExpenseInput {
  id?: string;
  type: ExpenseType;
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  receiptUrl?: string;
  notes?: string | null;
  createdAt?: string;
}

async function financeMutation(path: string, method: string, body?: unknown): Promise<any> {
  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload?.error || "تعذر تنفيذ العملية المالية."));
  return payload;
}

export async function createCanonicalFinanceExpense(input: CanonicalExpenseInput): Promise<Record<string, unknown>> {
  const payload = await financeMutation("/api/finance/expenses", "POST", input);
  return payload.record as Record<string, unknown>;
}

export async function updateCanonicalFinanceExpense(id: string, patch: Partial<CanonicalExpenseInput>): Promise<Record<string, unknown>> {
  const payload = await financeMutation(`/api/finance/expenses/${encodeURIComponent(id)}`, "PATCH", patch);
  return payload.record as Record<string, unknown>;
}

export async function deleteCanonicalFinanceExpense(id: string): Promise<void> {
  await financeMutation(`/api/finance/expenses/${encodeURIComponent(id)}`, "DELETE");
}

export async function reconcileCanonicalFinance(expenses: Array<CanonicalExpenseInput>): Promise<any> {
  return financeMutation("/api/finance/migrate", "POST", { expenses, reconcileAiTransactions: true });
}

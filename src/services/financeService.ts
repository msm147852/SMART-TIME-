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

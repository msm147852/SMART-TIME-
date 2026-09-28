import { db } from "../../database.js";

export interface CalendarOccurrence {
  eventId: string;
  userId: string;
  title: string;
  occurrenceStart: string;
  occurrenceEnd?: string;
  timezone: string;
  reminderEnabled: boolean;
  reminderMinutes?: number;
}

type Recurrence = { frequency: "daily" | "weekly" | "monthly"; interval: number; until?: string };

function parseRecurrence(value: unknown): Recurrence | null {
  if (!value) return null;
  try {
    const r = typeof value === "string" ? JSON.parse(value) : value;
    if (!r || !["daily", "weekly", "monthly"].includes(String(r.frequency))) return null;
    const interval = Number(r.interval ?? 1);
    if (!Number.isInteger(interval) || interval < 1) return null;
    return { frequency: r.frequency, interval, ...(r.until ? { until: new Date(r.until).toISOString() } : {}) };
  } catch {
    return null;
  }
}

function addOccurrence(date: Date, recurrence: Recurrence): Date {
  const next = new Date(date);
  if (recurrence.frequency === "daily") next.setUTCDate(next.getUTCDate() + recurrence.interval);
  else if (recurrence.frequency === "weekly") next.setUTCDate(next.getUTCDate() + recurrence.interval * 7);
  else next.setUTCMonth(next.getUTCMonth() + recurrence.interval);
  return next;
}

function durationMs(start: string, end?: string): number | null {
  if (!end) return null;
  const value = new Date(end).getTime() - new Date(start).getTime();
  return value >= 0 ? value : null;
}

export function expandRecurringEvents(
  userId: string,
  from: Date,
  to: Date,
  maxOccurrences = 500,
): CalendarOccurrence[] {
  if (!userId) throw new Error("userId is required");
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to < from) {
    throw new Error("Invalid occurrence range");
  }

  const rows = db.prepare(`
    SELECT id, user_id as userId, title, start_at as startAt, end_at as endAt,
           timezone, reminder_enabled as reminderEnabled,
           reminder_minutes as reminderMinutes, recurrence_json as recurrenceJson
    FROM ai_events
    WHERE user_id = ?
      AND recurrence_json IS NOT NULL
      AND start_at <= ?
  `).all(userId, to.toISOString()) as any[];

  const occurrences: CalendarOccurrence[] = [];
  for (const row of rows) {
    const recurrence = parseRecurrence(row.recurrenceJson);
    if (!recurrence) continue;
    const originalStart = new Date(String(row.startAt));
    if (!Number.isFinite(originalStart.getTime())) continue;
    const duration = durationMs(String(row.startAt), row.endAt ? String(row.endAt) : undefined);

    let cursor = new Date(originalStart);
    let guard = 0;
    while (cursor < from && guard++ < 10000) cursor = addOccurrence(cursor, recurrence);
    while (cursor <= to && occurrences.length < maxOccurrences) {
      if (!recurrence.until || cursor <= new Date(recurrence.until)) {
        occurrences.push({
          eventId: String(row.id),
          userId: String(row.userId),
          title: String(row.title),
          occurrenceStart: cursor.toISOString(),
          ...(duration !== null ? { occurrenceEnd: new Date(cursor.getTime() + duration).toISOString() } : {}),
          timezone: String(row.timezone),
          reminderEnabled: Boolean(row.reminderEnabled),
          ...(row.reminderMinutes === null || row.reminderMinutes === undefined ? {} : { reminderMinutes: Number(row.reminderMinutes) }),
        });
      }
      cursor = addOccurrence(cursor, recurrence);
      guard++;
      if (guard > 10000) break;
    }
  }
  return occurrences.sort((a, b) => a.occurrenceStart.localeCompare(b.occurrenceStart));
}

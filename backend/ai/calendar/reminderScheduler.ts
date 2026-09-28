import { db } from "../../database.js";

export interface PendingEventReminder {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  startAt: string;
  timezone: string;
  reminderMinutes: number;
  scheduledFor: string;
  queuedAt: string;
}

db.exec(`
CREATE TABLE IF NOT EXISTS ai_event_reminders (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  queued_at TEXT NOT NULL,
  delivered_at TEXT,
  UNIQUE(event_id, scheduled_for)
);
CREATE INDEX IF NOT EXISTS idx_ai_event_reminders_user_pending
  ON ai_event_reminders(user_id, delivered_at, scheduled_for);
`);

function nowIso() {
  return new Date().toISOString();
}

export function queueDueEventReminders(now = new Date()): number {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) throw new Error("Invalid scheduler time");

  const rows = db.prepare(`
    SELECT id, user_id as userId, title, start_at as startAt,
           timezone, reminder_minutes as reminderMinutes
    FROM ai_events
    WHERE reminder_enabled = 1
      AND reminder_minutes IS NOT NULL
      AND recurrence_json IS NULL
  `).all() as any[];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO ai_event_reminders
      (id,event_id,user_id,scheduled_for,queued_at)
    VALUES (?,?,?,?,?)
  `);

  let queued = 0;
  const queuedAt = nowIso();
  const transaction = db.transaction(() => {
    for (const row of rows) {
      const startMs = new Date(String(row.startAt)).getTime();
      const minutes = Number(row.reminderMinutes);
      if (!Number.isFinite(startMs) || !Number.isInteger(minutes) || minutes < 0) continue;

      const scheduledMs = startMs - minutes * 60_000;
      if (scheduledMs > nowMs) continue;

      const scheduledFor = new Date(scheduledMs).toISOString();
      const reminderId = `rem_${row.id}_${scheduledMs}`;
      const result = insert.run(reminderId, row.id, row.userId, scheduledFor, queuedAt);
      queued += result.changes;
    }
  });
  transaction();
  return queued;
}

export function listPendingEventReminders(userId: string, limit = 50): PendingEventReminder[] {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  return db.prepare(`
    SELECT r.id, r.event_id as eventId, r.user_id as userId,
           e.title, e.start_at as startAt, e.timezone,
           e.reminder_minutes as reminderMinutes,
           r.scheduled_for as scheduledFor,
           r.queued_at as queuedAt
    FROM ai_event_reminders r
    JOIN ai_events e ON e.id = r.event_id AND e.user_id = r.user_id
    WHERE r.user_id = ? AND r.delivered_at IS NULL
    ORDER BY r.scheduled_for ASC
    LIMIT ?
  `).all(userId, safeLimit) as PendingEventReminder[];
}

export function acknowledgeEventReminder(userId: string, reminderId: string): boolean {
  const result = db.prepare(`
    UPDATE ai_event_reminders
    SET delivered_at = ?
    WHERE id = ? AND user_id = ? AND delivered_at IS NULL
  `).run(nowIso(), reminderId, userId);
  return result.changes === 1;
}

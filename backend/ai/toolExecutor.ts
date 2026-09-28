import crypto from "node:crypto";
import { db } from "../database.js";
import type { SmartAiAction } from "./types.js";

export interface VerifiedToolResult {
  ok: boolean;
  operation: string;
  record: Record<string, unknown>;
  verification: Record<string, unknown>;
  error?: string;
}

function now() { return new Date().toISOString(); }
function id(prefix: string) { return `${prefix}_${crypto.randomUUID()}`; }
function amount(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error("Amount must be a positive number");
  return Math.round(n * 100) / 100;
}
function text(value: unknown, fallback = "") { return String(value ?? fallback).trim(); }

function readBudget(userId: string) {
  return db.prepare("SELECT user_id as userId, monthly_limit as monthlyLimit, currency, updated_at as updatedAt FROM ai_budgets WHERE user_id = ?").get(userId) as any || null;
}

function readTransaction(userId: string, transactionId: string) {
  return db.prepare(`SELECT id, user_id as userId, title, amount, category, date, payment_method as paymentMethod, notes, created_at as createdAt
    FROM ai_transactions WHERE id = ? AND user_id = ?`).get(transactionId, userId) as any || null;
}

function readTask(userId: string, taskId: string) {
  return db.prepare(`SELECT id, user_id as userId, title, completed, priority, category, due_date as dueDate, due_time as dueTime, note, created_at as createdAt, completed_at as completedAt
    FROM ai_tasks WHERE id = ? AND user_id = ?`).get(taskId, userId) as any || null;
}

function remainingBudget(userId: string) {
  const budget = readBudget(userId);
  if (!budget) return null;
  const row = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ai_transactions WHERE user_id = ? AND substr(date, 1, 7) = substr(date('now'), 1, 7)").get(userId) as any;
  return Math.round((Number(budget.monthlyLimit) - Number(row?.total || 0)) * 100) / 100;
}

export function addTransaction(userId: string, payload: Record<string, unknown>): VerifiedToolResult {
  const uid = text(userId);
  if (!uid) throw new Error("userId is required");
  const transactionId = id("txn");
  const title = text(payload.title);
  if (!title) throw new Error("Transaction title is required");
  const value = amount(payload.amount);
  const category = text(payload.category, "other");
  const date = text(payload.date, now().slice(0, 10));
  const paymentMethod = text(payload.paymentMethod, "cash");
  const notes = text(payload.notes);

  db.prepare(`INSERT INTO ai_transactions (id,user_id,title,amount,category,date,payment_method,notes,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(transactionId, uid, title, value, category, date, paymentMethod, notes || null, now());

  const record = readTransaction(uid, transactionId);
  if (!record) return { ok: false, operation: "addTransaction", record: {}, verification: {}, error: "Database read-back failed after insert" };
  const remaining = remainingBudget(uid);
  return {
    ok: true,
    operation: "addTransaction",
    record,
    verification: { persisted: true, transactionId, monthlyRemaining: remaining }
  };
}

export function updateTransaction(userId: string, payload: Record<string, unknown>): VerifiedToolResult {
  const uid = text(userId);
  const transactionId = text(payload.id);
  if (!transactionId) throw new Error("Transaction id is required");
  const current = readTransaction(uid, transactionId);
  if (!current) throw new Error("Transaction not found for this user");

  const title = payload.title === undefined ? current.title : text(payload.title);
  if (!title) throw new Error("Transaction title is required");
  const value = payload.amount === undefined ? Number(current.amount) : amount(payload.amount);
  const category = payload.category === undefined ? current.category : text(payload.category, "other");
  const date = payload.date === undefined ? current.date : text(payload.date);
  const paymentMethod = payload.paymentMethod === undefined ? current.paymentMethod : text(payload.paymentMethod, "cash");
  const notes = payload.notes === undefined ? current.notes : (text(payload.notes) || null);

  db.prepare(`UPDATE ai_transactions
    SET title=?, amount=?, category=?, date=?, payment_method=?, notes=?
    WHERE id=? AND user_id=?`)
    .run(title, value, category, date, paymentMethod, notes, transactionId, uid);

  const record = readTransaction(uid, transactionId);
  if (!record || record.title !== title || Number(record.amount) !== value || record.date !== date) {
    return { ok: false, operation: "updateTransaction", record: {}, verification: {}, error: "Database read-back failed after transaction update" };
  }
  return { ok: true, operation: "updateTransaction", record, verification: { persisted: true, transactionId } };
}

export function deleteTransaction(userId: string, transactionId: string): VerifiedToolResult {
  const uid = text(userId);
  const idValue = text(transactionId);
  if (!idValue) throw new Error("Transaction id is required");
  const current = readTransaction(uid, idValue);
  if (!current) throw new Error("Transaction not found for this user");

  db.prepare("DELETE FROM ai_transactions WHERE id = ? AND user_id = ?").run(idValue, uid);
  const verify = readTransaction(uid, idValue);
  if (verify) return { ok: false, operation: "deleteTransaction", record: {}, verification: {}, error: "Database read-back failed after transaction delete" };
  return { ok: true, operation: "deleteTransaction", record: current, verification: { persisted: true, deleted: true, transactionId: idValue } };
}

export function updateBudget(userId: string, payload: Record<string, unknown>): VerifiedToolResult {
  const uid = text(userId);
  const limit = amount(payload.monthlyLimit);
  const currency = text(payload.currency, "EGP");
  const updatedAt = now();
  db.prepare(`INSERT INTO ai_budgets (user_id,monthly_limit,currency,updated_at) VALUES (?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET monthly_limit=excluded.monthly_limit,currency=excluded.currency,updated_at=excluded.updated_at`).run(uid, limit, currency, updatedAt);
  const record = readBudget(uid);
  if (!record || Number(record.monthlyLimit) !== limit) return { ok: false, operation: "updateBudget", record: {}, verification: {}, error: "Database read-back failed after budget update" };
  return { ok: true, operation: "updateBudget", record, verification: { persisted: true } };
}

export function addTask(userId: string, payload: Record<string, unknown>): VerifiedToolResult {
  const uid = text(userId);
  const taskId = id("task");
  const title = text(payload.title);
  if (!title) throw new Error("Task title is required");
  db.prepare(`INSERT INTO ai_tasks (id,user_id,title,completed,priority,category,due_date,due_time,note,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(taskId, uid, title, 0, text(payload.priority, "medium"), text(payload.category, "general"), text(payload.dueDate) || null, text(payload.dueTime) || null, text(payload.note) || null, now());
  const record = readTask(uid, taskId);
  if (!record) return { ok: false, operation: "addTask", record: {}, verification: {}, error: "Database read-back failed after task insert" };
  return { ok: true, operation: "addTask", record, verification: { persisted: true, taskId } };
}

export function updateTask(userId: string, payload: Record<string, unknown>): VerifiedToolResult {
  const uid = text(userId);
  const taskId = text(payload.id);
  if (!taskId) throw new Error("Task id is required");
  const current = readTask(uid, taskId);
  if (!current) throw new Error("Task not found for this user");
  const completed = payload.completed === undefined ? Number(current.completed) : (payload.completed ? 1 : 0);
  const title = payload.title === undefined ? current.title : text(payload.title);
  const priority = payload.priority === undefined ? current.priority : text(payload.priority);
  const category = payload.category === undefined ? current.category : text(payload.category);
  const dueDate = payload.dueDate === undefined ? current.dueDate : (text(payload.dueDate) || null);
  const dueTime = payload.dueTime === undefined ? current.dueTime : (text(payload.dueTime) || null);
  const note = payload.note === undefined ? current.note : (text(payload.note) || null);
  const completedAt = completed ? (current.completedAt || now()) : null;
  db.prepare(`UPDATE ai_tasks SET title=?,completed=?,priority=?,category=?,due_date=?,due_time=?,note=?,completed_at=? WHERE id=? AND user_id=?`)
    .run(title, completed, priority, category, dueDate, dueTime, note, completedAt, taskId, uid);
  const record = readTask(uid, taskId);
  if (!record || Number(record.completed) !== completed || record.title !== title) return { ok: false, operation: "updateTask", record: {}, verification: {}, error: "Database read-back failed after task update" };
  return { ok: true, operation: "updateTask", record, verification: { persisted: true, taskId } };
}

export function executeToolAction(userId: string, action: SmartAiAction): VerifiedToolResult {
  if (!action) throw new Error("No executable action supplied");
  switch (action.type) {
    case "add_expense": return addTransaction(userId, action.payload);
    case "update_budget": return updateBudget(userId, action.payload);
    case "add_daily_task": return addTask(userId, action.payload);
    case "update_daily_task": return updateTask(userId, action.payload);
    default: throw new Error(`Unsupported tool action: ${(action as any).type}`);
  }
}

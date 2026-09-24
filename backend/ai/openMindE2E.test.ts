import crypto from "node:crypto";
import { db } from "../database.js";
import { executeToolAction } from "./toolExecutor.js";
import { runOpenMindBrain } from "./openMindBrain.js";

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const userId = `e2e_${crypto.randomUUID()}`;

try {
  const budget = executeToolAction(userId, { type: "update_budget", payload: { monthlyLimit: 5000, currency: "EGP" } });
  assert(budget.ok, "budget must persist before the scenario");

  const first = await runOpenMindBrain({
    message: "صرفت 300 جنيه بنزين النهاردة",
    language: "ar",
    appContext: {},
    userId,
    confirmed: false,
  });
  assert(first.requiresConfirmation === true, "first turn must request confirmation");
  assert(first.action?.type === "add_expense", "first turn must produce an add_expense action");

  const second = await runOpenMindBrain({
    message: "صرفت 300 جنيه بنزين النهاردة",
    language: "ar",
    appContext: {},
    userId,
    confirmed: true,
  });
  assert(second.execution?.ok === true, "confirmed execution must succeed");
  assert((second.execution?.verification as any)?.persisted === true, "read-back verification must be true");
  assert((second.execution?.verification as any)?.monthlyRemaining === 4700, "remaining budget must be 4700 EGP");
  assert(second.reply.includes("300") && second.reply.includes("4700"), "final reply must contain verified amount and balance");

  const row = db.prepare("SELECT amount,title FROM ai_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(userId) as any;
  assert(row?.amount === 300 && row?.title === "بنزين", "database read-back must contain the exact transaction");

  console.log("OPEN MIND E2E transaction scenario passed");
} finally {
  db.prepare("DELETE FROM ai_transactions WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM ai_budgets WHERE user_id = ?").run(userId);
}

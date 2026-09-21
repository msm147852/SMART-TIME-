#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [
  "backend/ai/training/smart-time-v2.jsonl",
  "backend/ai/training/smart-time-grounded-v1.jsonl",
  "backend/ai/training/smart-time-eval-v1.jsonl",
];

const errors = [];
const categoryCounts = new Map();

for (const relative of files) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    errors.push(`${relative}: file not found`);
    continue;
  }

  const lines = fs.readFileSync(file, "utf8").split(/\\r?\\n/).filter(Boolean);
  const seen = new Set();
  lines.forEach((line, index) => {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      errors.push(`${relative}: invalid JSON on line ${index + 1}`);
      return;
    }
    const required = relative.includes("eval")
      ? ["category", "input", "expected_behavior"]
      : ["category", "instruction", "input", "output"];
    for (const key of required) {
      if (typeof row[key] !== "string" || !row[key].trim()) {
        errors.push(`${relative}: line ${index + 1} missing non-empty ${key}`);
      }
    }
    const duplicateKey = row.input?.trim();
    if (duplicateKey && seen.has(duplicateKey)) {
      errors.push(`${relative}: duplicate input on line ${index + 1}`);
    }
    if (duplicateKey) seen.add(duplicateKey);
    if (row.category) categoryCounts.set(row.category, (categoryCounts.get(row.category) || 0) + 1);
  });

  if (!relative.includes("eval") && lines.length < 40) {
    errors.push(`${relative}: expected at least 40 training examples`);
  }
  if (relative.includes("eval") && lines.length < 15) {
    errors.push(`${relative}: expected at least 15 held-out examples`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("SMART AI datasets valid.");
console.log(Object.fromEntries(categoryCounts));

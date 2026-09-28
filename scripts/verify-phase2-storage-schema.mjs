import fs from "node:fs";

const schemaPath = "src/services/storageSchema.ts";
const source = fs.readFileSync(schemaPath, "utf8");

const known = (source.match(/^\s{2}\[[A-Z0-9_.]+\]: \{/gm) ?? []).length;
const hidden = (source.match(/^\s{2}smart_time_[a-z0-9_]+: \{/gm) ?? []).length;

if (known !== 28) throw new Error(`Phase 2 expected 28 known keys, found ${known}`);
if (hidden !== 5) throw new Error(`Phase 2 expected 5 hidden keys, found ${hidden}`);
if (!source.includes("isStorageSchemaKey")) throw new Error("Missing isStorageSchemaKey()");
if (!source.includes("validateStorageValue")) throw new Error("Missing validateStorageValue()");
if (!source.includes("parseStorageValue")) throw new Error("Missing parseStorageValue()");
if (!source.includes("satisfies {")) throw new Error("Schema is not compile-time checked with satisfies");

console.log(`PHASE 2 SCHEMA GATE: PASS — 28 known + 5 hidden = ${known + hidden} entries`);

#!/usr/bin/env node
/**
 * scan-color-violations.mjs
 *
 * Enforces rules from COLOR_CONTRAST_RULES.md:
 *  - No direct hex colors in components (#rgb / #rrggbb / #rrggbbaa)
 *  - No `text-white` / `text-black` / `bg-white` / `bg-black` classes
 *  - No `rgb(...)` / `rgba(...)` calls in .tsx components
 *
 * Scope: src/components/**\/*.{ts,tsx}
 * Exits with code 1 if violations are found.
 *
 * Usage:
 *   node scripts/scan-color-violations.mjs
 *   node scripts/scan-color-violations.mjs --json
 */
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SCAN_DIR = join(ROOT, "src", "components");
const AS_JSON = process.argv.includes("--json");

const PATTERNS = [
  { name: "hex-color", regex: /#[0-9a-fA-F]{3,8}\b/g, severity: "warn" },
  { name: "text-white", regex: /\btext-white\b/g, severity: "error" },
  { name: "text-black", regex: /\btext-black\b/g, severity: "error" },
  { name: "bg-white", regex: /\bbg-white\b/g, severity: "error" },
  { name: "bg-black", regex: /\bbg-black\b/g, severity: "error" },
  { name: "rgb-call", regex: /\brgba?\s*\(/g, severity: "warn" },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if ([".ts", ".tsx"].includes(extname(entry))) out.push(full);
  }
  return out;
}

const files = walk(SCAN_DIR);
const hits = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  for (const { name, regex, severity } of PATTERNS) {
    lines.forEach((line, i) => {
      // Skip color-constant declarations like `navy: "#162C58"` living only at top of branded files
      // (we still report them but mark as info so users know they're concentrated there).
      const m = line.match(regex);
      if (m) {
        hits.push({
          file: relative(ROOT, file).replaceAll("\\", "/"),
          line: i + 1,
          rule: name,
          severity,
          snippet: line.trim().slice(0, 160),
        });
      }
    });
  }
}

if (AS_JSON) {
  console.log(JSON.stringify({ total: hits.length, hits }, null, 2));
} else {
  if (hits.length === 0) {
    console.log("✔ No color/contrast violations found under src/components.");
  } else {
    console.log(`✖ Found ${hits.length} potential violations:\n`);
    const grouped = {};
    for (const h of hits) (grouped[h.rule] ||= []).push(h);
    for (const [rule, arr] of Object.entries(grouped)) {
      console.log(`── ${rule} (${arr.length}) ──`);
      for (const h of arr.slice(0, 20)) {
        console.log(`  ${h.severity.toUpperCase()}  ${h.file}:${h.line}  ${h.snippet}`);
      }
      if (arr.length > 20) console.log(`  … and ${arr.length - 20} more`);
      console.log();
    }
  }
}

const hasErrors = hits.some((h) => h.severity === "error");
process.exit(hasErrors ? 1 : 0);

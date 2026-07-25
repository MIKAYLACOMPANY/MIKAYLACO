import fs from "node:fs";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node audit-signals.mjs <feed.js-or-json>");
  process.exit(2);
}

const required = ["id", "city", "image", "sourceUrl", "source", "creator", "title", "signal", "query", "pieces"];
const text = fs.readFileSync(input, "utf8");
let items;

if (input.endsWith(".json")) {
  items = JSON.parse(text);
} else {
  const match = text.match(/(?:window\.)?MIKAYLA_STYLE_FEED\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!match) throw new Error("Could not find MIKAYLA_STYLE_FEED array");
  items = Function(`"use strict"; return (${match[1]})`)();
}

const errors = [];
const ids = new Set();
for (const [index, item] of items.entries()) {
  for (const key of required) {
    if (item[key] === undefined || item[key] === null || item[key] === "") {
      errors.push(`Item ${index + 1}: missing ${key}`);
    }
  }
  if (!Array.isArray(item.pieces)) errors.push(`Item ${index + 1}: pieces must be an array`);
  if (!/^https:\/\//.test(item.image || "")) errors.push(`Item ${index + 1}: image must use HTTPS`);
  if (!/^https:\/\//.test(item.sourceUrl || "")) errors.push(`Item ${index + 1}: sourceUrl must use HTTPS`);
  if (ids.has(item.id)) errors.push(`Duplicate id: ${item.id}`);
  ids.add(item.id);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Signal audit passed: ${items.length} sourced looks`);

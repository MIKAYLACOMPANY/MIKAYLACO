import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const required = [
  "index.html",
  "package.json",
  "vercel.json",
  ".env.example",
  "api/analyze.js",
  "api/itinerary.js",
  "api/closet.js",
  "api/shop-link.js",
  "api/style-signals.js",
];

const errors = [];
for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing ${relative}`);
}

const textFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "skills"].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:html|css|js|json|md|example)$/.test(entry.name)) textFiles.push(full);
  }
}
walk(root);

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /pina_[A-Za-z0-9_-]{20,}/,
  /^ANTHROPIC_API_KEY=(?!\s*$).+/m,
  /^RESEND_API_KEY=(?!\s*$).+/m,
];
for (const file of textFiles) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) errors.push(`Possible committed secret in ${path.relative(root, file)}`);
  }
}

const htmlPath = path.join(root, "index.html");
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const journeys = [
    ["Discover", /Discover/i],
    ["Visual Shop", /Visual Shop|Shop (?:This |the )?Look/i],
    ["Plan", /Plan|Itinerary/i],
    ["Closet", /Closet/i],
    ["Studio", /Studio/i],
  ];
  for (const [label, pattern] of journeys) {
    if (!pattern.test(html)) errors.push(`Primary journey missing from index.html: ${label}`);
  }
  if (!/direct retailer|affiliate|commission/i.test(html)) errors.push("Shopping relationship language is missing from index.html");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Static release audit passed: ${textFiles.length} files reviewed`);

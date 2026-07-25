const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);
const apiNames = new Set([
  "city-photos", "recommend", "outfits", "analyze", "trends", "live-trends",
  "product-search", "waitlist", "featured", "products", "closet", "itinerary",
  "shop-link", "style-signals",
]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function createResponse(res) {
  return {
    setHeader(name, value) { res.setHeader(name, value); },
    status(code) {
      res.statusCode = code;
      return this;
    },
    end(body) { res.end(body); },
    json(value) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(value));
    },
  };
}

async function handleApi(req, res, url) {
  const name = url.pathname.replace(/^\/api\//, "");
  if (!apiNames.has(name)) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "API route not found" }));
    return;
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = null;
  if (raw) {
    try { body = JSON.parse(raw); }
    catch { body = raw; }
  }
  req.body = body;
  req.query = Object.fromEntries(url.searchParams.entries());
  try {
    const route = require(path.join(root, "api", `${name}.js`));
    await route(req, createResponse(res));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Local API error" }));
  }
}

function serveStatic(res, pathname) {
  let relative = decodeURIComponent(pathname);
  if (relative === "/") relative = "/index.html";
  const file = path.resolve(root, `.${relative}`);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) await handleApi(req, res, url);
  else serveStatic(res, url.pathname);
}).listen(port, "127.0.0.1", () => {
  console.log(`MIKAYLA ready at http://127.0.0.1:${port}`);
});

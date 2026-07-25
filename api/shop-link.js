const ALLOWED_HOSTS = new Set([
  "www.farfetch.com",
  "farfetch.com",
  "www.revolve.com",
  "revolve.com",
  "www.asos.com",
  "asos.com",
]);

const MERCHANT_ENV = {
  farfetch: "AWIN_FARFETCH_MERCHANT_ID",
  revolve: "AWIN_REVOLVE_MERCHANT_ID",
  asos: "AWIN_ASOS_MERCHANT_ID",
};

module.exports = async function shopLink(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET required" });

  let destination;
  try {
    destination = new URL(String(req.query?.url || ""));
  } catch {
    return res.status(400).json({ error: "Invalid destination" });
  }
  if (destination.protocol !== "https:" || !ALLOWED_HOSTS.has(destination.hostname)) {
    return res.status(400).json({ error: "Unsupported retailer" });
  }

  const retailer = String(req.query?.retailer || "").toLowerCase();
  const publisherId = process.env.AWIN_PUBLISHER_ID;
  const merchantId = process.env[MERCHANT_ENV[retailer] || ""];
  let outbound = destination.toString();

  if (publisherId && merchantId) {
    const clickRef = String(req.query?.look || "mikayla-look").replace(/[^a-z0-9_-]/gi, "").slice(0, 50);
    outbound = "https://www.awin1.com/cread.php?" + new URLSearchParams({
      awinmid: merchantId,
      awinaffid: publisherId,
      clickref: clickRef,
      ued: destination.toString(),
    }).toString();
  }

  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Location", outbound);
  return res.status(302).end();
};

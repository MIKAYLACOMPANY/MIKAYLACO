function getImage(pin) {
  const images = pin?.media?.images || pin?.media?.image || {};
  const preferred = ["1200x", "600x", "400x300", "150x150"];
  for (const key of preferred) {
    if (images[key]?.url) return images[key].url;
  }
  const first = Object.values(images).find((image) => image && image.url);
  return first?.url || "";
}

function toSignal(pin, index) {
  const title = pin.title || pin.alt_text || "City style reference";
  const description = pin.description || pin.alt_text || "Open the original Pin for full creator context.";
  const cityMatch = `${title} ${description}`.match(/\b(Paris|London|Milan|Rome|Tokyo|Barcelona|Santorini|Positano|Ibiza|Mykonos|Lisbon|Copenhagen|Amsterdam|New York|Dubai|Bali|Tulum|Marrakech)\b/i);
  const city = cityMatch ? cityMatch[1].replace(/\b\w/g, (letter) => letter.toUpperCase()) : "City Edit";
  const query = `${city} women outfit ${title}`.slice(0, 180);
  return {
    id: `pinterest-${pin.id || index}`,
    city,
    image: getImage(pin),
    sourceUrl: `https://www.pinterest.com/pin/${pin.id}/`,
    creator: pin.board_owner?.username ? `@${pin.board_owner.username}` : "Pinterest",
    source: "Live MIKAYLA Pinterest board",
    title,
    signal: description.slice(0, 180),
    query,
    pieces: [],
  };
}

module.exports = async function styleSignals(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET required" });
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");

  const token = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;
  if (!token || !boardId) return res.status(200).json({ items: [], live: false, reason: "Pinterest board access is not configured" });

  try {
    const endpoint = `https://api.pinterest.com/v5/boards/${encodeURIComponent(boardId)}/pins?page_size=50`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error(`Pinterest API ${response.status}`);
    const data = await response.json();
    const requestedCity = String(req.query?.city || "").trim().toLowerCase();
    let items = (data.items || []).map(toSignal).filter((item) => item.image);
    if (requestedCity) {
      const cityItems = items.filter((item) => item.city.toLowerCase() === requestedCity);
      if (cityItems.length) items = cityItems;
    }
    return res.status(200).json({ items, live: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("style-signals error:", error.message);
    return res.status(200).json({ items: [], live: false, reason: "Pinterest board is temporarily unavailable" });
  }
};

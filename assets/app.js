const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const state = {
  city: "Paris",
  closet: JSON.parse(localStorage.getItem("mikayla-closet") || "[]"),
  itinerary: JSON.parse(localStorage.getItem("mikayla-itinerary") || "null"),
  savedLooks: JSON.parse(localStorage.getItem("mikayla-looks") || "[]"),
  mixer: {},
};

const heroImages = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=90",
];

const cities = {
  Paris: { code: "PAR", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=86", vibe: "Polished restraint with one point of tension.", palette: ["#171717", "#c7b69e", "#eee9df", "#7b1624"] },
  Milan: { code: "MIL", image: "https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?auto=format&fit=crop&w=1600&q=86", vibe: "Architectural tailoring, rich leather, and immaculate finishing.", palette: ["#171717", "#5f4333", "#d5c4a9", "#8a1e28"] },
  London: { code: "LON", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=86", vibe: "Heritage layers interrupted by something irreverent.", palette: ["#1d242b", "#7d1e2c", "#b2a18e", "#e7e3da"] },
  "New York": { code: "NYC", image: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=1600&q=86", vibe: "Downtown ease sharpened with uptown structure.", palette: ["#121212", "#f2f0ea", "#7c7a73", "#6d1520"] },
  Tokyo: { code: "TYO", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=86", vibe: "Precision, proportion, and one beautifully unexpected detail.", palette: ["#101010", "#e4e1d8", "#a8b1a6", "#b32234"] },
  Barcelona: { code: "BCN", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1600&q=86", vibe: "Mediterranean colour grounded by confident, easy shapes.", palette: ["#204e67", "#d7744a", "#f2dfb4", "#753a30"] },
  Positano: { code: "PSA", image: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1600&q=86", vibe: "Sun-washed glamour in pieces that move with the coast.", palette: ["#f0e7d6", "#d5a657", "#406e80", "#b74a3f"] },
  Copenhagen: { code: "CPH", image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=86", vibe: "Practical minimalism with playful colour and deliberate volume.", palette: ["#1e2925", "#c8d0c7", "#e8d8bd", "#ae4246"] },
  Dubai: { code: "DXB", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=86", vibe: "Modest glamour, liquid tailoring, and high-impact accessories.", palette: ["#c5aa7d", "#3f2822", "#f0e8d8", "#7f5139"] },
};

const fallbackTrends = {
  Paris: [
    ["The silhouette", "Long-line tailoring", "Fluid trousers, a close-fitting base, and a structured layer.", "women longline tailored blazer", "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85"],
    ["The shoe", "A pointed flat", "Polished enough for dinner, practical enough for the city.", "women pointed ballet flat", "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85"],
    ["The finish", "A precise little bag", "One recognisable shape, worn without performance.", "mini structured leather bag", "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=85"],
  ],
};

const productCategories = [
  ["tops", "Top"],
  ["bottoms", "Bottom"],
  ["shoes", "Shoes"],
  ["accessories", "Finish"],
];

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3300);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function titleCase(value = "") {
  return String(value).replace(/[_-]/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function normaliseCity(value) {
  const query = value.trim().toLowerCase();
  return Object.keys(cities).find(name => name.toLowerCase() === query)
    || Object.keys(cities).find(name => name.toLowerCase().includes(query) || query.includes(name.toLowerCase()))
    || titleCase(value.trim());
}

function setHeader() {
  $("#siteHeader").classList.toggle("scrolled", window.scrollY > 50);
}
window.addEventListener("scroll", setHeader, { passive: true });
setHeader();

let heroIndex = 0;
setInterval(() => {
  if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  heroIndex = (heroIndex + 1) % heroImages.length;
  $(".hero-media").style.backgroundImage = `url("${heroImages[heroIndex]}")`;
}, 12000);

$("#menuButton").addEventListener("click", () => {
  $("#mobileDrawer").classList.add("open");
  $("#mobileDrawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
});
function closeDrawer() {
  $("#mobileDrawer").classList.remove("open");
  $("#mobileDrawer").setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}
$("#drawerClose").addEventListener("click", closeDrawer);
$$(".mobile-drawer a").forEach(link => link.addEventListener("click", closeDrawer));

const dialog = $("#searchDialog");
$$("[data-open-search]").forEach(button => button.addEventListener("click", () => dialog.showModal()));
$("#searchClose").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

async function searchCity(cityValue, shouldScroll = true) {
  const city = normaliseCity(cityValue || "Paris");
  state.city = city;
  const profile = cities[city] || {
    code: city.slice(0, 3).toUpperCase(),
    image: cities.Paris.image,
    vibe: `A live reading of what ${city} is wearing now.`,
    palette: cities.Paris.palette,
  };
  $("#cityTitle").innerHTML = `${escapeHTML(city)}, <em>right now.</em>`;
  $("#cityStamp").textContent = profile.code;
  $("#cityHeroImage").src = profile.image;
  $("#cityHeroImage").alt = `${city} city view`;
  $("#trendVibe").textContent = profile.vibe;
  $("#cityUpdated").textContent = "Reading now";
  $("#palette").innerHTML = profile.palette.map(color => `<i style="--swatch:${color}"></i>`).join("");
  $("#readerCity").value = $(`#readerCity option[value="${CSS.escape(city)}"]`) ? city : "Paris";
  $("#studioCity").value = $(`#studioCity option[value="${CSS.escape(city)}"]`) ? city : "Paris";
  renderTrendLoading();
  if (shouldScroll) $("#city-edit").scrollIntoView({ behavior: "smooth" });

  try {
    const response = await fetch(`/api/live-trends?city=${encodeURIComponent(city)}`);
    if (!response.ok) throw new Error("Trend service unavailable");
    const data = await response.json();
    renderTrends(city, data, profile);
  } catch {
    renderTrends(city, null, profile);
    toast(`Showing the latest saved ${city} edit while live signals reconnect.`);
  }
  await loadMixer(city);
}

function renderTrendLoading() {
  $("#trendGrid").innerHTML = Array.from({ length: 3 }, () => `
    <article class="trend-card loading-shimmer">
      <div class="trend-image"></div>
      <p class="card-meta">Reading live signals</p>
      <h3>Building the edit…</h3>
    </article>`).join("");
}

function buildFallbackTrend(city, index) {
  const generic = [
    ["The silhouette", "The city's leading proportion", `A considered shape currently defining ${city} street style.`, `${city} women street style outfit`, "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=85"],
    ["The essential", "The piece locals repeat", "The item that makes the rest of the wardrobe feel current.", `${city} trending fashion women`, "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85"],
    ["The finish", "The accessory changing the look", "A precise final detail with outsized impact.", `${city} trending accessories women`, "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85"],
  ];
  return (fallbackTrends[city] || generic)[index] || generic[index];
}

function renderTrends(city, data, profile) {
  const items = Array.isArray(data?.trending_items) && data.trending_items.length
    ? data.trending_items.slice(0, 3)
    : [0, 1, 2].map(index => {
        const item = buildFallbackTrend(city, index);
        return { category: item[0], name: item[1], why_trending: item[2], retailer_search_query: item[3], image: item[4] };
      });
  $("#trendVibe").textContent = data?.vibe_of_the_moment || data?.headline || profile.vibe;
  $("#trendSource").textContent = data?._sources?.total_inputs
    ? `Synthesised from ${data._sources.total_inputs} current editorial and social signals.`
    : "Synthesised from current fashion coverage and high-engagement social signals.";
  $("#cityUpdated").textContent = data?.generated_at ? `Updated ${new Date(data.generated_at).toLocaleDateString([], { month: "short", day: "numeric" })}` : "Updated today";
  $("#trendGrid").innerHTML = items.map((item, index) => {
    const fallback = buildFallbackTrend(city, index);
    const image = item.image || fallback[4];
    const query = item.retailer_search_query || item.name;
    return `<article class="trend-card">
      <div class="trend-image"><img src="${escapeHTML(image)}" alt="${escapeHTML(item.name || "City trend")}" loading="lazy"></div>
      <p class="card-meta">${escapeHTML(item.category || fallback[0])}</p>
      <h3>${escapeHTML(item.name || fallback[1])}</h3>
      <p>${escapeHTML(item.why_trending || item.description || fallback[2])}</p>
      <a href="https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}" target="_blank" rel="noopener">Shop the direction ↗</a>
    </article>`;
  }).join("");
}

$("#heroSearch").addEventListener("submit", event => {
  event.preventDefault();
  searchCity($("#heroCity").value);
});
$("#dialogSearch").addEventListener("submit", event => {
  event.preventDefault();
  const value = $("#dialogCity").value;
  dialog.close();
  searchCity(value);
});
$$("[data-city]").forEach(button => button.addEventListener("click", () => {
  dialog.close();
  searchCity(button.dataset.city);
}));
$("#refreshTrends").addEventListener("click", () => searchCity(state.city, false));

$("#heroCity").addEventListener("input", event => {
  const value = event.target.value.trim().toLowerCase();
  const matches = Object.keys(cities).filter(city => city.toLowerCase().includes(value)).slice(0, 5);
  const box = $("#citySuggestions");
  if (!value || !matches.length) {
    box.hidden = true;
    return;
  }
  box.innerHTML = matches.map(city => `<button type="button" data-suggest="${city}"><span>${city}</span><small>${cities[city].code}</small></button>`).join("");
  box.hidden = false;
  $$("[data-suggest]", box).forEach(button => button.addEventListener("click", () => {
    $("#heroCity").value = button.dataset.suggest;
    box.hidden = true;
    searchCity(button.dataset.suggest);
  }));
});

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const [header, data] = String(reader.result).split(",");
      resolve({ data, mediaType: header.match(/data:(.*);base64/)?.[1] || file.type });
    };
    reader.readAsDataURL(file);
  });
}

$("#itineraryFile").addEventListener("change", event => {
  const file = event.target.files[0];
  if (file) $("#itineraryFileLabel").textContent = file.name;
});

$("#itineraryForm").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("button[type='submit']", event.currentTarget);
  const file = $("#itineraryFile").files[0];
  const text = $("#itineraryText").value.trim();
  if (!file && !text) return toast("Add an itinerary file or paste your plans first.");
  button.disabled = true;
  button.innerHTML = "Reading every place…";
  $("#itineraryResult").innerHTML = `<div class="result-empty loading-shimmer"><p class="kicker">Venue intelligence</p><h3>Reading atmosphere, dress codes, and rewear possibilities…</h3></div>`;
  try {
    const payload = {
      itinerary_text: text,
      city: state.city,
      budget: $("#itineraryBudget").value,
      rewear: Number($("#itineraryRewear").value),
    };
    if (file) {
      const encoded = await fileToPayload(file);
      if (file.type === "application/pdf") payload.document_base64 = encoded.data;
      else payload.image_base64 = encoded.data;
      payload.media_type = encoded.mediaType;
    }
    const response = await fetch("/api/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || "Could not read itinerary");
    state.itinerary = data;
    localStorage.setItem("mikayla-itinerary", JSON.stringify(data));
    renderItinerary(data);
    toast("Your itinerary wardrobe is ready.");
  } catch (error) {
    $("#itineraryResult").innerHTML = `<div class="result-empty"><p class="kicker">We could not finish that read</p><h3>${escapeHTML(error.message)}</h3><p>Try pasting the itinerary text or use a clear screenshot.</p></div>`;
  } finally {
    button.disabled = false;
    button.innerHTML = `Style my itinerary <span>↗</span>`;
  }
});

function renderItinerary(data) {
  const schedule = Array.isArray(data.schedule) ? data.schedule : [];
  $("#itineraryResult").innerHTML = `
    <div class="trip-summary">
      <div><p class="kicker">${escapeHTML(data.dates || "Your trip")}</p><h3>${escapeHTML(data.destination || state.city)}</h3></div>
      <p>${escapeHTML(data.total_occasions || schedule.reduce((sum, day) => sum + (day.events?.length || 0), 0))} occasions</p>
    </div>
    <p class="capsule-note">${escapeHTML(data.capsule_note || "A considered capsule built around the way your days actually unfold.")}</p>
    ${schedule.map(day => `<section class="trip-day">
      <h4>Day ${escapeHTML(day.day)} · ${escapeHTML(day.date || "")}</h4>
      ${(day.events || []).map(item => `<article class="event-card">
        <time>${escapeHTML(item.time || "—")}</time>
        <div>
          <h5>${escapeHTML(item.venue || item.venue_type || "Your plan")}</h5>
          <span class="dress-code">${escapeHTML(item.dress_code || "City appropriate")}</span>
          <p class="event-outfit">${escapeHTML(item.outfit?.description || "")}</p>
          <p class="event-note">${escapeHTML(item.outfit?.stylist_note || "")}</p>
        </div>
      </article>`).join("")}
    </section>`).join("")}`;
}
if (state.itinerary) renderItinerary(state.itinerary);

function categoriseType(type = "") {
  const value = type.toLowerCase();
  if (/top|shirt|blouse|blazer|jacket|coat|knit|sweater|cami/.test(value)) return "tops";
  if (/trouser|pant|jean|skirt|short/.test(value)) return "bottoms";
  if (/dress|gown|jumpsuit/.test(value)) return "dresses";
  if (/shoe|heel|flat|sandal|boot|loafer|sneaker|mule/.test(value)) return "shoes";
  return "accessories";
}

$("#closetFile").addEventListener("change", async event => {
  const files = [...event.target.files].slice(0, 8);
  for (const file of files) await addClosetPiece(file);
  event.target.value = "";
});

async function addClosetPiece(file) {
  const encoded = await fileToPayload(file);
  const localImage = `data:${encoded.mediaType};base64,${encoded.data}`;
  const placeholder = {
    id: `piece-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "Analysing piece…",
    color: "Reading colour",
    category: "accessories",
    image: localImage,
  };
  state.closet.unshift(placeholder);
  persistCloset();
  renderCloset();
  try {
    const response = await fetch("/api/closet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "identify", image_base64: encoded.data, mime_type: encoded.mediaType }),
    });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error);
    Object.assign(placeholder, result, { category: categoriseType(result.type) });
    toast(`${result.type} added to your closet.`);
  } catch {
    Object.assign(placeholder, { type: titleCase(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")) || "Closet piece", color: "Tap into any trip", category: "accessories" });
    toast("Piece saved. AI categorisation will complete when styling intelligence is available.");
  }
  persistCloset();
  renderCloset();
}

function persistCloset() {
  try {
    localStorage.setItem("mikayla-closet", JSON.stringify(state.closet));
  } catch {
    toast("Your browser storage is full. Remove a few large photos before adding more.");
  }
}

function renderCloset(filter = "all") {
  $("#closetCount").textContent = state.closet.length;
  const items = filter === "all" ? state.closet : state.closet.filter(item => item.category === filter);
  if (!items.length) {
    $("#closetGrid").innerHTML = `<div class="closet-empty"><span>+</span><p>${state.closet.length ? "No pieces in this category yet." : "Your digital wardrobe begins here."}</p><label for="closetFile">Upload a piece</label></div>`;
    return;
  }
  $("#closetGrid").innerHTML = items.map(item => `<article class="closet-item">
    <img src="${item.image}" alt="${escapeHTML(item.type)}">
    <button class="closet-remove" data-remove="${item.id}" aria-label="Remove ${escapeHTML(item.type)}">×</button>
    <div class="closet-item-info"><strong>${escapeHTML(item.type)}</strong><small>${escapeHTML(item.color || item.material || "Saved piece")}</small></div>
  </article>`).join("");
  $$("[data-remove]").forEach(button => button.addEventListener("click", () => {
    state.closet = state.closet.filter(item => item.id !== button.dataset.remove);
    persistCloset();
    renderCloset(filter);
  }));
}
renderCloset();
$$("[data-filter]", $("#closetFilters")).forEach(button => button.addEventListener("click", () => {
  $$("[data-filter]", $("#closetFilters")).forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  renderCloset(button.dataset.filter);
}));

$("#readerFile").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  $("#readerPreview").src = URL.createObjectURL(file);
  $("#readerPreview").hidden = false;
  $(".reader-prompt").hidden = true;
});

$("#readerForm").addEventListener("submit", async event => {
  event.preventDefault();
  const file = $("#readerFile").files[0];
  if (!file) return toast("Upload an outfit first.");
  const button = $("button[type='submit']", event.currentTarget);
  button.disabled = true;
  button.innerHTML = "Reading every piece…";
  $("#readerResult").innerHTML = `<div class="lens-mark loading-shimmer"><span></span></div><p>Reading silhouette, pieces, and city relevance…</p>`;
  try {
    const encoded = await fileToPayload(file);
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: encoded.data, mediaType: encoded.mediaType, city: $("#readerCity").value }),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || "Analysis could not be completed");
    renderAnalysis(data);
  } catch (error) {
    $("#readerResult").innerHTML = `<div class="lens-mark"><span></span></div><p>${escapeHTML(error.message)}</p><small>Try a clear, full-length outfit image</small>`;
  } finally {
    button.disabled = false;
    button.innerHTML = `Read this look <span>↗</span>`;
  }
});

function renderAnalysis(data) {
  const pieces = Array.isArray(data.pieces) ? data.pieces : [];
  $("#readerResult").style.alignItems = "stretch";
  $("#readerResult").innerHTML = `
    <div class="analysis-head">
      <span class="analysis-score">${escapeHTML(data.trend_relevance?.score || "—")}</span>
      <p class="kicker">City score · ${escapeHTML(data.trend_relevance?.city || $("#readerCity").value)}</p>
      <h3>${escapeHTML(data.aesthetic_label || data.overall_vibe || "Your look, decoded")}</h3>
      <p>${escapeHTML(data.trend_relevance?.verdict || data.rating_reason || "")}</p>
    </div>
    <div class="analysis-pieces">
      ${pieces.length ? pieces.map(piece => `<article class="analysis-piece">
        <strong>${escapeHTML(piece.description || piece.category)}</strong>
        <p>${escapeHTML(piece.trend_note || piece.style_notes || "")}</p>
        <div class="tier-links">${["luxury", "mid", "budget"].map(tier => {
          const link = piece.buy_tiers?.[tier]?.[0];
          return link ? `<a href="${escapeHTML(link.url)}" target="_blank" rel="noopener">${titleCase(tier)} ↗</a>` : "";
        }).join("")}</div>
      </article>`).join("") : `<article class="analysis-piece"><strong>Look received</strong><p>${escapeHTML(data.city_styling_tip || "Detailed piece matching will appear when AI vision is configured.")}</p></article>`}
    </div>`;
}

async function loadMixer(city = state.city) {
  $("#mixerRails").innerHTML = productCategories.map(([, label]) => `<div class="mixer-rail"><div class="rail-loading">Reading ${label.toLowerCase()} options…</div></div>`).join("");
  const results = await Promise.all(productCategories.map(async ([category, label]) => {
    try {
      const response = await fetch(`/api/products?city=${encodeURIComponent(city)}&category=${category}&limit=6`);
      const data = await response.json();
      return [category, label, data.products || []];
    } catch {
      return [category, label, []];
    }
  }));
  results.forEach(([category, label, products]) => {
    state.mixer[category] = { label, products, index: 0 };
  });
  renderMixer();
}

function renderMixer() {
  $("#mixerRails").innerHTML = productCategories.map(([category]) => {
    const rail = state.mixer[category];
    const visibleProducts = filteredProducts(rail?.products || []);
    if (rail) rail.visibleProducts = visibleProducts;
    const safeIndex = visibleProducts.length ? rail.index % visibleProducts.length : 0;
    if (rail) rail.index = safeIndex;
    const product = visibleProducts[safeIndex];
    if (!product) return `<div class="mixer-rail"><div class="rail-loading">${rail?.label || category} options are being refreshed.</div></div>`;
    return `<div class="mixer-rail" data-rail="${category}">
      <button class="rail-arrow" data-direction="-1" aria-label="Previous ${rail.label}">←</button>
      <article class="rail-product">
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}">
        <div>
          <span class="category">${escapeHTML(rail.label)} · ${rail.index + 1} of ${visibleProducts.length}</span>
          <h3>${escapeHTML(product.name)}</h3>
          <p>${escapeHTML(product.brand || "")} · $${Number(product.price || 0).toLocaleString()}</p>
          <a href="${escapeHTML(product.affiliate || "#")}" target="_blank" rel="noopener">Shop this piece ↗</a>
        </div>
      </article>
      <button class="rail-arrow" data-direction="1" aria-label="Next ${rail.label}">→</button>
    </div>`;
  }).join("");
  $$("[data-rail]").forEach(railEl => {
    $$("[data-direction]", railEl).forEach(button => button.addEventListener("click", () => {
      const rail = state.mixer[railEl.dataset.rail];
      const products = rail.visibleProducts || rail.products;
      rail.index = (rail.index + Number(button.dataset.direction) + products.length) % products.length;
      renderMixer();
    }));
  });
  renderLookStack();
}

function renderLookStack() {
  const selected = selectedMixerProducts();
  $("#lookStack").innerHTML = selected.length ? selected.map(product => `<div class="stack-piece"><img src="${escapeHTML(product.image)}" alt=""><span>${escapeHTML(product.name)}</span></div>`).join("") : `<div class="stack-placeholder"></div>`;
  $("#lookTotal").textContent = `$${selected.reduce((sum, product) => sum + Number(product.price || 0), 0).toLocaleString()}`;
}

function filteredProducts(products) {
  const budget = $("#studioBudget").value;
  if (budget === "budget") return products.filter(product => Number(product.price || 0) < 150);
  if (budget === "mid") return products.filter(product => Number(product.price || 0) >= 150 && Number(product.price || 0) <= 400);
  if (budget === "luxury") return products.filter(product => Number(product.price || 0) > 400);
  return products;
}

function selectedMixerProducts() {
  return productCategories.map(([category]) => {
    const rail = state.mixer[category];
    const products = rail?.visibleProducts || rail?.products || [];
    return products[rail?.index || 0];
  }).filter(Boolean);
}

$("#studioCity").addEventListener("change", event => loadMixer(event.target.value));
$("#studioBudget").addEventListener("change", renderMixer);
$("#saveLook").addEventListener("click", () => {
  const selected = selectedMixerProducts();
  if (!selected.length) return toast("Your look is still loading.");
  state.savedLooks.push({ id: Date.now(), city: $("#studioCity").value, pieces: selected });
  localStorage.setItem("mikayla-looks", JSON.stringify(state.savedLooks));
  toast(state.itinerary ? "Look saved and ready to assign to your itinerary." : "Look saved. Upload an itinerary whenever you are ready.");
});

loadMixer("Paris");

(function () {
  "use strict";

  var feed = Array.isArray(window.MIKAYLA_STYLE_FEED) ? window.MIKAYLA_STYLE_FEED : [];
  var state = {
    signals: feed.slice(),
    signalMode: "curated",
    selectedCity: "All",
    closet: readStore("mikayla_closet_v4", []),
    itinerary: readStore("mikayla_itinerary_v4", null),
    savedLooks: readStore("mikayla_saved_looks_v4", []),
    savedInspiration: readStore("mikayla_saved_inspiration_v1", []),
    uploadedReferences: readStore("mikayla_uploaded_references_v1", []),
    hiddenInspiration: readStore("mikayla_hidden_inspiration_v1", []),
    tasteFeedback: readStore("mikayla_taste_feedback_v1", {}),
    assignments: readStore("mikayla_assignments_v4", {}),
    mixer: {},
    pendingVisualReference: null,
    refinements: readStore("mikayla_refinements_v1", { occasion: "", colour: "", size: "", region: "Canada" })
  };

  var studioDefaults = {
    tops: [
      { id: "top-white-shirt", name: "Crisp white shirt", note: "The city-neutral foundation", price: 98, query: "women crisp white cotton shirt" },
      { id: "top-silk-cami", name: "Silk camisole", note: "A refined evening base", price: 148, query: "women silk camisole" },
      { id: "top-knit", name: "Fine neutral knit", note: "Soft structure for cooler streets", price: 120, query: "women fine neutral knit top" }
    ],
    bottoms: [
      { id: "bottom-trouser", name: "Wide-leg trouser", note: "Tailored without feeling formal", price: 168, query: "women tailored wide leg trouser" },
      { id: "bottom-denim", name: "Straight-leg denim", note: "Relaxed, clean, city-ready", price: 135, query: "women straight leg denim" },
      { id: "bottom-midi", name: "Fluid midi skirt", note: "Movement with a quiet line", price: 145, query: "women fluid midi skirt" }
    ],
    shoes: [
      { id: "shoe-loafer", name: "Leather loafer", note: "Polished enough to walk all day", price: 190, query: "women leather loafer" },
      { id: "shoe-flat", name: "Ballet flat", note: "The low-profile city shoe", price: 155, query: "women leather ballet flat" },
      { id: "shoe-heel", name: "Kitten heel", note: "An evening shift without excess", price: 210, query: "women kitten heel" }
    ],
    bags: [
      { id: "bag-shoulder", name: "Compact shoulder bag", note: "Structured and hands-free", price: 240, query: "women structured shoulder bag" },
      { id: "bag-woven", name: "Woven day bag", note: "A natural coastal texture", price: 175, query: "women woven day bag" },
      { id: "bag-tophandle", name: "Top-handle bag", note: "A sharper finish for dinner", price: 260, query: "women structured top handle bag" }
    ],
    accessories: [
      { id: "acc-hoops", name: "Sculptural gold hoops", note: "One decisive point of light", price: 68, query: "women sculptural gold hoop earrings" },
      { id: "acc-sunglasses", name: "Oval sunglasses", note: "A clean, current proportion", price: 95, query: "women oval sunglasses" },
      { id: "acc-scarf", name: "Silk scarf", note: "Colour without adding bulk", price: 85, query: "women printed silk scarf" }
    ]
  };

  function readStore(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      toast("This device is out of local storage. Remove a few large images and try again.");
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slug(value) {
    return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function pinId(url) {
    var match = String(url || "").match(/\/pin\/(\d+)/i);
    return match ? match[1] : "";
  }

  function sourcePlatform(url) {
    var value = String(url || "").toLowerCase();
    if (value.includes("pinterest.")) return "Pinterest";
    if (value.includes("instagram.com")) return "Instagram";
    if (value.includes("tiktok.com")) return "TikTok";
    return "Original source";
  }

  function tiktokId(url) {
    var match = String(url || "").match(/\/video\/(\d+)/i);
    return match ? match[1] : "";
  }

  function instagramEmbedUrl(url) {
    var match = String(url || "").match(/^https:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/i);
    return match ? "https://www.instagram.com/" + match[1] + "/" + match[2] + "/embed/captioned/" : "";
  }

  function sourceEmbed(item) {
    var sourceUrl = item && item.sourceUrl;
    var platform = sourcePlatform(sourceUrl);
    var pinterestId = pinId(sourceUrl);
    var videoId = tiktokId(sourceUrl);
    var instagramUrl = instagramEmbedUrl(sourceUrl);
    if (pinterestId) {
      return '<a data-pin-do="embedPin" data-pin-width="medium" href="' + escapeHTML(sourceUrl) + '"></a>';
    }
    if (videoId) {
      return '<iframe class="social-post-frame social-post-frame-tiktok" loading="lazy" title="TikTok post by ' + escapeHTML(item.creator || "creator") + '" src="https://www.tiktok.com/player/v1/' + escapeHTML(videoId) + '?controls=1&description=1&music_info=0&rel=0" allow="fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    }
    if (instagramUrl) {
      return '<iframe class="social-post-frame social-post-frame-instagram" loading="lazy" title="Instagram post by ' + escapeHTML(item.creator || "creator") + '" src="' + escapeHTML(instagramUrl) + '" allowtransparency="true" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    }
    if (item && item.image && sourceUrl) {
      return '<a class="source-image-link" href="' + escapeHTML(sourceUrl) + '" target="_blank" rel="noopener"><img loading="lazy" src="' + escapeHTML(item.image) + '" alt="' + escapeHTML(item.title || item.city + " style reference") + '"><span>View on ' + escapeHTML(platform) + ' ↗</span></a>';
    }
    return '<span><small>' + escapeHTML(item.city || "City edit") + '</small><br>' + escapeHTML(item.title || "MIKAYLA editorial interpretation") + '</span>';
  }

  function fallbackCitySignals(city) {
    var search = "https://www.pinterest.com/search/pins/?q=" + encodeURIComponent(city + " women street style outfit");
    return [
      { id: "interpretation-" + slug(city) + "-day", city: city, sourceUrl: search, creator: "MIKAYLA", source: "Editorial interpretation", title: "The city day edit", signal: "A polished daytime silhouette shaped around the destination, season, and current weather.", pieces: ["City-ready layer", "Refined day base", "Low-profile shoe", "Structured day bag", "Sunglasses"] },
      { id: "interpretation-" + slug(city) + "-dinner", city: city, sourceUrl: search, creator: "MIKAYLA", source: "Editorial interpretation", title: "The dinner edit", signal: "An elevated evening direction designed to feel intentional without becoming formalwear.", pieces: ["Evening silhouette", "Refined heel or flat", "Compact bag", "Sculptural jewellery"] },
      { id: "interpretation-" + slug(city) + "-statement", city: city, sourceUrl: search, creator: "MIKAYLA", source: "Editorial interpretation", title: "The fashion-forward edit", signal: "A stronger proportion or accessory story for travellers who want a more directional interpretation.", pieces: ["Directional main piece", "Clean base", "Statement accessory", "Polished shoe"] }
    ];
  }

  function hydratePinterest() {
    window.setTimeout(function () {
      try {
        if (window.PinUtils && typeof window.PinUtils.build === "function") window.PinUtils.build();
      } catch (_) {}
    }, 60);
  }

  function updateSavedCount() {
    var count = state.savedInspiration.length + state.uploadedReferences.length + state.savedLooks.length;
    var badge = document.getElementById("saved-nav-count");
    if (badge) badge.textContent = String(count);
  }

  function toast(message) {
    var element = document.getElementById("toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("is-visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { element.classList.remove("is-visible"); }, 2800);
  }

  function setBusy(button, busy, label) {
    if (!button) return;
    if (busy) {
      button.dataset.label = button.textContent;
      button.textContent = label || "Working…";
      button.disabled = true;
    } else {
      button.textContent = button.dataset.label || button.textContent;
      button.disabled = false;
    }
  }

  function route() {
    var name = (location.hash || "#home").slice(1);
    if (!document.querySelector('[data-view="' + name + '"]')) name = "home";
    document.querySelectorAll(".view").forEach(function (view) {
      view.classList.toggle("is-active", view.dataset.view === name);
    });
    document.querySelectorAll("[data-route-link]").forEach(function (link) {
      link.classList.toggle("is-active", link.dataset.routeLink === name);
    });
    closeMenu();
    closeDrawer();
    window.scrollTo({ top: 0, behavior: "auto" });
    if (name === "discover") renderDiscover();
    if (name === "closet") renderCloset();
    if (name === "studio") renderStudio();
    if (name === "saved") renderSavedPage();
    if (name === "plan") {
      updateClosetCounts();
      if (state.itinerary) renderPlan(state.itinerary);
    }
  }

  function closeMenu() {
    var nav = document.getElementById("primary-nav");
    var button = document.querySelector(".menu-button");
    if (!nav || !button) return;
    nav.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  function editorialCard(item) {
    var saved = state.savedInspiration.some(function (candidate) { return candidate.id === item.id; });
    var platform = sourcePlatform(item.sourceUrl);
    return '<article class="editorial-card" data-card-id="' + escapeHTML(item.id) + '">' +
      '<div class="editorial-card-source">' + sourceEmbed(item) + '</div>' +
      '<div class="editorial-card-copy"><div class="editorial-card-meta"><span>' + escapeHTML(item.city) + '</span><span>' + escapeHTML(item.creator || item.source) + ' · <a href="' + escapeHTML(item.sourceUrl) + '" target="_blank" rel="noopener">' + escapeHTML(platform) + ' ↗</a></span></div>' +
      '<h3>' + escapeHTML(item.title) + '</h3>' +
      '<div class="editorial-card-actions"><button type="button" data-open-look="' + escapeHTML(item.id) + '">Scan & shop this look →</button>' +
      '<button type="button" data-save-look="' + escapeHTML(item.id) + '" aria-pressed="' + String(saved) + '">' + (saved ? "Saved" : "Save") + '</button></div></div></article>';
  }

  function bindEditorialCards(scope) {
    scope.querySelectorAll("[data-open-look]").forEach(function (button) {
      button.addEventListener("click", function () {
        var item = state.signals.find(function (signal) { return signal.id === button.dataset.openLook; }) ||
          feed.find(function (signal) { return signal.id === button.dataset.openLook; }) ||
          state.savedInspiration.find(function (signal) { return signal.id === button.dataset.openLook; });
        if (item) openDrawer(item);
      });
    });
    scope.querySelectorAll("[data-save-look]").forEach(function (button) {
      button.addEventListener("click", function () {
        toggleSavedInspiration(button.dataset.saveLook);
      });
    });
  }

  function renderHomeFeed() {
    var container = document.getElementById("home-feed");
    if (!container) return;
    var priority = ["Paris", "Milan", "Positano", "Santorini", "London", "Dubai"];
    var items = priority.map(function (city) {
      return feed.find(function (item) { return item.city === city; }) || fallbackCitySignals(city)[0];
    });
    container.innerHTML = items.map(editorialCard).join("");
    bindEditorialCards(container);
    hydratePinterest();
  }

  function toggleSavedInspiration(id) {
    var exists = state.savedInspiration.some(function (item) { return item.id === id; });
    if (exists) {
      state.savedInspiration = state.savedInspiration.filter(function (item) { return item.id !== id; });
      toast("Removed from your private edit.");
    } else {
      var source = state.signals.find(function (item) { return item.id === id; }) || feed.find(function (item) { return item.id === id; });
      if (!source) return;
      state.savedInspiration.unshift(Object.assign({}, source, { savedAt: new Date().toISOString() }));
      toast("Saved to your private edit.");
    }
    writeStore("mikayla_saved_inspiration_v1", state.savedInspiration);
    updateSavedCount();
    renderHomeFeed();
    if ((location.hash || "#home") === "#discover") renderDiscover();
    if ((location.hash || "") === "#saved") renderSavedPage();
  }

  function renderDiscover() {
    renderCityFilters();
    var title = document.getElementById("discover-city-title");
    if (title) title.textContent = state.selectedCity === "All" ? "Every city" : state.selectedCity;
    var items = state.selectedCity === "All"
      ? state.signals
      : state.signals.filter(function (item) { return item.city.toLowerCase() === state.selectedCity.toLowerCase(); });
    items = items.filter(function (item) { return !state.hiddenInspiration.includes(item.id); });
    var container = document.getElementById("discover-feed");
    if (!container) return;
    if (!items.length) {
      container.innerHTML = '<div class="empty-state"><h2>No sourced looks yet.</h2><p>MIKAYLA is building this city edit. Try another destination while the current search refreshes.</p></div>';
      return;
    }
    container.innerHTML = items.map(editorialCard).join("");
    bindEditorialCards(container);
    hydratePinterest();
  }

  function renderCityFilters() {
    var cities = ["All"].concat(Array.from(new Set(state.signals.map(function (item) { return item.city; }))).sort());
    var container = document.getElementById("city-filters");
    if (!container) return;
    container.innerHTML = cities.map(function (city) {
      return '<button type="button" class="' + (city === state.selectedCity ? "is-active" : "") + '" data-city="' + escapeHTML(city) + '">' + escapeHTML(city) + '</button>';
    }).join("");
    container.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedCity = button.dataset.city;
        renderDiscover();
      });
    });
  }

  function bindLookCards(scope) {
    scope.querySelectorAll("[data-look-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        var item = state.signals.find(function (signal) { return signal.id === button.dataset.lookId; });
        if (item) openDrawer(item);
      });
    });
  }

  function shopLink(retailer, query, source) {
    var destinations = {
      revolve: "https://www.revolve.com/r/Search.jsp?search=" + encodeURIComponent(query),
      farfetch: "https://www.farfetch.com/shopping/women/search/items.aspx?q=" + encodeURIComponent(query),
      asos: "https://www.asos.com/search/?q=" + encodeURIComponent(query)
    };
    var destination = destinations[retailer];
    if (!destination) return "#";
    return "./api/shop-link?retailer=" + encodeURIComponent(retailer) + "&url=" + encodeURIComponent(destination) + "&look=" + encodeURIComponent(source || "site");
  }

  function drawerPiecesMarkup(pieces, item, scanned) {
    return pieces.map(function (piece) {
      var name = typeof piece === "string" ? piece : (piece.description || piece.category || piece.type || "Detected piece");
      var query = typeof piece === "string" ? item.city + " women " + piece : (piece.search_query || item.city + " women " + name);
      var note = typeof piece === "string" ? "" : (piece.style_notes || piece.trend_note || "");
      return '<div class="drawer-piece"><div class="drawer-piece-heading"><h3>' + escapeHTML(name) + '</h3>' +
        (piece && piece.trend_score ? '<small>' + escapeHTML(piece.trend_score) + '% city fit</small>' : '') + '</div>' +
        (note ? '<p>' + escapeHTML(note) + '</p>' : '') +
        '<p class="drawer-tier-note">' + (scanned ? 'AI-detected piece · ' : '') + 'closest similar searches · exact only when a verified catalogue confirms the product</p><div class="drawer-actions">' +
          '<a class="is-primary" href="' + escapeHTML(shopLink("revolve", query, item.id)) + '" target="_blank" rel="noopener"><small>Contemporary · first edit</small><b>Revolve ↗</b></a>' +
          '<a href="' + escapeHTML(shopLink("asos", query, item.id)) + '" target="_blank" rel="noopener"><small>Accessible</small><b>ASOS ↗</b></a>' +
          '<a href="' + escapeHTML(shopLink("farfetch", query, item.id)) + '" target="_blank" rel="noopener"><small>Luxury</small><b>Farfetch ↗</b></a>' +
        '</div></div>';
    }).join("");
  }

  async function scanSocialLook(item, button) {
    var results = document.querySelector("[data-scan-results]");
    if (!results || !item.image) return;
    setBusy(button, true, "Scanning every piece…");
    results.setAttribute("aria-busy", "true");
    try {
      var response = await fetch("./api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: item.image, city: item.city })
      });
      var analysis = await response.json();
      if (!response.ok || analysis.error) throw new Error(analysis.error || "This look could not be scanned.");
      var detected = Array.isArray(analysis.pieces) ? analysis.pieces : [];
      if (!detected.length) {
        results.insertAdjacentHTML("afterbegin", '<p class="scan-status">The live visual model is not configured yet. MIKAYLA is showing the human-curated piece breakdown for this look.</p>');
        return;
      }
      item.pieces = detected;
      results.innerHTML = '<div class="scan-result-intro"><p class="eyebrow">MIKAYLA visual scan</p><h3>' + escapeHTML(analysis.overall_vibe || "The complete look, detected.") + '</h3>' +
        (analysis.city_styling_tip ? '<p>' + escapeHTML(analysis.city_styling_tip) + '</p>' : '') + '</div>' + drawerPiecesMarkup(detected, item, true);
      toast("The complete look is ready to shop.");
    } catch (error) {
      results.insertAdjacentHTML("afterbegin", '<p class="scan-status">' + escapeHTML(error.message || "The visual scan is temporarily unavailable.") + ' The curated shopping breakdown remains available below.</p>');
    } finally {
      results.removeAttribute("aria-busy");
      setBusy(button, false);
    }
  }

  function openDrawer(item) {
    var drawer = document.getElementById("shop-drawer");
    var backdrop = document.getElementById("drawer-backdrop");
    var content = document.getElementById("shop-drawer-content");
    if (!drawer || !backdrop || !content) return;
    var pieces = Array.isArray(item.pieces) && item.pieces.length
      ? item.pieces
      : String(item.signal || "").split("·").map(function (piece) { return piece.trim(); }).filter(Boolean);
    var saved = state.savedInspiration.some(function (candidate) { return candidate.id === item.id; });
    var platform = sourcePlatform(item.sourceUrl);
    var isSpecificPost = Boolean(pinId(item.sourceUrl) || tiktokId(item.sourceUrl) || instagramEmbedUrl(item.sourceUrl));
    var originalLabel = isSpecificPost ? "View original " + platform + " post and creator" : "Open current city inspiration source";
    content.innerHTML =
      '<div class="source-embed">' + sourceEmbed(item) + '</div><div class="drawer-source-meta"><a href="' + escapeHTML(item.sourceUrl) + '" target="_blank" rel="noopener">' + originalLabel + ' ↗</a><span>Platform-hosted public source</span></div>' +
      '<div class="drawer-copy"><p class="eyebrow" id="drawer-title">' + escapeHTML(item.city) + ' · ' + escapeHTML(item.creator || item.source) + '</p>' +
      '<h2>' + escapeHTML(item.title) + '</h2><p>' + escapeHTML(item.signal) + '</p>' +
      (item.image ? '<button class="solid-button drawer-scan-button" type="button" data-scan-current-look>Scan every visible piece</button><p class="drawer-scan-note">The original stays attached above while MIKAYLA identifies the clothing, shoes, bag, jewellery, and accessories.</p>' : '') +
      '<div data-scan-results aria-live="polite">' + drawerPiecesMarkup(pieces, item, false) + '</div>' +
      '<div class="feedback-row"><button type="button" data-drawer-save="' + escapeHTML(item.id) + '">' + (saved ? "Saved" : "Save inspiration") + '</button><button type="button" data-feedback="love">Love this</button><button type="button" data-feedback="not-style">Not my style</button><button type="button" data-feedback="hide">Hide</button></div>' +
      '<p class="shopping-note">Shopping is curated inside MIKAYLA; checkout opens the retailer. Results remain labelled similar until a verified product catalogue confirms an exact item.</p></div>';
    backdrop.hidden = false;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    drawer.querySelector(".drawer-close").focus();
    var saveButton = content.querySelector("[data-drawer-save]");
    if (saveButton) saveButton.addEventListener("click", function () { toggleSavedInspiration(item.id); closeDrawer(); });
    var scanButton = content.querySelector("[data-scan-current-look]");
    if (scanButton) scanButton.addEventListener("click", function () { scanSocialLook(item, scanButton); });
    content.querySelectorAll("[data-feedback]").forEach(function (button) {
      button.addEventListener("click", function () {
        var feedback = button.dataset.feedback;
        state.tasteFeedback[item.id] = feedback;
        writeStore("mikayla_taste_feedback_v1", state.tasteFeedback);
        if (feedback === "hide" || feedback === "not-style") {
          if (!state.hiddenInspiration.includes(item.id)) state.hiddenInspiration.push(item.id);
          writeStore("mikayla_hidden_inspiration_v1", state.hiddenInspiration);
          closeDrawer();
          renderDiscover();
        }
        toast(feedback === "love" ? "MIKAYLA will learn from this look." : "Your taste edit has been updated.");
      });
    });
    hydratePinterest();
  }

  function closeDrawer() {
    var drawer = document.getElementById("shop-drawer");
    var backdrop = document.getElementById("drawer-backdrop");
    if (!drawer || !backdrop) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    backdrop.hidden = true;
    document.body.classList.remove("drawer-open");
  }

  async function loadSignals(city) {
    var status = document.getElementById("signal-status");
    try {
      var response = await fetch("./api/style-signals?city=" + encodeURIComponent(city === "All" ? "" : city));
      if (!response.ok) return;
      var data = await response.json();
      if (data.live && Array.isArray(data.items) && data.items.length) {
        state.signals = data.items;
        state.signalMode = "live";
        if (status) {
          var platforms = Array.isArray(data.sourcePlatforms) && data.sourcePlatforms.length
            ? data.sourcePlatforms.join(" · ")
            : "Pinterest · Instagram · TikTok";
          var trendText = Array.isArray(data.trendKeywords) && data.trendKeywords.length
            ? " · rising now: " + data.trendKeywords.slice(0, 3).map(function (trend) { return trend.keyword; }).join(", ")
            : "";
          status.innerHTML = '<span></span><div><b>Live city style signals</b><small>Refreshed ' +
            escapeHTML(new Date(data.updatedAt).toLocaleString()) + ' · ' + escapeHTML(platforms) + escapeHTML(trendText) + '</small></div>';
        }
      } else {
        var searchedCity = city && city !== "All" ? city : "";
        var curatedForCity = searchedCity ? feed.filter(function (item) { return item.city.toLowerCase() === searchedCity.toLowerCase(); }) : feed.slice();
        state.signals = curatedForCity.length ? feed.slice() : fallbackCitySignals(searchedCity);
        state.signalMode = "curated";
        if (status) {
          var liveSearch = searchedCity
            ? ' <a href="https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(searchedCity + " street style women outfit") + '" target="_blank" rel="noopener">Open current Pinterest search ↗</a>'
            : "";
          status.innerHTML = '<span></span><div><b>Curated public references</b><small>Automatic city discovery is being connected.' + liveSearch + '</small></div>';
        }
      }
    } catch (_) {
      var offlineCity = city && city !== "All" ? city : "";
      var offlineCurated = offlineCity ? feed.filter(function (item) { return item.city.toLowerCase() === offlineCity.toLowerCase(); }) : feed.slice();
      state.signals = offlineCurated.length ? feed.slice() : fallbackCitySignals(offlineCity);
    }
    renderDiscover();
  }

  async function fileToData(file, maxWidth) {
    if (file.type === "text/plain") return { text: await file.text(), mediaType: file.type };
    var dataUrl = await new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    if (!file.type.startsWith("image/") || !maxWidth) {
      return { dataUrl: dataUrl, base64: String(dataUrl).split(",")[1], mediaType: file.type };
    }
    var image = await new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = dataUrl;
    });
    var ratio = Math.min(1, maxWidth / image.width);
    var canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * ratio);
    canvas.height = Math.round(image.height * ratio);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    var compressed = canvas.toDataURL("image/jpeg", .8);
    return { dataUrl: compressed, base64: compressed.split(",")[1], mediaType: "image/jpeg" };
  }

  function renderVisualPieces(analysis, manualQuery) {
    var container = document.getElementById("visual-results");
    if (!container) return;
    var pieces = Array.isArray(analysis.pieces) ? analysis.pieces : [];
    if (!pieces.length && manualQuery) {
      pieces = manualQuery.split(/,| and /i).map(function (term, index) {
        term = term.trim();
        return term ? { id: "manual-" + index, description: term, category: term, style_notes: "Manual description used because live visual analysis is not configured.", search_query: term } : null;
      }).filter(Boolean);
    }
    if (!pieces.length) {
      container.innerHTML = '<p class="eyebrow">Analysis unavailable</p><div class="empty-state"><h2>Add a short description.</h2><p>The live vision model is not configured yet. Describe the main pieces—such as “white linen dress, woven bag, gold earrings”—and MIKAYLA can still build useful shopping paths without pretending to identify the image.</p></div>';
      return;
    }
    var demoNote = analysis._demo || analysis.demo
      ? '<p class="privacy-note">Manual shopping mode · visual AI is not configured on this environment.</p>'
      : "";
    container.innerHTML =
      '<div class="analysis-header"><p class="eyebrow">' + escapeHTML(analysis.aesthetic_label || "Complete look") + '</p>' +
      '<h2>' + escapeHTML(analysis.overall_vibe || "The look, translated.") + '</h2>' +
      (analysis.city_styling_tip ? '<p>' + escapeHTML(analysis.city_styling_tip) + '</p>' : "") + demoNote + '</div>' +
      pieces.map(function (piece) {
        var name = piece.description || piece.category || piece.type || "Detected piece";
        var query = piece.search_query || name;
        return '<article class="piece-result"><header><h3>' + escapeHTML(name) + '</h3>' +
          (piece.trend_score ? '<small>' + escapeHTML(piece.trend_score) + '% city fit</small>' : "") + '</header>' +
          '<p>' + escapeHTML(piece.style_notes || piece.trend_note || "Shop the silhouette and styling effect at the price level that suits you.") + '</p>' +
          '<div class="tier-links">' +
            '<a class="is-primary" href="' + escapeHTML(shopLink("revolve", query, "visual")) + '" target="_blank" rel="noopener"><small>Contemporary · first edit</small><b>Modern edit ↗</b></a>' +
            '<a href="' + escapeHTML(shopLink("asos", query, "visual")) + '" target="_blank" rel="noopener"><small>Accessible</small><b>Budget edit ↗</b></a>' +
            '<a href="' + escapeHTML(shopLink("farfetch", query, "visual")) + '" target="_blank" rel="noopener"><small>Luxury</small><b>Investment edit ↗</b></a>' +
          '</div></article>';
      }).join("");
  }

  async function submitVisual(event) {
    event.preventDefault();
    var file = document.getElementById("visual-file").files[0];
    var city = document.getElementById("visual-city").value.trim() || "Paris";
    var query = document.getElementById("visual-query").value.trim();
    if (!file && !query) {
      toast("Choose an image or describe the pieces first.");
      return;
    }
    var button = event.submitter || event.currentTarget.querySelector("button[type=submit]");
    setBusy(button, true, "Reading the look…");
    var payload = { city: city };
    try {
      if (file) {
        var data = await fileToData(file, 1400);
        payload.imageBase64 = data.base64;
        payload.mediaType = data.mediaType;
      }
      var analysis;
      if (file) {
        var response = await fetch("./api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        analysis = await response.json();
        if (!response.ok || analysis.error) throw new Error(analysis.error || "The look could not be read.");
      } else {
        analysis = { _demo: true, overall_vibe: "A manual style search, translated across three budgets.", pieces: [] };
      }
      renderVisualPieces(analysis, query);
    } catch (error) {
      toast(error.message || "The look could not be read.");
      renderVisualPieces({ _demo: true, pieces: [] }, query);
    } finally {
      setBusy(button, false);
    }
  }

  async function submitPlan(event) {
    event.preventDefault();
    var text = document.getElementById("plan-text").value.trim();
    var file = document.getElementById("plan-file").files[0];
    if (!text && !file) {
      toast("Paste your plans or attach an itinerary first.");
      return;
    }
    var button = event.submitter || event.currentTarget.querySelector("button[type=submit]");
    setBusy(button, true, "Building the wardrobe…");
    var payload = {
      itinerary_text: text,
      city: document.getElementById("plan-city").value.trim(),
      budget: document.getElementById("plan-budget").value,
      rewear: Number(document.getElementById("plan-rewear").value),
      closet_items: state.closet.map(function (item) {
        return { id: item.id, type: item.type, color: item.color, category: item.category, material: item.material, style_tags: item.styleTags || [] };
      })
    };
    try {
      if (file) {
        var data = await fileToData(file);
        if (data.text) payload.itinerary_text = [payload.itinerary_text, data.text].filter(Boolean).join("\n");
        else if (file.type === "application/pdf") payload.document_base64 = data.base64;
        else if (file.type.startsWith("image/")) {
          payload.image_base64 = data.base64;
          payload.media_type = data.mediaType;
        }
      }
      var response = await fetch("./api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      var result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || "The itinerary could not be read.");
      state.itinerary = result;
      writeStore("mikayla_itinerary_v4", result);
      renderPlan(result);
      toast("Your trip wardrobe is ready.");
    } catch (error) {
      toast(error.message || "The itinerary could not be read.");
    } finally {
      setBusy(button, false);
    }
  }

  function renderOutfitDetails(outfit) {
    outfit = outfit || {};
    var owned = Array.isArray(outfit.pieces)
      ? outfit.pieces.filter(function (piece) { return piece.is_owned || piece.owned_item_id; })
      : [];
    var gaps = Array.isArray(outfit.gaps) ? outfit.gaps : [];
    return (owned.length
      ? '<p class="owned-line">From your closet · ' + owned.map(function (piece) { return escapeHTML(piece.item); }).join(" · ") + '</p>'
      : "") +
      gaps.map(function (gap) {
        var query = gap.search_query || gap.item;
        return '<p class="gap-line">Suggested gap · ' + escapeHTML(gap.item) + ' <a href="' + escapeHTML(shopLink("revolve", query, "itinerary")) + '" target="_blank" rel="noopener">Shop options ↗</a></p>';
      }).join("");
  }

  function outfitOptionsFor(item) {
    var options = Array.isArray(item.outfit_options) ? item.outfit_options : [];
    if (options.length) return options.slice(0, 3);
    var base = item.outfit || {};
    return [{
      direction: "Understated",
      description: base.description || "A complete city-ready look will appear here.",
      stylist_note: base.stylist_note || "The closest edit for this occasion.",
      pieces: base.pieces || [],
      gaps: base.gaps || []
    }];
  }

  function tripPanels(result) {
    var events = [];
    (result.schedule || []).forEach(function (day) {
      (day.events || []).forEach(function (event) { events.push(event); });
    });
    var capsule = [];
    events.forEach(function (event) {
      var option = outfitOptionsFor(event)[0] || {};
      (option.pieces || []).forEach(function (piece) {
        var name = piece.item || piece.description;
        if (name && !capsule.includes(name)) capsule.push(name);
      });
    });
    if (!capsule.length) capsule = ["One city-ready layer", "Two versatile day bases", "One evening silhouette", "Two pairs of shoes", "One day bag", "One evening bag", "Jewellery and eyewear"];
    var packing = capsule.concat(["Undergarments and sleepwear", "Travel-size care kit", "Weather layer if the forecast changes"]);
    return '<div class="trip-tools" role="tablist"><button type="button" class="is-active" data-trip-tab="calendar">Trip calendar</button><button type="button" data-trip-tab="capsule">Capsule wardrobe</button><button type="button" data-trip-tab="packing">Packing list</button></div>' +
      '<section class="trip-panel" data-trip-panel="calendar"><h3>Your trip at a glance</h3><ul class="trip-panel-list">' + events.map(function (event) { return '<li><b>' + escapeHTML(event.time || "") + '</b> · ' + escapeHTML(event.venue || "Your plan") + '</li>'; }).join("") + '</ul></section>' +
      '<section class="trip-panel" data-trip-panel="capsule" hidden><h3>The capsule</h3><ul class="trip-panel-list">' + capsule.map(function (piece) { return '<li>' + escapeHTML(piece) + '</li>'; }).join("") + '</ul></section>' +
      '<section class="trip-panel" data-trip-panel="packing" hidden><h3>The packing list</h3><ul class="trip-panel-list">' + packing.map(function (piece) { return '<li>□ ' + escapeHTML(piece) + '</li>'; }).join("") + '</ul></section>';
  }

  function bindTripTools(scope) {
    scope.querySelectorAll("[data-trip-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        scope.querySelectorAll("[data-trip-tab]").forEach(function (candidate) { candidate.classList.toggle("is-active", candidate === button); });
        scope.querySelectorAll("[data-trip-panel]").forEach(function (panel) { panel.hidden = panel.dataset.tripPanel !== button.dataset.tripTab; });
      });
    });
  }

  function renderPlan(result) {
    var container = document.getElementById("plan-results");
    if (!container || !result) return;
    var schedule = Array.isArray(result.schedule) ? result.schedule : [];
    container.hidden = false;
    container.innerHTML =
      '<div class="trip-heading"><div><p class="eyebrow">' + escapeHTML(result.dates || "Your trip") + '</p><h2>' + escapeHTML(result.destination || "Your destination") + '</h2></div>' +
      '<p>' + escapeHTML(result.capsule_note || "A compact, repeatable wardrobe built around the places on your itinerary.") + (result.demo ? " This is a clearly labelled local interpretation; connected AI produces deeper venue analysis." : "") + '</p></div>' +
      tripPanels(result) +
      schedule.map(function (day, dayIndex) {
        return '<section class="trip-day"><h3>Day ' + escapeHTML(day.day || dayIndex + 1) + '<small>' + escapeHTML(day.date || "") + '</small></h3><div>' +
          (day.events || []).map(function (item, eventIndex) {
            var key = dayIndex + "-" + eventIndex;
            var options = outfitOptionsFor(item);
            return '<article class="trip-event"><time>' + escapeHTML(item.time || "") + '</time><div><small>' + escapeHTML(item.venue_type || item.dress_code || "Occasion") + '</small><h4>' + escapeHTML(item.venue || "Your plan") + '</h4><p>' + escapeHTML(item.dress_code || "") + '</p></div>' +
              '<div><div class="outfit-directions">' + options.map(function (option, optionIndex) { return '<div class="outfit-direction' + (optionIndex === 0 ? " is-featured" : "") + '"><small>' + escapeHTML(option.direction || "Option " + (optionIndex + 1)) + '</small><p>' + escapeHTML(option.description || "Complete look") + '</p><p class="stylist-reason">' + escapeHTML(option.stylist_note || "") + '</p>' + renderOutfitDetails(option) + '</div>'; }).join("") + '</div>' +
              renderLookAssignment(key) + '</div></article>';
          }).join("") + '</div></section>';
      }).join("");
    bindAssignmentSelects(container);
    bindTripTools(container);
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderLookAssignment(key) {
    if (!state.savedLooks.length) return '<a class="text-link" href="#studio">Build a look to assign <span>→</span></a>';
    return '<label class="assignment-label">Assign saved look<select data-assignment="' + escapeHTML(key) + '"><option value="">Not assigned</option>' +
      state.savedLooks.map(function (look) {
        return '<option value="' + escapeHTML(look.id) + '"' + (state.assignments[key] === look.id ? " selected" : "") + '>' + escapeHTML(look.name) + '</option>';
      }).join("") + '</select></label>';
  }

  function bindAssignmentSelects(scope) {
    scope.querySelectorAll("[data-assignment]").forEach(function (select) {
      select.addEventListener("change", function () {
        if (select.value) state.assignments[select.dataset.assignment] = select.value;
        else delete state.assignments[select.dataset.assignment];
        writeStore("mikayla_assignments_v4", state.assignments);
        toast(select.value ? "Look assigned to the itinerary." : "Assignment removed.");
      });
    });
  }

  async function addClosetFiles(files) {
    var accepted = Array.from(files).filter(function (file) { return file.type.startsWith("image/"); });
    if (!accepted.length) return;
    toast("Adding " + accepted.length + (accepted.length === 1 ? " piece…" : " pieces…"));
    for (var index = 0; index < accepted.length; index++) {
      var file = accepted[index];
      try {
        var data = await fileToData(file, 900);
        var item = {
          id: uid("closet"),
          image: data.dataUrl,
          type: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") || "Wardrobe piece",
          category: "tops",
          color: "",
          material: "",
          styleTags: [],
          owned: true,
          createdAt: new Date().toISOString()
        };
        state.closet.push(item);
        writeStore("mikayla_closet_v4", state.closet);
        renderCloset();
        try {
          var response = await fetch("./api/closet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "identify", image_base64: data.base64, mime_type: data.mediaType })
          });
          var identified = await response.json();
          if (response.ok && !identified.error && !identified.demo) {
            item.type = identified.type || item.type;
            item.color = identified.color || "";
            item.material = identified.material || "";
            item.styleTags = identified.style_tags || [];
            item.category = categoryFromType(identified.type);
            writeStore("mikayla_closet_v4", state.closet);
            renderCloset();
          }
        } catch (_) {}
      } catch (_) {
        toast("One image could not be added.");
      }
    }
    updateClosetCounts();
  }

  function categoryFromType(type) {
    var value = String(type || "").toLowerCase();
    if (/shoe|boot|sandal|loafer|flat|heel|sneaker/.test(value)) return "shoes";
    if (/bag|tote|clutch|purse/.test(value)) return "bags";
    if (/earring|necklace|bracelet|belt|scarf|sunglass|hat|jewel/.test(value)) return "accessories";
    if (/trouser|pant|jean|skirt|short/.test(value)) return "bottoms";
    if (/dress|jumpsuit|set/.test(value)) return "dresses";
    if (/coat|jacket|blazer|cardigan/.test(value)) return "outerwear";
    return "tops";
  }

  function renderCloset() {
    var container = document.getElementById("closet-grid");
    if (!container) return;
    updateClosetCounts();
    if (!state.closet.length) {
      container.innerHTML = '<div class="empty-state"><h2>Your closet is waiting.</h2><p>Add a few favourite pieces to make every city edit personal.</p></div>';
      return;
    }
    var categories = ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "accessories"];
    container.innerHTML = state.closet.map(function (item) {
      return '<article class="closet-item" data-closet-id="' + escapeHTML(item.id) + '">' +
        '<img src="' + escapeHTML(item.image) + '" alt="' + escapeHTML(item.type || "Wardrobe piece") + '">' +
        '<div class="closet-item-form"><label>Item<input data-field="type" value="' + escapeHTML(item.type || "") + '"></label>' +
        '<label>Category<select data-field="category">' + categories.map(function (category) { return '<option value="' + category + '"' + (item.category === category ? " selected" : "") + '>' + category + '</option>'; }).join("") + '</select></label>' +
        '<label>Colour<input data-field="color" value="' + escapeHTML(item.color || "") + '" placeholder="Add colour"></label></div>' +
        '<div class="closet-item-actions"><span>Owned · saved locally</span><button type="button" data-remove>Remove</button></div></article>';
    }).join("");
    container.querySelectorAll(".closet-item").forEach(function (article) {
      var item = state.closet.find(function (candidate) { return candidate.id === article.dataset.closetId; });
      article.querySelectorAll("[data-field]").forEach(function (input) {
        input.addEventListener("change", function () {
          item[input.dataset.field] = input.value;
          writeStore("mikayla_closet_v4", state.closet);
        });
      });
      article.querySelector("[data-remove]").addEventListener("click", function () {
        state.closet = state.closet.filter(function (candidate) { return candidate.id !== item.id; });
        writeStore("mikayla_closet_v4", state.closet);
        renderCloset();
        renderStudio();
      });
    });
  }

  function updateClosetCounts() {
    var count = state.closet.length;
    var label = count + (count === 1 ? " piece" : " pieces");
    var main = document.getElementById("closet-count");
    var callout = document.getElementById("closet-count-callout");
    if (main) main.textContent = label;
    if (callout) callout.textContent = label + " ready";
  }

  function studioItems(category) {
    var closetMatches = state.closet.filter(function (item) {
      if (category === "tops") return ["tops", "dresses", "outerwear"].includes(item.category);
      return item.category === category;
    }).map(function (item) {
      return { id: item.id, name: item.type || "Owned piece", note: [item.color, item.material].filter(Boolean).join(" · ") || "From your closet", price: 0, owned: true, category: category };
    });
    return closetMatches.concat(studioDefaults[category] || []);
  }

  function renderStudio() {
    var mixer = document.getElementById("mixer");
    if (!mixer) return;
    var categories = ["tops", "bottoms", "shoes", "bags", "accessories"];
    mixer.innerHTML = categories.map(function (category) {
      var items = studioItems(category);
      return '<section class="mixer-row"><h2>' + escapeHTML(category.charAt(0).toUpperCase() + category.slice(1)) + '</h2><div class="mixer-options">' +
        items.map(function (item) {
          var active = state.mixer[category] && state.mixer[category].id === item.id;
          return '<button type="button" class="mixer-option' + (active ? " is-active" : "") + '" data-category="' + category + '" data-item="' + escapeHTML(item.id) + '">' +
            '<span><b>' + escapeHTML(item.name) + '</b><small>' + escapeHTML(item.note || "") + '</small></span>' +
            '<span class="' + (item.owned ? "owned" : "") + '">' + (item.owned ? "Owned · $0" : "$" + item.price + " · shoppable") + '</span></button>';
        }).join("") + '</div></section>';
    }).join("");
    mixer.querySelectorAll(".mixer-option").forEach(function (button) {
      button.addEventListener("click", function () {
        var category = button.dataset.category;
        var item = studioItems(category).find(function (candidate) { return candidate.id === button.dataset.item; });
        if (item) state.mixer[category] = item;
        renderStudio();
      });
    });
    renderLookStack();
    renderSavedLooks();
  }

  function renderLookStack() {
    var stack = document.getElementById("look-stack");
    var total = document.getElementById("look-total");
    if (!stack || !total) return;
    var chosen = Object.keys(state.mixer).map(function (category) {
      return { category: category, item: state.mixer[category] };
    });
    if (!chosen.length) {
      stack.innerHTML = '<div class="look-stack-empty">Choose one piece from each row.</div>';
      total.textContent = "$0";
      return;
    }
    stack.innerHTML = chosen.map(function (choice) {
      return '<div class="look-stack-item"><span>' + escapeHTML(choice.item.name) + '</span><small>' + (choice.item.owned ? "Owned" : "$" + choice.item.price) + '</small></div>';
    }).join("");
    total.textContent = "$" + chosen.reduce(function (sum, choice) { return sum + Number(choice.item.price || 0); }, 0);
  }

  function saveLook(event) {
    event.preventDefault();
    var pieces = Object.keys(state.mixer).map(function (category) {
      var item = state.mixer[category];
      return { category: category, id: item.id, name: item.name, price: item.price || 0, owned: Boolean(item.owned), query: item.query || item.name };
    });
    if (pieces.length < 2) {
      toast("Choose at least two pieces before saving the look.");
      return;
    }
    var name = document.getElementById("look-name").value.trim() || "Untitled city look";
    state.savedLooks.unshift({ id: uid("look"), name: name, pieces: pieces, createdAt: new Date().toISOString() });
    writeStore("mikayla_saved_looks_v4", state.savedLooks);
    updateSavedCount();
    document.getElementById("look-name").value = "";
    renderSavedLooks();
    toast("Look saved. You can now assign it to the itinerary.");
  }

  function renderSavedLooks() {
    var container = document.getElementById("saved-looks-grid");
    if (!container) return;
    if (!state.savedLooks.length) {
      container.innerHTML = '<div class="empty-state"><p>Saved outfits will appear here and remain available to your itinerary.</p></div>';
      return;
    }
    container.innerHTML = state.savedLooks.map(function (look) {
      var cost = (look.pieces || []).reduce(function (sum, piece) { return sum + Number(piece.price || 0); }, 0);
      return '<article class="saved-look" data-saved-look="' + escapeHTML(look.id) + '"><h3>' + escapeHTML(look.name) + '</h3>' +
        '<p>' + (look.pieces || []).map(function (piece) { return escapeHTML(piece.name); }).join(" · ") + '</p>' +
        '<footer><span>' + (look.pieces || []).filter(function (piece) { return piece.owned; }).length + ' owned · $' + cost + ' new</span><button type="button">Delete</button></footer></article>';
    }).join("");
    container.querySelectorAll("[data-saved-look]").forEach(function (article) {
      article.querySelector("button").addEventListener("click", function () {
        var id = article.dataset.savedLook;
        state.savedLooks = state.savedLooks.filter(function (look) { return look.id !== id; });
        Object.keys(state.assignments).forEach(function (key) {
          if (state.assignments[key] === id) delete state.assignments[key];
        });
        writeStore("mikayla_saved_looks_v4", state.savedLooks);
        writeStore("mikayla_assignments_v4", state.assignments);
        updateSavedCount();
        renderSavedLooks();
        if ((location.hash || "") === "#saved") renderSavedPage();
      });
    });
  }

  function renderSavedPage() {
    var summary = document.getElementById("saved-summary");
    var inspiration = document.getElementById("saved-inspiration-grid");
    var looks = document.getElementById("saved-page-looks");
    if (!summary || !inspiration || !looks) return;
    var itineraryEvents = state.itinerary && Array.isArray(state.itinerary.schedule)
      ? state.itinerary.schedule.reduce(function (count, day) { return count + (day.events || []).length; }, 0)
      : 0;
    summary.innerHTML = [
      [state.savedInspiration.length + state.uploadedReferences.length, "saved inspiration"],
      [state.closet.length, "closet pieces"],
      [state.savedLooks.length, "built looks"],
      [itineraryEvents, "trip occasions"]
    ].map(function (stat) { return '<div class="saved-stat"><strong>' + stat[0] + '</strong><span>' + stat[1] + '</span></div>'; }).join("");
    var externalCards = state.savedInspiration.map(editorialCard).join("");
    var uploadedCards = state.uploadedReferences.map(function (item) { return '<article class="vault-card"><img src="' + escapeHTML(item.image) + '" alt="Private uploaded outfit reference"><div><small>Private upload</small><h3>' + escapeHTML(item.name || "Saved outfit reference") + '</h3><button type="button" data-remove-reference="' + escapeHTML(item.id) + '">Remove</button></div></article>'; }).join("");
    inspiration.innerHTML = state.savedInspiration.length || state.uploadedReferences.length
      ? externalCards + uploadedCards
      : '<div class="saved-empty"><h3>Your edit begins with one look.</h3><p>Save inspiration from any city and MIKAYLA will keep it connected to the creator, destination, and shopping path.</p></div>';
    bindEditorialCards(inspiration);
    inspiration.querySelectorAll("[data-remove-reference]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.uploadedReferences = state.uploadedReferences.filter(function (item) { return item.id !== button.dataset.removeReference; });
        writeStore("mikayla_uploaded_references_v1", state.uploadedReferences);
        updateSavedCount();
        renderSavedPage();
      });
    });
    hydratePinterest();
    looks.innerHTML = state.savedLooks.length
      ? state.savedLooks.map(function (look) {
        var cost = (look.pieces || []).reduce(function (sum, piece) { return sum + Number(piece.price || 0); }, 0);
        return '<article class="saved-look"><h3>' + escapeHTML(look.name) + '</h3><p>' + (look.pieces || []).map(function (piece) { return escapeHTML(piece.name); }).join(" · ") + '</p><footer><span>' + (look.pieces || []).filter(function (piece) { return piece.owned; }).length + ' owned · $' + cost + ' new</span><a href="#studio">Open studio →</a></footer></article>';
      }).join("")
      : '<div class="saved-empty"><h3>No assembled looks yet.</h3><p>Build a complete look in the Outfit Studio, then assign it to any occasion on your trip.</p></div>';
  }

  function init() {
    renderHomeFeed();
    renderCloset();
    renderStudio();
    updateClosetCounts();
    updateSavedCount();
    document.getElementById("discover-occasion").value = state.refinements.occasion || "";
    document.getElementById("discover-colour").value = state.refinements.colour || "";
    document.getElementById("discover-size").value = state.refinements.size || "";
    document.getElementById("discover-region").value = state.refinements.region || "Canada";
    loadSignals("All");
    route();

    window.addEventListener("hashchange", route);
    document.querySelector(".menu-button").addEventListener("click", function () {
      var nav = document.getElementById("primary-nav");
      var open = nav.classList.toggle("is-open");
      this.setAttribute("aria-expanded", String(open));
    });
    document.querySelector(".drawer-close").addEventListener("click", closeDrawer);
    document.getElementById("drawer-backdrop").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
        closeDrawer();
      }
    });

    document.getElementById("home-city-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var city = document.getElementById("home-city").value.trim();
      if (!city) return toast("Enter the city you are visiting.");
      state.selectedCity = city;
      document.getElementById("discover-city").value = city;
      location.hash = "discover";
      loadSignals(city);
    });

    document.getElementById("discover-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var city = document.getElementById("discover-city").value.trim();
      state.selectedCity = city || "All";
      loadSignals(state.selectedCity);
    });

    document.querySelectorAll("[data-city-jump]").forEach(function (link) {
      link.addEventListener("click", function () {
        var city = link.dataset.cityJump;
        state.selectedCity = city;
        document.getElementById("discover-city").value = city;
        loadSignals(city);
      });
    });

    document.getElementById("visual-file").addEventListener("change", async function () {
      var file = this.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return toast("Choose a JPG, PNG, or WebP image.");
      var data = await fileToData(file, 1000);
      var preview = document.getElementById("visual-preview");
      preview.src = data.dataUrl;
      preview.alt = "Uploaded outfit preview";
      preview.hidden = false;
      state.pendingVisualReference = { image: data.dataUrl, name: file.name.replace(/\.[^.]+$/, "") || "Outfit reference" };
      var saveReference = document.getElementById("save-visual-reference");
      saveReference.hidden = false;
      saveReference.disabled = false;
      saveReference.textContent = "Save original to my private vault";
      document.querySelector("#visual-drop .upload-empty").hidden = true;
    });
    document.getElementById("visual-form").addEventListener("submit", submitVisual);
    document.getElementById("save-visual-reference").addEventListener("click", function () {
      if (!state.pendingVisualReference) return;
      state.uploadedReferences.unshift({ id: uid("reference"), image: state.pendingVisualReference.image, name: state.pendingVisualReference.name, createdAt: new Date().toISOString() });
      if (writeStore("mikayla_uploaded_references_v1", state.uploadedReferences)) {
        updateSavedCount();
        this.textContent = "Saved to private vault";
        this.disabled = true;
        toast("Original saved to your private vault.");
      }
    });

    document.getElementById("plan-file").addEventListener("change", function () {
      document.getElementById("plan-file-name").textContent = this.files[0] ? this.files[0].name : "Choose file";
    });
    document.getElementById("plan-form").addEventListener("submit", submitPlan);

    document.getElementById("apply-refinements").addEventListener("click", function () {
      state.refinements = {
        occasion: document.getElementById("discover-occasion").value,
        colour: document.getElementById("discover-colour").value.trim(),
        size: document.getElementById("discover-size").value.trim(),
        region: document.getElementById("discover-region").value
      };
      writeStore("mikayla_refinements_v1", state.refinements);
      toast("Your city edit has been refined for " + state.refinements.region + ".");
    });

    document.getElementById("closet-files").addEventListener("change", function () {
      addClosetFiles(this.files);
      this.value = "";
    });
    document.getElementById("clear-closet").addEventListener("click", function () {
      if (!state.closet.length) return;
      if (!window.confirm("Delete every piece saved on this device?")) return;
      state.closet = [];
      writeStore("mikayla_closet_v4", []);
      renderCloset();
      renderStudio();
    });
    document.getElementById("save-look-form").addEventListener("submit", saveLook);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

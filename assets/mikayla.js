(function () {
  "use strict";

  var views = {
    home: {
      label: "Home",
      eyebrow: "",
      title: "",
      description: "",
      sections: ["hero", "benefits", "mk-style-feed", "features", "signup"]
    },
    discover: {
      label: "Discover",
      eyebrow: "City fashion intelligence",
      title: "What is the city wearing now?",
      description: "Search any destination, read its current style language, and shop a complete version at the price that works for you.",
      sections: ["mk-style-feed", "trending-looks", "discovery", "shop-look", "it-items"]
    },
    plan: {
      label: "Plan",
      eyebrow: "Itinerary stylist",
      title: "One trip. Every look considered.",
      description: "Start with a city or upload the schedule. MIKAYLA connects each activity and reservation to an outfit that belongs there.",
      sections: ["input-section", "itinerary", "outfit-organizer"]
    },
    closet: {
      label: "Closet",
      eyebrow: "Your wardrobe, remembered",
      title: "Wear what you already love.",
      description: "Add your real clothes once. MIKAYLA will recognise, organise, and reuse them before recommending anything new.",
      sections: ["wardrobe"]
    },
    studio: {
      label: "Studio",
      eyebrow: "Build the complete look",
      title: "Change one piece. Change everything.",
      description: "Move through tops, bottoms, shoes, bags, and accessories until the proportions and price feel exactly right.",
      sections: ["outfitStudio", "it-items"]
    }
  };

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function toast(message) {
    var el = document.getElementById("mkToast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.classList.remove("show"); }, 3200);
  }

  function buildShell() {
    var shell = document.createElement("header");
    shell.className = "mk-shell";
    shell.id = "mkShell";
    shell.innerHTML =
      '<button class="mk-logo" type="button" data-mk-view="home" aria-label="MIKAYLA home">MIKAYLA</button>' +
      '<nav class="mk-nav" aria-label="Primary navigation">' +
        '<button type="button" data-mk-view="discover">Discover</button>' +
        '<button type="button" data-mk-view="plan">Plan</button>' +
        '<button type="button" data-mk-view="closet">Closet</button>' +
        '<button type="button" data-mk-view="studio">Studio</button>' +
      '</nav>' +
      '<button class="mk-account" type="button" data-mk-view="plan">Start a trip</button>' +
      '<button class="mk-menu-toggle" id="mkMenuToggle" type="button" aria-label="Open menu" aria-expanded="false">☰</button>';

    var drawer = document.createElement("div");
    drawer.className = "mk-drawer";
    drawer.id = "mkDrawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML = ["discover", "plan", "closet", "studio"].map(function (view, index) {
      return '<button type="button" data-mk-view="' + view + '">' + views[view].label + '<small>0' + (index + 1) + '</small></button>';
    }).join("");

    var masthead = document.createElement("section");
    masthead.className = "mk-view-masthead";
    masthead.id = "mkViewMasthead";
    masthead.hidden = true;

    var toastEl = document.createElement("div");
    toastEl.className = "mk-toast";
    toastEl.id = "mkToast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");

    document.body.insertBefore(shell, document.body.firstChild);
    document.body.insertBefore(drawer, shell.nextSibling);
    document.body.insertBefore(masthead, drawer.nextSibling);
    document.body.appendChild(toastEl);

    document.querySelectorAll("[data-mk-view]").forEach(function (button) {
      button.addEventListener("click", function () { switchView(button.getAttribute("data-mk-view")); });
    });
    document.getElementById("mkMenuToggle").addEventListener("click", toggleMenu);
    window.addEventListener("scroll", updateShell, { passive: true });
  }

  function toggleMenu() {
    var drawer = document.getElementById("mkDrawer");
    var toggle = document.getElementById("mkMenuToggle");
    var open = drawer.classList.toggle("open");
    drawer.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "×" : "☰";
    document.body.classList.toggle("mk-menu-open", open);
  }

  function closeMenu() {
    var drawer = document.getElementById("mkDrawer");
    var toggle = document.getElementById("mkMenuToggle");
    if (!drawer || !toggle) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";
    document.body.classList.remove("mk-menu-open");
  }

  function updateShell() {
    var shell = document.getElementById("mkShell");
    if (shell) shell.classList.toggle("mk-solid", window.scrollY > 42);
  }

  function switchView(view, options) {
    options = options || {};
    if (!views[view]) view = "home";
    document.body.setAttribute("data-mk-view", view);

    document.querySelectorAll("body > section:not(#mkViewMasthead)").forEach(function (section) {
      section.classList.add("mk-view-hidden");
    });
    views[view].sections.forEach(function (id) {
      var section = document.getElementById(id);
      if (section) section.classList.remove("mk-view-hidden");
    });

    var masthead = document.getElementById("mkViewMasthead");
    masthead.classList.remove("mk-view-hidden");
    if (view === "home") {
      masthead.hidden = true;
    } else {
      masthead.hidden = false;
      masthead.innerHTML =
        "<span>" + escapeHTML(views[view].eyebrow) + "</span>" +
        "<h1>" + escapeHTML(views[view].title) + "</h1>" +
        "<p>" + escapeHTML(views[view].description) + "</p>";
    }

    document.querySelectorAll(".mk-nav [data-mk-view]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-mk-view") === view);
    });
    document.querySelectorAll(".ticker-wrap").forEach(function (ticker) {
      ticker.style.display = view === "home" ? "" : "none";
    });
    closeMenu();
    if (!options.keepScroll) window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
    if (!options.skipHistory) history.replaceState(null, "", "#" + view);
    updateShell();
  }

  function reframeHero() {
    var title = document.querySelector("#hero .hero-wordmark");
    var tagline = document.querySelector("#hero .hero-tagline");
    var sub = document.querySelector("#hero .hero-sub");
    var primary = document.querySelector("#hero .hero-learn");
    var secondary = document.querySelector("#hero .hero-join");
    if (title) title.textContent = "Every city has its own dress code.";
    if (tagline) tagline.textContent = "Travel fashion intelligence";
    if (sub) sub.textContent = "Search the destination or share the itinerary. MIKAYLA reads the local style language and builds a complete wardrobe for every place you are going.";
    if (primary) {
      primary.textContent = "Explore a city";
      primary.onclick = function () { switchView("discover"); };
    }
    if (secondary) {
      secondary.textContent = "Plan a trip";
      secondary.onclick = function () { switchView("plan"); };
    }

    var hero = document.getElementById("hero");
    if (!hero || document.getElementById("mkHeroSearch")) return;
    var form = document.createElement("form");
    form.className = "mk-hero-search";
    form.id = "mkHeroSearch";
    form.innerHTML =
      '<label for="mkHeroCity">Where are you going?</label>' +
      '<div class="mk-search-row">' +
        '<input id="mkHeroCity" type="search" placeholder="Try Paris, Tokyo, or Positano" autocomplete="off" required>' +
        '<button type="submit">Discover ↗</button>' +
      '</div>';
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      discoverCity(document.getElementById("mkHeroCity").value);
    });
    hero.appendChild(form);

    var source = document.createElement("a");
    source.className = "mk-hero-source";
    source.href = "https://www.pinterest.com/pin/397583473358907334/";
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "Look: @cocobeautea · Pinterest ↗";
    hero.appendChild(source);
  }

  function reframeClaims() {
    var inspirationCopy = document.querySelector("#inspiration .masonry-intro p:last-child");
    if (inspirationCopy) {
      inspirationCopy.textContent = "City-specific looks interpreted from current public fashion signals and editorial coverage. Choose a destination to read its signature style.";
    }

    var summerNote = document.querySelector("#european-summer .es-cta-text");
    if (summerNote) summerNote.textContent = "City-specific · Shoppable · Designed to evolve";

    var inspirationFootnote = document.querySelector("#inspiration > p:last-child");
    if (inspirationFootnote) {
      inspirationFootnote.innerHTML = "Current editorial samples — choose <strong>Shop Look</strong> or compare a lower-price <strong>Alternative</strong>.";
    }

    document.querySelectorAll("#inspiration .pin-meta").forEach(function (meta) {
      meta.textContent = meta.textContent
        .replace(/\s*·?\s*@[\w.]+/g, "")
        .replace(/\s*·?\s*(TikTok|Instagram)(\s*#[\w]+)?/gi, "")
        .replace(/\s*·?\s*via Pinterest/gi, " · public style signal");
    });

    var inspirationUnlock = document.querySelector("#inspiration .masonry-cta p");
    if (inspirationUnlock) inspirationUnlock.textContent = "Enter a city to unlock shopping links and budget alternatives for every piece.";

    var stats = document.querySelectorAll("#signup .st");
    var statCopy = [
      ["Any", "City you search"],
      ["Exact + alt.", "Two shopping paths for every look"],
      ["Multiple", "Public and editorial signals considered"],
      ["Head to toe", "Clothing + shoes + jewellery + bags"]
    ];
    stats.forEach(function (stat, index) {
      if (!statCopy[index]) return;
      var number = stat.querySelector(".st-num");
      var label = stat.querySelector(".st-lbl");
      if (number) number.textContent = statCopy[index][0];
      if (label) label.textContent = statCopy[index][1];
    });

    var closetPrivacy = document.querySelector("#wardrobe .mw-add-zone > div:last-child");
    if (closetPrivacy && /browser|servers/i.test(closetPrivacy.textContent)) {
      closetPrivacy.textContent = "Your wardrobe is saved to your device unless secure account storage is configured.";
    }

    var aboutParagraphs = document.querySelectorAll("#about .ab-body p");
    if (aboutParagraphs.length > 1) {
      aboutParagraphs[1].textContent = "MIKAYLA turns public fashion coverage, city context, and the details of your trip into outfit recommendations designed for the place and moment. From a Paris gallery opening to a Tokyo izakaya or a Milan rooftop, every suggestion can connect to an exact piece or a considered alternative.";
    }
  }

  var styleFeedState = {
    items: Array.isArray(window.MIKAYLA_STYLE_FEED) ? window.MIKAYLA_STYLE_FEED.slice() : [],
    city: "All"
  };

  function retailerDestination(retailer, query) {
    var encoded = encodeURIComponent(query);
    var urls = {
      farfetch: "https://www.farfetch.com/shopping/women/search/items.aspx?q=" + encoded,
      revolve: "https://www.revolve.com/r/Search.jsp?search=" + encoded,
      asos: "https://www.asos.com/search/?q=" + encoded
    };
    return urls[retailer] || urls.asos;
  }

  function shopLink(retailer, query, lookId) {
    var destination = retailerDestination(retailer, query);
    if (location.protocol === "file:") return destination;
    return "./api/shop-link?retailer=" + encodeURIComponent(retailer) +
      "&look=" + encodeURIComponent(lookId || "") +
      "&url=" + encodeURIComponent(destination);
  }

  function buildStyleFeed() {
    if (document.getElementById("mk-style-feed")) return;
    var anchor = document.getElementById("european-summer") || document.getElementById("features");
    if (!anchor || !anchor.parentNode) return;

    var section = document.createElement("section");
    section.id = "mk-style-feed";
    section.className = "mk-style-feed";
    section.innerHTML =
      '<div class="mk-feed-head">' +
        '<div><span>Public creator & Pinterest edit</span><h2>Seen in the city.<br><em>Shoppable at your price.</em></h2></div>' +
        '<div class="mk-feed-tools">' +
          '<p>Every image opens into a visual shopping result with designer, contemporary, and budget options. The original creator or Pin remains one click away.</p>' +
          '<form id="mkFeedSearch"><input id="mkFeedCity" type="search" placeholder="Search Paris, Milan, Santorini…" aria-label="Search the style feed by city"><button type="submit">Read the city ↗</button></form>' +
        '</div>' +
      '</div>' +
      '<div class="mk-feed-filters" id="mkFeedFilters"></div>' +
      '<div class="mk-feed-meta"><span id="mkFeedStatus">Curated public references · affiliate-ready shopping paths</span><span>Tap any image to shop</span></div>' +
      '<div class="mk-feed-grid" id="mkFeedGrid"></div>';

    anchor.parentNode.insertBefore(section, anchor);

    var drawer = document.createElement("aside");
    drawer.id = "mkShopDrawer";
    drawer.className = "mk-shop-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML = '<button class="mk-shop-close" type="button" aria-label="Close shopping result">×</button><div id="mkShopDrawerBody"></div>';
    document.body.appendChild(drawer);

    document.getElementById("mkFeedSearch").addEventListener("submit", function (event) {
      event.preventDefault();
      var city = document.getElementById("mkFeedCity").value.trim();
      loadStyleFeed(city || "All");
    });
    document.getElementById("mkFeedFilters").addEventListener("click", function (event) {
      var button = event.target.closest("[data-feed-city]");
      if (!button) return;
      loadStyleFeed(button.getAttribute("data-feed-city"));
    });
    document.getElementById("mkFeedGrid").addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-shop-look]");
      if (trigger) openShopDrawer(trigger.getAttribute("data-shop-look"));
    });
    drawer.querySelector(".mk-shop-close").addEventListener("click", closeShopDrawer);
    drawer.addEventListener("click", function (event) {
      if (event.target === drawer) closeShopDrawer();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeShopDrawer();
    });

    renderFeedFilters();
    renderStyleFeed(styleFeedState.items, "All", "Curated public references");
    loadStyleFeed("All");
  }

  function renderFeedFilters() {
    var cities = ["All"];
    styleFeedState.items.forEach(function (item) {
      if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
    });
    var filters = document.getElementById("mkFeedFilters");
    if (!filters) return;
    filters.innerHTML = cities.map(function (city) {
      return '<button type="button" data-feed-city="' + escapeHTML(city) + '">' + escapeHTML(city) + '</button>';
    }).join("");
  }

  function renderStyleFeed(items, city, status) {
    styleFeedState.city = city || "All";
    var allItems = Array.isArray(items) ? items : [];
    var filtered = styleFeedState.city === "All"
      ? allItems
      : allItems.filter(function (item) { return String(item.city).toLowerCase() === styleFeedState.city.toLowerCase(); });
    if (!filtered.length) filtered = allItems.slice(0, 8);

    var grid = document.getElementById("mkFeedGrid");
    var statusEl = document.getElementById("mkFeedStatus");
    if (!grid) return;
    if (statusEl) statusEl.textContent = status || "Curated public references";
    document.querySelectorAll("#mkFeedFilters [data-feed-city]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-feed-city").toLowerCase() === styleFeedState.city.toLowerCase());
    });

    grid.innerHTML = filtered.map(function (item, index) {
      var tall = index % 5 === 0 || index % 5 === 3 ? " tall" : "";
      return '<article class="mk-feed-card' + tall + '">' +
        '<button class="mk-feed-image" type="button" data-shop-look="' + escapeHTML(item.id) + '" aria-label="Shop ' + escapeHTML(item.title) + '">' +
          '<img src="' + escapeHTML(item.image) + '" alt="' + escapeHTML(item.title) + '" loading="lazy" referrerpolicy="no-referrer">' +
          '<span class="mk-feed-city">' + escapeHTML(item.city) + '</span>' +
          '<span class="mk-feed-shop">Visual shop ↗</span>' +
        '</button>' +
        '<div class="mk-feed-copy"><div><h3>' + escapeHTML(item.title) + '</h3><p>' + escapeHTML(item.signal || "") + '</p></div>' +
          '<a href="' + escapeHTML(item.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(item.creator || item.source || "View source") + ' ↗</a>' +
        '</div>' +
      '</article>';
    }).join("");
    grid.querySelectorAll("img").forEach(function (image) {
      image.addEventListener("error", function () {
        var card = image.closest(".mk-feed-card");
        if (card) card.remove();
      }, { once: true });
    });
  }

  async function loadStyleFeed(city) {
    city = String(city || "All").trim() || "All";
    var fallback = Array.isArray(window.MIKAYLA_STYLE_FEED) ? window.MIKAYLA_STYLE_FEED : styleFeedState.items;
    styleFeedState.items = fallback.slice();
    renderFeedFilters();
    renderStyleFeed(fallback, city, city === "All" ? "Curated public references" : "Reading the " + city + " board edit");
    if (location.protocol === "file:") return;

    try {
      var response = await fetch("./api/style-signals?city=" + encodeURIComponent(city === "All" ? "" : city));
      if (!response.ok) return;
      var data = await response.json();
      if (!Array.isArray(data.items) || !data.items.length) return;
      styleFeedState.items = data.items;
      renderFeedFilters();
      renderStyleFeed(data.items, city, data.live ? "Live from the MIKAYLA Pinterest board" : "Curated public references");
    } catch (_) {}
  }

  function openShopDrawer(id) {
    var item = styleFeedState.items.find(function (entry) { return entry.id === id; }) ||
      (window.MIKAYLA_STYLE_FEED || []).find(function (entry) { return entry.id === id; });
    if (!item) return;
    var drawer = document.getElementById("mkShopDrawer");
    var body = document.getElementById("mkShopDrawerBody");
    var pieces = Array.isArray(item.pieces) ? item.pieces : String(item.signal || "").split("·").map(function (piece) { return piece.trim(); }).filter(Boolean);
    var lensUrl = "https://lens.google.com/uploadbyurl?url=" + encodeURIComponent(item.image);
    body.innerHTML =
      '<div class="mk-shop-visual"><img src="' + escapeHTML(item.image) + '" alt="' + escapeHTML(item.title) + '" referrerpolicy="no-referrer"></div>' +
      '<div class="mk-shop-content">' +
        '<span class="mk-shop-eyebrow">' + escapeHTML(item.city) + ' · visual match</span>' +
        '<h2>' + escapeHTML(item.title) + '</h2>' +
        '<p>' + escapeHTML(item.signal || "") + '</p>' +
        '<div class="mk-detected"><span>Pieces detected</span>' + pieces.map(function (piece) { return '<b>' + escapeHTML(piece) + '</b>'; }).join("") + '</div>' +
        '<div class="mk-price-paths">' +
          '<a href="' + escapeHTML(shopLink("farfetch", item.query, item.id)) + '" target="_blank" rel="nofollow sponsored noopener"><small>Designer</small><strong>Investment edit</strong><span>Farfetch ↗</span></a>' +
          '<a href="' + escapeHTML(shopLink("revolve", item.query, item.id)) + '" target="_blank" rel="nofollow sponsored noopener"><small>Contemporary</small><strong>Mid-range match</strong><span>Revolve ↗</span></a>' +
          '<a href="' + escapeHTML(shopLink("asos", item.query, item.id)) + '" target="_blank" rel="nofollow sponsored noopener"><small>Budget</small><strong>Under-$150 search</strong><span>ASOS ↗</span></a>' +
        '</div>' +
        '<div class="mk-shop-source"><a href="' + escapeHTML(item.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Open original source ↗</a><a href="' + escapeHTML(lensUrl) + '" target="_blank" rel="noopener noreferrer">Search image with Google Lens ↗</a></div>' +
        '<p class="mk-affiliate-note">Shopping links are ready to route through MIKAYLA affiliate IDs when the retailer accounts are connected.</p>' +
      '</div>';
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("mk-menu-open");
  }

  function closeShopDrawer() {
    var drawer = document.getElementById("mkShopDrawer");
    if (!drawer) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("mk-menu-open");
  }

  function discoverCity(city) {
    city = String(city || "").trim();
    if (!city) return;
    switchView("discover", { instant: true });
    loadStyleFeed(city);
    var field = document.getElementById("discCityInput");
    if (field) field.value = city;
    setTimeout(function () {
      if (typeof window.applyDiscCity === "function") {
        window.applyDiscCity();
        if (typeof window.MIKAYLA_loadTrendingLooks === "function") {
          window.MIKAYLA_loadTrendingLooks(city);
        }
        if (typeof window.MIKAYLA_loadFeaturedLook === "function") {
          window.MIKAYLA_loadFeaturedLook(city);
        }
      } else {
        toast("The city search is still loading. Please try again.");
      }
    }, 40);
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var result = String(reader.result);
        resolve(result.slice(result.indexOf(",") + 1));
      };
      reader.readAsDataURL(file);
    });
  }

  function fileToText(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.readAsText(file);
    });
  }

  function buildItineraryUploader() {
    var panel = document.getElementById("panel-itinerary-upload");
    if (!panel) return;
    panel.innerHTML =
      '<form class="mk-itinerary-uploader" id="mkItineraryForm">' +
        '<div class="mk-itinerary-files">' +
          '<h3>Share your itinerary</h3>' +
          '<p>Add a screenshot, image, PDF, or text document. Named venues and activities become distinct styling moments.</p>' +
          '<label class="mk-file-drop" for="mkItineraryFile">' +
            '<input id="mkItineraryFile" type="file" accept="image/*,.pdf,.txt,text/plain">' +
            '<b>+</b><strong id="mkItineraryFileLabel">Choose a file</strong><small>PDF, JPG, PNG, or TXT · up to 10MB</small>' +
          '</label>' +
        '</div>' +
        '<div class="mk-itinerary-copy">' +
          '<textarea id="mkItineraryText" placeholder="Or paste your plans here…&#10;&#10;Friday, 8 PM — dinner at Gigi Rigolatto&#10;Saturday — Louvre, lunch at Loulou, drinks at Bar Hemingway"></textarea>' +
          '<div class="mk-itinerary-actions">' +
            '<select id="mkItineraryBudget" aria-label="Budget"><option value="affordable">Under $200 / look</option><option value="mid" selected>$200–$500 / look</option><option value="luxury">$500+ / look</option><option value="mixed">Mix high and low</option></select>' +
            '<select id="mkItineraryRewear" aria-label="Rewear preference"><option value="1">No rewear</option><option value="2" selected>Rewear twice</option><option value="3">Rewear three times</option></select>' +
            '<button type="submit">Style my trip ↗</button>' +
          '</div>' +
        '</div>' +
        '<div class="mk-itinerary-result" id="mkItineraryResult" hidden></div>' +
      '</form>';

    var fileInput = document.getElementById("mkItineraryFile");
    fileInput.addEventListener("change", function () {
      if (fileInput.files[0]) document.getElementById("mkItineraryFileLabel").textContent = fileInput.files[0].name;
    });
    document.getElementById("mkItineraryForm").addEventListener("submit", submitItinerary);
  }

  async function submitItinerary(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var file = document.getElementById("mkItineraryFile").files[0];
    var text = document.getElementById("mkItineraryText").value.trim();
    var button = form.querySelector('button[type="submit"]');
    var result = document.getElementById("mkItineraryResult");
    if (!file && !text) {
      toast("Add an itinerary file or paste your plans first.");
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      toast("Please choose a file smaller than 10MB.");
      return;
    }
    button.disabled = true;
    button.textContent = "Reading every place…";
    result.hidden = false;
    result.innerHTML = "<h3>Reading atmosphere, dress codes, and rewear possibilities…</h3>";

    try {
      var payload = {
        itinerary_text: text,
        city: (document.getElementById("cityInput") || {}).value || "",
        budget: document.getElementById("mkItineraryBudget").value,
        rewear: Number(document.getElementById("mkItineraryRewear").value)
      };
      if (file) {
        if (file.type === "text/plain" || /\.txt$/i.test(file.name)) {
          payload.itinerary_text = [payload.itinerary_text, await fileToText(file)].filter(Boolean).join("\n");
        } else {
          var encoded = await fileToBase64(file);
          payload.media_type = file.type || "application/octet-stream";
          if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) payload.document_base64 = encoded;
          else payload.image_base64 = encoded;
        }
      }
      var response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      var data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "The itinerary could not be read.");
      renderItinerary(data);
      try { localStorage.setItem("mikayla_itinerary_v3", JSON.stringify(data)); } catch (_) {}
      toast("Your itinerary wardrobe is ready.");
    } catch (error) {
      result.innerHTML = '<h3 class="mk-error">We could not finish that read.</h3><p>' + escapeHTML(error.message) + '</p>';
    } finally {
      button.disabled = false;
      button.textContent = "Style my trip ↗";
    }
  }

  function renderItinerary(data) {
    var result = document.getElementById("mkItineraryResult");
    var schedule = Array.isArray(data.schedule) ? data.schedule : [];
    result.innerHTML =
      '<div class="mk-trip-summary"><div><small>' + escapeHTML(data.dates || "Your trip") + '</small><h3>' + escapeHTML(data.destination || "Trip wardrobe") + '</h3></div><span>' + escapeHTML(data.total_occasions || "") + ' occasions</span></div>' +
      '<p class="mk-capsule">' + escapeHTML(data.capsule_note || "A considered capsule for the way your days actually unfold.") + '</p>' +
      schedule.map(function (day) {
        return '<section class="mk-day"><h4>Day ' + escapeHTML(day.day) + ' · ' + escapeHTML(day.date || "") + '</h4>' +
          (day.events || []).map(function (item) {
            return '<article class="mk-event"><time>' + escapeHTML(item.time || "—") + '</time><div>' +
              '<h5>' + escapeHTML(item.venue || item.venue_type || "Your plan") + '</h5>' +
              '<span class="mk-event-badge">' + escapeHTML(item.dress_code || "City appropriate") + '</span>' +
              '<p class="mk-event-look">' + escapeHTML((item.outfit || {}).description || "") + '</p>' +
              '<p class="mk-event-note">' + escapeHTML((item.outfit || {}).stylist_note || "") + '</p>' +
            '</div></article>';
          }).join("") + '</section>';
      }).join("");
  }

  function restoreItinerary() {
    try {
      var saved = JSON.parse(localStorage.getItem("mikayla_itinerary_v3") || "null");
      if (saved) {
        var result = document.getElementById("mkItineraryResult");
        if (result) {
          result.hidden = false;
          renderItinerary(saved);
        }
      }
    } catch (_) {}
  }

  function correctClaims() {
    var featureTitles = document.querySelectorAll("#features .feat-title");
    var featureBodies = document.querySelectorAll("#features .feat-body");
    if (featureTitles[0]) featureTitles[0].textContent = "Public signals and editorial context, in one considered edit";
    if (featureBodies[0]) featureBodies[0].textContent = "MIKAYLA combines approved public sources, fashion coverage, and city context. Direct social-platform data activates only through approved access.";
    if (featureTitles[1]) featureTitles[1].textContent = "Every booking becomes a dress-code decision";
    if (featureBodies[1]) featureBodies[1].textContent = "Named venues are interpreted through available public information and AI context, with clear confidence rather than invented review claims.";
    var sourceDetails = document.querySelectorAll(".source-detail");
    if (sourceDetails[0]) sourceDetails[0].textContent = "Open city-tagged references";
    if (sourceDetails[1]) sourceDetails[1].textContent = "Open style videos and city vlogs";
  }

  function hookLegacyNavigation() {
    var originalScrollToCity = window.scrollToCity;
    window.scrollToCity = function (city) {
      switchView("discover", { instant: true });
      setTimeout(function () {
        if (typeof originalScrollToCity === "function") originalScrollToCity(city);
        else discoverCity(city);
      }, 30);
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildShell();
    reframeHero();
    reframeClaims();
    buildStyleFeed();
    buildItineraryUploader();
    correctClaims();
    hookLegacyNavigation();
    restoreItinerary();

    var initial = location.hash.replace("#", "");
    switchView(views[initial] ? initial : "home", { instant: true, skipHistory: true });
    updateShell();
  });
})();

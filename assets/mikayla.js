(function () {
  "use strict";

  var views = {
    home: {
      label: "Home",
      eyebrow: "",
      title: "",
      description: "",
      sections: ["hero", "benefits", "european-summer", "inspiration", "features", "style-journal", "about", "signup"]
    },
    discover: {
      label: "Discover",
      eyebrow: "City fashion intelligence",
      title: "What is the city wearing now?",
      description: "Search any destination, read its current style language, and shop a complete version at the price that works for you.",
      sections: ["european-summer", "trending-looks", "discovery", "inspiration", "shop-look", "shop-this-look", "it-items"]
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

  function discoverCity(city) {
    city = String(city || "").trim();
    if (!city) return;
    switchView("discover", { instant: true });
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
    buildItineraryUploader();
    correctClaims();
    hookLegacyNavigation();
    restoreItinerary();

    var initial = location.hash.replace("#", "");
    switchView(views[initial] ? initial : "home", { instant: true, skipHistory: true });
    updateShell();
  });
})();

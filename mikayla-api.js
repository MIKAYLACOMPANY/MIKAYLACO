// MIKAYLA Frontend API Client
// Include this script in index.html just before the closing </body> tag:
//   <script src="/mikayla-api.js"></script>
//
// Wires up city selection, trend display, product grid, and outfit recommendations.

(function() {
  'use strict';

  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8888/api'
    : '/api';

  // -- Utility ---------------------------------------------------------------
  function $(id) { return document.getElementById(id); }
  function setText(id, text) { var el = $(id); if (el) el.textContent = text; }

  // -- Trend loader ----------------------------------------------------------
  async function loadTrends(city) {
    if (!city) return;
    try {
      var res  = await fetch(API_BASE + '/trends?city=' + encodeURIComponent(city.toLowerCase()));
      var data = await res.json();
      renderTrends(data);
    } catch (err) {
      console.warn('MIKAYLA: trends fetch failed', err);
    }
  }

  function renderTrends(data) {
    if (!data) return;
    setText('trendHeadline',    data.headline            || '');
    setText('trendVibe',        data.vibe_of_the_moment  || '');
    setText('trendInsiderTip',  data.insider_tip         || '');
    setText('trendAvoid',       data.avoid               || '');

    var trendList = $('trendingNowList');
    if (trendList && data.trending_now) {
      trendList.innerHTML = data.trending_now.map(function(t) {
        return '<li class="trend-item">' +
          '<span class="trend-name">'   + escapeHtml(t.item) + '</span>' +
          '<span class="trend-why">'    + escapeHtml(t.why)  + '</span>' +
          '<span class="trend-brands">' + (t.key_brands||[]).map(escapeHtml).join(' Â· ') + '</span>' +
          '</li>';
      }).join('');
    }

    var colorRow = $('trendColors');
    if (colorRow && data.key_colors) {
      colorRow.innerHTML = data.key_colors.map(function(c) {
        return '<span class="trend-color-chip">' + escapeHtml(c) + '</span>';
      }).join('');
    }

    if (data.dress_codes) {
      setText('dresscodeDay',       data.dress_codes.day       || '');
      setText('dresscodeDinner',    data.dress_codes.dinner    || '');
      setText('dresscodeNightlife', data.dress_codes.nightlife || '');
    }
  }

  // -- Product grid loader ---------------------------------------------------
  // Fetches 2 items each from 3 rotated categories for the selected city,
  // producing a curated cross-category mix that changes by hour + city.
  // Once AWIN_API_TOKEN is set in Netlify env vars, returns real affiliate products.
  async function loadProducts(city, forcedCategory, vibe) {
    var grid = $('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    grid.style.opacity       = '0.4';
    grid.style.pointerEvents = 'none';

    try {
      var ALL_CATS = ['tops','dresses','shoes','bags','accessories','bottoms'];
      var hour     = new Date().getHours();
      var offset   = (hour + (city.charCodeAt(0) || 0)) % ALL_CATS.length;
      var cats     = forcedCategory
        ? [forcedCategory]
        : [ALL_CATS[offset % 6], ALL_CATS[(offset+2) % 6], ALL_CATS[(offset+4) % 6]];
      var requests = cats.map(function(cat) {
        return fetch(API_BASE + '/products?city=' + encodeURIComponent(city) + '&category=' + cat + '&limit=2')
          .then(function(r) { return r.json(); })
          .catch(function() { return { products: [] }; });
      });
      var results     = await Promise.all(requests);
      var allProducts = results.reduce(function(acc, r) { return acc.concat(r.products || []); }, []);
      var trending    = (results[0] && results[0].trending)       || [];
      var vibeLabel   = (results[0] && results[0].vibe)           || '';
      var fromAwin    = !!(results[0] && results[0].powered_by_awin);

      if (allProducts.length) {
        renderProductGrid(allProducts, grid, { city: city, trending: trending, vibeLabel: vibeLabel, fromAwin: fromAwin });
      }
    } catch (err) {
      console.warn('MIKAYLA: products fetch failed, keeping demo grid', err);
    } finally {
      grid.style.opacity       = '';
      grid.style.pointerEvents = '';
    }
  }

  function renderProductGrid(products, grid, meta) {
    var trendBar = '';
    if (meta && meta.city && meta.trending && meta.trending.length) {
      var pills  = meta.trending.slice(0,3).map(function(t) {
        return '<span class="t-pill" style="background:var(--off-white);padding:3px 10px;border-radius:2px;font-size:11px;">' + escapeHtml(t) + '</span>';
      }).join('');
      var source = meta.fromAwin
        ? '<span style="font-size:10px;opacity:0.5;margin-left:auto;">live via Awin \u2713</span>'
        : '<span style="font-size:10px;opacity:0.4;margin-left:auto;">demo \u2014 add Awin key for live products</span>';
      trendBar = '<div class="trend-bar" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 0 18px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--light);border-bottom:1px solid var(--off-white);margin-bottom:20px;">' +
        '<span style="opacity:.5;">Trending in ' + escapeHtml(meta.city) + '</span>' +
        pills + source + '</div>';
    }

    var cards = products.map(function(p) {
      return '<div class="product-card" onclick="window.open(\'' + escapeHtml(p.affiliate||'#') + '\',\'_blank\')" style="cursor:pointer;">' +
        '<div class="product-img">' +
        '<img src="' + escapeHtml(p.image||'') + '" alt="' + escapeHtml(p.name) + '" loading="lazy" ' +
        'onerror="this.closest(\'.product-img\').style.background=\'#f5f2ee\';this.style.display=\'none\';">' +
        '</div>' +
        '<div class="product-info">' +
        '<div class="product-brand">' + escapeHtml(p.brand||'') + '</div>' +
        '<div class="product-name">'  + escapeHtml(p.name)       + '</div>' +
        '<div class="product-price">$' + Number(p.price||0).toLocaleString() + '</div>' +
        '<a class="product-buy" href="' + escapeHtml(p.affiliate||'#') + '" target="_blank" rel="nofollow sponsored noopener" onclick="event.stopPropagation()">Shop Now \u2192</a>' +
        '</div></div>';
    }).join('');

    grid.innerHTML = trendBar + cards;
    if (window.MIKAYLA_makeCardsClickable) window.MIKAYLA_makeCardsClickable();
  }

  // -- Outfit recommendation loader ------------------------------------------
  async function loadRecommendation(city, occasion, budget, vibe, days) {
    var resultsEl = $('recommendationResults') || $('outfitStudio');
    if (!resultsEl) return;
    var loadingEl = $('recommendLoading');
    if (loadingEl) loadingEl.style.display = 'flex';
    try {
      var res  = await fetch(API_BASE + '/recommend', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ city: city, occasion: occasion, budget: budget, vibe: vibe, days: days }),
      });
      var data = await res.json();
      renderRecommendation(data, resultsEl);
    } catch (err) {
      console.warn('MIKAYLA: recommendation fetch failed', err);
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }

  function renderRecommendation(data, container) {
    if (!data || !data.outfits) return;
    setText('packingPhilosophy', data.packing_philosophy || '');
    setText('localTip',         data.local_tip          || '');
    setText('capsuleSummary',   data.capsule_summary    || '');
    var heroList = $('heroPieces');
    if (heroList && data.hero_pieces) {
      heroList.innerHTML = data.hero_pieces.map(function(p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('');
    }
    var outfitsEl = $('outfitCards');
    if (outfitsEl && data.outfits) {
      outfitsEl.innerHTML = data.outfits.map(function(outfit) {
        return '<div class="outfit-card">' +
          '<div class="outfit-occasion">' + escapeHtml(outfit.occasion) + '</div>' +
          '<p class="outfit-description">' + escapeHtml(outfit.description) + '</p>' +
          '<div class="outfit-items">' +
          (outfit.items||[]).map(function(item) {
            return '<div class="outfit-item">' +
              '<span class="outfit-category">' + escapeHtml(item.category) + '</span>' +
              '<span class="outfit-name">'     + escapeHtml(item.name)     + '</span>' +
              '<span class="outfit-brand">'    + escapeHtml(item.brand)    + '</span>' +
              '<span class="outfit-price">~$'  + (item.price_approx||0)   + '</span>' +
              '<p class="outfit-why">'          + escapeHtml(item.why)     + '</p>' +
              '<a class="outfit-shop" href="https://www.farfetch.com/search/?q=' +
              encodeURIComponent(item.search_query||item.name) +
              '" target="_blank" rel="nofollow sponsored noopener">Find This \u2192</a>' +
              '</div>';
          }).join('') +
          '</div></div>';
      }).join('');
    }
  }

  // -- Init ------------------------------------------------------------------
  function init() {
    var cityInput = $('cityInput');
    if (cityInput) {
      var trendDebounce;
      cityInput.addEventListener('input', function() {
        clearTimeout(trendDebounce);
        var city = this.value.trim();
        if (city.length > 2) {
          trendDebounce = setTimeout(function() {
            loadTrends(city);
            loadProducts(city);
          }, 600);
        }
      });
    }

    var findBtn = $('findLookBtn') || $('generateBtn') || document.querySelector('[data-action="find-look"]');
    if (findBtn) {
      findBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var city     = ($('cityInput')      || {}).value || '';
        var occasion = ($('occasionSelect') || {}).value || 'general';
        var budget   = ($('budgetSelect')   || {}).value || 'mixed';
        var days     = parseInt(($('daysInput') || {}).value || '5');
        var vibe     = (document.querySelector('.vibe-card.selected .vibe-title') || {}).textContent || '';
        if (city) loadRecommendation(city, occasion, budget, vibe, days);
      });
    }

    var activePill = document.querySelector('.city-pill.active');
    var startCity  = (cityInput || {}).value || (activePill && activePill.textContent.trim()) || 'Paris';
    loadTrends(startCity);
    loadProducts(startCity);

    window.MIKAYLA_API = { loadTrends: loadTrends, loadProducts: loadProducts, loadRecommendation: loadRecommendation };
  }

  // -- Helpers ---------------------------------------------------------------
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

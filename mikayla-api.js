// MIKAYLA Frontend API Client v2
// Connects to the live trend intelligence engine (/api/live-trends)
// and product search (/api/product-search + /api/products).
//
// What changed in v2:
//   - loadTrends now calls /api/live-trends (Reddit + Google Trends + RSS → Claude)
//   - renderTrends shows each trending item with 3 shoppable retailer links
//   - Live data badge shows source count (RSS articles + Reddit posts + Google Trends terms)
//   - Backward compatible: falls back to /api/trends if live-trends unavailable

(function() {
  'use strict';

  var API_BASE = '/api';

  // ── Utility ─────────────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function setText(id, text) { var el = $(id); if (el) el.textContent = text; }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  function tierLabel(tier) {
    if (tier === 'budget')  return '$';
    if (tier === 'luxury')  return '$$$';
    return '$$';
  }

  // ── Trend loader ─────────────────────────────────────────────────────────────
  async function loadTrends(city) {
    if (!city) return;
    try {
      var res = await fetch(API_BASE + '/live-trends?city=' + encodeURIComponent(city));
      if (!res.ok) throw new Error('live-trends ' + res.status);
      var data = await res.json();
      renderTrends(data);
    } catch (err) {
      console.warn('MIKAYLA: live-trends failed, trying legacy endpoint', err);
      try {
        var res2  = await fetch(API_BASE + '/trends?city=' + encodeURIComponent(city.toLowerCase()));
        var data2 = await res2.json();
        renderTrends(data2);
      } catch (err2) {
        console.warn('MIKAYLA: trends fetch failed', err2);
      }
    }
  }

  // ── Trend renderer ───────────────────────────────────────────────────────────
  function renderTrends(data) {
    if (!data) return;

    setText('trendHeadline',   data.headline           || '');
    setText('trendVibe',       data.vibe_of_the_moment || '');
    setText('trendInsiderTip', data.insider_tip        || '');
    setText('trendAvoid',      data.what_locals_avoid  || data.avoid || '');

    if (data.dress_codes) {
      setText('dresscodeDay',       data.dress_codes.day       || '');
      setText('dresscodeDinner',    data.dress_codes.dinner    || '');
      setText('dresscodeNightlife', data.dress_codes.nightlife || '');
    }

    var colorRow = $('trendColors');
    var palette  = data.color_palette || data.key_colors || [];
    if (colorRow && palette.length) {
      colorRow.innerHTML = palette.map(function(c) {
        return '<span class="trend-color-chip">' + escapeHtml(c) + '</span>';
      }).join('');
    }

    var trendList = $('trendingNowList');
    if (!trendList) return;

    // Normalise v1 format (trending_now) into v2 shape (trending_items)
    var items = data.trending_items || null;
    var isV2  = !!items;
    if (!isV2 && data.trending_now && data.trending_now.length) {
      items = data.trending_now.map(function(t) {
        return {
          name:           t.item,
          why_trending:   t.why,
          key_brands:     t.key_brands || [],
          tiktok_context: t.tiktok_context || '',
          shop_links:     [],
        };
      });
    }

    if (!items || !items.length) {
      trendList.innerHTML = '<li class="trend-item trend-item--empty">Add ANTHROPIC_API_KEY to Vercel to enable live AI trend synthesis.</li>';
      return;
    }

    // Live data badge
    var liveBadge = '';
    if (isV2 && data._sources && data._sources.total_inputs > 0) {
      var s      = data._sources;
      var cached = data._cached ? ' · cached ' + (data._cache_age_mins || 0) + 'm ago' : ' · just fetched';
      liveBadge  = '<div class="trend-live-badge">' +
        '<span class="trend-live-dot"></span>' +
        '<span>' + s.rss_articles + ' editorial · ' + s.reddit_posts + ' Reddit · ' + s.google_trends_terms + ' Google Trends' + cached + '</span>' +
        '</div>';
    }

    // Item cards
    var cards = items.map(function(item) {
      var shopLinksHtml = '';
      if (item.shop_links && item.shop_links.length) {
        shopLinksHtml = '<div class="trend-shop-links">' +
          item.shop_links.map(function(link) {
            return '<a class="trend-shop-btn" href="' + escapeHtml(link.url) + '" target="_blank" rel="nofollow sponsored noopener">' +
              escapeHtml(link.name) + ' <span class="trend-shop-tier">' + tierLabel(link.tier) + '</span>' +
              '</a>';
          }).join('') +
          '</div>';
      }

      var brandsHtml = '';
      if (item.key_brands && item.key_brands.length) {
        brandsHtml = '<span class="trend-brands">' + item.key_brands.map(escapeHtml).join(' · ') + '</span>';
      }

      var tiktokHtml = '';
      if (item.tiktok_context) {
        tiktokHtml = '<span class="trend-tiktok">↗ ' + escapeHtml(item.tiktok_context) + '</span>';
      }

      var metaHtml = '';
      if (item.color || item.price_range) {
        var parts = [];
        if (item.color)       parts.push(escapeHtml(item.color));
        if (item.price_range) parts.push(escapeHtml(item.price_range));
        metaHtml = '<span class="trend-meta">' + parts.join(' · ') + '</span>';
      }

      return '<li class="trend-item">' +
        '<span class="trend-name">'   + escapeHtml(item.name)            + '</span>' +
        metaHtml +
        '<span class="trend-why">'    + escapeHtml(item.why_trending || '') + '</span>' +
        brandsHtml +
        tiktokHtml +
        shopLinksHtml +
        '</li>';
    }).join('');

    trendList.innerHTML = liveBadge + '<ul class="trend-items-ul">' + cards + '</ul>';
  }

  // ── Product grid loader ──────────────────────────────────────────────────────
  async function loadProducts(city, forcedCategory) {
    var grid = $('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    grid.style.opacity       = '0.4';
    grid.style.pointerEvents = 'none';

    try {
      var ALL_CATS = ['tops', 'dresses', 'shoes', 'bags', 'accessories', 'bottoms'];
      var hour     = new Date().getHours();
      var offset   = (hour + (city.charCodeAt(0) || 0)) % ALL_CATS.length;
      var cats     = forcedCategory
        ? [forcedCategory]
        : [ALL_CATS[offset % 6], ALL_CATS[(offset + 2) % 6], ALL_CATS[(offset + 4) % 6]];

      var requests = cats.map(function(cat) {
        return fetch(API_BASE + '/products?city=' + encodeURIComponent(city) + '&category=' + cat + '&limit=2')
          .then(function(r) { return r.json(); })
          .catch(function()  { return { products: [] }; });
      });
      var results     = await Promise.all(requests);
      var allProducts = results.reduce(function(acc, r) { return acc.concat(r.products || []); }, []);
      var trending    = (results[0] && results[0].trending) || [];
      var fromAwin    = !!(results[0] && results[0].powered_by_awin);

      if (allProducts.length) {
        renderProductGrid(allProducts, grid, { city: city, trending: trending, fromAwin: fromAwin });
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
      var pills  = meta.trending.slice(0, 3).map(function(t) {
        return '<span class="t-pill" style="background:var(--off-white);padding:3px 10px;border-radius:2px;font-size:11px;">' + escapeHtml(t) + '</span>';
      }).join('');
      var source = meta.fromAwin
        ? '<span style="font-size:10px;opacity:0.5;margin-left:auto;">live via Awin ✓</span>'
        : '<span style="font-size:10px;opacity:0.4;margin-left:auto;">demo — add Awin key for live products</span>';
      trendBar = '<div class="trend-bar" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 0 18px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--light);border-bottom:1px solid var(--off-white);margin-bottom:20px;">' +
        '<span style="opacity:.5;">Trending in ' + escapeHtml(meta.city) + '</span>' +
        pills + source + '</div>';
    }

    var cards = products.map(function(p) {
      return '<div class="product-card" onclick="window.open(\'' + escapeHtml(p.affiliate || '#') + '\',\'_blank\')" style="cursor:pointer;">' +
        '<div class="product-img">' +
        '<img src="' + escapeHtml(p.image || '') + '" alt="' + escapeHtml(p.name) + '" loading="lazy" ' +
        'onerror="this.closest(\'.product-img\').style.background=\'#f5f2ee\';this.style.display=\'none\';">' +
        '</div>' +
        '<div class="product-info">' +
        '<div class="product-brand">' + escapeHtml(p.brand || '') + '</div>' +
        '<div class="product-name">'  + escapeHtml(p.name)        + '</div>' +
        '<div class="product-price">$' + Number(p.price || 0).toLocaleString() + '</div>' +
        '<a class="product-buy" href="' + escapeHtml(p.affiliate || '#') + '" target="_blank" rel="nofollow sponsored noopener" onclick="event.stopPropagation()">Shop Now →</a>' +
        '</div></div>';
    }).join('');

    grid.innerHTML = trendBar + cards;
    if (window.MIKAYLA_makeCardsClickable) window.MIKAYLA_makeCardsClickable();
  }

  // ── Outfit recommendation loader ─────────────────────────────────────────────
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
          '<div class="outfit-occasion">' + escapeHtml(outfit.occasion)     + '</div>' +
          '<p class="outfit-description">' + escapeHtml(outfit.description) + '</p>' +
          '<div class="outfit-items">' +
          (outfit.items || []).map(function(item) {
            return '<div class="outfit-item">' +
              '<span class="outfit-category">' + escapeHtml(item.category)   + '</span>' +
              '<span class="outfit-name">'     + escapeHtml(item.name)       + '</span>' +
              '<span class="outfit-brand">'    + escapeHtml(item.brand)      + '</span>' +
              '<span class="outfit-price">~$'  + (item.price_approx || 0)   + '</span>' +
              '<p class="outfit-why">'          + escapeHtml(item.why)       + '</p>' +
              '<a class="outfit-shop" href="https://www.farfetch.com/search/?q=' +
              encodeURIComponent(item.search_query || item.name) +
              '" target="_blank" rel="nofollow sponsored noopener">Find This →</a>' +
              '</div>';
          }).join('') +
          '</div></div>';
      }).join('');
    }
  }

  // ── Inject CSS for trend elements ────────────────────────────────────────────
  function injectTrendStyles() {
    if (document.getElementById('mikayla-trend-styles')) return;
    var s   = document.createElement('style');
    s.id    = 'mikayla-trend-styles';
    s.textContent =
      '.trend-live-badge{display:flex;align-items:center;gap:6px;font-family:"Raleway",sans-serif;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(10,10,10,.4);padding:8px 0 16px;border-bottom:1px solid var(--border,#e8e4dd);margin-bottom:16px;}' +
      '.trend-live-dot{width:6px;height:6px;border-radius:50%;background:#4caf50;animation:livePulse 2s ease-in-out infinite;flex-shrink:0;}' +
      '@keyframes livePulse{0%,100%{opacity:1}50%{opacity:.35}}' +
      '.trend-items-ul{list-style:none;margin:0;padding:0;}' +
      '.trend-item{padding:20px 0;border-bottom:1px solid var(--border,#e8e4dd);}' +
      '.trend-item:last-child{border-bottom:none;}' +
      '.trend-name{display:block;font-family:"Cormorant Garamond",serif;font-size:18px;font-weight:500;color:var(--black,#0a0a0a);margin-bottom:4px;}' +
      '.trend-meta{display:block;font-family:"Raleway",sans-serif;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(10,10,10,.35);margin-bottom:8px;}' +
      '.trend-why{display:block;font-family:"Raleway",sans-serif;font-size:12px;line-height:1.7;color:rgba(10,10,10,.6);margin-bottom:8px;}' +
      '.trend-brands{display:block;font-family:"Raleway",sans-serif;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(10,10,10,.4);margin-bottom:6px;}' +
      '.trend-tiktok{display:block;font-family:"Raleway",sans-serif;font-size:11px;font-style:italic;color:rgba(10,10,10,.45);margin-bottom:10px;}' +
      '.trend-shop-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}' +
      '.trend-shop-btn{display:inline-flex;align-items:center;gap:4px;font-family:"Raleway",sans-serif;font-size:10px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:var(--black,#0a0a0a);text-decoration:none;border:1px solid var(--border,#e8e4dd);padding:7px 14px;transition:all .2s;white-space:nowrap;}' +
      '.trend-shop-btn:hover{background:var(--black,#0a0a0a);color:#fff;border-color:var(--black,#0a0a0a);}' +
      '.trend-shop-tier{opacity:.45;font-size:9px;}' +
      '.trend-item--empty{font-family:"Raleway",sans-serif;font-size:12px;color:rgba(10,10,10,.4);padding:20px 0;}';
    document.head.appendChild(s);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    injectTrendStyles();

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

    window.MIKAYLA_API = {
      loadTrends:         loadTrends,
      loadProducts:       loadProducts,
      loadRecommendation: loadRecommendation,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

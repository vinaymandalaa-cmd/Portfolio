/* Motion layer — light by design.
   One arming pass (plus a few bounded retries), one IntersectionObserver, CSS transitions.
   Variants stay small on purpose: text rises 12px, labels only fade, rules draw, images
   settle out of a 1.02 scale, numbers count. Nothing loops, nothing runs off screen.
   Failsafe: anything hidden that is on screen gets revealed, so a title can never stay blank. */
(function () {
  if (window.__omMotion) return;
  window.__omMotion = true;

  var script = document.currentScript;
  var accent = (script && script.dataset.accent) || '#888888';
  var EASE = 'cubic-bezier(.22,.7,.2,1)';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = function () { return innerWidth < 700; };

  var css = document.createElement('style');
  var rules = [
    'html{scroll-behavior:smooth}',
    /* text block */
    '.om-h{opacity:0;transform:translateY(12px)}',
    '.om-h.om-in{opacity:1;transform:none;transition:opacity .55s ' + EASE + ',transform .55s ' + EASE + '}',
    /* image / media */
    '.om-hi{opacity:0;scale:1.02}',
    '.om-hi.om-in{opacity:1;scale:1;transition:opacity .55s ease,scale .7s ' + EASE + '}',
    /* small label: fade only, no movement */
    '.om-hf{opacity:0}',
    '.om-hf.om-in{opacity:1;transition:opacity .7s ease}',
    /* hairline rule: draws from its leading edge */
    '.om-hr{transform:scaleX(0);transform-origin:0 50%}',
    '.om-hr.om-in{transform:none;transition:transform .8s ' + EASE + '}',
    /* grid tile: shorter travel, tighter stagger */
    '.om-ht{opacity:0;transform:translateY(9px)}',
    '.om-ht.om-in{opacity:1;transform:none;transition:opacity .5s ' + EASE + ',transform .5s ' + EASE + '}',
    '.om-tap{transition:transform .22s ' + EASE + ',box-shadow .3s ease,opacity .22s ease,background-color .25s ease,border-color .25s ease,color .25s ease}',
    '.om-tap:hover{transform:translateY(-2px)}',
    '.om-tap:active{transform:translateY(0)}',
    '.om-card{transition:transform .38s ' + EASE + ',box-shadow .38s ease,border-color .3s ease}',
    '.om-card:hover{transform:translateY(-3px)}',
    '.om-zoom img{transition:scale .9s ' + EASE + '}',
    '.om-zoom:hover img{scale:1.03}',
    '.om-par{will-change:transform}',
    '#om-progress{position:fixed;top:0;left:0;height:2px;width:100%;transform:scaleX(0);transform-origin:0 50%;z-index:9999;pointer-events:none;background:' + accent + ';opacity:.8;will-change:transform}',
    '@media (max-width:700px){.om-h{transform:translateY(9px)}.om-ht{transform:translateY(7px)}.om-hi{scale:1}}',
    '@media (max-width:900px){[data-om-stack]{grid-template-columns:repeat(2,minmax(0,1fr))!important}}',
    '@media (max-width:560px){[data-om-stack]{grid-template-columns:1fr!important}[data-om-stack] [data-om-arrow]{display:none!important}}',
    '@media (hover:none){.om-tap:hover,.om-card:hover{transform:none}.om-zoom:hover img{scale:1}}',
    '@media (prefers-reduced-motion: reduce){.om-h,.om-hi,.om-hf,.om-ht{opacity:1!important;transform:none!important;scale:1!important}.om-hr{transform:none!important}#om-progress{display:none}}'
  ];
  css.textContent = rules.join('\n');
  document.head.appendChild(css);
  if (reduce) return;

  var parallax = [];

  /* pages that already draw their own scroll rail keep it — no second bar on top */
  var ownBar = false, barChecks = 0;
  function hasOwnBar() {
    if (ownBar || barChecks > 6) return ownBar;
    barChecks++;
    var all = document.querySelectorAll('div,span');
    for (var i = 0; i < all.length && i < 400; i++) {
      var el = all[i], cs = getComputedStyle(el);
      if (cs.position !== 'fixed' || parseFloat(cs.top) > 2 || parseFloat(cs.left) > 2) continue;
      var h = parseFloat(cs.height);
      if (h > 0 && h <= 5) { ownBar = true; break; } /* width starts at 0%: judge by structure */
    }
    return ownBar;
  }

  /* scroll progress + parallax — reads scrollY only, one rAF, no layout thrash in the handler */
  var bar = document.createElement('div');
  bar.id = 'om-progress';
  var raf = 0;
  addEventListener('scroll', function () {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      if (hasOwnBar()) { if (bar.isConnected) bar.remove(); }
      else if (document.body && !bar.isConnected) document.body.appendChild(bar);
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
      drift();
      rescue();
    });
  }, { passive: true });

  /* ≤14px of counter drift on tall imagery: reads as depth, never as movement */
  function drift() {
    if (!parallax.length || small()) return;
    var vh = innerHeight;
    for (var i = 0; i < parallax.length; i++) {
      var el = parallax[i];
      if (!el.isConnected) { parallax.splice(i--, 1); continue; }
      var r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      var p = (r.top + r.height / 2 - vh / 2) / vh; /* -1 … 1 */
      el.style.translate = '0 ' + (-Math.max(-1, Math.min(1, p)) * 14).toFixed(1) + 'px';
    }
  }

  var pending = new Set();
  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      var el = entries[i].target;
      io.unobserve(el);
      show(el, parseFloat(el.dataset.omD || 0));
    }
  }, { rootMargin: '0px 0px 22% 0px', threshold: 0.01 });

  function watch(el) { pending.add(el); io.observe(el); }

  function show(el, delay) {
    pending.delete(el);
    setTimeout(function () {
      el.classList.add('om-in');
      if (el.dataset.omNum) count(el);
      setTimeout(function () { el.classList.remove('om-h', 'om-hi', 'om-hf', 'om-ht', 'om-hr', 'om-in'); }, 900);
    }, delay || 0);
  }

  /* headline numerals tick up to their real value, then the DOM holds the original text */
  function count(el) {
    var final = el.dataset.omNum;
    var m = final.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    var target = parseFloat(m[2].replace(/,/g, ''));
    var dec = (m[2].split('.')[1] || '').length;
    var group = m[2].indexOf(',') > -1;
    var t0 = 0, dur = 900;
    var tick = function (ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var v = target * (1 - Math.pow(1 - k, 3));
      var s = dec ? v.toFixed(dec) : String(Math.round(v));
      if (group) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      el.textContent = m[1] + s + m[3];
      if (k < 1) requestAnimationFrame(tick);
      else el.textContent = final;
    };
    requestAnimationFrame(tick);
  }

  function skip(el) {
    if (el.dataset.omMotion === 'skip' || el.closest('[data-om-motion="skip"]')) return true;
    var cs = getComputedStyle(el);
    if (cs.transform !== 'none') return true; /* element owns its transform (centred, rotated) */
    return cs.position === 'sticky' || cs.position === 'fixed' ||
      !!el.querySelector('[style*="position: sticky"],[style*="position:sticky"],[style*="position: fixed"],[style*="position:fixed"]');
  }

  /* reveal units: first descendants of a section that fit in a viewport-ish box */
  function units(root) {
    var out = [], q = Array.prototype.slice.call(root.children), lim = innerHeight * 0.8;
    while (q.length) {
      var el = q.shift();
      if (!(el instanceof HTMLElement) || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      var h = el.getBoundingClientRect().height;
      if (!h) continue;
      if (h <= lim && h >= 22 && !skip(el)) out.push(el);
      else if (el.children.length) q = q.concat(Array.prototype.slice.call(el.children));
    }
    return out;
  }

  /* which of the four reveals suits this element */
  function variant(el, siblings) {
    if (el.tagName === 'IMG' || el.querySelector('img')) return 'om-hi';
    var r = el.getBoundingClientRect();
    if (r.height <= 4) return 'om-hr';
    var cs = getComputedStyle(el);
    var txt = (el.textContent || '').trim();
    if (parseFloat(cs.fontSize) <= 13 && txt.length < 64 &&
        (cs.textTransform === 'uppercase' || parseFloat(cs.letterSpacing) > 0.8)) return 'om-hf';
    if (siblings >= 3 && r.height < innerHeight * 0.5) return 'om-ht';
    return 'om-h';
  }

  var NUM = /^[+\-–]?[₹$€£]?\s?\d[\d,]*(\.\d+)?\s?(%|x|×|k|K|M|\+|hrs?|d|days?)?$/;

  function arm() {
    /* native scroll-driven CSS animations fire late or not at all — reveal these ourselves */
    document.querySelectorAll('[style*="animation-timeline"]').forEach(function (el) {
      el.style.removeProperty('animation');
      el.style.removeProperty('animation-timeline');
      el.style.removeProperty('animation-range');
      el.style.removeProperty('animation-name');
      el.style.removeProperty('animation-fill-mode');
    });

    var fold = innerHeight * 1.1;
    document.querySelectorAll('section,header,footer,[data-om-reveal]').forEach(function (sec) {
      var pass = parseInt(sec.dataset.omArmed || 0, 10);
      if (pass >= 2) return;
      sec.dataset.omArmed = String(pass + 1);
      var list = units(sec);
      var counts = new Map();
      list.forEach(function (el) {
        counts.set(el.parentElement, (counts.get(el.parentElement) || 0) + 1);
      });
      var seen = new Map();
      list.forEach(function (el) {
        if (el.dataset.omSeen) return;
        el.dataset.omSeen = '1';
        if (el.getBoundingClientRect().top < fold) return; /* already on screen: never hide it */
        var group = counts.get(el.parentElement) || 1;
        var v = variant(el, group);
        var i = seen.get(el.parentElement) || 0;
        seen.set(el.parentElement, i + 1);
        el.dataset.omD = String(Math.min(i, v === 'om-ht' ? 5 : 3) * (v === 'om-ht' ? 55 : 45));
        el.classList.add(v);
        watch(el);
      });
    });

    /* numerals in stat blocks tick up when their card arrives */
    document.querySelectorAll('div,span,p,strong,em,h1,h2,h3,h4').forEach(function (el) {
      if (el.dataset.omN || el.children.length) return;
      el.dataset.omN = '1';
      var txt = (el.textContent || '').trim();
      if (!txt || txt.length > 9 || !NUM.test(txt)) return;
      if (parseFloat(getComputedStyle(el).fontSize) < 26) return;
      var raw = parseFloat(txt.replace(/[^\d.]/g, ''));
      if (!isFinite(raw) || raw === 0) return;
      if (raw > 1000 && !/[%x×kKM+]/.test(txt)) return; /* years and IDs stay put */
      el.dataset.omNum = txt;
      watch(el);
    });

    document.querySelectorAll('a,button,[role="button"]').forEach(function (el) {
      if (el.dataset.omTap) return;
      el.dataset.omTap = '1';
      el.classList.add('om-tap');
    });

    document.querySelectorAll('[style*="box-shadow"]').forEach(function (el) {
      if (el.dataset.omCard) return;
      el.dataset.omCard = '1';
      if (el.tagName === 'A' || el.tagName === 'BUTTON' || skip(el)) return;
      if (el.parentElement && el.parentElement.closest('.om-card')) return;
      var h = el.getBoundingClientRect().height;
      if (h > 60 && h < innerHeight * 0.92) el.classList.add('om-card');
    });

    document.querySelectorAll('img').forEach(function (el) {
      var frame = el.parentElement;
      if (el.dataset.omZ || !frame) return;
      var h = el.getBoundingClientRect().height;
      if (h < 10) return; /* not laid out yet */
      el.dataset.omZ = '1';
      if (h < 80 || skip(el)) return;
      if (getComputedStyle(frame).overflow === 'visible') return;
      frame.classList.add('om-zoom');
      /* only genuinely tall art gets drift: never anything positioned or already transformed */
      var ics = getComputedStyle(el);
      if (h > innerHeight * 0.55 && parallax.length < 8 && !el.closest('[data-om-motion="skip"]') &&
          ics.position === 'static' && ics.transform === 'none' && el.tagName === 'IMG' &&
          !/\.gif($|\?)/i.test(el.currentSrc || el.src || '')) {
        el.classList.add('om-par');
        parallax.push(el);
      }
    });
  }

  /* failsafe: nothing hidden may sit on screen. Walks only what is still waiting,
     so a long page costs nothing per scroll frame. */
  function rescue() {
    if (!pending.size) return;
    var vh = innerHeight;
    pending.forEach(function (el) {
      if (!el.isConnected) { pending.delete(el); return; }
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.98 && r.bottom > -40) { io.unobserve(el); show(el, 0); }
    });
  }

  var t = 0, passes = 0;
  function run() { if (passes++ > 14) return; arm(); rescue(); }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', run);
  else run();
  addEventListener('load', run);
  [400, 900, 1600, 2600].forEach(function (ms) { setTimeout(run, ms); });
  addEventListener('resize', function () { if (small()) parallax.forEach(function (el) { el.style.translate = ''; }); }, { passive: true });

  /* newly streamed content: at most one extra pass every 700ms */
  new MutationObserver(function () {
    if (t) return;
    t = setTimeout(function () { t = 0; run(); }, 700);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

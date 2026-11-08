/* ============================================================
   APP LOGIC & MEGA MENU CONTROLLER
   External script — safe to include on any page with
   <script src="app.js" defer></script>
   ============================================================ */
(function (window, document) {
  'use strict';

  /* ----------------------------------------------------------
     HELPERS
     ---------------------------------------------------------- */
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Safe addEventListener — ignores missing elements. */
  function on(target, type, handler, options) {
    if (target) target.addEventListener(type, handler, options);
  }

  /** requestAnimationFrame throttle for scroll/resize handlers. */
  function rafThrottle(fn) {
    let scheduled = false;
    return function throttled() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        fn();
      });
    };
  }

  function smoothScrollTo(top) {
    window.scrollTo({ top: top, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
  }

  /* ==========================================================
     1. MEGA MENU (desktop)
     Returns { showMenu, hideAllMenus } so other modules can use it.
     ========================================================== */
  function initMegaMenu() {
    const items = $$('.nav-item-custom[data-menu]');
    const backdrop = $('#megaBackdrop');
    const noop = { showMenu: function () {}, hideAllMenus: function () {} };

    if (!items.length) return noop;

    const HIDE_DELAY = 150;
    let closeTimer = null;

    function setItemState(item, isOpen) {
      item.classList.toggle('mega-open', isOpen);
      const trigger = $('.nav-link-custom', item);
      if (trigger) trigger.setAttribute('aria-expanded', String(isOpen));
    }

    function isAnyOpen() {
      return items.some(item => item.classList.contains('mega-open'));
    }

    function clearHideTimer() {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function showMenu(item) {
      clearHideTimer();

      // Close every other menu instantly
      items.forEach(other => {
        if (other !== item) setItemState(other, false);
      });

      setItemState(item, true);
      if (backdrop) backdrop.classList.add('active');
    }

    function hideAllMenus() {
      if (!isAnyOpen() && !(backdrop && backdrop.classList.contains('active'))) return;
      clearHideTimer();
      items.forEach(item => setItemState(item, false));
      if (backdrop) backdrop.classList.remove('active');
    }

    function startHideTimer() {
      clearHideTimer();
      closeTimer = window.setTimeout(hideAllMenus, HIDE_DELAY);
    }

    items.forEach(item => {
      const trigger = $('.nav-link-custom', item);
      const menu = $('.mega-menu', item);
      if (!trigger) return;

      on(trigger, 'mouseenter', () => showMenu(item));
      on(trigger, 'mouseleave', startHideTimer);

      // Entering the panel cancels the grace timer (fixes the "move down" bug)
      on(menu, 'mouseenter', clearHideTimer);
      on(menu, 'mouseleave', startHideTimer);

      // Keyboard / click / touch accessibility
      on(trigger, 'click', event => {
        event.preventDefault();
        if (item.classList.contains('mega-open')) {
          hideAllMenus();
        } else {
          showMenu(item);
        }
      });

      on(trigger, 'focus', () => showMenu(item));
    });

    on(backdrop, 'click', hideAllMenus);
    on(document, 'keydown', event => {
      if (event.key === 'Escape') hideAllMenus();
    });

    return { showMenu: showMenu, hideAllMenus: hideAllMenus };
  }

  /* ==========================================================
     2. STICKY HEADER
     ========================================================== */
  function initStickyHeader(onScroll) {
    const header = $('#header');
    if (!header) return;

    const update = rafThrottle(() => {
      header.classList.toggle('scrolled', window.scrollY > 8);
      if (typeof onScroll === 'function') onScroll();
    });

    on(window, 'scroll', update, { passive: true });
    update(); // set initial state
  }

  /* ==========================================================
     3. MOBILE DRAWER
     Returns { open, close, toggle }
     ========================================================== */
  function initMobileDrawer() {
    const toggle = $('#mobileToggle');
    const drawer = $('#mobileDrawer');
    const noop = { open: function () {}, close: function () {}, toggle: function () {} };

    if (!toggle || !drawer) return noop;

    const bars = $$('span', toggle);
    let isOpen = false;

    function setBars(open) {
      if (bars[0]) bars[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : 'none';
      if (bars[1]) bars[1].style.opacity = open ? '0' : '1';
      if (bars[2]) bars[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : 'none';
    }

    function open() {
      isOpen = true;
      drawer.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      setBars(true);
    }

    function close() {
      isOpen = false;
      drawer.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      setBars(false);
    }

    function toggleDrawer() {
      isOpen ? close() : open();
    }

    on(toggle, 'click', toggleDrawer);

    // Close after tapping any link inside the drawer
    $$('a', drawer).forEach(link => on(link, 'click', close));

    // Close on Escape
    on(document, 'keydown', event => {
      if (event.key === 'Escape' && isOpen) close();
    });

    return { open: open, close: close, toggle: toggleDrawer };
  }

  /* ==========================================================
     4. SPA ROUTER (data-view / data-nav)
     Returns { showView, getCurrentView }
     ========================================================== */
  function initRouter(onNavigate) {
    const views = $$('.view');
    let currentView = null;

    function showView(name) {
      if (!name || !views.length) return false;

      let matched = false;
      views.forEach(view => {
        const isMatch = view.dataset.view === name;
        view.style.display = isMatch ? 'block' : 'none';
        if (isMatch) matched = true;
      });

      if (!matched) return false;

      currentView = name;
      smoothScrollTo(0);
      if (typeof onNavigate === 'function') onNavigate(name);
      return true;
    }

    function getCurrentView() {
      return currentView;
    }

    $$('[data-nav]').forEach(link => {
      on(link, 'click', event => {
        const name = link.dataset.nav;
        if (!name) return;
        if (showView(name)) event.preventDefault();
      });
    });

    return { showView: showView, getCurrentView: getCurrentView };
  }

  /* ==========================================================
     5. SEARCH MODAL
     ========================================================== */
  function initSearch() {
    const modal = $('#searchModal');
    const input = $('#searchInput');
    const suggestions = $('#searchSuggestions');
    if (!modal || !input) return;

    on(modal, 'shown.bs.modal', () => input.focus());

    on(input, 'input', event => {
      if (!suggestions) return;
      suggestions.classList.toggle('active', event.target.value.trim().length > 0);
    });
  }

  /* ==========================================================
     6. HERO DOTS
     ========================================================== */
  function initHeroDots() {
    const dots = $$('.hero-dot');
    if (!dots.length) return;

    dots.forEach(dot => {
      on(dot, 'click', () => {
        dots.forEach(other => other.classList.remove('active'));
        dot.classList.add('active');
      });
    });
  }

  /* ==========================================================
     7. STORY CAROUSEL
     ========================================================== */
  function initStoryCarousel() {
    const track = $('#storiesTrack');
    if (!track) return;

    const STEP = 360;
    const scrollBy = offset => track.scrollBy({
      left: offset,
      behavior: REDUCED_MOTION ? 'auto' : 'smooth'
    });

    on($('#prevStory'), 'click', () => scrollBy(-STEP));
    on($('#nextStory'), 'click', () => scrollBy(STEP));
  }

  /* ==========================================================
     8. SCROLL REVEAL
     ========================================================== */
  function initScrollReveal() {
    const reveals = $$('.reveal');
    if (!reveals.length) return;

    // Graceful fallback for old browsers
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    reveals.forEach(el => observer.observe(el));
  }

  /* ==========================================================
     9. BOOTSTRAP
     ========================================================== */
  function init() {
    const megaMenu = initMegaMenu();
    const drawer = initMobileDrawer();

    // Single "close everything" routine shared by router + scroll
    function closeAllOverlays() {
      megaMenu.hideAllMenus();
      drawer.close();
    }

    initStickyHeader(() => megaMenu.hideAllMenus());

    const router = initRouter(() => closeAllOverlays());

    initSearch();
    initHeroDots();
    initStoryCarousel();
    initScrollReveal();

    // Initial route (honours #hash when present)
    const initialView = (window.location.hash || '').replace('#', '');
    if (!router.showView(initialView)) {
      router.showView('home');
    }

    /* Public API — handy for other scripts / debugging */
    window.App = {
      showView: router.showView,
      getCurrentView: router.getCurrentView,
      hideMenus: megaMenu.hideAllMenus,
      closeMobileDrawer: drawer.close
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
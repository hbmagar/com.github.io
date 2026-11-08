/* ============================================================
   APP LOGIC & MEGA MENU CONTROLLER
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky Header ---------- */
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', scrollY > 8);
    hideAllMenus(); // Close menus on scroll
  });

  /* ---------- Desktop Mega Menu Logic (Bulletproof Hover) ---------- */
  const navItems = document.querySelectorAll('.nav-item-custom[data-menu]');
  const backdrop = document.getElementById('megaBackdrop');
  let closeTimeout;

  function showMenu(item) {
    clearTimeout(closeTimeout);
    
    // Close other menus instantly
    navItems.forEach(nav => {
      if (nav !== item) {
        nav.classList.remove('mega-open');
        nav.querySelector('.nav-link-custom').setAttribute('aria-expanded', 'false');
      }
    });
    
    // Open this menu
    item.classList.add('mega-open');
    item.querySelector('.nav-link-custom').setAttribute('aria-expanded', 'true');
    backdrop.classList.add('active');
  }

  function hideAllMenus() {
    navItems.forEach(nav => {
      nav.classList.remove('mega-open');
      nav.querySelector('.nav-link-custom').setAttribute('aria-expanded', 'false');
    });
    backdrop.classList.remove('active');
  }

  function startHideTimer() {
    closeTimeout = setTimeout(() => {
      hideAllMenus();
    }, 150); // 150ms grace period
  }

  navItems.forEach(item => {
    const trigger = item.querySelector('.nav-link-custom');
    const menu = item.querySelector('.mega-menu');

    // Hover on trigger opens menu
    trigger.addEventListener('mouseenter', () => showMenu(item));
    
    // Leaving trigger starts the hide timer
    trigger.addEventListener('mouseleave', startHideTimer);

    // Entering the menu cancels the hide timer (Fixes the moving-down bug)
    menu.addEventListener('mouseenter', () => clearTimeout(closeTimeout));
    
    // Leaving the menu starts the hide timer
    menu.addEventListener('mouseleave', startHideTimer);

    // Keyboard & Click accessibility
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (item.classList.contains('mega-open')) {
        hideAllMenus();
      } else {
        showMenu(item);
      }
    });

    trigger.addEventListener('focus', () => showMenu(item));
  });

  // Close when clicking the dark backdrop
  backdrop.addEventListener('click', hideAllMenus);

  // Close when pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideAllMenus();
  });

  /* ---------- Mobile Drawer Toggle ---------- */
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  let menuOpen = false;

  mobileToggle.addEventListener('click', () => {
    menuOpen = !menuOpen;
    mobileDrawer.classList.toggle('active', menuOpen);
    const spans = mobileToggle.querySelectorAll('span');
    if(menuOpen){
      spans[0].style.transform='rotate(45deg) translate(5px,5px)';
      spans[1].style.opacity='0';
      spans[2].style.transform='rotate(-45deg) translate(5px,-5px)';
    } else {
      spans[0].style.transform='none';
      spans[1].style.opacity='1';
      spans[2].style.transform='none';
    }
  });

  // Close mobile drawer when a link inside is clicked
  mobileDrawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileDrawer.classList.remove('active');
      menuOpen = false;
      mobileToggle.querySelectorAll('span').forEach(s => {
        s.style.transform='none'; s.style.opacity='1';
      });
    });
  });

  /* ---------- SPA Router ---------- */
  const views = document.querySelectorAll('.view');
  const navLinks = document.querySelectorAll('[data-nav]');

  function showView(name){
    views.forEach(v => v.style.display = v.dataset.view === name ? 'block' : 'none');
    window.scrollTo({top:0, behavior:'smooth'});
    hideAllMenus();
    mobileDrawer.classList.remove('active');
    mobileToggle.querySelectorAll('span').forEach(s => {
      s.style.transform='none'; s.style.opacity='1';
    });
    menuOpen = false;
  }

  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      const nav = link.dataset.nav;
      if(nav && document.querySelector(`.view[data-view="${nav}"]`)){
        e.preventDefault();
        showView(nav);
      }
    });
  });

  /* ---------- Search Input Focus ---------- */
  const searchModal = document.getElementById('searchModal');
  const searchInput = document.getElementById('searchInput');
  const searchSuggestions = document.getElementById('searchSuggestions');

  searchModal.addEventListener('shown.bs.modal', () => {
    searchInput.focus();
  });

  searchInput.addEventListener('input', e => {
    searchSuggestions.classList.toggle('active', e.target.value.trim().length > 0);
  });

  /* ---------- Hero dots ---------- */
  document.querySelectorAll('.hero-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.hero-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    });
  });

  /* ---------- Story carousel ---------- */
  const track = document.getElementById('storiesTrack');
  if(track){
    document.getElementById('prevStory').addEventListener('click', () => track.scrollBy({left:-360,behavior:'smooth'}));
    document.getElementById('nextStory').addEventListener('click', () => track.scrollBy({left:360,behavior:'smooth'}));
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(en.isIntersecting){ en.target.classList.add('visible'); observer.unobserve(en.target); }
    });
  }, {threshold:.12});
  reveals.forEach(el => observer.observe(el));

  /* ---------- Initial route ---------- */
  showView('home');
});
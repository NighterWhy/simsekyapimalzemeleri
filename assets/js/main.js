/**
* Template Name: iConstruction
* Template URL: https://bootstrapmade.com/iconstruction-bootstrap-construction-template/
* Updated: Jul 27 2025 with Bootstrap v5.3.7
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader || (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top'))) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  // rAF ile birleşik scroll handler
  let _scrollScheduled = false;
  function onScrollRaf() {
    if (_scrollScheduled) return;
    _scrollScheduled = true;
    requestAnimationFrame(() => {
      toggleScrolled();
      toggleScrollTop();
      _scrollScheduled = false;
    });
  }

  window.addEventListener('load', toggleScrolled);
  document.addEventListener('scroll', onScrollRaf, { passive: true });

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');
  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    if (!mobileNavToggleBtn) return;
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });
  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');
  function toggleScrollTop() {
    if (!scrollTop) return;
    window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
  }
  if (scrollTop) {
    scrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  window.addEventListener('load', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    if (window.AOS && AOS.init) {
      AOS.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      });
    }
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate Pure Counter
   */
  if (window.PureCounter) new PureCounter();

  /**
   * Initiate glightbox
   */
  if (window.GLightbox) {
    GLightbox({ selector: '.glightbox' });
  }

  /**
   * Init swiper sliders (genel)
   * NOT: productSwiper'ı hariç tutuyoruz (altta özel init var)
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      if (swiperElement.id === 'productSwiper') return; // bizim ürün slider'ını burada başlatma

      const cfgEl = swiperElement.querySelector(".swiper-config");
      if (!cfgEl) return;

      let config = {};
      try { config = JSON.parse(cfgEl.innerHTML.trim()); } catch(e) {}

      if (swiperElement.classList.contains("swiper-tab") && typeof initSwiperWithCustomPagination === 'function') {
        initSwiperWithCustomPagination(swiperElement, config);
      } else if (window.Swiper) {
        new Swiper(swiperElement, config);
      }
    });
  }
  window.addEventListener("load", initSwiper);

})();

/* ---------- ÖZEL: Ürün slider (productSwiper) hafif & tek-init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('#productSwiper');
  if (!el || !window.Swiper) return;

  // Çift init koruması
  if (el.dataset.inited === '1') return;
  el.dataset.inited = '1';

  const BASE_SPEED = 3500;
  const GAP = 10;

  window.productSwiper = new Swiper('#productSwiper', {
    slidesPerView: 'auto',
    spaceBetween: GAP,
    loop: true,
    loopAdditionalSlides: 14,        // daha düşük: DOM yükü azalır
    loopPreventsSliding: false,
    speed: BASE_SPEED,
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
    freeMode: false,                // true performansı düşürüyordu
    allowTouchMove: true,
    resistanceRatio: 0,
  });

  // Ekrandan çıkınca autoplay'i durdur -> CPU düşer
  const io = new IntersectionObserver(([entry]) => {
    if (!window.productSwiper?.autoplay) return;
    entry.isIntersecting ? window.productSwiper.autoplay.start()
                         : window.productSwiper.autoplay.stop();
  }, { threshold: 0.1 });
  io.observe(el);

  // Sekme gizliyken autoplay durdur
  document.addEventListener('visibilitychange', () => {
    if (!window.productSwiper?.autoplay) return;
    document.hidden ? window.productSwiper.autoplay.stop()
                    : window.productSwiper.autoplay.start();
  });
});

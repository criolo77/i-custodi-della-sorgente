/* ============================================================
   I Custodi della Sorgente — script.js
   ============================================================ */

(function () {
  "use strict";

  /* ---- anno nel footer ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- header: cambia stile allo scroll ---- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- menu mobile ---- */
  var toggle    = document.getElementById("navToggle");
  var navMobile = document.getElementById("navMobile");

  function closeNav() {
    toggle.classList.remove("open");
    navMobile.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  toggle.addEventListener("click", function () {
    var isOpen = navMobile.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  navMobile.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeNav);
  });

  /* ---- prefers-reduced-motion ---- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- reveal on scroll (IntersectionObserver) ---- */
  var revealables = document.querySelectorAll(".reveal, .reveal-stagger, [data-flow]");

  if (reduceMotion) {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
      el.classList.add("in-view");
    });
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var cls = entry.target.hasAttribute("data-flow") ? "in-view" : "is-visible";
            entry.target.classList.add(cls);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -60px 0px" }
    );
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
      el.classList.add("in-view");
    });
  }

  /* ---- fallback immagini mancanti ---- */
  ["heroImg", "aboutImg"].forEach(function (id) {
    var img = document.getElementById(id);
    if (img) {
      img.addEventListener("error", function () {
        img.style.display = "none";
      });
    }
  });

  /* ---- slider testimonianze ---- */
  var slides   = Array.prototype.slice.call(document.querySelectorAll(".t-slide"));
  var dotsWrap = document.getElementById("tDots");
  var current  = 0;
  var timer;

  if (slides.length && dotsWrap) {
    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.className = "t-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", "Vai alla testimonianza " + (i + 1));
      dot.addEventListener("click", function () {
        goTo(i);
        resetTimer();
      });
      dotsWrap.appendChild(dot);
    });

    var dots = Array.prototype.slice.call(dotsWrap.children);

    function goTo(i) {
      slides[current].classList.remove("active");
      dots[current].classList.remove("active");
      current = (i + slides.length) % slides.length;
      slides[current].classList.add("active");
      dots[current].classList.add("active");
    }

    function resetTimer() {
      clearInterval(timer);
      if (!reduceMotion) {
        timer = setInterval(function () { goTo(current + 1); }, 6500);
      }
    }

    var btnNext = document.getElementById("tNext");
    var btnPrev = document.getElementById("tPrev");
    if (btnNext) btnNext.addEventListener("click", function () { goTo(current + 1); resetTimer(); });
    if (btnPrev) btnPrev.addEventListener("click", function () { goTo(current - 1); resetTimer(); });

    resetTimer();
  }

  /* ---- form contatti (demo front-end) ---- */
  var form    = document.getElementById("contactForm");
  var success = document.getElementById("formSuccess");

  if (form && success) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      success.classList.add("show");
      form.reset();
      setTimeout(function () { success.classList.remove("show"); }, 6000);
    });
  }

  /* ---- modale contatti ---- */
  var modal      = document.getElementById("contactModal");
  var ctaBtn     = document.getElementById("ctaOpenModal");
  var closeBtn   = document.getElementById("modalClose");
  var backdrop   = document.getElementById("modalBackdrop");
  var firstFocus = null;

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    // find first focusable element
    firstFocus = modal.querySelector("input, select, textarea, button:not(#modalClose)");
    if (firstFocus) firstFocus.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (ctaBtn) ctaBtn.focus();
  }

  if (ctaBtn)   ctaBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);

  // close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hidden) closeModal();
  });

  // trap focus inside modal
  if (modal) {
    modal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var focusable = Array.prototype.slice.call(
        modal.querySelectorAll('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])')
      ).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---- Frammenti di Cammino: lightbox ---- */
  var framItems    = Array.prototype.slice.call(document.querySelectorAll('.frammenti-item'));
  var framLightbox = document.getElementById('frammentilightbox');
  var framBackdrop = document.getElementById('frammentilightboxBackdrop');
  var framClose    = document.getElementById('frammentilightboxClose');
  var framContent  = document.getElementById('frammentilightboxContent');
  var framPrev     = document.getElementById('frammentilightboxPrev');
  var framNext     = document.getElementById('frammentilightboxNext');
  var framCurrent  = 0;

  function framOpen(idx) {
    if (!framLightbox) return;
    framCurrent = (idx + framItems.length) % framItems.length;
    framRender();
    framLightbox.hidden = false;
    document.body.classList.add('modal-open');
    if (framClose) framClose.focus();
  }

  function framClose_fn() {
    if (!framLightbox) return;
    framLightbox.hidden = true;
    document.body.classList.remove('modal-open');
  }

  function framRender() {
    if (!framContent) return;
    var item = framItems[framCurrent];
    var img  = item ? item.querySelector('img') : null;
    if (img) {
      framContent.innerHTML = '<img src="' + img.src + '" alt="' + (img.alt || '') + '">';
    } else {
      // placeholder
      framContent.innerHTML = '<div class="frammenti-placeholder frammenti-placeholder-lb">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
        + '<span>Foto in arrivo</span></div>';
    }
  }

  framItems.forEach(function(item, i) {
    item.addEventListener('click', function() { framOpen(i); });
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); framOpen(i); }
    });
  });

  if (framClose)   framClose.addEventListener('click', framClose_fn);
  if (framBackdrop) framBackdrop.addEventListener('click', framClose_fn);
  if (framPrev)    framPrev.addEventListener('click', function() { framOpen(framCurrent - 1); });
  if (framNext)    framNext.addEventListener('click', function() { framOpen(framCurrent + 1); });

  document.addEventListener('keydown', function(e) {
    if (!framLightbox || framLightbox.hidden) return;
    if (e.key === 'Escape')      framClose_fn();
    if (e.key === 'ArrowLeft')   framOpen(framCurrent - 1);
    if (e.key === 'ArrowRight')  framOpen(framCurrent + 1);
  });

})();

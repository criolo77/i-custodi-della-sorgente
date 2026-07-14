/* ============================================================
   Custodi della Sorgente — script.js
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

  /* ---- contenuti Pages CMS via JSON statici ---- */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value, options) {
    if (!value) return "";
    var date = new Date(value + "T00:00:00");
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("it-IT", options || {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function formatDateRange(startDate, endDate) {
    if (!startDate) return "";
    var start = new Date(startDate + "T00:00:00");
    if (Number.isNaN(start.getTime())) return "";
    var end = endDate ? new Date(endDate + "T00:00:00") : null;

    if (!end || Number.isNaN(end.getTime()) || end.getTime() === start.getTime()) {
      return start.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    }

    var sameYear = start.getFullYear() === end.getFullYear();
    var sameMonth = sameYear && start.getMonth() === end.getMonth();

    if (sameMonth) {
      var monthYear = start.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
      return start.getDate() + "\u2013" + end.getDate() + " " + monthYear;
    }
    if (sameYear) {
      var startPart = start.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
      var endPart = end.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
      return startPart + " \u2013 " + endPart;
    }
    var startFull = start.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    var endFull = end.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    return startFull + " \u2013 " + endFull;
  }

  function fetchJson(path) {
    return fetch(path, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Impossibile caricare " + path);
      return response.json();
    });
  }

  function renderSeminari(items) {
    var root = document.getElementById("seminariList");
    if (!root || !Array.isArray(items)) return;

    var visibili = items.filter(function (item) {
      return item.stato !== "bozza";
    });
    if (!visibili.length) return;

    root.innerHTML = visibili.map(function (item) {
      var date = item.startDate ? new Date(item.startDate + "T00:00:00") : null;
      var day = date && !Number.isNaN(date.getTime()) ? String(date.getDate()).padStart(2, "0") : "--";
      var month = date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString("it-IT", { month: "short" }).replace(".", "")
        : "";
      var dateRange = formatDateRange(item.startDate, item.endDate);
      var metaParts = [dateRange, item.luogo, item.orario].filter(Boolean);

      var isConcluso = item.stato === "concluso";
      var actionHtml;
      if (isConcluso) {
        actionHtml = '<button class="btn btn-outline-dark is-disabled" type="button" disabled aria-disabled="true">Concluso</button>';
      } else if (item.link) {
        actionHtml = '<a class="btn btn-outline-dark" href="' + escapeHtml(item.link) + '" target="_blank" rel="noopener">Iscriviti</a>';
      } else {
        actionHtml = '<button class="btn btn-outline-dark" type="button" data-open-contact>Iscriviti</button>';
      }

      var effectiveSlug = (window.ContentEngine && window.ContentEngine.resolveSlug)
        ? window.ContentEngine.resolveSlug(item, {})
        : (item.slug || "");
      var detailUrl = effectiveSlug ? "seminario.html?slug=" + encodeURIComponent(effectiveSlug) : "";
      var dateBadge = '<span class="day">' + escapeHtml(day) + '</span><span class="month">' + escapeHtml(month) + '</span>';
      var titleHtml = escapeHtml(item.titolo);

      return '<div class="event-row">'
        + (detailUrl
          ? '<a class="event-date" href="' + escapeHtml(detailUrl) + '" aria-label="Vedi il seminario: ' + escapeHtml(item.titolo) + '">' + dateBadge + '</a>'
          : '<div class="event-date">' + dateBadge + '</div>')
        + '<div class="event-info">'
        + '<h3>' + (detailUrl ? '<a href="' + escapeHtml(detailUrl) + '">' + titleHtml + '</a>' : titleHtml) + '</h3>'
        + '<p>' + escapeHtml(item.descrizione || item.sottotitolo || "") + '</p>'
        + (metaParts.length ? '<p><strong>' + escapeHtml(metaParts.join(" · ")) + '</strong></p>' : "")
        + '</div>'
        + actionHtml
        + '</div>';
    }).join("");
  }

  function renderFrammenti(items) {
    var root = document.getElementById("frammentiGrid");
    if (!root || !Array.isArray(items) || !items.length) return;
    var layoutClasses = ["frammenti-tall", "frammenti-wide", "", "", "frammenti-tall", "frammenti-wide"];

    root.innerHTML = items.slice(0, 6).map(function (item, index) {
      var image = item.immagine || item.image || item.foto || "";
      var layout = layoutClasses[index % layoutClasses.length];
      var content = image
        ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(item.titolo || "Frammento di Cammino") + '">'
        : '<div class="frammenti-placeholder">'
          + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
          + '<span>' + escapeHtml(item.titolo || "Frammento") + '</span>'
          + '</div>';
      return '<div class="frammenti-item ' + layout + '" data-index="' + index + '">' + content + '</div>';
    }).join("");
  }

  function renderQuaderni(items) {
    var root = document.getElementById("quaderniGrid");
    if (!root || !Array.isArray(items) || !items.length) return;

    root.innerHTML = items.slice(0, 3).map(function (item) {
      var slug = item.slug || "";
      var href = slug ? "quaderno.html?slug=" + encodeURIComponent(slug) : "quaderno.html";
      var cover = item.copertina
        ? '<img src="' + escapeHtml(item.copertina) + '" alt="' + escapeHtml(item.titolo || "Quaderno") + '">'
        : '<div class="quaderno-cover-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>';

      return '<article class="quaderno-card">'
        + '<div class="quaderno-cover">' + cover + '</div>'
        + '<div class="quaderno-body">'
        + '<div class="quaderno-meta"><span class="quaderno-autore">' + escapeHtml(item.autore || "Custodi della Sorgente") + '</span><span class="quaderno-sep" aria-hidden="true">·</span><time class="quaderno-data">' + escapeHtml(formatDate(item.data, { month: "long", year: "numeric" })) + '</time></div>'
        + '<h3 class="quaderno-titolo">' + escapeHtml(item.titolo) + '</h3>'
        + '<p class="quaderno-estratto">' + escapeHtml(item.estratto || item.descrizione || "") + '</p>'
        + '<a href="' + escapeHtml(href) + '" class="quaderno-link">Leggi il Quaderno <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>'
        + '</div>'
        + '</article>';
    }).join("");
  }

  function renderTestimonianze(items) {
    var root = document.getElementById("testimonianzeSlider");
    var dots = document.getElementById("tDots");
    if (!root || !Array.isArray(items) || !items.length) return;
    if (dots) dots.innerHTML = "";

    root.innerHTML = items.map(function (item, index) {
      var stars = '<svg viewBox="0 0 24 24"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>';
      return '<div class="t-slide' + (index === 0 ? " active" : "") + '">'
        + '<div class="t-card">'
        + '<div class="t-stars">' + stars.repeat(5) + '</div>'
        + '<p class="t-quote">"' + escapeHtml(item.testo || "") + '"</p>'
        + '<p class="t-name">' + escapeHtml(item.nome || "") + '</p>'
        + '<p class="t-role">' + escapeHtml(item.ruolo || item.luogo || "") + '</p>'
        + '</div>'
        + '</div>';
    }).join("");
  }

  function bindCmsContactButtons() {
    document.querySelectorAll("[data-open-contact]").forEach(function (button) {
      button.addEventListener("click", function () {
        var trigger = document.getElementById("ctaOpenModal");
        if (trigger) trigger.click();
      });
    });
  }

  function loadCmsContent() {
    return Promise.allSettled([
      fetchJson("content/seminari.json").then(renderSeminari),
      fetchJson("content/frammenti.json").then(renderFrammenti),
      fetchJson("content/quaderni.json").then(renderQuaderni),
      fetchJson("content/testimonianze.json").then(renderTestimonianze)
    ]).then(function () {
      bindCmsContactButtons();
    });
  }

  /* ---- slider testimonianze ---- */
  function initTestimonialsSlider() {
    var slides   = Array.prototype.slice.call(document.querySelectorAll(".t-slide"));
    var dotsWrap = document.getElementById("tDots");
    var current  = 0;
    var timer;

    if (!slides.length || !dotsWrap) return;
    dotsWrap.innerHTML = "";

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
  var savedScrollY = 0;

  function openModal() {
    if (!modal) return;
    savedScrollY = window.scrollY;
    document.body.style.top = "-" + savedScrollY + "px";
    document.body.classList.add("modal-open");
    modal.hidden = false;
    firstFocus = modal.querySelector("input, select, textarea, button:not(#modalClose)");
    if (firstFocus) firstFocus.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    document.body.style.top = "";
    window.scrollTo({ top: savedScrollY, behavior: "instant" });
    if (ctaBtn) ctaBtn.focus({ preventScroll: true }); // focus senza scroll automatico
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
  function initFrammentiLightbox() {
    var framItems    = Array.prototype.slice.call(document.querySelectorAll('.frammenti-item'));
    var framLightbox = document.getElementById('frammentilightbox');
    var framBackdrop = document.getElementById('frammentilightboxBackdrop');
    var framClose    = document.getElementById('frammentilightboxClose');
    var framContent  = document.getElementById('frammentilightboxContent');
    var framPrev     = document.getElementById('frammentilightboxPrev');
    var framNext     = document.getElementById('frammentilightboxNext');
    var framCurrent  = 0;

    if (!framItems.length || !framLightbox) return;

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
  }

  loadCmsContent().then(function () {
    initTestimonialsSlider();
    initFrammentiLightbox();
  });

})();

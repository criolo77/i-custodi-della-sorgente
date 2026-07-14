/**
 * Content Engine — Custodi della Sorgente
 * ============================================================
 * Motore condiviso per le pagine di dettaglio dei contenuti dinamici
 * (attualmente: Quaderni, Seminari).
 *
 * Nato dal consolidamento dell'Architettura 1.0 (STEP 1-2), centralizza
 * la logica comune a ogni "pagina modello + slug + JSON" del sito:
 *   - lettura dello slug dalla querystring;
 *   - caricamento del relativo file JSON;
 *   - individuazione del contenuto richiesto;
 *   - delega del disegno (render) alla singola pagina, che resta
 *     responsabile solo del proprio markup/HTML specifico.
 *
 * Qualsiasi nuova tipologia di contenuto (Ritiri, Eventi, Percorsi,
 * Meditazioni, Podcast, Video, Articoli, ecc.) potrà appoggiarsi a
 * questo stesso motore fornendo solo una configurazione dedicata,
 * senza duplicare la logica di fetch/slug/visibilità.
 *
 * Il file non introduce alcuna modifica visiva: si limita a spostare
 * qui funzioni già esistenti e identiche nelle pagine di dettaglio.
 */
(function (global) {
  "use strict";

  // ------------------------------------------------------------
  // Utility di base, condivise da tutte le pagine di dettaglio
  // ------------------------------------------------------------

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

  // Formatta un intervallo di date (per contenuti su più giorni, es. Seminari).
  // Se endDate e' assente o coincide con startDate, restituisce una singola data.
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

  // Legge lo slug dalla querystring (?slug=...); in assenza, ricade sul
  // primo elemento disponibile (stesso comportamento gia' in uso).
  function getRequestedSlug(items, slugField) {
    var field = slugField || "slug";
    var params = new URLSearchParams(global.location.search);
    var slug = params.get("slug");
    if (slug) return slug;
    return items[0] && items[0][field] ? items[0][field] : "";
  }

  // ------------------------------------------------------------
  // Motore generico per pagine "modello + slug + JSON"
  // ------------------------------------------------------------
  //
  // config = {
  //   dataUrl:          string    percorso del file JSON dei contenuti (obbligatorio)
  //   rootId:           string    id dell'elemento in cui disegnare il contenuto (obbligatorio)
  //   slugField:        string    nome del campo slug nel JSON (default: "slug")
  //   isVisible:        function(item) -> bool   filtro di visibilita' pubblica
  //                                              (es. escludere stato "bozza"); default: sempre visibile
  //   getDocumentTitle: function(item) -> string  titolo da assegnare a document.title (opzionale)
  //   render:           function(item, root)      disegna il contenuto trovato (obbligatorio)
  //   renderNotFound:   function(root)             disegna lo stato "non trovato" (obbligatorio)
  //   seo:              function(item)             punto di innesto per SEO dinamica futura
  //                                                 (title/meta/canonical/Open Graph/Twitter/
  //                                                 Schema.org Event/breadcrumb). Non implementato
  //                                                 in questo step: se assente, non fa nulla.
  // }
  function initDetailPage(config) {
    var root = document.getElementById(config.rootId);
    if (!root) return;

    var isVisible = config.isVisible || function () { return true; };
    var slugField = config.slugField || "slug";

    fetch(config.dataUrl, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Impossibile caricare: " + config.dataUrl);
        return response.json();
      })
      .then(function (items) {
        if (!Array.isArray(items) || !items.length) {
          config.renderNotFound(root);
          return;
        }
        var slug = getRequestedSlug(items, slugField);
        var item = items.find(function (entry) { return entry[slugField] === slug; });

        if (item && isVisible(item)) {
          if (config.getDocumentTitle) document.title = config.getDocumentTitle(item);
          // Punto di innesto riservato alla SEO dinamica (title/meta/canonical/OG/
          // Twitter/Schema.org Event/breadcrumb), da implementare in uno step futuro.
          if (typeof config.seo === "function") config.seo(item);
          config.render(item, root);
        } else {
          config.renderNotFound(root);
        }
      })
      .catch(function () {
        config.renderNotFound(root);
      });
  }

  global.ContentEngine = {
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    formatDateRange: formatDateRange,
    getRequestedSlug: getRequestedSlug,
    initDetailPage: initDetailPage
  };
})(window);

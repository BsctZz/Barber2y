(function () {
  "use strict";

  // ---------- Année footer ----------
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Menu mobile ----------
  var navToggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");

  function closeNav() {
    nav.setAttribute("data-open", "false");
    navToggle.setAttribute("aria-expanded", "false");
    document.documentElement.removeAttribute("data-nav-open");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var isOpen = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!isOpen));
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      if (isOpen) {
        document.documentElement.removeAttribute("data-nav-open");
      } else {
        document.documentElement.setAttribute("data-nav-open", "true");
      }
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
  }

  // ---------- Logo médaillon au scroll ----------
  var header = document.querySelector(".header");
  if (header) {
    var toggleHeaderScrolled = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 60);
    };
    toggleHeaderScrolled();
    window.addEventListener("scroll", toggleHeaderScrolled, { passive: true });
  }

  // ---------- Header transparent -> noir progressif (page avec hero vidéo) ----------
  var heroSection = document.querySelector(".hero");
  if (header && heroSection) {
    var HEADER_FADE_DISTANCE = 260;
    var updateHeaderAlpha = function () {
      var ratio = Math.min(window.scrollY / HEADER_FADE_DISTANCE, 1);
      header.style.setProperty("--header-alpha", (ratio * 0.97).toFixed(3));
    };
    updateHeaderAlpha();
    window.addEventListener("scroll", updateHeaderAlpha, { passive: true });
  }

  // ---------- Cookie banner (RGPD) ----------
  var cookieBanner = document.getElementById("cookie-banner");
  var cookieAccept = document.getElementById("cookie-accept");
  var cookieRefuse = document.getElementById("cookie-refuse");
  var CONSENT_KEY = "barber2y_cookie_consent";
  var backToTop = document.getElementById("back-to-top");

  function markCookieDismissed() {
    if (backToTop) backToTop.classList.add("cookie-dismissed");
  }

  function loadAnalyticsIfConsented() {
    var consent = localStorage.getItem(CONSENT_KEY);
    if (consent !== "accepted") return;
    // TODO : brancher Google Analytics 4 ou Matomo ici une fois l'ID connu.
    // Ne jamais charger le script de mesure d'audience avant ce point.
  }

  try {
    if (cookieBanner && !localStorage.getItem(CONSENT_KEY)) {
      cookieBanner.hidden = false;
    } else {
      markCookieDismissed();
    }
  } catch (e) {
    /* localStorage indisponible (navigation privée) : on n'affiche pas le bandeau */
    markCookieDismissed();
  }

  if (cookieAccept) {
    cookieAccept.addEventListener("click", function () {
      try {
        localStorage.setItem(CONSENT_KEY, "accepted");
      } catch (e) {}
      cookieBanner.hidden = true;
      markCookieDismissed();
      loadAnalyticsIfConsented();
    });
  }

  if (cookieRefuse) {
    cookieRefuse.addEventListener("click", function () {
      try {
        localStorage.setItem(CONSENT_KEY, "refused");
      } catch (e) {}
      cookieBanner.hidden = true;
      markCookieDismissed();
    });
  }

  // ---------- Bouton retour en haut ----------
  if (backToTop) {
    var toggleBackToTop = function () {
      backToTop.classList.toggle("is-visible", window.scrollY > 500);
    };
    toggleBackToTop();
    window.addEventListener("scroll", toggleBackToTop, { passive: true });

    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  loadAnalyticsIfConsented();

  // ---------- Animations au scroll (reveal) ----------
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealGroups = document.querySelectorAll(
      ".section-title, .card, .pricing-card, .util-card, .product-card, .salon > *, .contact > *"
    );

    revealGroups.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.setProperty("--reveal-delay", (i % 4) * 0.08 + "s");
    });

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealGroups.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // ---------- Lien de nav actif selon la section visible ----------
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll(".nav a[href^='#']");

  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.getAttribute("id");
          navLinks.forEach(function (link) {
            var isCurrent = link.getAttribute("href") === "#" + id;
            link.toggleAttribute("aria-current", isCurrent);
            if (isCurrent) link.setAttribute("aria-current", "page");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  // ---------- Horaires : mise en avant du jour en cours ----------
  var hoursList = document.getElementById("hours-list");
  if (hoursList) {
    var todayRow = hoursList.querySelector('[data-day="' + new Date().getDay() + '"]');
    if (todayRow) {
      todayRow.classList.add("is-today");
      var badge = document.createElement("span");
      badge.className = "hours__badge";
      badge.textContent = "Aujourd'hui";
      todayRow.querySelector(".hours__day").after(badge);
    }
  }

  // ---------- Réservation (Planity) ----------
  // Renseigner ici le lien Planity (marque blanche) dès réception : tous les liens .js-booking basculent dessus.
  // Tant qu'il est vide, ils pointent vers la section #contact.
  var BOOKING_URL = "";
  if (BOOKING_URL) {
    document.querySelectorAll(".js-booking").forEach(function (link) {
      link.href = BOOKING_URL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  }
})();

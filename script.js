(function () {
  "use strict";

  // ---------- Année footer ----------
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Menu mobile (tiroir) ----------
  // Fermeture : bouton ✕, clic sur le fond, clic sur un lien, Échap, ou passage en grand écran.
  var navToggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");
  var navBackdrop = document.getElementById("nav-backdrop");
  var navClose = document.getElementById("nav-close");

  function isNavOpen() {
    return nav.getAttribute("data-open") === "true";
  }

  function openNav() {
    nav.setAttribute("data-open", "true");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Fermer le menu");
    document.documentElement.setAttribute("data-nav-open", "true");
    if (navBackdrop) {
      navBackdrop.hidden = false;
      requestAnimationFrame(function () {
        navBackdrop.classList.add("is-visible");
      });
    }
    if (navClose) navClose.focus({ preventScroll: true });
  }

  function closeNav(restoreFocus) {
    if (!isNavOpen()) return;
    nav.setAttribute("data-open", "false");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Ouvrir le menu");
    document.documentElement.removeAttribute("data-nav-open");
    if (navBackdrop) {
      navBackdrop.classList.remove("is-visible");
      setTimeout(function () {
        if (!isNavOpen()) navBackdrop.hidden = true;
      }, 300);
    }
    if (restoreFocus === true) navToggle.focus({ preventScroll: true });
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      if (isNavOpen()) closeNav(true);
      else openNav();
    });

    if (navClose) navClose.addEventListener("click", function () { closeNav(true); });
    if (navBackdrop) navBackdrop.addEventListener("click", function () { closeNav(true); });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    // Clic n'importe où hors du menu (et hors du bouton burger) = fermeture
    document.addEventListener("click", function (e) {
      if (isNavOpen() && !nav.contains(e.target) && !navToggle.contains(e.target)) closeNav();
    });

    document.addEventListener("keydown", function (e) {
      if (!isNavOpen()) return;
      if (e.key === "Escape") {
        closeNav(true);
        return;
      }
      // Garde le focus clavier dans le menu tant qu'il est ouvert
      if (e.key === "Tab") {
        var focusables = nav.querySelectorAll("a, button");
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (mq) {
      if (mq.matches) closeNav();
    });
  }

  // ---------- Vidéo hero : pas de téléchargement en mode économie de données / animations réduites ----------
  var heroVideo = document.querySelector(".hero__video");
  var saveData = navigator.connection && navigator.connection.saveData;
  if (heroVideo && (saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.querySelectorAll("source").forEach(function (source) {
      source.remove();
    });
    heroVideo.load();
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

  // ---------- Consentement cookies (RGPD / recommandations CNIL) ----------
  // - Rien de tiers n'est chargé avant le choix (carte Google Maps, futur outil d'audience).
  // - "Tout refuser" aussi simple que "Tout accepter" ; choix modifiable via "Gérer les cookies".
  // - Le choix est conservé 6 mois puis redemandé.
  var cookieBanner = document.getElementById("cookie-banner");
  var cookieAccept = document.getElementById("cookie-accept");
  var cookieRefuse = document.getElementById("cookie-refuse");
  var CONSENT_KEY = "barber2y_cookie_consent";
  var CONSENT_MAX_AGE = 1000 * 60 * 60 * 24 * 182; // ~6 mois
  var backToTop = document.getElementById("back-to-top");

  function readConsent() {
    try {
      var raw = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (raw && (raw.value === "accepted" || raw.value === "refused") && Date.now() - raw.date < CONSENT_MAX_AGE) {
        return raw.value;
      }
    } catch (e) {
      /* ancienne valeur texte ou stockage indisponible : on redemande */
    }
    return null;
  }

  function saveConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ value: value, date: Date.now() }));
    } catch (e) {}
  }

  function showCookieBanner(show) {
    if (!cookieBanner) return;
    cookieBanner.hidden = !show;
    if (backToTop) backToTop.classList.toggle("cookie-dismissed", !show);
  }

  function applyConsent() {
    if (readConsent() !== "accepted") return;
    loadMap();
    // TODO : brancher ici un outil de mesure d'audience (GA4 / Matomo) le jour où il y en a un.
  }

  showCookieBanner(readConsent() === null);

  if (cookieAccept) {
    cookieAccept.addEventListener("click", function () {
      saveConsent("accepted");
      showCookieBanner(false);
      applyConsent();
    });
  }

  if (cookieRefuse) {
    cookieRefuse.addEventListener("click", function () {
      var hadMap = mapFrame && mapFrame.querySelector("iframe");
      saveConsent("refused");
      showCookieBanner(false);
      // Retrait du consentement : on recharge pour retirer la carte déjà affichée
      if (hadMap) window.location.reload();
    });
  }

  document.querySelectorAll("[data-cookie-settings]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showCookieBanner(true);
      if (cookieAccept) cookieAccept.focus();
    });
  });

  // ---------- Carte Google Maps (chargée seulement après consentement) ----------
  var mapFrame = document.getElementById("map-frame");
  var mapLoadBtn = document.getElementById("map-load");

  function loadMap() {
    if (!mapFrame || mapFrame.querySelector("iframe")) return;
    var iframe = document.createElement("iframe");
    iframe.src = mapFrame.getAttribute("data-map-src");
    iframe.title = "Carte : Barber 2Y, 8 rue du Maréchal Foch à Ars-sur-Moselle";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;
    mapFrame.innerHTML = "";
    mapFrame.appendChild(iframe);
  }

  if (mapLoadBtn) {
    // Clic = consentement ponctuel pour la carte uniquement (non mémorisé)
    mapLoadBtn.addEventListener("click", loadMap);
  }

  // ---------- Itinéraire : choix Google Maps / Waze / Plans ----------
  var directionsDialog = document.getElementById("directions-dialog");
  if (directionsDialog && typeof directionsDialog.showModal === "function") {
    document.querySelectorAll("[data-directions]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        directionsDialog.showModal();
      });
    });
    directionsDialog.querySelectorAll("[data-directions-close], .directions__app").forEach(function (el) {
      el.addEventListener("click", function () {
        directionsDialog.close();
      });
    });
    // Clic sur le fond = fermer
    directionsDialog.addEventListener("click", function (e) {
      if (e.target === directionsDialog) directionsDialog.close();
    });
  }
  // Sans <dialog> (vieux navigateurs), le lien ouvre directement Google Maps.

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

  applyConsent();

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
  var navLinks = document.querySelectorAll(".nav__link");

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
    document.querySelectorAll("[data-booking-pending]").forEach(function (el) {
      el.hidden = true;
    });
  }

  // ---------- Réseaux sociaux ----------
  // Renseigner les liens dès que les comptes existent : les icônes du footer et la section Instagram
  // s'affichent automatiquement. Un lien vide = élément masqué (pas de lien cassé en ligne).
  var SOCIAL_LINKS = {
    instagram: "",
    tiktok: "",
    facebook: ""
  };
  var hasSocial = false;
  document.querySelectorAll("[data-social]").forEach(function (link) {
    var url = SOCIAL_LINKS[link.getAttribute("data-social")];
    if (url) {
      link.href = url;
      link.hidden = false;
      hasSocial = true;
    } else {
      link.hidden = true;
    }
  });
  document.querySelectorAll("[data-social-section]").forEach(function (el) {
    // La section photos Instagram n'a de sens qu'avec le compte Instagram
    el.hidden = el.id === "social" ? !SOCIAL_LINKS.instagram : !hasSocial;
  });
})();

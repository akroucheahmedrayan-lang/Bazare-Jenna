/**
 * script.js — JavaScript partagé pour toutes les pages
 * Bazare Jenna — Boutique Mode & Style — Version 2 (améliorée)
 */

/* ============================================================
   UTILITAIRE : normalise une chaîne (minuscules + sans accents)
   ============================================================ */
function normaliser(texte) {
  return texte
    .toLowerCase()
    .normalize("NFD")                    // décompose les accents
    .replace(/[\u0300-\u036f]/g, "")     // supprime les diacritiques
    .trim();
}

/* ============================================================
   RECHERCHE — PAGE D'ACCUEIL
   Maps mots-clés → page de destination
   ============================================================ */
const MOTS_CLES = {
  "chaussures.html": [
    "chaussures", "chaussure", "shoes", "shoe",
    "baskets", "basket", "sneakers",
    "bottes", "bottines", "mocassins", "sandales"
  ],
  "jeans.html": [
    "jeans", "jean", "denim", "short"
  ],
  "vetements.html": [
    "vetements", "vetement", "clothes", "clothing",
    "t-shirt", "tshirt", "sweat", "chemise",
    "pull", "veste", "manteau", "robe", "pantalon"
  ],
  "accessoires.html": [
    "accessoires", "accessoire", "accessories",
    "casquette", "ceinture", "sac", "echarpe",
    "lunettes", "montre", "portefeuille", "bonnet"
  ]
};

/**
 * Cherche la page cible pour une saisie donnée.
 * @param {string} saisie
 * @returns {string|null}
 */
function trouverPage(saisie) {
  const s = normaliser(saisie);
  if (s.length === 0) return null;

  for (const [page, mots] of Object.entries(MOTS_CLES)) {
    for (const mot of mots) {
      if (s.includes(mot) || mot.includes(s)) {
        return page;
      }
    }
  }
  return null;
}

/* ── Initialisation de la recherche sur la page d'accueil ── */
function initRechercheAccueil() {
  const form     = document.getElementById("form-recherche-accueil");
  if (!form) return;

  const input    = document.getElementById("input-recherche-accueil");
  const msgErreur = document.getElementById("msg-aucun-rayon");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const valeur = input.value;
    if (normaliser(valeur).length === 0) return;

    const page = trouverPage(valeur);
    if (page) {
      msgErreur.style.display = "none";
      naviguerVers(page);
    } else {
      msgErreur.style.display = "block";
    }
  });

  input.addEventListener("input", function () {
    msgErreur.style.display = "none";
  });
}

/* ============================================================
   FILTRAGE EN DIRECT — PAGES CATÉGORIE
   ============================================================ */
function initRechercheProduits() {
  const form   = document.getElementById("form-recherche-categorie");
  if (!form) return;

  const input   = document.getElementById("input-recherche-categorie");
  const grille  = document.getElementById("grille-produits");
  const compteur = document.getElementById("compteur-produits");
  const msgVide  = document.getElementById("msg-aucun-produit");

  if (!input || !grille || !compteur) return;

  const toutes = Array.from(grille.querySelectorAll(".product-card"));
  const total  = toutes.length;

  /* Compteur initial */
  compteur.textContent = total + " produit" + (total > 1 ? "s" : "");

  function filtrer() {
    const terme = normaliser(input.value);
    let visibles = 0;

    toutes.forEach(function (carte) {
      const nom     = normaliser(carte.dataset.nom || "");
      const visible = terme.length === 0 || nom.includes(terme);

      if (visible) {
        /* Réapparition animée */
        carte.style.display = "";
        carte.classList.remove("filter-reveal");
        /* Force reflow pour relancer l'animation */
        void carte.offsetWidth;
        carte.classList.add("filter-reveal");
        visibles++;
      } else {
        carte.style.display = "none";
        carte.classList.remove("filter-reveal");
      }
    });

    /* Mise à jour du compteur */
    compteur.textContent = visibles + " produit" + (visibles > 1 ? "s" : "");

    /* Message aucun résultat */
    if (msgVide) {
      msgVide.style.display = visibles === 0 ? "block" : "none";
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    filtrer();
  });

  input.addEventListener("input", filtrer);
}

/* ============================================================
   TRANSITIONS DE PAGE (fondu entrant / sortant)
   ============================================================ */

/**
 * Navigue vers une URL en ajoutant d'abord une animation de sortie.
 * @param {string} url
 */
function naviguerVers(url) {
  /* Si les préférences réduisent les mouvements, navigue directement */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.location.href = url;
    return;
  }

  document.body.classList.add("page-exit");
  setTimeout(function () {
    window.location.href = url;
  }, 260); /* légèrement supérieur à la durée CSS (0.25s) */
}

/** Intercepte les liens de navigation pour la transition de sortie */
function initTransitionsPage() {
  /* Fondu d'entrée au chargement */
  document.body.classList.add("page-enter");
  /* Force reflow */
  void document.body.offsetWidth;
  document.body.classList.remove("page-enter");

  /* Intercepte les clics sur les liens internes de navigation */
  document.addEventListener("click", function (e) {
    const lien = e.target.closest("a[href]");
    if (!lien) return;

    const href = lien.getAttribute("href");
    /* Ignore les ancres (#), les liens externes, et les liens avec modificateurs */
    if (!href || href.startsWith("#") || href.startsWith("http") ||
        href.startsWith("mailto") || href.startsWith("tel") ||
        e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }

    e.preventDefault();
    naviguerVers(href);
  });
}

/* ============================================================
   EN-TÊTE STICKY — OMBRE ET PADDING AU SCROLL
   ============================================================ */
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  function mettreAJour() {
    if (window.scrollY > 20) {
      header.classList.add("header-scrolled");
    } else {
      header.classList.remove("header-scrolled");
    }
  }

  window.addEventListener("scroll", mettreAJour, { passive: true });
  mettreAJour();
}

/* ============================================================
   RÉVÉLATION AU SCROLL — IntersectionObserver
   ============================================================ */
function initRevealScroll() {
  /* Ne pas appliquer si l'utilisateur préfère les mouvements réduits */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const elements = document.querySelectorAll(".reveal");
  if (!elements.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        /* N'anime qu'une seule fois */
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px"
  });

  elements.forEach(function (el) {
    observer.observe(el);
  });
}

/* ============================================================
   BOUTON "RETOUR EN HAUT"
   ============================================================ */
function initBoutonHaut() {
  const btn = document.querySelector(".btn-top");
  if (!btn) return;

  function mettreAJour() {
    if (window.scrollY > 400) {
      btn.classList.add("btn-top--visible");
    } else {
      btn.classList.remove("btn-top--visible");
    }
  }

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", mettreAJour, { passive: true });
  mettreAJour();
}

/* ============================================================
   BARRE DE RECHERCHE — FOCUS / BLUR
   ============================================================ */
function initSearchFocus() {
  document.querySelectorAll(".search-form").forEach(function (form) {
    const input = form.querySelector(".search-form__input");
    if (!input) return;

    input.addEventListener("focus", function () {
      form.classList.add("search-focused");
    });

    input.addEventListener("blur", function () {
      form.classList.remove("search-focused");
    });
  });
}

/* ============================================================
   BOUTONS FAVORI (cœur)
   ============================================================ */
function initFavoris() {
  document.querySelectorAll(".btn-favori").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const actif = btn.classList.toggle("favori-actif");

      /* Animation de pulsation */
      btn.classList.remove("favori-pop");
      void btn.offsetWidth; /* force reflow */
      btn.classList.add("favori-pop");

      /* Met à jour l'aria-label */
      btn.setAttribute("aria-label", actif ? "Retirer des favoris" : "Ajouter aux favoris");

      /* Nettoie la classe d'animation après qu'elle se termine */
      btn.addEventListener("animationend", function () {
        btn.classList.remove("favori-pop");
      }, { once: true });
    });
  });
}

/* ============================================================
   SHIMMER SUR LES PLACEHOLDERS D'IMAGE
   (Ajoute la classe .shimmer et la retire après 1s)
   ============================================================ */
function initShimmer() {
  const boites = document.querySelectorAll(
    ".product-card__image-box, .rayon-card__image-box, .hero-image-box"
  );

  boites.forEach(function (boite) {
    /* Ajoute le shimmer seulement s'il n'y a pas d'image réelle */
    if (!boite.querySelector("img")) {
      boite.classList.add("shimmer");
      setTimeout(function () {
        boite.classList.remove("shimmer");
      }, 1100);
    }
  });
}

/* ============================================================
   CURSEUR PERSONNALISÉ
   (desktop uniquement, désactivé si prefers-reduced-motion)
   ============================================================ */
function initCurseurPersonnalise() {
  /* Conditions de désactivation */
  const pointeurFin = window.matchMedia("(pointer: fine)").matches;
  const reduitMvt   = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!pointeurFin || reduitMvt) return;

  const dot  = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;

  /* Position du ring (avec délai) */
  let ringX = 0, ringY = 0;
  let mouseX = 0, mouseY = 0;
  let rafId = null;

  /* Éléments cliquables */
  const selecteurCliquable = "a, button, [role='button'], .rayon-card, .category-chip, .filter-btn, .product-card";

  document.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    /* Le point suit la souris exactement */
    dot.style.left = mouseX + "px";
    dot.style.top  = mouseY + "px";
  });

  /* Animation fluide du ring (interpolation) */
  function animerRing() {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    ring.style.left = ringX + "px";
    ring.style.top  = ringY + "px";
    rafId = requestAnimationFrame(animerRing);
  }
  animerRing();

  /* Agrandit le ring au survol d'éléments cliquables */
  document.addEventListener("mouseover", function (e) {
    if (e.target.closest(selecteurCliquable)) {
      ring.classList.add("cursor-hover");
    }
  });

  document.addEventListener("mouseout", function (e) {
    if (e.target.closest(selecteurCliquable)) {
      ring.classList.remove("cursor-hover");
    }
  });

  /* Cache le curseur quand la souris sort de la fenêtre */
  document.addEventListener("mouseleave", function () {
    dot.classList.add("cursor-hidden");
    ring.classList.add("cursor-hidden");
  });

  document.addEventListener("mouseenter", function () {
    dot.classList.remove("cursor-hidden");
    ring.classList.remove("cursor-hidden");
  });

  /* Rétablit le curseur texte natif sur les inputs */
  document.querySelectorAll("input, textarea").forEach(function (el) {
    el.addEventListener("mouseenter", function () {
      dot.style.opacity = "0";
    });
    el.addEventListener("mouseleave", function () {
      dot.style.opacity = "1";
    });
  });
}

/* ============================================================
   POINT D'ENTRÉE
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {

  /* ── Fonctionnalités existantes ── */
  initRechercheAccueil();
  initRechercheProduits();

  /* ── Nouvelles fonctionnalités ── */
  initTransitionsPage();
  initHeaderScroll();
  initRevealScroll();
  initBoutonHaut();
  initSearchFocus();
  initFavoris();
  initShimmer();
  initCurseurPersonnalise();

});

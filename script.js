const serviceItems = [...document.querySelectorAll("[data-service]")];
const serviceImages = [...document.querySelectorAll("[data-service-image]")];

function openService(index) {
  serviceItems.forEach((item, i) => {
    const open = i === index;
    item.classList.toggle("is-open", open);
    item.querySelector("button").setAttribute("aria-expanded", String(open));
  });
  serviceImages.forEach((image, i) => {
    const active = i === index;
    image.classList.toggle("is-active", active);
    image.toggleAttribute("aria-hidden", !active);
  });
}

if (serviceItems.length) {
  openService(0);

  serviceItems.forEach((item, index) => {
    item.querySelector("button").addEventListener("click", () => {
      if (item.classList.contains("is-open")) return;
      openService(index);
    });
  });
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function countUp(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  const start = performance.now();
  const duration = 1100;

  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = Math.round(target * eased).toLocaleString("en-US") + suffix;
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

if (!reduceMotion) {
  document.documentElement.classList.add("motion");
  document.querySelectorAll("[data-count]").forEach(countUp);

  const revealEls = [...document.querySelectorAll("[data-reveal]")];
  revealEls.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((child) => child.hasAttribute("data-reveal"));
    const index = siblings.indexOf(el);
    if (index > 0) el.style.transitionDelay = `${index * 90}ms`;
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
  );

  const intro = document.querySelector(".about-intro");
  const introEls = intro ? [...intro.querySelectorAll("[data-reveal]")] : [];
  const introSet = new Set(introEls);

  revealEls.forEach((el) => {
    if (!introSet.has(el)) revealObserver.observe(el);
  });

  if (intro && introEls.length) {
    const introObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        introEls.forEach((el) => el.classList.add("is-in"));
        introObserver.disconnect();
      },
      { threshold: 0.2, rootMargin: "0px 0px -28% 0px" }
    );
    introObserver.observe(intro);
  }
}

const quoteRoot = document.querySelector("[data-quotes]");
let quoteController = null;

function getTestimonials(lang) {
  const dict = window.DUTAM_I18N && window.DUTAM_I18N[lang];
  const list = dict && Array.isArray(dict.testimonials) ? dict.testimonials : null;
  if (list && list.length) return list;
  return (window.DUTAM_I18N && window.DUTAM_I18N.en && window.DUTAM_I18N.en.testimonials) || [];
}

if (quoteRoot) {
  const indexEl = quoteRoot.querySelector("[data-quote-index]");
  const displayEl = quoteRoot.querySelector("[data-quote-display]");
  const fullEl = quoteRoot.querySelector("[data-quote-full]");
  const expandBtn = quoteRoot.querySelector("[data-quote-expand]");
  const nameEl = quoteRoot.querySelector("[data-quote-name]");
  const orgEl = quoteRoot.querySelector("[data-quote-org]");
  const voicesEl = quoteRoot.querySelector("[data-quote-voices]");
  const prevBtn = quoteRoot.querySelector("[data-quote-prev]");
  const nextBtn = quoteRoot.querySelector("[data-quote-next]");
  let quoteIndex = 0;
  let expanded = false;
  let autoTimer;
  let testimonials = getTestimonials((window.DutamI18n && window.DutamI18n.getLang()) || "en");
  let voiceButtons = [];

  function buildVoices() {
    voicesEl.innerHTML = "";
    testimonials.forEach((item, i) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.name;
      button.addEventListener("click", () => showQuote(i, true));
      li.appendChild(button);
      voicesEl.appendChild(li);
    });
    voiceButtons = [...voicesEl.querySelectorAll("button")];
  }

  function setExpanded(next) {
    expanded = next;
    fullEl.hidden = !expanded;
    displayEl.hidden = expanded;
    expandBtn.setAttribute("aria-expanded", String(expanded));
    const expandKey = expanded ? "about.quotes_collapse" : "about.quotes_expand";
    expandBtn.textContent = window.DutamI18n ? window.DutamI18n.t(expandKey) : expandBtn.textContent;
  }

  function showQuote(next, userDriven = false) {
    if (!testimonials.length) return;
    quoteIndex = (next + testimonials.length) % testimonials.length;
    const item = testimonials[quoteIndex];
    const n = String(quoteIndex + 1).padStart(2, "0");
    const total = String(testimonials.length).padStart(2, "0");
    const indexTemplate = window.DutamI18n
      ? window.DutamI18n.t("about.quotes_index")
      : "Testimonial {n} / {total}";
    indexEl.textContent = indexTemplate.replace("{n}", n).replace("{total}", total);
    displayEl.textContent = item.display;
    fullEl.textContent = item.full;
    nameEl.textContent = item.name;
    orgEl.textContent = item.org;
    voiceButtons.forEach((button, i) => {
      button.classList.toggle("is-active", i === quoteIndex);
    });
    setExpanded(false);
    if (userDriven) restartAuto();
  }

  function restartAuto() {
    if (reduceMotion) return;
    if (autoTimer) window.clearInterval(autoTimer);
    autoTimer = window.setInterval(() => showQuote(quoteIndex + 1), 7000);
  }

  function refreshQuotes(lang) {
    const currentName = testimonials[quoteIndex] && testimonials[quoteIndex].name;
    testimonials = getTestimonials(lang);
    buildVoices();
    let nextIndex = 0;
    if (currentName) {
      const found = testimonials.findIndex((item) => item.name === currentName);
      if (found >= 0) nextIndex = found;
    }
    showQuote(nextIndex);
  }

  buildVoices();
  expandBtn.addEventListener("click", () => setExpanded(!expanded));
  prevBtn.addEventListener("click", () => showQuote(quoteIndex - 1, true));
  nextBtn.addEventListener("click", () => showQuote(quoteIndex + 1, true));

  showQuote(0);
  if (!reduceMotion) {
    autoTimer = window.setInterval(() => showQuote(quoteIndex + 1), 7000);
  }

  quoteController = { refreshQuotes };
}

const language = document.querySelector(".language");
const languageBtn = language && language.querySelector(".language-btn");
const languageMenu = document.querySelector("#language-menu");

function applyLanguage(lang) {
  if (!window.DutamI18n) return lang || "en";
  const next = window.DutamI18n.apply(lang);
  if (quoteController) quoteController.refreshQuotes(next);
  return next;
}

if (language && languageBtn && languageMenu && window.DutamI18n) {
  languageBtn.addEventListener("click", () => {
    const open = languageMenu.hidden;
    languageMenu.hidden = !open;
    languageBtn.setAttribute("aria-expanded", String(open));
  });

  languageMenu.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-lang]");
    if (!choice) return;
    applyLanguage(choice.dataset.lang);
    languageMenu.hidden = true;
    languageBtn.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", (event) => {
    if (!language.contains(event.target)) {
      languageMenu.hidden = true;
      languageBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || languageMenu.hidden) return;
    languageMenu.hidden = true;
    languageBtn.setAttribute("aria-expanded", "false");
    languageBtn.focus();
  });

  applyLanguage(window.DutamI18n.getLang());
}

const nav = document.querySelector(".nav");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#site-nav");
let lastScrollY = window.scrollY;

navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
  if (open) nav.classList.remove("is-hidden");
});

navLinks.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  navLinks.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
});

nav.addEventListener("focusin", () => nav.classList.remove("is-hidden"));

window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY;
    const delta = y - lastScrollY;
    if (Math.abs(delta) < 8 && y > 8) return;
    const menuOpen = navLinks.classList.contains("is-open");
    if (y < 8 || delta < 0 || menuOpen) nav.classList.remove("is-hidden");
    else nav.classList.add("is-hidden");
    lastScrollY = y;
  },
  { passive: true }
);

function bindForm(form, invalidKey, successKey) {
  if (!form) return;
  const status = form.querySelector(".form-status");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const t = (key, fallback) => (window.DutamI18n ? window.DutamI18n.t(key) : fallback);
    if (!form.checkValidity()) {
      status.hidden = false;
      status.textContent = t(invalidKey, "Please complete the required fields.");
      form.reportValidity();
      return;
    }
    status.hidden = false;
    status.textContent = t(successKey, "Thanks.");
    form.reset();
  });
}

bindForm(document.querySelector("#project-form"), "form.invalid_privacy", "form.success_contact");
bindForm(document.querySelector("#career-form"), "form.invalid_required", "form.success_career");
bindForm(document.querySelector("#contact-form"), "form.invalid_required", "form.success_contact");

const industryTrack = document.querySelector(".industry-track");
const industryMarqueeMq = window.matchMedia("(max-width: 760px)");

function syncIndustryMarquee() {
  if (!industryTrack) return;
  const clones = industryTrack.querySelectorAll("[data-marquee-clone]");
  if (industryMarqueeMq.matches) {
    if (clones.length) return;
    [...industryTrack.querySelectorAll("img")].forEach((img) => {
      const clone = img.cloneNode(true);
      clone.dataset.marqueeClone = "true";
      clone.alt = "";
      clone.setAttribute("aria-hidden", "true");
      industryTrack.appendChild(clone);
    });
    return;
  }
  clones.forEach((clone) => clone.remove());
}

syncIndustryMarquee();
industryMarqueeMq.addEventListener("change", syncIndustryMarquee);

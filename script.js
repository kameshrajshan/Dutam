const serviceItems = [...document.querySelectorAll("[data-service]")];
const serviceImages = [...document.querySelectorAll("[data-service-image]")];

function serviceIndexFromUrl() {
  const index = Number(new URLSearchParams(location.search).get("service"));
  if (!Number.isInteger(index) || index < 0 || index >= serviceItems.length) return 0;
  return index;
}

function writeQueryParam(name, index) {
  const url = new URL(location.href);
  if (!index) url.searchParams.delete(name);
  else url.searchParams.set(name, String(index));
  history.replaceState(null, "", url.pathname + url.search + url.hash);
}

function openService(index, updateUrl) {
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
  if (updateUrl) writeQueryParam("service", index);
}

if (serviceItems.length) {
  openService(serviceIndexFromUrl(), false);

  serviceItems.forEach((item, index) => {
    item.querySelector("button").addEventListener("click", () => {
      if (item.classList.contains("is-open")) return;
      openService(index, true);
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
    const lang = document.documentElement.lang || "en";
    el.textContent = new Intl.NumberFormat(lang).format(Math.round(target * eased)) + suffix;
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

  const intro = document.querySelector(".about-intro");
  const introEls = intro ? [...intro.querySelectorAll("[data-reveal]")] : [];
  const introSet = new Set(introEls);
  let pendingReveals = revealEls.filter((el) => !introSet.has(el));
  let revealObserver = null;

  function revealEl(el) {
    if (!el || el.classList.contains("is-in")) return;
    el.classList.add("is-in");
    if (revealObserver) revealObserver.unobserve(el);
  }

  function flushReveals() {
    if (!pendingReveals.length) return;
    const viewH = window.innerHeight || document.documentElement.clientHeight;
    const measured = pendingReveals.map((el) => ({ el, rect: el.getBoundingClientRect() }));
    const stay = [];
    measured.forEach(({ el, rect }) => {
      if (rect.top < viewH * 0.92 && rect.bottom > 0) revealEl(el);
      else stay.push(el);
    });
    pendingReveals = stay;
  }

  let revealFrame = 0;
  function scheduleFlush() {
    if (revealFrame) return;
    revealFrame = requestAnimationFrame(() => {
      revealFrame = 0;
      flushReveals();
    });
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealEl(entry.target);
      });
      pendingReveals = pendingReveals.filter((el) => !el.classList.contains("is-in"));
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );

  pendingReveals.forEach((el) => revealObserver.observe(el));
  flushReveals();
  window.addEventListener("scroll", scheduleFlush, { passive: true });
  window.addEventListener("resize", scheduleFlush);

  if (intro && introEls.length) {
    const revealIntro = () => {
      introEls.forEach((el) => el.classList.add("is-in"));
      introObserver.disconnect();
    };
    const introObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        revealIntro();
      },
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" }
    );
    introObserver.observe(intro);
    const introRect = intro.getBoundingClientRect();
    const viewH = window.innerHeight || document.documentElement.clientHeight;
    if (introRect.top < viewH * 0.88 && introRect.bottom > 0) revealIntro();
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
  const pauseBtn = quoteRoot.querySelector("[data-quote-pause]");
  let quoteIndex = 0;
  let expanded = false;
  let quotesPaused = false;
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
    if (userDriven) {
      writeQueryParam("quote", quoteIndex);
      if (!quotesPaused) restartAuto();
    }
  }

  function quoteIndexFromUrl() {
    const index = Number(new URLSearchParams(location.search).get("quote"));
    if (!Number.isInteger(index) || index < 0 || index >= testimonials.length) return 0;
    return index;
  }

  function restartAuto() {
    if (reduceMotion || quotesPaused) return;
    if (autoTimer) window.clearInterval(autoTimer);
    autoTimer = window.setInterval(() => showQuote(quoteIndex + 1), 7000);
  }

  function setQuotesPaused(next) {
    quotesPaused = next;
    if (autoTimer) window.clearInterval(autoTimer);
    autoTimer = 0;
    if (pauseBtn) {
      pauseBtn.setAttribute("aria-pressed", String(quotesPaused));
      const key = quotesPaused ? "about.quotes_play" : "about.quotes_pause";
      pauseBtn.textContent = window.DutamI18n ? window.DutamI18n.t(key) : pauseBtn.textContent;
    }
    if (!quotesPaused) restartAuto();
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
  if (pauseBtn) {
    if (reduceMotion) pauseBtn.hidden = true;
    else pauseBtn.addEventListener("click", () => setQuotesPaused(!quotesPaused));
  }

  showQuote(quoteIndexFromUrl());
  if (!reduceMotion) restartAuto();

  quoteController = {
    refreshQuotes,
    syncPauseLabel() {
      if (!pauseBtn || reduceMotion) return;
      const key = quotesPaused ? "about.quotes_play" : "about.quotes_pause";
      pauseBtn.textContent = window.DutamI18n ? window.DutamI18n.t(key) : pauseBtn.textContent;
    },
  };
}

const language = document.querySelector(".language");
const languageBtn = language && language.querySelector(".language-btn");
const languageMenu = document.querySelector("#language-menu");

function applyLanguage(lang) {
  if (!window.DutamI18n) return lang || "en";
  return window.DutamI18n.apply(lang);
}

// i18n.js owns boot/pageshow apply; quotes only need the change event.
document.addEventListener("dutam:langchange", (event) => {
  const lang = event.detail && event.detail.lang;
  if (quoteController && lang) quoteController.refreshQuotes(lang);
  if (quoteController) quoteController.syncPauseLabel();
  formatPrivacyDate();
  refreshFormStatuses();
});

if (language && languageBtn && languageMenu) {
  languageBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = languageMenu.hidden;
    languageMenu.hidden = !open;
    languageBtn.setAttribute("aria-expanded", String(open));
  });

  // Capture so language changes always win over document click-to-close.
  languageMenu.addEventListener(
    "click",
    (event) => {
      const choice = event.target.closest("[data-lang]");
      if (!choice) return;
      event.preventDefault();
      event.stopPropagation();
      applyLanguage(choice.dataset.lang);
      languageMenu.hidden = true;
      languageBtn.setAttribute("aria-expanded", "false");
    },
    true
  );

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
}

const nav = document.querySelector(".nav");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#site-nav");
let lastScrollY = window.scrollY;

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    if (open && nav) nav.classList.remove("is-hidden");
  });

  navLinks.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
}

if (nav) {
  nav.addEventListener("focusin", () => nav.classList.remove("is-hidden"));
}

window.addEventListener(
  "scroll",
  () => {
    if (!nav || !navLinks) return;
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

const dirtyForms = new Set();
window.addEventListener("beforeunload", (event) => {
  if (!dirtyForms.size) return;
  event.preventDefault();
  event.returnValue = "";
});

function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => {
    const described = el.id ? form.querySelector(`[aria-describedby~="${el.id}"]`) : null;
    if (described) {
      const next = described
        .getAttribute("aria-describedby")
        .split(/\s+/)
        .filter((id) => id && id !== el.id)
        .join(" ");
      if (next) described.setAttribute("aria-describedby", next);
      else described.removeAttribute("aria-describedby");
    }
    el.remove();
  });
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
}

function showFieldError(field, message) {
  field.setAttribute("aria-invalid", "true");
  const error = document.createElement("p");
  error.className = "field-error";
  error.textContent = message;
  if (field.id) {
    error.id = `${field.id}-error`;
    const existing = field.getAttribute("aria-describedby");
    field.setAttribute("aria-describedby", existing ? `${existing} ${error.id}` : error.id);
  }
  const host = field.closest(".check") || field;
  host.insertAdjacentElement("afterend", error);
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

function tForm(key, fallback) {
  return window.DutamI18n ? window.DutamI18n.t(key) : fallback;
}

function renderFormStatus(status, message) {
  if (!status) return;
  status.hidden = false;
  status.textContent = message;
}

function hideFormStatus(form, status) {
  form.removeAttribute("data-status-kind");
  form.removeAttribute("data-status-key");
  if (!status) return;
  status.hidden = true;
  status.textContent = "";
}

function refreshFormStatuses() {
  document.querySelectorAll("form[data-status-key]").forEach((form) => {
    const key = form.getAttribute("data-status-key");
    if (!key) return;
    const status = form.querySelector(".form-status");
    if (status && !status.hidden) status.textContent = tForm(key, status.textContent);
    if (key === "form.file_too_large") {
      const file = form.querySelector('input[type="file"]');
      const fileError = file && document.getElementById(`${file.id}-error`);
      if (fileError) fileError.textContent = tForm(key, fileError.textContent);
    }
  });
}

function bindForm(form, invalidKey) {
  if (!form) return;
  const status = form.querySelector(".form-status");
  form.setAttribute("data-invalid-key", invalidKey);
  form.addEventListener("input", () => {
    dirtyForms.add(form);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    if (!form.checkValidity()) {
      const invalid = [...form.querySelectorAll(":invalid")].filter((el) => {
        if (!el.willValidate) return false;
        return !el.closest("[hidden]");
      });
      const summary = tForm(invalidKey, "Fill in the highlighted fields.");
      invalid.forEach((field) => showFieldError(field, summary));
      form.setAttribute("data-status-kind", "invalid");
      form.setAttribute("data-status-key", invalidKey);
      renderFormStatus(status, summary);
      if (invalid[0]) invalid[0].focus();
      return;
    }
    const file = form.querySelector('input[type="file"]');
    if (file && file.files[0] && file.files[0].size > MAX_RESUME_BYTES) {
      const tooLarge = tForm("form.file_too_large", "Choose a resume of 5 MB or less.");
      showFieldError(file, tooLarge);
      form.setAttribute("data-status-kind", "invalid");
      form.setAttribute("data-status-key", "form.file_too_large");
      renderFormStatus(status, tooLarge);
      file.focus();
      return;
    }
    hideFormStatus(form, status);
  });
}

function syncOtherField(select) {
  const wrapId = select.getAttribute("data-other-field");
  const wrap = wrapId && document.getElementById(wrapId);
  if (!wrap) return;
  const otherInput = wrap.querySelector("input");
  const showOther = select.value === "other";
  wrap.hidden = !showOther;
  if (otherInput) {
    otherInput.required = showOther;
    if (!showOther) otherInput.value = "";
  }
}

document.querySelectorAll("select[data-other-field]").forEach((select) => {
  syncOtherField(select);
  select.addEventListener("change", () => syncOtherField(select));
});

bindForm(document.querySelector("#project-form"), "form.invalid_privacy");
bindForm(document.querySelector("#career-form"), "form.invalid_required");
bindForm(document.querySelector("#contact-form"), "form.invalid_required");

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

function formatPrivacyDate() {
  const el = document.querySelector("[data-privacy-updated]");
  if (!el) return;
  const date = new Date(`${el.getAttribute("data-privacy-updated")}T00:00:00`);
  if (Number.isNaN(date.getTime())) return;
  const lang = document.documentElement.lang || "en";
  const formatted = new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(date);
  const label = window.DutamI18n ? window.DutamI18n.t("privacy.updated_label") : "Last updated";
  el.textContent = `${label}: ${formatted}`;
}

formatPrivacyDate();

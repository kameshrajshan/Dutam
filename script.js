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

const quoteStage = document.querySelector("[data-quotes]");
if (quoteStage) {
  const quotes = [...quoteStage.querySelectorAll("[data-quote]")];
  let quoteIndex = 0;

  function fitQuoteStage() {
    quoteStage.style.height = "auto";
    quotes.forEach((quote) => {
      quote.style.minHeight = "0px";
    });
    const tallest = Math.max(...quotes.map((quote) => quote.offsetHeight));
    quotes.forEach((quote) => {
      quote.style.minHeight = "";
    });
    quoteStage.style.height = `${tallest}px`;
  }

  function showQuote(next) {
    quoteIndex = next;
    quotes.forEach((quote, i) => {
      const active = i === quoteIndex;
      quote.classList.toggle("is-active", active);
      quote.toggleAttribute("aria-hidden", !active);
    });
  }

  showQuote(0);
  fitQuoteStage();
  quoteStage.classList.add("is-ready");
  window.addEventListener("resize", fitQuoteStage);
  if (!reduceMotion) {
    window.setInterval(() => {
      showQuote((quoteIndex + 1) % quotes.length);
    }, 5000);
  }
}

const language = document.querySelector(".language");
const languageBtn = language.querySelector(".language-btn");
const languageMenu = document.querySelector("#language-menu");
const languageLabel = document.querySelector("[data-language-label]");

languageBtn.addEventListener("click", () => {
  const open = languageMenu.hidden;
  languageMenu.hidden = !open;
  languageBtn.setAttribute("aria-expanded", String(open));
});

languageMenu.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-lang]");
  if (!choice) return;
  languageLabel.textContent = choice.textContent;
  document.documentElement.lang = choice.dataset.lang;
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

function bindForm(form, invalidMessage, successMessage) {
  if (!form) return;
  const status = form.querySelector(".form-status");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      status.hidden = false;
      status.textContent = invalidMessage;
      form.reportValidity();
      return;
    }
    status.hidden = false;
    status.textContent = successMessage;
    form.reset();
  });
}

bindForm(
  document.querySelector("#project-form"),
  "Please complete the required fields and accept the privacy policy.",
  "Thanks. A Dutam engineer will reply within one business day."
);
bindForm(
  document.querySelector("#career-form"),
  "Please complete the required fields.",
  "Thanks. We'll keep your application and write when a role fits."
);
bindForm(
  document.querySelector("#contact-form"),
  "Please complete the required fields.",
  "Thanks. A Dutam engineer will reply within one business day."
);

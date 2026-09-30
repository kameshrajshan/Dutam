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
if (quoteRoot) {
  const testimonials = [
    {
      name: "Anne Bouwman",
      org: "Viscon Fresh Produce\nThe Netherlands",
      display:
        "Our cooperation with Dutam is going well. We can find each other easily through digital channels.",
      full:
        "Our cooperation with Dutam is going well. We can find each other easily through digital channels. The English language is well mastered, so communication is smooth. Dutam follows our drawing rules but dares to ask questions about them so that we could improve them together. We notice that Dutam is gaining more experience with our machines, resulting in less questions and more feedback on possible errors in our designs. We feel that Dutam is committed to delivering good work and, if necessary, is willing to go the extra mile. We look forward to a longer cooperation.",
    },
    {
      name: "Richard Walther",
      org: "Founder, Walther Cad Planung GmbH\nGermany",
      display:
        "I do appreciate the good quality work of Dutam and the good workflow they have.",
      full:
        "I do appreciate the good quality work of Dutam and the good workflow they have. The team is trained professionally. What I do appreciate the most is the team. Each and every one is doing his best to bring the project to a successful result.",
    },
    {
      name: "Bart Ramaekers",
      org: "Co-owner, WB&E Facade Design\nBelgium",
      display:
        "Dutam Engineering is always ready with a solution that perfectly fits our needs.",
      full:
        "Since the founding of Dutam Engineering, they have quickly become an essential and reliable partner for our company. Whether it's smaller projects or more complex assignments, Dutam Engineering is always ready with a solution that perfectly fits our needs. They deliver drawings that meet the highest quality standards, always within the agreed deadlines. We fully intend to continue working together successfully for many years to come.",
    },
    {
      name: "Raymond and Bas",
      org: "Owners, Draw2Design B.V.\nThe Netherlands",
      display:
        "We see Dutam as an extension of our company. A trusted address for engineering work.",
      full:
        "Our collaboration with Dutam Engineering has developed into a structural partnership in which we see Dutam as an extension of our company. A company that speaks our language, understands our working methods, is flexible, and always works according to schedule and agreements. A trusted address for engineering work.",
    },
    {
      name: "Drees-Peter",
      org: "Operations Manager, De Bruin Process Equipement B.V.\nThe Netherlands",
      display:
        "We are very pleased with Dutam as our partner and can certainly recommend them.",
      full:
        "We have been collaborating with Dutam for some time now for the development of our production drawings, and we are very satisfied with their service. Their team is highly professional in their communication and approach, making the collaboration smooth. The drawings they deliver are of high quality, precise, and always meet our expectations. Additionally, they are quick to respond, which helps us work efficiently and complete our projects on time. In short, we are very pleased with Dutam as our partner and can certainly recommend them for technical drawings and engineering work.",
    },
  ];

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

  testimonials.forEach((item, i) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.name;
    button.addEventListener("click", () => showQuote(i, true));
    li.appendChild(button);
    voicesEl.appendChild(li);
  });

  const voiceButtons = [...voicesEl.querySelectorAll("button")];

  function setExpanded(next) {
    expanded = next;
    fullEl.hidden = !expanded;
    displayEl.hidden = expanded;
    expandBtn.setAttribute("aria-expanded", String(expanded));
    expandBtn.textContent = expanded ? "Show highlight ←" : "Read full statement →";
  }

  function showQuote(next, userDriven = false) {
    quoteIndex = (next + testimonials.length) % testimonials.length;
    const item = testimonials[quoteIndex];
    const n = String(quoteIndex + 1).padStart(2, "0");
    const total = String(testimonials.length).padStart(2, "0");
    indexEl.textContent = `Testimonial ${n} / ${total}`;
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

  expandBtn.addEventListener("click", () => setExpanded(!expanded));
  prevBtn.addEventListener("click", () => showQuote(quoteIndex - 1, true));
  nextBtn.addEventListener("click", () => showQuote(quoteIndex + 1, true));

  showQuote(0);
  if (!reduceMotion) {
    autoTimer = window.setInterval(() => showQuote(quoteIndex + 1), 7000);
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

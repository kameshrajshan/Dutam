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

openService(0);

serviceItems.forEach((item, index) => {
  item.querySelector("button").addEventListener("click", () => {
    if (item.classList.contains("is-open")) return;
    openService(index);
  });
});

const quotes = [...document.querySelectorAll("[data-quote]")];
const dots = document.querySelector(".dots");
let quoteIndex = 0;

function showQuote(index) {
  quoteIndex = (index + quotes.length) % quotes.length;
  quotes.forEach((quote, i) => {
    const active = i === quoteIndex;
    quote.hidden = !active;
    quote.classList.toggle("is-active", active);
  });
  dots.querySelectorAll("button").forEach((dot, i) => {
    dot.setAttribute("aria-selected", String(i === quoteIndex));
  });
}

quotes.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("role", "tab");
  dot.setAttribute("aria-label", `Testimonial ${i + 1}`);
  dot.addEventListener("click", () => showQuote(i));
  dots.append(dot);
});

document.querySelector("[data-quote-prev]").addEventListener("click", () => showQuote(quoteIndex - 1));
document.querySelector("[data-quote-next]").addEventListener("click", () => showQuote(quoteIndex + 1));
showQuote(0);

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
  languageLabel.textContent = choice.dataset.lang === "nl" ? "Nederlands" : "English";
  languageMenu.hidden = true;
  languageBtn.setAttribute("aria-expanded", "false");
});

document.addEventListener("click", (event) => {
  if (!language.contains(event.target)) {
    languageMenu.hidden = true;
    languageBtn.setAttribute("aria-expanded", "false");
  }
});

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#site-nav");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
});

const form = document.querySelector("#project-form");
const status = form.querySelector(".form-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    status.hidden = false;
    status.textContent = "Please complete the required fields and accept the privacy policy.";
    form.reportValidity();
    return;
  }
  status.hidden = false;
  status.textContent = "Thanks. A Dutam engineer will reply within one business day.";
  form.reset();
});

// Password gate + language choice, all on one page (no redirects, so there is no flash of content).
//
// The initial state (gate / language / site) is set by a tiny inline script in index.html's <head>
// before anything paints. This file handles what happens next.
//
// NOTE: this is a light gate. It keeps casual visitors and search engines out, but anyone who views
// the page source can get around it, so don't put anything truly sensitive on the site.
//
// To change the password, hash the new one in your browser console and paste the result into HASHES:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourPassword'))
//     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
// The current password is "240927" (the one printed on the invite).
const HASHES = [
  "cdd6188f4f0ccabe001ac9c0c4fee69f6fc355f72f97edcb4846624835a81dd8", // 240927
];

const root = document.documentElement;
const store = (() => {
  try { window.sessionStorage.setItem("_t", "1"); window.sessionStorage.removeItem("_t"); return window.sessionStorage; }
  catch (e) { return null; }
})();
let memory = { unlocked: false, lang: null }; // fallback if storage is blocked

const get = (k) => (store ? store.getItem(k) : memory[k === "wedding_lang" ? "lang" : "unlocked"]);
const isUnlocked = () => (store ? store.getItem("wedding_unlocked") === "true" : memory.unlocked);
const getLang = () => { const l = get("wedding_lang"); return l === "en" || l === "sv" ? l : null; };

function setState(s) {
  root.classList.remove("st-gate", "st-lang", "st-site");
  root.classList.add(s);
  if (s === "st-site") window.scrollTo(0, 0);
}

const TEXT = {
  en: { alt: "Wedding invitation: Hanna and Niall, 24 September 2027, Wasing Estate" },
  sv: { alt: "Bröllopsinbjudan: Hanna och Niall, 24 september 2027, Wasing Estate" },
};

function applyLang(lang) {
  root.lang = lang;
  const img = document.getElementById("landing-img");
  if (img) {
    img.src = "img/landing-" + lang + ".jpg";
    img.alt = TEXT[lang].alt;
  }
  document.title = lang === "sv" ? "Hanna & Niall — 24 september 2027" : "Hanna & Niall — 24 September 2027";
}

function chooseLang(lang) {
  if (store) store.setItem("wedding_lang", lang); else memory.lang = lang;
  applyLang(lang);
  setState("st-site");
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function initGate() {
  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-input");
  const error = document.getElementById("gate-error");
  if (!form) return;
  if (input && root.classList.contains("st-gate")) input.focus();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.textContent = "";
    if (!(window.crypto && crypto.subtle)) {
      error.textContent = "Please open this page over https:// to continue.";
      return;
    }
    const hash = await sha256(input.value.trim());
    if (HASHES.includes(hash)) {
      if (store) store.setItem("wedding_unlocked", "true"); else memory.unlocked = true;
      input.value = "";
      // Go straight to the next step. The site stays hidden until a language is chosen.
      setState(getLang() ? "st-site" : "st-lang");
    } else {
      error.textContent = "That's not it — try again.";
      input.select();
    }
  });
}

function initLang() {
  document.querySelectorAll("[data-set-lang]").forEach((btn) => {
    btn.addEventListener("click", () => chooseLang(btn.getAttribute("data-set-lang")));
  });
  // Footer link: switch language without going back through the chooser.
  document.querySelectorAll("[data-switch-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const y = window.scrollY;
      const lang = btn.getAttribute("data-switch-lang");
      if (store) store.setItem("wedding_lang", lang); else memory.lang = lang;
      applyLang(lang);
      window.scrollTo(0, y);
    });
  });
}

function initReveal() {
  const els = document.querySelectorAll(".rv");
  if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  els.forEach((el) => io.observe(el));
}

applyLang(getLang() || "en");
initGate();
initLang();
initReveal();

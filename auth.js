// Simple client-side password gate.
// NOTE: this only keeps casual visitors and search engines out — anyone who
// views the page source and is determined enough can bypass it. Don't put
// anything truly sensitive behind it.

// This is the SHA-256 hash of the current password ("wedding2027").
// To change the password: open this site in a browser, open the console, and run
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourNewPassword'))
//     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
// then paste the printed value in below.
const PASSWORD_HASH = "f8402c371963457ff61a477e175d1203f30872fcf527f5f0ce952aaff3f06532";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// After unlocking, send first-time visitors to the language-select page.
// Once a language is chosen it's remembered for the rest of the session, so
// this only interrupts the very first page load after entering the password.
function maybeRedirectToLanguageSelect() {
  const lang = sessionStorage.getItem("wedding_lang");
  const onLanguagePage = /language\.html$/.test(window.location.pathname);
  if (!lang && !onLanguagePage) {
    window.location.href = "language.html";
  }
}

function buildGate() {
  const gate = document.createElement("div");
  gate.id = "gate";
  gate.innerHTML = `
    <div class="box">
      <h1>This page is private</h1>
      <p>Enter the password from the invite to continue.</p>
      <form id="gate-form">
        <input type="password" id="gate-input" autocomplete="off" autofocus />
        <button type="submit">Enter</button>
        <div class="error" id="gate-error"></div>
      </form>
    </div>`;
  document.body.prepend(gate);

  document.getElementById("gate-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = document.getElementById("gate-input").value;
    const hash = await sha256(value);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem("wedding_unlocked", "true");
      document.body.classList.remove("locked");
      gate.remove();
      maybeRedirectToLanguageSelect();
    } else {
      document.getElementById("gate-error").textContent = "That's not it — try again.";
    }
  });
}

if (sessionStorage.getItem("wedding_unlocked") !== "true") {
  document.body.classList.add("locked");
  document.addEventListener("DOMContentLoaded", buildGate);
} else {
  maybeRedirectToLanguageSelect();
}

const menuToggle = document.querySelector("#menu-toggle");
const mainNav = document.querySelector("#main-nav");
const toastElement = document.querySelector("#toast");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

window.setTimeout(() => document.body.classList.remove("page-entering"), 280);

window.addEventListener("pageshow", () => {
  document.body.classList.remove("page-leaving");
});

function showSiteToast(message) {
  if (!toastElement) return;
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  window.clearTimeout(showSiteToast.timeout);
  showSiteToast.timeout = window.setTimeout(() => toastElement.classList.remove("visible"), 2600);
}

function setMenuOpen(open) {
  mainNav?.classList.toggle("open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));
}

menuToggle?.addEventListener("click", () => {
  setMenuOpen(!mainNav.classList.contains("open"));
});

mainNav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenuOpen(false);
});

window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
  if (event.matches) setMenuOpen(false);
});

document.querySelectorAll(".nav-soon").forEach((button) => {
  button.addEventListener("click", () => {
    showSiteToast(`${button.dataset.soon} será construída na próxima etapa.`);
    mainNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link || event.defaultPrevented || event.button !== 0) return;
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (link.target === "_blank" || link.hasAttribute("download")) return;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin) return;
  if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.hash) return;
  if (reducedMotion.matches) return;

  event.preventDefault();
  document.body.classList.add("page-leaving");
  window.setTimeout(() => {
    window.location.href = destination.href;
  }, 110);
});

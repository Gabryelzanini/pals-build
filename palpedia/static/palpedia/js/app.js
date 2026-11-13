const DATA_URL = "https://www.palworldonline.net/assets/palworld-encyclopedia-1.0.4.json";
const LOCALE_URL = "https://raw.githubusercontent.com/GGarnize/palworld-knowledge/main/data/pals.json";
const PAL_IMAGE_BASE = "https://palworld.gg/images/full_palicon";
const LEGACY_IMAGE_BASE = "https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/public/images/paldeck";

const ELEMENTS = {
  ice: { label: "Gelo", iconUrl: "/static/images/icons/elements/ice48.png" },
  dark: { label: "Sombrio", iconUrl: "/static/images/icons/elements/dark48.png" },
  dragon: { label: "Dragão", iconUrl: "/static/images/icons/elements/dragon48.png" },
  ground: { label: "Terra", iconUrl: "/static/images/icons/elements/ground48.png" },
  grass: { label: "Folha", iconUrl: "/static/images/icons/elements/grass48.png" },
  electric: { label: "Elétrico", iconUrl: "/static/images/icons/elements/electric48.png" },
  water: { label: "Água", iconUrl: "/static/images/icons/elements/water48.png" },
  fire: { label: "Fogo", iconUrl: "/static/images/icons/elements/fire48.png" },
  normal: { label: "Normal", iconUrl: "/static/images/icons/elements/neutral48.png" },
};

const WORKS = {
  gathering: { label: "Coleta", iconUrl: "/static/images/icons/works/collection32.png" },
  cooling: { label: "Resfriamento", iconUrl: "/static/images/icons/works/cool32.png" },
  lumbering: { label: "Desmatamento", iconUrl: "/static/images/icons/works/deforest32.png" },
  kindling: { label: "Acendimento", iconUrl: "/static/images/icons/works/emitFlame32.png" },
  generatingElectricity: { label: "Geração de eletricidade", iconUrl: "/static/images/icons/works/generateElectricity32.png" },
  handiwork: { label: "Trabalho manual", iconUrl: "/static/images/icons/works/handcraft32.png" },
  mining: { label: "Mineração", iconUrl: "/static/images/icons/works/mining32.png" },
  farming: { label: "Agricultura", iconUrl: "/static/images/icons/works/monsterFarm32.png" },
  medicineProduction: { label: "Produção de medicamentos", iconUrl: "/static/images/icons/works/productMedicine32.png" },
  planting: { label: "Plantio", iconUrl: "/static/images/icons/works/seeding32.png" },
  transporting: { label: "Transporte", iconUrl: "/static/images/icons/works/transport32.png" },
  watering: { label: "Rega", iconUrl: "/static/images/icons/works/watering32.png" },
};

const COLLECTIONS = {
  terraria: { label: "Terraria", iconUrl: "/static/images/icons/collections/terraria.png" },
};

const FALLBACK_PALS = [
  ["Lamball", "Lamball", "1", "SheepBall", ["normal"], 1, { handiwork: 1, transporting: 1, farming: 1 }, 70, 70, 70],
  ["Cattiva", "Cattiva", "2", "PinkCat", ["normal"], 1, { handiwork: 1, transporting: 1, gathering: 1, mining: 1 }, 70, 70, 70],
  ["Chikipi", "Chikipi", "3", "ChickenPal", ["normal"], 1, { gathering: 1, farming: 1 }, 60, 60, 60],
  ["Lifmunk", "Lifmunk", "4", "Carbunclo", ["grass"], 1, { planting: 1, handiwork: 1, lumbering: 1, medicineProduction: 1, gathering: 1 }, 75, 70, 70],
  ["Fuack", "Fuack", "5", "Kamo", ["water"], 1, { watering: 1, handiwork: 1, transporting: 1 }, 60, 80, 60],
  ["Foxparks", "Foxparks", "29", "Kitsunebi", ["fire"], 1, { kindling: 1 }, 65, 75, 70],
  ["Pengullet", "Pengullet", "10", "Penguin", ["water", "ice"], 1, { watering: 1, cooling: 1, handiwork: 1, transporting: 1 }, 70, 75, 70],
  ["Direhowl", "Direhowl", "33", "Garm", ["normal"], 2, { gathering: 1 }, 80, 95, 75],
  ["Dinossom", "Dinossom", "84", "FlowerDinosaur", ["grass", "dragon"], 6, { planting: 3, lumbering: 3 }, 110, 90, 90],
  ["Anubis", "Anubis", "139", "Anubis", ["ground"], 10, { handiwork: 6, mining: 6, transporting: 4 }, 120, 130, 100],
  ["Jetragon", "Jetragon", "202", "JetDragon", ["dragon"], 20, { gathering: 8 }, 110, 140, 110],
  ["Bellanoir", "Bellanoir", "195", "NightLady", ["dark"], 20, { handiwork: 5, medicineProduction: 5, transporting: 4 }, 120, 150, 110],
].map(([name, namePt, paldeckNumber, internalId, elements, rarity, workSuitability, hp, attack, defense]) => ({
  name,
  namePt,
  paldeckNumber,
  internalId,
  elements,
  rarity,
  workSuitability,
  stats: { hp, shotAttack: attack, defense, support: 100, stamina: 100 },
  partnerSkill: { name: "Habilidade de parceiro" },
  flags: {},
}));

const state = {
  pals: [],
  query: "",
  element: null,
  work: null,
  collection: null,
  rarity: "all",
  sort: "dex",
  visible: 30,
};

const dom = {
  grid: document.querySelector("#pal-grid"),
  count: document.querySelector("#result-count"),
  search: document.querySelector("#search-input"),
  rarity: document.querySelector("#rarity-select"),
  sort: document.querySelector("#sort-select"),
  elementFilters: document.querySelector("#element-filters"),
  workFilters: document.querySelector("#work-filters"),
  collectionFilters: document.querySelector("#collection-filters"),
  activeRow: document.querySelector("#active-filter-row"),
  activeLabel: document.querySelector("#active-filter-label"),
  empty: document.querySelector("#empty-state"),
  loadWrap: document.querySelector("#load-more-wrap"),
  loadMore: document.querySelector("#load-more"),
  toast: document.querySelector("#toast"),
};

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toPalSlug(value = "") {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rarityInfo(value) {
  if (Number(value) >= 20) return { key: "legendary", label: "Lendário", accent: "#f07322" };
  if (Number(value) >= 8) return { key: "epic", label: "Épico", accent: "#9a43f7" };
  if (Number(value) >= 5) return { key: "rare", label: "Raro", accent: "#2d7ff9" };
  return { key: "common", label: "Comum", accent: "#93a4bb" };
}

function dexValue(value) {
  if (value === null || value === undefined || value === "" || Number(value) < 0) return 9999;
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : 9999;
}

function formatDex(value) {
  if (value === null || value === undefined || value === "" || Number(value) < 0) return "Collab";
  const raw = String(value).toUpperCase();
  const match = raw.match(/^(\d+)(.*)$/);
  return match ? `#${match[1].padStart(3, "0")}${match[2]}` : raw;
}

function isTerrariaPal(pal) {
  return pal.paldeckNumber === null || pal.paldeckNumber === undefined || pal.paldeckNumber === "" || Number(pal.paldeckNumber) < 0;
}

function bestWork(pal) {
  return Math.max(0, ...Object.values(pal.workSuitability || {}).map(Number));
}

function catalogIconMarkup(item, className = "catalog-icon") {
  if (item?.iconUrl) return `<img class="${className}" src="${item.iconUrl}" alt="" loading="lazy" />`;
  return `<span class="catalog-icon-fallback" aria-hidden="true">${item?.icon || "•"}</span>`;
}

function getImageUrl(pal) {
  return pal.internalId ? `${PAL_IMAGE_BASE}/T_${pal.internalId}_icon_normal.png` : "";
}

function getLegacyImageUrl(pal) {
  const raw = String(pal.paldeckNumber || "");
  if (!/^\d+$/.test(raw) || Number(raw) > 137) return "";
  return `${LEGACY_IMAGE_BASE}/${raw.padStart(3, "0")}.png`;
}

function setImageFallback(image, pal, large = false) {
  const legacy = getLegacyImageUrl(pal);
  if (legacy && image.dataset.fallbackAttempted !== "true") {
    image.dataset.fallbackAttempted = "true";
    image.src = legacy;
    return;
  }
  const fallback = document.createElement("span");
  fallback.className = "portrait-fallback";
  fallback.textContent = (pal.namePt || pal.name || "?").slice(0, large ? 2 : 1).toUpperCase();
  image.replaceWith(fallback);
}

function createImage(pal, large = false) {
  const image = document.createElement("img");
  image.src = getImageUrl(pal) || getLegacyImageUrl(pal);
  image.alt = pal.namePt || pal.name;
  image.loading = large ? "eager" : "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => setImageFallback(image, pal, large));
  return image;
}

function renderFilterButtons(target, items, type) {
  target.innerHTML = "";
  Object.entries(items).forEach(([key, item]) => {
    const button = document.createElement("button");
    button.className = "filter-chip";
    button.type = "button";
    button.dataset.value = key;
    button.dataset.filterType = type;
    button.dataset.label = item.label;
    button.setAttribute("aria-label", item.label);
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<span aria-hidden="true">${catalogIconMarkup(item, "filter-icon-image")}</span>`;
    button.addEventListener("click", () => {
      state[type] = state[type] === key ? null : key;
      state.visible = 30;
      updateFilterButtons();
      render();
    });
    target.appendChild(button);
  });
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-chip").forEach((button) => {
    const parentType = button.dataset.filterType;
    const active = state[parentType] === button.dataset.value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function filteredPals() {
  const query = normalize(state.query);
  const result = state.pals.filter((pal) => {
    const rarity = rarityInfo(pal.rarity).key;
    const searchText = normalize(`${pal.namePt} ${pal.name} ${pal.paldeckNumber}`);
    return (
      (!query || searchText.includes(query)) &&
      (!state.element || pal.elements?.includes(state.element)) &&
      (!state.work || Number(pal.workSuitability?.[state.work] || 0) > 0) &&
      (!state.collection || (state.collection === "terraria" && isTerrariaPal(pal))) &&
      (state.rarity === "all" || rarity === state.rarity)
    );
  });

  return result.sort((a, b) => {
    if (state.sort === "name") return (a.namePt || a.name).localeCompare(b.namePt || b.name, "pt-BR");
    if (state.sort === "rarity") return Number(b.rarity) - Number(a.rarity) || dexValue(a.paldeckNumber) - dexValue(b.paldeckNumber);
    if (state.sort === "work") return bestWork(b) - bestWork(a) || dexValue(a.paldeckNumber) - dexValue(b.paldeckNumber);
    return dexValue(a.paldeckNumber) - dexValue(b.paldeckNumber) || String(a.paldeckNumber).localeCompare(String(b.paldeckNumber));
  });
}

function createCard(pal) {
  const rarity = rarityInfo(pal.rarity);
  const card = document.createElement("a");
  card.className = `pal-card ${rarity.key}`;
  card.href = `/palpedia/${toPalSlug(pal.name)}/`;
  card.setAttribute("aria-label", `Ver detalhes de ${pal.namePt || pal.name}`);

  const top = document.createElement("div");
  top.className = "card-top";
  top.innerHTML = `
    <div class="element-stack">${(pal.elements || []).map((element) => `<span class="element-dot" title="${ELEMENTS[element]?.label || element}">${catalogIconMarkup(ELEMENTS[element], "element-icon-image")}</span>`).join("")}</div>
    <span class="work-count" title="Melhor nível de trabalho"><span aria-hidden="true">⚒</span><strong>${bestWork(pal)}</strong></span>
  `;

  const portrait = document.createElement("div");
  portrait.className = "pal-portrait";
  portrait.appendChild(createImage(pal));

  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = `
    <div class="pal-name-row">
      <h2 class="pal-name">${escapeHtml(pal.namePt || pal.name)}</h2>
      <span class="pal-number">${formatDex(pal.paldeckNumber)}</span>
    </div>
    <p class="element-names">${(pal.elements || []).map((element) => ELEMENTS[element]?.label || element).join(" · ") || "Sem elemento"}</p>
    <div class="rarity-pill">
      <span class="rarity-value">${Number(pal.rarity) || 0}</span>
      <span class="rarity-name">${rarity.label}</span>
    </div>
  `;

  card.append(top, portrait, body);
  return card;
}

function render() {
  const pals = filteredPals();
  const visible = pals.slice(0, state.visible);
  dom.grid.setAttribute("aria-busy", "true");
  dom.grid.innerHTML = "";
  const fragment = document.createDocumentFragment();
  visible.forEach((pal) => fragment.appendChild(createCard(pal)));
  dom.grid.appendChild(fragment);
  dom.grid.setAttribute("aria-busy", "false");

  dom.count.textContent = `${pals.length} / ${state.pals.length} Pals`;
  dom.empty.hidden = pals.length !== 0;
  dom.grid.hidden = pals.length === 0;
  dom.loadWrap.hidden = pals.length <= state.visible;
  if (pals.length > state.visible) dom.loadMore.textContent = `Mostrar mais ${Math.min(30, pals.length - state.visible)} Pals`;

  const filterLabels = [];
  if (state.query) filterLabels.push(`busca “${state.query}”`);
  if (state.element) filterLabels.push(`elemento ${ELEMENTS[state.element]?.label}`);
  if (state.work) filterLabels.push(`trabalho ${WORKS[state.work]?.label}`);
  if (state.collection) filterLabels.push(`coleção ${COLLECTIONS[state.collection]?.label}`);
  if (state.rarity !== "all") filterLabels.push(`raridade ${rarityInfo({ common: 1, rare: 5, epic: 8, legendary: 20 }[state.rarity]).label}`);
  dom.activeRow.hidden = filterLabels.length === 0;
  dom.activeLabel.textContent = filterLabels.length ? `Filtros ativos: ${filterLabels.join(" · ")}` : "";
}

function showSkeletons() {
  dom.grid.innerHTML = Array.from({ length: 15 }, () => '<div class="skeleton-card" aria-hidden="true"><span></span><span></span><span></span></div>').join("");
}

function clearFilters() {
  state.query = "";
  state.element = null;
  state.work = null;
  state.collection = null;
  state.rarity = "all";
  state.visible = 30;
  dom.search.value = "";
  dom.rarity.value = "all";
  updateFilterButtons();
  render();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function toast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("visible");
  window.clearTimeout(toast.timeout);
  toast.timeout = window.setTimeout(() => dom.toast.classList.remove("visible"), 2600);
}

function enrichPals(rawPals, localeRows) {
  const byEnglishName = new Map();
  const byId = new Map();
  localeRows.forEach((row) => {
    const english = normalize(row.name?.enUS);
    if (english && !byEnglishName.has(english)) byEnglishName.set(english, row);
    [row.id, row.tribe, row.source?.row].filter(Boolean).forEach((id) => byId.set(normalize(id), row));
  });

  return rawPals
    .filter((pal) => pal?.name)
    .map((pal) => {
      const direct = byEnglishName.get(normalize(pal.name));
      const idMatch = byId.get(normalize(pal.ids?.palpedia));
      // O ID interno distingue variantes que podem compartilhar o mesmo nome.
      // O nome fica apenas como fallback para registros legados.
      const localized = idMatch || direct;
      return {
        ...pal,
        namePt: localized?.name?.ptBR || pal.name,
        internalId: localized?.tribe || localized?.id || "",
      };
    });
}

async function fetchJson(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: "force-cache", headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ao consultar ${url}`);
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error(`Tempo esgotado ao consultar ${url}`);
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function loadData() {
  showSkeletons();
  renderFilterButtons(dom.elementFilters, ELEMENTS, "element");
  renderFilterButtons(dom.workFilters, WORKS, "work");
  renderFilterButtons(dom.collectionFilters, COLLECTIONS, "collection");

  try {
    const [databaseResult, localeResult] = await Promise.allSettled([fetchJson(DATA_URL), fetchJson(LOCALE_URL)]);
    if (databaseResult.status !== "fulfilled" || !Array.isArray(databaseResult.value?.pals)) throw new Error("Base principal indisponível");

    const localeRows = localeResult.status === "fulfilled" && Array.isArray(localeResult.value) ? localeResult.value : [];
    state.pals = enrichPals(databaseResult.value.pals, localeRows);
  } catch (error) {
    console.warn("Usando dados locais de contingência:", error);
    state.pals = FALLBACK_PALS;
    toast("A fonte externa está indisponível. Exibindo uma amostra local.");
  }
  render();
}

dom.search.addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  state.visible = 30;
  render();
});
dom.rarity.addEventListener("change", (event) => {
  state.rarity = event.target.value;
  state.visible = 30;
  render();
});
dom.sort.addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});
dom.loadMore.addEventListener("click", () => {
  state.visible += 30;
  render();
});
document.querySelector("#clear-filters").addEventListener("click", clearFilters);
document.querySelector("#empty-clear").addEventListener("click", clearFilters);
document.querySelector("#scroll-top").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

loadData();

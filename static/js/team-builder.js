const TEAM_DATA_URL = "https://www.palworldonline.net/assets/palworld-encyclopedia-1.0.4.json";
const TEAM_LOCALE_URL = "https://raw.githubusercontent.com/GGarnize/palworld-knowledge/main/data/pals.json";
const TEAM_PARTNER_PT_URL = "/api/partner-skills/";
const TEAM_PAL_CONTENT_BASE = "/api/pal-content";
const TEAM_PARTNER_FALLBACK_URL = "https://raw.githubusercontent.com/MagitekZed/palworld-helper/main/data/pals_partner_skills.json";
const TEAM_IMAGE_BASE = "https://palworld.gg/images/full_palicon";
const TEAM_LEGACY_IMAGE_BASE = "https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/public/images/paldeck";
const TEAM_STORAGE_KEY = "palsbuild-team-v1";
const TEAM_LIMIT = 6;

const TEAM_ELEMENTS = {
  ice: { label: "Gelo", iconUrl: "/static/images/icons/elements/ice128.png" },
  dark: { label: "Sombrio", iconUrl: "/static/images/icons/elements/dark128.png" },
  dragon: { label: "Dragão", iconUrl: "/static/images/icons/elements/dragon128.png" },
  ground: { label: "Terra", iconUrl: "/static/images/icons/elements/ground128.png" },
  grass: { label: "Folha", iconUrl: "/static/images/icons/elements/grass128.png" },
  electric: { label: "Elétrico", iconUrl: "/static/images/icons/elements/electric128.png" },
  water: { label: "Água", iconUrl: "/static/images/icons/elements/water128.png" },
  fire: { label: "Fogo", iconUrl: "/static/images/icons/elements/fire128.png" },
  normal: { label: "Normal", iconUrl: "/static/images/icons/elements/neutral128.png" },
};

const TEAM_ELEMENT_ADVANTAGES = {
  normal: [],
  fire: ["grass", "ice"],
  water: ["fire"],
  electric: ["water"],
  ground: ["electric"],
  grass: ["ground"],
  ice: ["dragon"],
  dragon: ["dark"],
  dark: ["normal"],
};

const TEAM_WORKS = {
  gathering: { label: "Coleta", iconUrl: "/static/images/icons/works/collection128.png" },
  cooling: { label: "Resfriamento", iconUrl: "/static/images/icons/works/cool128.png" },
  lumbering: { label: "Desmatamento", iconUrl: "/static/images/icons/works/deforest128.png" },
  kindling: { label: "Acendimento", iconUrl: "/static/images/icons/works/emitFlame128.png" },
  generatingElectricity: { label: "Geração de eletricidade", iconUrl: "/static/images/icons/works/generateElectricity128.png" },
  handiwork: { label: "Trabalho manual", iconUrl: "/static/images/icons/works/handcraft128.png" },
  mining: { label: "Mineração", iconUrl: "/static/images/icons/works/mining128.png" },
  farming: { label: "Agricultura", iconUrl: "/static/images/icons/works/monsterFarm128.png" },
  medicineProduction: { label: "Produção de medicamentos", iconUrl: "/static/images/icons/works/productMedicine128.png" },
  planting: { label: "Plantio", iconUrl: "/static/images/icons/works/seeding128.png" },
  transporting: { label: "Transporte", iconUrl: "/static/images/icons/works/transport128.png" },
  watering: { label: "Rega", iconUrl: "/static/images/icons/works/watering128.png" },
};

const TEAM_FALLBACK_PALS = [
  ["Lamball", "1", "SheepBall", ["normal"], { handiwork: 1, transporting: 1, farming: 1 }],
  ["Cattiva", "2", "PinkCat", ["normal"], { handiwork: 1, transporting: 1, gathering: 1, mining: 1 }],
  ["Chikipi", "3", "ChickenPal", ["normal"], { gathering: 1, farming: 1 }],
  ["Lifmunk", "4", "Carbunclo", ["grass"], { planting: 1, handiwork: 1, lumbering: 1, medicineProduction: 1, gathering: 1 }],
  ["Fuack", "5", "Kamo", ["water"], { watering: 1, handiwork: 1, transporting: 1 }],
  ["Foxparks", "29", "Kitsunebi", ["fire"], { kindling: 1 }],
  ["Pengullet", "10", "Penguin", ["water", "ice"], { watering: 1, cooling: 1, handiwork: 1, transporting: 1 }],
  ["Direhowl", "33", "Garm", ["normal"], { gathering: 1 }],
  ["Dinossom", "84", "FlowerDinosaur", ["grass", "dragon"], { planting: 3, lumbering: 3 }],
  ["Anubis", "139", "Anubis", ["ground"], { handiwork: 6, mining: 6, transporting: 4 }],
  ["Jetragon", "202", "JetDragon", ["dragon"], { gathering: 8 }],
  ["Bellanoir", "195", "NightLady", ["dark"], { handiwork: 5, medicineProduction: 5, transporting: 4 }],
].map(([name, paldeckNumber, internalId, elements, workSuitability]) => ({
  name,
  namePt: name,
  paldeckNumber,
  internalId,
  elements,
  workSuitability,
  teamKey: internalId,
  rarity: 1,
}));

const teamState = {
  pals: [],
  teamKeys: [],
  query: "",
  element: "all",
};

const teamDom = {
  slots: document.querySelector("#team-slots"),
  count: document.querySelector("#team-count"),
  clear: document.querySelector("#clear-team"),
  summary: document.querySelector("#team-summary"),
  summaryEmpty: document.querySelector("#team-summary-empty"),
  effectChips: document.querySelector("#team-effect-chips"),
  effectMetrics: document.querySelector("#team-effect-metrics"),
  effectiveElements: document.querySelector("#team-effective-elements"),
  threatElements: document.querySelector("#team-threat-elements"),
  partnerCount: document.querySelector("#team-partner-count"),
  partnerList: document.querySelector("#team-partner-list"),
  elementSummary: document.querySelector("#team-element-summary"),
  workSummary: document.querySelector("#team-work-summary"),
  catalogPanel: document.querySelector(".team-catalog"),
  catalog: document.querySelector("#team-catalog-list"),
  catalogEmpty: document.querySelector("#team-catalog-empty"),
  resultCount: document.querySelector("#team-result-count"),
  search: document.querySelector("#team-search-input"),
  elementFilter: document.querySelector("#team-element-filter"),
  toast: document.querySelector("#toast"),
};

function teamNormalize(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function teamSlug(value = "") {
  return teamNormalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function teamEscape(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function teamDexValue(value) {
  if (value === null || value === undefined || value === "" || Number(value) < 0) return 9999;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 9999;
}

function teamFormatDex(value) {
  if (value === null || value === undefined || value === "" || Number(value) < 0) return "Collab";
  const raw = String(value).toUpperCase();
  const match = raw.match(/^(\d+)(.*)$/);
  return match ? `#${match[1].padStart(3, "0")}${match[2]}` : raw;
}

function teamRarityAccent(value) {
  if (Number(value) >= 20) return "#f07322";
  if (Number(value) >= 8) return "#9a43f7";
  if (Number(value) >= 5) return "#2d7ff9";
  return "#93a4bb";
}

function teamIcon(item, className = "team-summary-icon") {
  return item?.iconUrl ? `<img class="${className}" src="${item.iconUrl}" alt="" />` : "";
}

function teamElementMatchups(elements = []) {
  const strong = new Set();
  const weak = new Set();
  elements.forEach((element) => {
    (TEAM_ELEMENT_ADVANTAGES[element] || []).forEach((target) => strong.add(target));
    Object.entries(TEAM_ELEMENT_ADVANTAGES).forEach(([attacker, targets]) => {
      if (targets.includes(element)) weak.add(attacker);
    });
  });
  return { strong: [...strong], weak: [...weak] };
}

function teamMatchupListMarkup(entries, emptyMessage) {
  if (!entries.length) return `<span class="team-matchup-empty">${teamEscape(emptyMessage)}</span>`;
  return entries.map(([element, count]) => `
    <span title="${teamEscape(TEAM_ELEMENTS[element]?.label || element)}">
      ${teamIcon(TEAM_ELEMENTS[element], "team-matchup-icon")}
      <strong>${teamEscape(TEAM_ELEMENTS[element]?.label || element)}</strong>
      ${count > 1 ? `<small>×${count}</small>` : ""}
    </span>`).join("");
}

function teamImageUrl(pal) {
  return pal.internalId ? `${TEAM_IMAGE_BASE}/T_${pal.internalId}_icon_normal.png` : "";
}

function teamLegacyImageUrl(pal) {
  const raw = String(pal.paldeckNumber || "");
  return /^\d+$/.test(raw) && Number(raw) <= 137 ? `${TEAM_LEGACY_IMAGE_BASE}/${raw.padStart(3, "0")}.png` : "";
}

function createTeamImage(pal) {
  const image = document.createElement("img");
  image.src = teamImageUrl(pal) || teamLegacyImageUrl(pal);
  image.alt = pal.namePt || pal.name;
  image.loading = "lazy";
  image.decoding = "async";
  image.draggable = false;
  image.addEventListener("error", () => {
    const legacy = teamLegacyImageUrl(pal);
    if (legacy && image.dataset.fallback !== "true") {
      image.dataset.fallback = "true";
      image.src = legacy;
      return;
    }
    const fallback = document.createElement("span");
    fallback.className = "team-image-fallback";
    fallback.textContent = (pal.namePt || pal.name).slice(0, 2).toUpperCase();
    image.replaceWith(fallback);
  });
  return image;
}

function findTeamPal(key) {
  return teamState.pals.find((pal) => pal.teamKey === key);
}

function currentTeam() {
  return teamState.teamKeys.map(findTeamPal).filter(Boolean);
}

function showTeamToast(message) {
  if (!teamDom.toast) return;
  teamDom.toast.textContent = message;
  teamDom.toast.classList.add("visible");
  window.clearTimeout(showTeamToast.timeout);
  showTeamToast.timeout = window.setTimeout(() => teamDom.toast.classList.remove("visible"), 2400);
}

function saveTeam() {
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teamState.teamKeys));
  } catch (error) {
    console.warn("Não foi possível salvar o time:", error);
    showTeamToast("Não foi possível salvar o time neste navegador.");
  }
}

function loadSavedTeam() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEAM_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return;
    teamState.teamKeys = saved.filter((key) => findTeamPal(key)).slice(0, TEAM_LIMIT);
  } catch (error) {
    console.warn("Time salvo inválido:", error);
  }
}

function renderTeamSlots() {
  teamDom.slots.setAttribute("aria-busy", "true");
  teamDom.slots.innerHTML = "";
  const team = currentTeam();

  for (let index = 0; index < TEAM_LIMIT; index += 1) {
    const pal = team[index];
    if (!pal) {
      const empty = document.createElement("div");
      empty.className = "team-slot team-slot-empty";
      empty.dataset.teamIndex = String(index);
      empty.innerHTML = `<button class="team-add-guide-button" type="button" data-team-action="catalog" data-team-index="${index}" aria-label="Ir para Adicionar Pals">+</button><span class="team-slot-position">Slot ${index + 1}</span><strong>Espaço livre</strong><small>Adicione um Pal pelo catálogo</small>`;
      teamDom.slots.appendChild(empty);
      continue;
    }

    const workEntries = Object.entries(pal.workSuitability || {})
      .filter(([, level]) => Number(level) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]));
    const baseStats = [
      ["HP", pal.stats?.hp],
      ["Ataque", pal.stats?.shotAttack],
      ["Defesa", pal.stats?.defense],
      ["Suporte", pal.stats?.support],
    ];
    const slot = document.createElement("article");
    slot.className = "team-slot team-slot-filled";
    slot.style.setProperty("--team-slot-accent", teamRarityAccent(pal.rarity));
    slot.innerHTML = `
      <button class="team-flip-button" type="button" data-team-action="flip" data-team-index="${index}" aria-label="Mostrar estatísticas de ${teamEscape(pal.namePt || pal.name)}" aria-pressed="false">?</button>
      <button class="team-remove" type="button" data-team-action="remove" data-team-index="${index}" aria-label="Remover ${teamEscape(pal.namePt)}">×</button>
      <div class="team-slot-flipper">
        <div class="team-slot-face team-slot-front">
          <a class="team-slot-portrait" href="/palpedia/${teamSlug(pal.name)}/" aria-label="Abrir página de ${teamEscape(pal.namePt)}" draggable="false"></a>
          <div class="team-slot-copy">
            <span>Slot ${index + 1} · ${teamFormatDex(pal.paldeckNumber)}</span>
            <h3>${teamEscape(pal.namePt || pal.name)}</h3>
            <div>${(pal.elements || []).map((element) => teamIcon(TEAM_ELEMENTS[element], "team-element-icon")).join("")}</div>
          </div>
          <button class="team-drag-handle" type="button" data-team-index="${index}" aria-label="Mover ${teamEscape(pal.namePt || pal.name)} com as setas do teclado">
            <span aria-hidden="true">⠿</span> Arraste o card
          </button>
        </div>
        <div class="team-slot-face team-slot-back" aria-hidden="true">
          <div class="team-slot-back-heading">
            <span>RESUMO BASE · SLOT ${index + 1}</span>
            <strong>${teamEscape(pal.namePt || pal.name)}</strong>
          </div>
          <div class="team-slot-stats">
            ${baseStats.map(([label, value]) => `<div><span>${label}</span><strong>${Number(value) || 0}</strong></div>`).join("")}
          </div>
          <div class="team-slot-works">
            <span>Aptidões</span>
            <div>${workEntries.length ? workEntries.map(([work, level]) => `<span title="${teamEscape(TEAM_WORKS[work]?.label || work)}">${teamIcon(TEAM_WORKS[work], "team-back-work-icon")}<strong>Lv ${Number(level) || 0}</strong></span>`).join("") : "<small>Nenhuma aptidão</small>"}</div>
          </div>
        </div>
      </div>
    `;
    slot.dataset.teamIndex = String(index);
    slot.querySelector(".team-slot-portrait").appendChild(createTeamImage(pal));
    teamDom.slots.appendChild(slot);
  }

  teamDom.count.textContent = `${team.length} / ${TEAM_LIMIT} Pals`;
  teamDom.clear.disabled = team.length === 0;
  teamDom.slots.setAttribute("aria-busy", "false");
}

function teamEffectCategories(pal) {
  const categories = new Set();
  const tags = new Set(pal.partnerEffect?.tags || []);
  const description = teamNormalize(`${pal.partnerEffect?.sourceDescription || ""} ${pal.partnerEffect?.description || ""} ${(pal.partnerSkill?.types || []).join(" ")}`);

  if (tags.has("mount") || /mount|ridden|montaria|montado|montar/.test(description)) categories.add("Montaria");
  if (tags.has("base") || tags.has("ranch") || /base|ranch|work suitability|fazenda|trabalho/.test(description)) categories.add("Base / Trabalho");
  if (/attack|damage|combat|weapon|ataque|dano|combate|arma/.test(description)) categories.add("Bônus de combate");
  if (/speed|dash|glid|double jump|move|veloc|planador|salto|desloc/.test(description)) categories.add("Mobilidade");
  if (/resist|defen|shield|less damage|immune|resist|defesa|escudo|imune|reduz/.test(description)) categories.add("Proteção");
  if (/carry|capacity|drop|item|mining|lumber|harvest|carga|capacidade|coleta|minera|madeira/.test(description)) categories.add("Utilidade");
  if (tags.has("active") && categories.size === 0) categories.add("Habilidade ativa");
  if (tags.has("party") && categories.size === 0) categories.add("Suporte em equipe");
  if (categories.size === 0) categories.add("Efeito especial");
  return [...categories];
}

function renderPartnerEffects(team) {
  teamDom.partnerList.innerHTML = "";
  teamDom.partnerCount.textContent = `${team.length} ${team.length === 1 ? "habilidade" : "habilidades"}`;

  team.forEach((pal) => {
    const effect = pal.partnerEffect || {
      skill: pal.partnerSkill?.name || "Habilidade de parceiro",
      description: "Descrição detalhada não disponível para este Pal.",
    };
    const categories = teamEffectCategories(pal);
    const card = document.createElement("article");
    card.className = "team-partner-card";
    card.innerHTML = `
      <a class="team-partner-portrait" href="/palpedia/${teamSlug(pal.name)}/" aria-label="Abrir página de ${teamEscape(pal.namePt || pal.name)}"></a>
      <div class="team-partner-copy">
        <div class="team-partner-title"><h4>${teamEscape(effect.skill)}</h4><a href="/palpedia/${teamSlug(pal.name)}/">${teamEscape(pal.namePt || pal.name)}</a></div>
        <p>${teamEscape(effect.description)}</p>
        <div class="team-partner-tags">${categories.map((category) => `<span>${teamEscape(category)}</span>`).join("")}</div>
      </div>`;
    card.querySelector(".team-partner-portrait").appendChild(createTeamImage(pal));
    teamDom.partnerList.appendChild(card);
  });
}

function renderTeamSummary() {
  const team = currentTeam();
  const hasTeam = team.length > 0;
  teamDom.summary.hidden = !hasTeam;
  teamDom.summaryEmpty.hidden = hasTeam;
  if (!hasTeam) return;

  const elements = new Map();
  const works = new Map();
  const effects = new Map();
  const effectiveElements = new Map();
  const threatElements = new Map();
  team.forEach((pal) => {
    (pal.elements || []).forEach((element) => elements.set(element, (elements.get(element) || 0) + 1));
    const matchups = teamElementMatchups(pal.elements || []);
    matchups.strong.forEach((element) => effectiveElements.set(element, (effectiveElements.get(element) || 0) + 1));
    matchups.weak.forEach((element) => threatElements.set(element, (threatElements.get(element) || 0) + 1));
    teamEffectCategories(pal).forEach((effect) => effects.set(effect, (effects.get(effect) || 0) + 1));
    Object.entries(pal.workSuitability || {}).forEach(([work, level]) => {
      const current = works.get(work) || { max: 0, count: 0 };
      works.set(work, { max: Math.max(current.max, Number(level) || 0), count: current.count + 1 });
    });
  });

  const totalAttack = team.reduce((total, pal) => total + (Number(pal.stats?.shotAttack) || 0), 0);
  const totalDefense = team.reduce((total, pal) => total + (Number(pal.stats?.defense) || 0), 0);
  const totalHp = team.reduce((total, pal) => total + (Number(pal.stats?.hp) || 0), 0);
  const mountCount = team.filter((pal) => teamEffectCategories(pal).includes("Montaria")).length;

  teamDom.effectChips.innerHTML = [...effects.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([effect, count]) => `<span>${teamEscape(effect)}${count > 1 ? ` <strong>×${count}</strong>` : ""}</span>`).join("");

  teamDom.effectMetrics.innerHTML = `
    <div><strong>${totalAttack}</strong><span>Ataque base</span></div>
    <div><strong>${totalDefense}</strong><span>Defesa base</span></div>
    <div><strong>${totalHp}</strong><span>HP base</span></div>
    <div><strong>${mountCount}</strong><span>${mountCount === 1 ? "Montaria" : "Montarias"}</span></div>
    <div class="team-metric-elements"><span>Elementos</span><div>${[...elements.keys()].map((element) => teamIcon(TEAM_ELEMENTS[element], "team-element-icon")).join("")}</div></div>`;

  const sortMatchups = (entries) => [...entries].sort((a, b) => b[1] - a[1] || (TEAM_ELEMENTS[a[0]]?.label || a[0]).localeCompare(TEAM_ELEMENTS[b[0]]?.label || b[0], "pt-BR"));
  teamDom.effectiveElements.innerHTML = teamMatchupListMarkup(sortMatchups(effectiveElements), "Sem vantagem elemental direta");
  teamDom.threatElements.innerHTML = teamMatchupListMarkup(sortMatchups(threatElements), "Sem fraqueza elemental registrada");

  renderPartnerEffects(team);

  teamDom.elementSummary.innerHTML = [...elements.entries()]
    .sort((a, b) => b[1] - a[1] || (TEAM_ELEMENTS[a[0]]?.label || a[0]).localeCompare(TEAM_ELEMENTS[b[0]]?.label || b[0], "pt-BR"))
    .map(([element, count]) => `<div>${teamIcon(TEAM_ELEMENTS[element])}<span>${teamEscape(TEAM_ELEMENTS[element]?.label || element)}</span><strong>${count}</strong></div>`).join("");

  teamDom.workSummary.innerHTML = [...works.entries()]
    .sort((a, b) => b[1].max - a[1].max || (TEAM_WORKS[a[0]]?.label || a[0]).localeCompare(TEAM_WORKS[b[0]]?.label || b[0], "pt-BR"))
    .map(([work, info]) => `<div>${teamIcon(TEAM_WORKS[work])}<span>${teamEscape(TEAM_WORKS[work]?.label || work)}</span><strong>Lv ${info.max}</strong><small>${info.count} ${info.count === 1 ? "Pal" : "Pals"}</small></div>`).join("");
}

function renderTeamCatalog() {
  const query = teamNormalize(teamState.query);
  const filtered = teamState.pals
    .filter((pal) => !query || teamNormalize(`${pal.namePt} ${pal.name} ${pal.paldeckNumber}`).includes(query))
    .filter((pal) => teamState.element === "all" || (pal.elements || []).includes(teamState.element))
    .sort((a, b) => teamDexValue(a.paldeckNumber) - teamDexValue(b.paldeckNumber) || (a.namePt || a.name).localeCompare(b.namePt || b.name, "pt-BR"));

  teamDom.catalog.setAttribute("aria-busy", "true");
  teamDom.catalog.innerHTML = "";
  teamDom.catalog.hidden = filtered.length === 0;
  teamDom.catalogEmpty.hidden = filtered.length > 0;
  teamDom.resultCount.textContent = `${filtered.length} Pals`;
  const full = teamState.teamKeys.length >= TEAM_LIMIT;

  const fragment = document.createDocumentFragment();
  filtered.forEach((pal) => {
    const card = document.createElement("article");
    card.className = "team-catalog-card";
    card.style.setProperty("--team-card-accent", teamRarityAccent(pal.rarity));
    card.innerHTML = `
      <a class="team-catalog-portrait" href="/palpedia/${teamSlug(pal.name)}/" aria-label="Abrir página de ${teamEscape(pal.namePt)}"></a>
      <div class="team-catalog-copy">
        <span>${teamFormatDex(pal.paldeckNumber)}</span>
        <h3>${teamEscape(pal.namePt || pal.name)}</h3>
        <div>${(pal.elements || []).map((element) => `${teamIcon(TEAM_ELEMENTS[element], "team-element-icon")}<small>${teamEscape(TEAM_ELEMENTS[element]?.label || element)}</small>`).join("")}</div>
      </div>
      <button type="button" data-add-pal="${teamEscape(pal.teamKey)}" aria-label="${full ? `Time cheio; não é possível adicionar ${teamEscape(pal.namePt || pal.name)}` : `Adicionar ${teamEscape(pal.namePt || pal.name)} ao time`}" ${full ? "disabled" : ""}>${full ? "Time cheio" : "Adicionar"}</button>`;
    card.querySelector(".team-catalog-portrait").appendChild(createTeamImage(pal));
    fragment.appendChild(card);
  });
  teamDom.catalog.appendChild(fragment);

  teamDom.catalog.setAttribute("aria-busy", "false");
}

function renderTeamBuilder() {
  renderTeamSlots();
  renderTeamSummary();
  renderTeamCatalog();
}

function guideToTeamCatalog() {
  const panel = teamDom.catalogPanel;
  if (!panel) return;
  window.clearTimeout(guideToTeamCatalog.timeout);
  panel.classList.remove("is-guided");
  void panel.offsetWidth;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const panelRect = panel.getBoundingClientRect();
  const catalogHeadingIsVisible = panelRect.top >= 70 && panelRect.top < window.innerHeight - 120;
  if (!catalogHeadingIsVisible) panel.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  panel.classList.add("is-guided");
  guideToTeamCatalog.timeout = window.setTimeout(() => panel.classList.remove("is-guided"), 2100);
}

function addPalToTeam(key) {
  if (teamState.teamKeys.length >= TEAM_LIMIT) {
    showTeamToast("Seu time já possui seis Pals.");
    return;
  }
  if (!findTeamPal(key)) return;
  teamState.teamKeys.push(key);
  saveTeam();
  renderTeamBuilder();
  refreshTeamPartnerContent();
}

function moveTeamPal(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= teamState.teamKeys.length) return;
  moveTeamPalTo(index, target);
}

function moveTeamPalTo(source, target) {
  if (source === target || source < 0 || source >= teamState.teamKeys.length) return;
  const safeTarget = Math.max(0, Math.min(target, teamState.teamKeys.length - 1));
  const movedPal = findTeamPal(teamState.teamKeys[source]);
  const [palKey] = teamState.teamKeys.splice(source, 1);
  teamState.teamKeys.splice(safeTarget, 0, palKey);
  saveTeam();
  renderTeamBuilder();
  showTeamToast(`${movedPal?.namePt || movedPal?.name || "Pal"} movido para a posição ${safeTarget + 1}.`);
}

let activeTeamDrag = null;
let suppressTeamSlotClick = false;

function activateTeamDrag(event) {
  if (!activeTeamDrag || activeTeamDrag.active) return;
  const { slot, rect } = activeTeamDrag;
  const ghost = slot.cloneNode(true);
  ghost.classList.add("team-drag-ghost");
  ghost.querySelectorAll("a, button").forEach((element) => element.setAttribute("tabindex", "-1"));
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  document.body.appendChild(ghost);

  activeTeamDrag.active = true;
  activeTeamDrag.ghost = ghost;
  slot.classList.add("is-drag-source");
  document.body.classList.add("team-dragging");
  if (navigator.vibrate) navigator.vibrate(25);
  updateTeamDrag(event);
}

function updateTeamDrag(event) {
  if (!activeTeamDrag?.active) return;
  const { ghost, offsetX, offsetY } = activeTeamDrag;
  ghost.style.left = `${event.clientX - offsetX}px`;
  ghost.style.top = `${event.clientY - offsetY}px`;

  document.querySelectorAll(".team-slot.is-drop-target").forEach((slot) => slot.classList.remove("is-drop-target"));
  const targetSlot = document.elementFromPoint(event.clientX, event.clientY)?.closest(".team-slot[data-team-index]");
  if (!targetSlot) {
    activeTeamDrag.targetIndex = activeTeamDrag.sourceIndex;
    return;
  }
  activeTeamDrag.targetIndex = Math.min(Number(targetSlot.dataset.teamIndex), teamState.teamKeys.length - 1);
  targetSlot.classList.add("is-drop-target");
}

function finishTeamDrag(event, cancelled = false) {
  if (!activeTeamDrag) return;
  window.clearTimeout(activeTeamDrag.holdTimer);
  const drag = activeTeamDrag;
  activeTeamDrag = null;

  try {
    drag.handle.releasePointerCapture(event.pointerId);
  } catch (error) {
    // A captura pode já ter sido liberada pelo navegador.
  }

  drag.ghost?.remove();
  drag.slot.classList.remove("is-drag-source");
  document.querySelectorAll(".team-slot.is-drop-target").forEach((slot) => slot.classList.remove("is-drop-target"));
  document.body.classList.remove("team-dragging");

  if (drag.active) {
    suppressTeamSlotClick = true;
    window.setTimeout(() => { suppressTeamSlotClick = false; }, 0);
  }

  if (!cancelled && drag.active && drag.targetIndex !== drag.sourceIndex) {
    moveTeamPalTo(drag.sourceIndex, drag.targetIndex);
  }
}

function enrichTeamPals(rawPals, localeRows, partnerSkillsPt = {}, partnerSkillsFallback = {}) {
  const byEnglishName = new Map();
  const byId = new Map();
  localeRows.forEach((row) => {
    const english = teamNormalize(row.name?.enUS);
    if (english && !byEnglishName.has(english)) byEnglishName.set(english, row);
    [row.id, row.tribe, row.source?.row].filter(Boolean).forEach((id) => byId.set(teamNormalize(id), row));
  });

  return rawPals.filter((pal) => pal?.name).map((pal) => {
    const localized = byId.get(teamNormalize(pal.ids?.palpedia)) || byEnglishName.get(teamNormalize(pal.name));
    const internalId = localized?.tribe || localized?.id || "";
    const partnerPt = partnerSkillsPt[teamSlug(pal.name)];
    const partnerFallback = partnerSkillsFallback[pal.name];
    return {
      ...pal,
      namePt: localized?.name?.ptBR || pal.name,
      internalId,
      teamKey: pal.ids?.palpedia || internalId || pal.name,
      partnerEffect: {
        skill: partnerPt?.skill || "Habilidade de parceiro",
        description: partnerPt?.description || "Carregando descrição em português…",
        tags: partnerFallback?.tags || [],
        sourceDescription: partnerFallback?.desc || partnerPt?.description || "",
        translated: Boolean(partnerPt?.skill && partnerPt?.description),
        translationAttempted: false,
      },
    };
  });
}

async function fetchTeamJson(url, timeoutMs = 12000) {
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

async function loadTeamPartnerContent(pal) {
  const effect = pal.partnerEffect;
  if (!effect || effect.translated || effect.translationAttempted) return false;
  effect.translationAttempted = true;

  try {
    const content = await fetchTeamJson(`${TEAM_PAL_CONTENT_BASE}/${teamSlug(pal.name)}/`);
    if (content.partner?.name && content.partner?.description) {
      effect.skill = content.partner.name;
      effect.description = content.partner.description;
      effect.translated = true;
    } else {
      effect.description = "Descrição em português não disponível para este Pal.";
    }
  } catch (error) {
    console.warn(`Não foi possível carregar a descrição em português de ${pal.name}:`, error);
    effect.description = "Descrição em português temporariamente indisponível.";
  }
  return true;
}

async function refreshTeamPartnerContent() {
  const changed = await Promise.all(currentTeam().map(loadTeamPartnerContent));
  if (changed.some(Boolean)) renderTeamSummary();
}

function setupTeamFilters() {
  Object.entries(TEAM_ELEMENTS).forEach(([key, element]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = element.label;
    teamDom.elementFilter.appendChild(option);
  });
}

async function loadTeamBuilder() {
  setupTeamFilters();
  try {
    const [databaseResult, localeResult, partnerPtResult, partnerFallbackResult] = await Promise.allSettled([
      fetchTeamJson(TEAM_DATA_URL),
      fetchTeamJson(TEAM_LOCALE_URL),
      fetchTeamJson(TEAM_PARTNER_PT_URL),
      fetchTeamJson(TEAM_PARTNER_FALLBACK_URL),
    ]);
    if (databaseResult.status !== "fulfilled" || !Array.isArray(databaseResult.value?.pals)) throw new Error("Base principal indisponível");
    const localeRows = localeResult.status === "fulfilled" && Array.isArray(localeResult.value) ? localeResult.value : [];
    const partnerSkillsPt = partnerPtResult.status === "fulfilled" ? partnerPtResult.value?.skills || {} : {};
    const partnerSkillsFallback = partnerFallbackResult.status === "fulfilled" ? partnerFallbackResult.value?.pals || {} : {};
    teamState.pals = enrichTeamPals(databaseResult.value.pals, localeRows, partnerSkillsPt, partnerSkillsFallback);
  } catch (error) {
    console.warn("Usando dados locais de contingência:", error);
    teamState.pals = TEAM_FALLBACK_PALS;
    showTeamToast("A fonte externa está indisponível. Exibindo uma amostra local.");
  }
  loadSavedTeam();
  renderTeamBuilder();
  refreshTeamPartnerContent();
}

teamDom.search?.addEventListener("input", (event) => {
  teamState.query = event.target.value;
  renderTeamCatalog();
});

teamDom.elementFilter?.addEventListener("change", (event) => {
  teamState.element = event.target.value;
  renderTeamCatalog();
});

teamDom.catalog?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-pal]");
  if (button) addPalToTeam(button.dataset.addPal);
});

teamDom.summaryEmpty?.addEventListener("click", (event) => {
  if (event.target.closest('[data-team-action="catalog"]')) guideToTeamCatalog();
});

teamDom.slots?.addEventListener("pointerdown", (event) => {
  const dragHandle = event.target.closest(".team-drag-handle");
  if (activeTeamDrag || (event.target.closest("button, input, select, textarea") && !dragHandle)) return;
  const slot = event.target.closest(".team-slot-filled");
  if (!slot) return;

  if (!event.target.closest("a")) event.preventDefault();
  const rect = slot.getBoundingClientRect();
  activeTeamDrag = {
    active: false,
    handle: slot,
    slot,
    rect,
    pointerId: event.pointerId,
    sourceIndex: Number(slot.dataset.teamIndex),
    targetIndex: Number(slot.dataset.teamIndex),
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    ghost: null,
    holdTimer: window.setTimeout(() => activateTeamDrag(event), 160),
  };
  slot.setPointerCapture(event.pointerId);
});

teamDom.slots?.addEventListener("dragstart", (event) => {
  if (event.target.closest(".team-slot-filled")) event.preventDefault();
});

document.addEventListener("pointermove", (event) => {
  if (!activeTeamDrag || event.pointerId !== activeTeamDrag.pointerId) return;
  const distance = Math.hypot(event.clientX - activeTeamDrag.startX, event.clientY - activeTeamDrag.startY);
  if (!activeTeamDrag.active && distance > 4) activateTeamDrag(event);
  if (activeTeamDrag?.active) {
    event.preventDefault();
    updateTeamDrag(event);
  }
});

document.addEventListener("pointerup", (event) => {
  if (activeTeamDrag && event.pointerId === activeTeamDrag.pointerId) finishTeamDrag(event);
});

document.addEventListener("pointercancel", (event) => {
  if (activeTeamDrag && event.pointerId === activeTeamDrag.pointerId) finishTeamDrag(event, true);
});

teamDom.slots?.addEventListener("keydown", (event) => {
  const handle = event.target.closest(".team-drag-handle");
  if (!handle) return;
  const index = Number(handle.dataset.teamIndex);
  if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    moveTeamPal(index, -1);
  }
  if (["ArrowRight", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
    moveTeamPal(index, 1);
  }
});

teamDom.slots?.addEventListener("click", (event) => {
  if (suppressTeamSlotClick) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const button = event.target.closest("[data-team-action]");
  if (!button) return;
  const index = Number(button.dataset.teamIndex);
  if (button.dataset.teamAction === "catalog") {
    guideToTeamCatalog();
    return;
  }
  if (button.dataset.teamAction === "flip") {
    const slot = button.closest(".team-slot-filled");
    if (!slot) return;
    const flipped = slot.classList.toggle("is-flipped");
    button.textContent = flipped ? "↩" : "?";
    button.setAttribute("aria-pressed", String(flipped));
    button.setAttribute("aria-label", flipped ? "Voltar para a frente do card" : `Mostrar estatísticas de ${findTeamPal(teamState.teamKeys[index])?.namePt || "Pal"}`);
    slot.querySelector(".team-slot-front")?.setAttribute("aria-hidden", String(flipped));
    slot.querySelector(".team-slot-back")?.setAttribute("aria-hidden", String(!flipped));
    slot.querySelectorAll(".team-slot-front a, .team-slot-front button").forEach((element) => {
      element.tabIndex = flipped ? -1 : 0;
    });
    return;
  }
  if (button.dataset.teamAction === "remove") {
    const removedPal = findTeamPal(teamState.teamKeys[index]);
    teamState.teamKeys.splice(index, 1);
    saveTeam();
    renderTeamBuilder();
    showTeamToast(`${removedPal?.namePt || removedPal?.name || "Pal"} removido do time.`);
  }
});

teamDom.clear?.addEventListener("click", () => {
  teamState.teamKeys = [];
  saveTeam();
  renderTeamBuilder();
  showTeamToast("Time limpo.");
});

loadTeamBuilder();

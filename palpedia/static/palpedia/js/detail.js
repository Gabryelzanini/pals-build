const DETAIL_DATA_URL = "https://www.palworldonline.net/assets/palworld-encyclopedia-1.0.4.json";
const DETAIL_LOCALE_URL = "https://raw.githubusercontent.com/GGarnize/palworld-knowledge/main/data/pals.json";
const DETAIL_PASSIVES_URL = "https://raw.githubusercontent.com/GGarnize/palworld-knowledge/main/data/passive-skills.json";
const DETAIL_IMAGE_BASE = "https://palworld.gg/images/full_palicon";
const DETAIL_LEGACY_IMAGE_BASE = "https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/public/images/paldeck";

const DETAIL_ELEMENTS = {
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

const DETAIL_WORKS = {
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

const detailRoot = document.querySelector("#pal-detail");
const detailContent = document.querySelector("#detail-content");
const detailLoading = document.querySelector("#detail-loading");
const detailError = document.querySelector("#detail-error");
const requestedSlug = detailRoot?.dataset.palSlug || "";
const DETAIL_PT_CONTENT_URL = `/api/pal-content/${encodeURIComponent(requestedSlug)}/`;

function detailNormalize(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function detailSlug(value = "") {
  return detailNormalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function detailEscape(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function detailRarity(value) {
  if (Number(value) >= 20) return { key: "legendary", label: "Lendário", accent: "#f07322" };
  if (Number(value) >= 8) return { key: "epic", label: "Épico", accent: "#9a43f7" };
  if (Number(value) >= 5) return { key: "rare", label: "Raro", accent: "#2d7ff9" };
  return { key: "common", label: "Comum", accent: "#93a4bb" };
}

function detailDex(value) {
  if (value === null || value === undefined || value === "" || Number(value) < 0) return "Collab";
  const raw = String(value).toUpperCase();
  const match = raw.match(/^(\d+)(.*)$/);
  return match ? `#${match[1].padStart(3, "0")}${match[2]}` : raw;
}

function detailIcon(item, className = "detail-inline-icon") {
  return item?.iconUrl ? `<img class="${className}" src="${item.iconUrl}" alt="" />` : "";
}

function findLocalizedPal(pal, rows) {
  const name = detailNormalize(pal.name);
  const internalId = detailNormalize(pal.ids?.palpedia);
  const candidates = rows.filter((row) =>
    detailNormalize(row.name?.enUS) === name ||
    detailNormalize(row.id) === internalId ||
    detailNormalize(row.tribe) === internalId ||
    detailNormalize(row.source?.row) === internalId
  );
  return candidates.find((row) => row.variant?.recommendationEligible) ||
    candidates.find((row) => row.variant?.kind === "normal") ||
    candidates[0];
}

function fillPassiveDescription(passive) {
  let description = passive.description?.ptBR || "";
  (passive.effects || []).forEach((effect, index) => {
    description = description.replaceAll(`{EffectValue${index + 1}}`, String(Math.abs(Number(effect.value))));
  });
  return description || "Efeito passivo natural deste Pal.";
}

function statMaximum(pals, readValue) {
  return Math.max(1, ...pals.map((entry) => Number(readValue(entry)) || 0));
}

function statBar(label, value, maximum, color) {
  const current = Math.max(0, Number(value) || 0);
  const safeMaximum = Math.max(1, Number(maximum) || 1);
  const percentage = Math.min(100, (current / safeMaximum) * 100);
  const accessibleLabel = `${label}: ${current} de ${safeMaximum}`;
  return `
    <div class="detail-stat-row" style="--stat-color: ${color}" title="${detailEscape(accessibleLabel)}">
      <span>${detailEscape(label)}</span>
      <div class="detail-stat-track" role="progressbar" aria-label="${detailEscape(label)}" aria-valuemin="0" aria-valuemax="${safeMaximum}" aria-valuenow="${current}">
        <i style="width: ${percentage.toFixed(2)}%"></i>
      </div>
      <strong>${current}<small> / ${safeMaximum}</small></strong>
    </div>`;
}

function renderDetail(pal, localized, passiveRows, metadata, ptContent = {}) {
  const namePt = localized?.name?.ptBR || pal.name;
  const rarity = detailRarity(pal.rarity);
  const workEntries = Object.entries(pal.workSuitability || {}).sort(([, a], [, b]) => Number(b) - Number(a));
  const passiveById = new Map(passiveRows.map((passive) => [passive.id, passive]));
  const naturalPassives = (localized?.naturalPassives || []).map((id) => passiveById.get(id)).filter(Boolean);
  const activeSkills = [...(pal.learnedSkills || [])].sort((a, b) => Number(a.level) - Number(b.level));
  const drops = pal.drops || [];
  const partner = pal.partnerSkill || {};
  const partnerPt = ptContent.partner || {};
  const activeSkillsPt = [...(ptContent.activeSkills || [])].sort((a, b) => Number(a.level) - Number(b.level));
  const dropsPt = ptContent.drops || [];
  const allPals = Array.isArray(metadata.pals) ? metadata.pals : [pal];
  const baseStats = [
    { label: "HP", value: pal.stats?.hp, maximum: statMaximum(allPals, (entry) => entry.stats?.hp), color: "#45b889" },
    { label: "Ataque corpo a corpo", value: pal.stats?.meleeAttack, maximum: statMaximum(allPals, (entry) => entry.stats?.meleeAttack), color: "#dd8a70" },
    { label: "Ataque à distância", value: pal.stats?.shotAttack, maximum: statMaximum(allPals, (entry) => entry.stats?.shotAttack), color: "#ec7068" },
    { label: "Defesa", value: pal.stats?.defense, maximum: statMaximum(allPals, (entry) => entry.stats?.defense), color: "#7898c7" },
    { label: "Suporte", value: pal.stats?.support, maximum: statMaximum(allPals, (entry) => entry.stats?.support), color: "#a2aabd" },
    { label: "Velocidade de trabalho", value: pal.stats?.craftSpeed, maximum: statMaximum(allPals, (entry) => entry.stats?.craftSpeed), color: "#58aeca" },
    { label: "Stamina", value: pal.stats?.stamina, maximum: statMaximum(allPals, (entry) => entry.stats?.stamina), color: "#c4a45f" },
    { label: "Alimentação", value: pal.nutrition?.foodAmount, maximum: statMaximum(allPals, (entry) => entry.nutrition?.foodAmount), color: "#9678c6" },
  ];
  const flags = [
    pal.flags?.nocturnal && "Noturno",
    pal.flags?.boss && "Chefe",
    pal.flags?.raidBoss && "Chefe de raid",
    pal.flags?.towerBoss && "Chefe de torre",
    pal.flags?.predator && "Predador",
    pal.flags?.uncapturable && "Não capturável",
  ].filter(Boolean);

  document.title = `${namePt} — Palpedia | PalsBuild`;
  document.querySelector("#breadcrumb-name").textContent = namePt;
  detailContent.style.setProperty("--detail-accent", rarity.accent);
  detailContent.innerHTML = `
    <header class="pal-detail-hero">
      <div class="detail-portrait" id="detail-portrait"></div>
      <div class="detail-identity">
        <p class="detail-kicker">${detailDex(pal.paldeckNumber)} · Palpedia</p>
        <h1>${detailEscape(namePt)}</h1>
        ${namePt !== pal.name ? `<p class="detail-original-name">${detailEscape(pal.name)}</p>` : ""}
        <div class="detail-tags">
          ${(pal.elements || []).map((element) => `<span>${detailIcon(DETAIL_ELEMENTS[element])}${detailEscape(DETAIL_ELEMENTS[element]?.label || element)}</span>`).join("")}
          <span class="detail-rarity">${rarity.label} · ${Number(pal.rarity) || 0}</span>
          ${flags.map((flag) => `<span>${detailEscape(flag)}</span>`).join("")}
        </div>
      </div>
      <div class="detail-summary">
        <div><span>Melhor trabalho</span><strong>${workEntries.length ? `${DETAIL_WORKS[workEntries[0][0]]?.label || workEntries[0][0]} Lv ${workEntries[0][1]}` : "Nenhum"}</strong></div>
        <div><span>Tamanho</span><strong>${detailEscape(pal.size || "—")}</strong></div>
        <div><span>Gênero</span><strong>${pal.gender?.malePercent ?? 50}% ♂ · ${100 - Number(pal.gender?.malePercent ?? 50)}% ♀</strong></div>
      </div>
    </header>

    <div class="detail-layout">
      <div class="detail-main-column">
        <section class="detail-section">
          <div class="detail-section-heading"><div><p>ATRIBUTOS</p><h2>Estatísticas base</h2></div><span>Comparação com o máximo da Palpedia</span></div>
          <div class="detail-stats-grid">
            ${baseStats.map((stat) => statBar(stat.label, stat.value, stat.maximum, stat.color)).join("")}
          </div>
        </section>

        <section class="detail-section">
          <div class="detail-section-heading"><div><p>COMBATE</p><h2>Habilidades ativas</h2></div><span>${activeSkills.length} habilidades</span></div>
          <div class="active-skill-list">
            ${activeSkills.length ? activeSkills.map((skill, index) => {
              const translated = activeSkillsPt[index] || {};
              return `
              <article class="active-skill-card">
                <div class="skill-element">${detailIcon(DETAIL_ELEMENTS[skill.element], "skill-element-icon")}</div>
                <div class="skill-info">
                  <span>Aprende no nível ${detailEscape(skill.level)}</span>
                  <h3>${detailEscape(translated.name || `Habilidade de ${DETAIL_ELEMENTS[skill.element]?.label || "combate"}`)}</h3>
                  <small>${detailEscape(DETAIL_ELEMENTS[skill.element]?.label || "Elemento não informado")}</small>
                  ${translated.description ? `<p>${detailEscape(translated.description)}</p>` : ""}
                </div>
                <dl><div><dt>Poder</dt><dd>${detailEscape(skill.power ?? "—")}</dd></div><div><dt>Recarga</dt><dd>${detailEscape(skill.cooldown ?? "—")}s</dd></div><div><dt>Alcance</dt><dd>${detailEscape(skill.minRange ?? 0)}–${detailEscape(skill.maxRange ?? 0)}</dd></div></dl>
              </article>
            `; }).join("") : '<p class="detail-muted">Nenhuma habilidade ativa encontrada.</p>'}
          </div>
        </section>

        <section class="detail-section">
          <div class="detail-section-heading"><div><p>TRAÇOS</p><h2>Passivas naturais</h2></div></div>
          <div class="passive-grid">
            ${naturalPassives.length ? naturalPassives.map((passive) => `
              <article class="passive-card rank-${Math.min(3, Math.max(0, Number(passive.rank) || 0))}">
                <div><span>Rank ${detailEscape(passive.rank ?? 0)}</span><h3>${detailEscape(passive.name?.ptBR || "Passiva natural")}</h3></div>
                <p>${detailEscape(fillPassiveDescription(passive))}</p>
              </article>
            `).join("") : '<p class="detail-muted">Este Pal não possui uma passiva natural registrada.</p>'}
          </div>
        </section>

        <section class="detail-section">
          <div class="detail-section-heading"><div><p>RECOMPENSAS</p><h2>Itens derrubados</h2></div><span>${drops.length} registros</span></div>
          <div class="drop-table-wrap">
            ${drops.length ? `<table class="drop-table"><thead><tr><th>Item</th><th>Quantidade</th><th>Chance</th><th>Nível</th></tr></thead><tbody>${drops.map((drop, index) => `<tr><td>${detailEscape(dropsPt[index] || `Item ${index + 1}`)}</td><td>${detailEscape(drop.min)}–${detailEscape(drop.max)}</td><td>${detailEscape(drop.rate)}%</td><td>${drop.level ? `Lv ${detailEscape(drop.level)}` : "Qualquer"}</td></tr>`).join("")}</tbody></table>` : '<p class="detail-muted">Nenhum drop registrado.</p>'}
          </div>
        </section>
      </div>

      <aside class="detail-side-column">
        <section class="detail-section sticky-detail-card">
          <div class="detail-section-heading"><div><p>BASE</p><h2>Aptidões de trabalho</h2></div></div>
          <div class="detail-work-list">
            ${workEntries.length ? workEntries.map(([key, level]) => `<div><span class="detail-work-icon">${detailIcon(DETAIL_WORKS[key], "work-icon-image")}</span><span>${detailEscape(DETAIL_WORKS[key]?.label || key)}</span><strong>Lv ${detailEscape(level)}</strong></div>`).join("") : '<p class="detail-muted">Sem aptidões de trabalho.</p>'}
          </div>
        </section>

        <section class="detail-section">
          <div class="detail-section-heading"><div><p>PARCEIRO</p><h2>Habilidade de parceiro</h2></div></div>
          <div class="partner-detail">
            <h3>${detailEscape(partnerPt.name || "Habilidade de parceiro")}</h3>
            <p>${detailEscape(partnerPt.description || "Descrição em português não disponível para este Pal.")}</p>
            <dl>
              ${partner.cooldown != null ? `<div><dt>Recarga</dt><dd>${detailEscape(partner.cooldown)}s</dd></div>` : ""}
              ${partner.duration != null ? `<div><dt>Duração</dt><dd>${detailEscape(partner.duration)}s</dd></div>` : ""}
              ${partner.unlockItemId ? `<div><dt>Desbloqueio</dt><dd>${detailEscape(partner.unlockItemId)}</dd></div>` : ""}
            </dl>
          </div>
        </section>

        <section class="detail-section">
          <div class="detail-section-heading"><div><p>LOCOMOÇÃO</p><h2>Movimento</h2></div></div>
          <div class="movement-list">
            <div><span>Caminhada</span><strong>${detailEscape(pal.movement?.walk ?? "—")}</strong></div>
            <div><span>Corrida</span><strong>${detailEscape(pal.movement?.run ?? "—")}</strong></div>
            <div><span>Sprint montado</span><strong>${detailEscape(pal.movement?.rideSprint ?? "—")}</strong></div>
            <div><span>Transporte</span><strong>${detailEscape(pal.movement?.transport ?? "—")}</strong></div>
            <div><span>Natação</span><strong>${detailEscape(pal.movement?.swim ?? "—")}</strong></div>
            <div><span>Natação rápida</span><strong>${detailEscape(pal.movement?.swimDash ?? "—")}</strong></div>
          </div>
        </section>

        <p class="detail-source">Base ${detailEscape(metadata.gameVersion || "atual")} · coletada em ${detailEscape(metadata.collectedAt || "data não informada")}</p>
      </aside>
    </div>
  `;

  const portrait = detailContent.querySelector("#detail-portrait");
  const image = document.createElement("img");
  image.src = localized?.tribe ? `${DETAIL_IMAGE_BASE}/T_${localized.tribe}_icon_normal.png` : "";
  image.alt = namePt;
  image.addEventListener("error", () => {
    const rawDex = String(pal.paldeckNumber || "");
    if (/^\d+$/.test(rawDex) && Number(rawDex) <= 137 && image.dataset.fallback !== "true") {
      image.dataset.fallback = "true";
      image.src = `${DETAIL_LEGACY_IMAGE_BASE}/${rawDex.padStart(3, "0")}.png`;
      return;
    }
    const fallback = document.createElement("span");
    fallback.textContent = namePt.slice(0, 2).toUpperCase();
    image.replaceWith(fallback);
  });
  portrait.appendChild(image);

  detailLoading.hidden = true;
  detailContent.hidden = false;
}

async function detailFetch(url, timeoutMs = 12000) {
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

async function loadPalDetail() {
  try {
    const [databaseResult, localeResult, passiveResult, ptContentResult] = await Promise.allSettled([
      detailFetch(DETAIL_DATA_URL),
      detailFetch(DETAIL_LOCALE_URL),
      detailFetch(DETAIL_PASSIVES_URL),
      detailFetch(DETAIL_PT_CONTENT_URL),
    ]);
    if (databaseResult.status !== "fulfilled" || !Array.isArray(databaseResult.value?.pals)) throw new Error("Base principal indisponível");

    const pal = databaseResult.value.pals.find((entry) => detailSlug(entry.name) === requestedSlug);
    if (!pal) throw new Error("Pal não encontrado");
    const localeRows = localeResult.status === "fulfilled" && Array.isArray(localeResult.value) ? localeResult.value : [];
    const passiveRows = passiveResult.status === "fulfilled" && Array.isArray(passiveResult.value) ? passiveResult.value : [];
    const ptContent = ptContentResult.status === "fulfilled" ? ptContentResult.value : {};
    const localized = findLocalizedPal(pal, localeRows);
    renderDetail(pal, localized, passiveRows, databaseResult.value, ptContent);
  } catch (error) {
    console.error(error);
    detailLoading.hidden = true;
    detailError.hidden = false;
  }
}

loadPalDetail();

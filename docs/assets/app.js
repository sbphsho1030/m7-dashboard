const SITE_ROOT = new URL("..", document.currentScript.src).pathname;

const state = {
  latest: null,
  calendarIndex: null,
  calendarManifest: null,
  monthManifest: null,
  selectedItem: null,
  currentView: "dashboard"
};

const els = {
  status: document.querySelector("#status"),
  monthSelect: document.querySelector("#monthSelect"),
  calendar: document.querySelector("#calendar"),
  selectedDate: document.querySelector("#selectedDate"),
  dashboardTitle: document.querySelector("#dashboardTitle"),
  dashboardBtn: document.querySelector("#dashboardBtn"),
  fullReportBtn: document.querySelector("#fullReportBtn"),
  contentFrame: document.querySelector("#contentFrame")
};

function siteUrl(path) {
  const cleanPath = String(path).replace(/^\/+/, "");
  return `${SITE_ROOT}${cleanPath}`;
}

async function fetchJson(path) {
  const response = await fetch(siteUrl(path), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`無法載入 ${path} (${response.status})`);
  }
  return response.json();
}

async function fetchJsonOptional(path) {
  const response = await fetch(siteUrl(path), { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

async function fetchHtml(path) {
  const response = await fetch(siteUrl(path), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`無法載入 ${path} (${response.status})`);
  }
  return response.text();
}

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle("error", isError);
}

function showError(error) {
  setStatus("載入失敗", true);
  els.contentFrame.innerHTML = `<div class="error-box">${escapeHtml(error.message || "資料載入失敗，請稍後再試。")}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateLabel(dateText) {
  return dateText || "--";
}

function renderMonthOptions() {
  els.monthSelect.innerHTML = "";
  for (const month of state.calendarIndex.availableMonths) {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    els.monthSelect.append(option);
  }
}

async function loadMonth(month) {
  if (state.calendarManifest && Array.isArray(state.calendarManifest.items)) {
    state.monthManifest = {
      month,
      items: state.calendarManifest.items.filter((item) => item.date.startsWith(`${month}-`))
    };
  } else {
    state.monthManifest = await fetchJson(`data/calendar/${month}.json`);
  }
  renderCalendar();
}

function renderCalendar() {
  const manifest = state.monthManifest;
  const [year, month] = manifest.month.split("-").map(Number);
  const availableByDate = new Map(manifest.items.map((item) => [item.date, item]));
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"];
  const nodes = weekdayLabels.map((label) => `<div class="weekday">${label}</div>`);

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    nodes.push('<div class="day empty" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${manifest.month}-${String(day).padStart(2, "0")}`;
    const item = availableByDate.get(date);
    const selected = state.selectedItem && state.selectedItem.date === date;

    if (item) {
      nodes.push(`<button class="day available${selected ? " selected" : ""}" type="button" data-date="${date}">${day}</button>`);
    } else {
      nodes.push(`<button class="day unavailable" type="button" disabled>${day}</button>`);
    }
  }

  els.calendar.innerHTML = nodes.join("");
}

function updateViewButtons() {
  els.dashboardBtn.classList.toggle("active", state.currentView === "dashboard");
  els.fullReportBtn.classList.toggle("active", state.currentView === "fullReport");
  els.fullReportBtn.disabled = !state.selectedItem || !getFullReportPath(state.selectedItem);
}

function getDashboardPath(item) {
  return item.dashboardJson || item.dashboard;
}

function getFullReportPath(item) {
  return item.fullReportJson || item.fullReport || null;
}

function isJsonPath(path) {
  return /\.json$/i.test(path || "");
}

function renderList(items) {
  if (!items || !items.length) {
    return "";
  }
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderEvidence(profile) {
  if (!profile) {
    return "";
  }
  return `
    <div class="evidence-box">
      <span>Evidence Profile</span>
      <p><strong>Source items:</strong> ${escapeHtml(profile.sourceItemCount ?? "sample")}</p>
      <p><strong>Recurrence:</strong> ${escapeHtml(profile.recurrence || "sample")}</p>
      <p><strong>Why selected:</strong> ${escapeHtml(profile.whySelected || "sample")}</p>
      <p><strong>What changed:</strong> ${escapeHtml(profile.whatChanged || "sample")}</p>
    </div>
  `;
}

function renderTop3(items) {
  return (items || []).map((item, index) => `
    <article class="topic-card">
      <span>Topic ${index + 1} · ${escapeHtml(item.dataStatus || "sample")}</span>
      <h3>${escapeHtml(item.topic)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <div class="topic-meta">
        <span>Theme: ${escapeHtml(item.theme)}</span>
        <span>Type: ${escapeHtml(item.type)}</span>
        <span>Direction: ${escapeHtml(item.direction)}</span>
        <span>Horizon: ${escapeHtml(item.horizon)}</span>
        <span>Confidence: ${escapeHtml(item.confidence)}</span>
      </div>
      <p><strong>Companies:</strong> ${escapeHtml((item.companies || []).join(", ") || "sample")}</p>
      <p><strong>Thesis impact:</strong> ${escapeHtml(item.thesisImpact)}</p>
      <p><strong>Action bias:</strong> ${escapeHtml(item.actionBias)}</p>
      <p><strong>Persistence:</strong> ${escapeHtml(item.persistence)}</p>
      <div>
        <strong>Watch signals</strong>
        ${renderList(item.watchSignals)}
      </div>
      ${renderEvidence(item.evidenceProfile)}
    </article>
  `).join("");
}

function renderDashboardJson(data) {
  return `
    <section class="dashboard-sample">
      <div>
        <p class="eyebrow">${escapeHtml(data.dataStatus || "sample")} Dashboard JSON</p>
        <h2>${escapeHtml(data.title)}</h2>
        <p>${escapeHtml(data.summary)}</p>
      </div>
      <div class="summary-grid" aria-label="Dashboard metadata">
        <div class="metric"><span>Market Date</span><strong>${escapeHtml(data.date)}</strong></div>
        <div class="metric"><span>Status</span><strong>${escapeHtml(data.dataStatus || "sample")}</strong></div>
        <div class="metric"><span>Schema</span><strong>${escapeHtml(data.schemaVersion)}</strong></div>
      </div>
      <div class="top3-list">${renderTop3(data.top3)}</div>
    </section>
  `;
}

function renderFullReportJson(data) {
  const sections = (data.sections || []).map((section) => `
    <section class="report-section">
      <h3>${escapeHtml(section.heading)}</h3>
      <p>${escapeHtml(section.body)}</p>
    </section>
  `).join("");

  return `
    <section class="report-sample">
      <div>
        <p class="eyebrow">${escapeHtml(data.dataStatus || "sample")} Full Report JSON</p>
        <h2>${escapeHtml(data.title)}</h2>
        <p>${escapeHtml(data.summary)}</p>
      </div>
      ${sections}
    </section>
  `;
}

async function loadRenderableContent(path, view) {
  if (isJsonPath(path)) {
    const data = await fetchJson(path);
    return view === "fullReport" ? renderFullReportJson(data) : renderDashboardJson(data);
  }
  return fetchHtml(path);
}

async function loadContent(item, view = "dashboard") {
  state.selectedItem = item;
  state.currentView = view === "fullReport" && getFullReportPath(item) ? "fullReport" : "dashboard";
  updateViewButtons();
  renderCalendar();

  els.selectedDate.textContent = formatDateLabel(item.date);
  els.dashboardTitle.textContent = item.title || "Dashboard";
  setStatus("載入中...");

  const path = state.currentView === "fullReport" ? getFullReportPath(item) : getDashboardPath(item);
  try {
    els.contentFrame.innerHTML = await loadRenderableContent(path, state.currentView);
    setStatus("已載入");
  } catch (error) {
    showError(error);
  }
}

async function selectDate(date) {
  const item = state.monthManifest.items.find((entry) => entry.date === date);
  if (item) {
    await loadContent(item, "dashboard");
  }
}

async function init() {
  try {
    state.latest = await fetchJson("data/latest.json");
    state.calendarManifest = await fetchJsonOptional("data/calendar-manifest.json");
    state.calendarIndex = state.calendarManifest || await fetchJson("data/calendar/index.json");
    renderMonthOptions();

    const latestMonth = state.latest.date.slice(0, 7);
    els.monthSelect.value = latestMonth;
    await loadMonth(latestMonth);

    const latestItem = state.monthManifest.items.find((item) => item.date === state.latest.date) || state.latest;
    await loadContent(latestItem, "dashboard");
  } catch (error) {
    showError(error);
  }
}

els.monthSelect.addEventListener("change", async (event) => {
  try {
    setStatus("載入月份...");
    await loadMonth(event.target.value);
    const firstItem = state.monthManifest.items[0];
    if (firstItem) {
      await loadContent(firstItem, "dashboard");
    } else {
      els.contentFrame.innerHTML = '<div class="error-box">這個月份目前沒有可顯示資料。</div>';
      setStatus("無資料");
    }
  } catch (error) {
    showError(error);
  }
});

els.calendar.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-date]");
  if (button) {
    await selectDate(button.dataset.date);
  }
});

els.dashboardBtn.addEventListener("click", async () => {
  if (state.selectedItem) {
    await loadContent(state.selectedItem, "dashboard");
  }
});

els.fullReportBtn.addEventListener("click", async () => {
  if (state.selectedItem && getFullReportPath(state.selectedItem)) {
    await loadContent(state.selectedItem, "fullReport");
  }
});

init();

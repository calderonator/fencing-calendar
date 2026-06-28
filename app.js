// ── Fencer Profile ────────────────────────────────────────────
const FENCER = {
  name: "Diego Calderon", weapon: "Senior Men's Épée",
  division: "Division I", rank: 125, points: 97.9,
  season: "2026-27", top12pts: 1703,
};

// ── Points ────────────────────────────────────────────────────
const PTS = {
  intl: 4000, elite_win: 1000, national_win: 200,
  regional_win: 100, local_large: 75, local_std: 50, local_small: 25,
};

// ── Events ────────────────────────────────────────────────────
const EVENTS = [
  { date:"2026-08-01", name:"Trial Points System Activates",               loc:"USA-wide",                                      tier:"system",   pts:0,              notes:"2025-26 results carry over. New season begins." },
  { date:"2026-10-09", name:"October NAC — Division I Men's Épée",         loc:"Orlando, FL — OCCC",                            tier:"target",   pts:PTS.elite_win,  notes:"🎯 PRIMARY TARGET. Elite win = 1,000 pts · National win = 200 pts." },
  { date:"2026-11-20", name:"November NAC — Division I Men's Épée",        loc:"Columbus, OH",                                  tier:"national", pts:PTS.elite_win,  notes:"Strong Oct result may qualify for Elite." },
  { date:"2027-01-08", name:"January NAC — Division I Men's Épée",         loc:"Oklahoma City, OK",                             tier:"national", pts:PTS.elite_win,  notes:"Third NAC of the season." },
  { date:"2027-02-01", name:"February NAC — Division I Men's Épée (TBA)",  loc:"TBA",                                           tier:"tba",      pts:PTS.elite_win,  notes:"Date/location TBA — announced ~Sep 2026." },
  { date:"2027-04-16", name:"April NAC + Division I National Championship", loc:"Cincinnati, OH — First Financial Center",       tier:"national", pts:PTS.elite_win,  notes:"Highest-value domestic event. Apr 16–19, 2027." },
  { date:"2027-06-27", name:"Summer Nationals / July Challenge",            loc:"TBA",                                           tier:"tba",      pts:PTS.elite_win,  notes:"Season-ending championship. TBA." },
];

const REGIONAL = [
  "2026-08-22","2026-09-06","2026-09-12","2026-09-19","2026-09-26",
  "2026-10-03","2026-10-17","2026-10-24","2026-11-07","2026-11-14",
  "2026-12-05","2026-12-12","2027-01-09","2027-01-16","2027-01-23",
  "2027-02-06","2027-02-13","2027-02-20","2027-02-27","2027-03-06",
  "2027-03-13","2027-03-20","2027-03-27","2027-04-10","2027-04-17",
  "2027-04-24","2027-05-01","2027-05-09",
];

const TIER = {
  target:   { emoji:"🎯", label:"Primary Target",    bg:"#dbeafe", fg:"#1d4ed8", border:"#2563eb" },
  national: { emoji:"🇺🇸", label:"USA National",      bg:"#fef9c3", fg:"#92400e", border:"#d97706" },
  local:    { emoji:"📍", label:"AskFred Local",      bg:"#dcfce7", fg:"#166534", border:"#16a34a" },
  regional: { emoji:"📋", label:"ROC Regional",       bg:"#ffedd5", fg:"#9a3412", border:"#ea580c" },
  training: { emoji:"🇪🇸", label:"Spain Training",    bg:"#ccfbf1", fg:"#115e59", border:"#0d9488" },
  tba:      { emoji:"⏳", label:"TBA",                bg:"#f3f4f6", fg:"#374151", border:"#9ca3af" },
  system:   { emoji:"⚙️", label:"System",             bg:"#e0e7ff", fg:"#3730a3", border:"#6366f1" },
};

// ── Regional locations (from Airtable 26-27 Reg Cal List) ─────
const REGIONAL_LOCS = {
  "2026-08-22":"Edison, NJ",
  "2026-09-06":"Ontario, CA",
  "2026-09-12":"Air Force Academy, CO",
  "2026-09-19":"La Jolla, CA · Myrtle Beach, SC",
  "2026-09-26":"Evanston, IL · Suffern, NY",
  "2026-10-03":"Seattle, WA",
  "2026-10-17":"Houston, TX",
  "2026-10-24":"Santa Clara, CA",
  "2026-11-07":"Grand Rapids, MI",
  "2026-11-14":"Metairie, LA",
  "2026-12-05":"No D1A events — check Airtable",
  "2026-12-12":"Myrtle Beach, SC",
  "2027-01-09":"No D1A events — check Airtable",
  "2027-01-16":"Bellevue, WA · San Diego, CA",
  "2027-01-23":"Jacksonville, FL",
  "2027-02-06":"Providence, RI",
  "2027-02-13":"No D1A events — check Airtable",
  "2027-02-20":"No D1A events — check Airtable",
  "2027-02-27":"Phoenixville, PA",
  "2027-03-06":"No D1A events — check Airtable",
  "2027-03-13":"Grand Rapids, MI · College Park, MD",
  "2027-03-20":"No D1A events — check Airtable",
  "2027-03-27":"Libertyville, IL · Dallas, TX",
  "2027-04-10":"Houston, TX",
  "2027-04-17":"No D1A events — check Airtable",
  "2027-04-24":"No D1A events — check Airtable",
  "2027-05-01":"Tigard, OR",
  "2027-05-09":"No D1A events — check Airtable",
};

// ── State ─────────────────────────────────────────────────────
let currentTab = "home";
let currentFilter = "all";

// ── Helpers ───────────────────────────────────────────────────
function today() {
  const d = new Date(); d.setHours(0,0,0,0); return d;
}
function parseDate(s) {
  const [y,m,d] = s.split("-").map(Number);
  return new Date(y, m-1, d);
}
function daysUntil(dateStr) {
  return Math.ceil((parseDate(dateStr) - today()) / 86400000);
}
function fmtDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" });
}
function fmtMonth(dateStr) {
  return parseDate(dateStr).toLocaleDateString("en-US", { month:"long", year:"numeric" });
}

function allEvents() {
  const evs = [...EVENTS.map(e => ({...e, source:"USA Fencing"}))];
  REGIONAL.forEach(d => evs.push({
    date:d, name:"ROC Regional Weekend", loc:REGIONAL_LOCS[d] || "Various, USA",
    tier:"regional", pts:PTS.regional_win, source:"USA Fencing Regional",
    notes:"D1A events at this weekend count for Trial pts. Check Airtable for full schedule."
  }));
  return evs.filter(e => daysUntil(e.date) >= 0).sort((a,b) => a.date.localeCompare(b.date));
}

// ── Render: Grid Calendar ─────────────────────────────────────
function renderGrid() {
  const evMap = {};
  allEvents().forEach(ev => {
    const key = ev.date.substring(0,10);
    if (!evMap[key]) evMap[key] = [];
    evMap[key].push(ev);
  });

  const GRID_MONTHS = [
    {y:2026,m:8},{y:2026,m:9},{y:2026,m:10},{y:2026,m:11},{y:2026,m:12},
    {y:2027,m:1},{y:2027,m:2},{y:2027,m:3},{y:2027,m:4},{y:2027,m:5},{y:2027,m:6},{y:2027,m:7},
  ];
  const MONTHS_SHORT = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MONTHS_FULL  = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const todayStr = new Date().toISOString().substring(0,10);

  let html = `<div class="grid-legend">
    <span class="gl-item" style="background:#dbeafe;border-color:#2563eb">🎯 Target</span>
    <span class="gl-item" style="background:#fef9c3;border-color:#d97706">🇺🇸 National</span>
    <span class="gl-item" style="background:#ffedd5;border-color:#ea580c">📋 Regional</span>
    <span class="gl-item" style="background:#ccfbf1;border-color:#0d9488">🇪🇸 Spain</span>
  </div>`;

  GRID_MONTHS.forEach(({y, m}) => {
    const firstDow = new Date(y, m-1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const weeks = Math.ceil((firstDow + daysInMonth) / 7);

    html += `<div class="grid-month">
      <div class="grid-month-title">${MONTHS_FULL[m]} ${y}</div>
      <div class="grid-dow-row">${DAYS.map(d=>`<div class="grid-dow">${d}</div>`).join("")}</div>`;

    for (let wk = 0; wk < weeks; wk++) {
      html += `<div class="grid-week">`;
      for (let dow = 0; dow < 7; dow++) {
        const dom = wk * 7 + dow - firstDow + 1;
        if (dom < 1 || dom > daysInMonth) {
          html += `<div class="grid-cell empty"></div>`;
        } else {
          const key = `${y}-${String(m).padStart(2,"0")}-${String(dom).padStart(2,"0")}`;
          const evs = evMap[key] || [];
          const isToday = key === todayStr;
          const ev = evs[0];
          const t = ev ? TIER[ev.tier] : null;
          const shortName = ev ? ev.name.replace("Division I Men's Épée","Div I").replace("— Division I","").replace("Division I","Div I").replace("National Championship","Natl Champ").trim() : "";
          const shortLoc  = ev ? ev.loc.replace("Orange County Convention Center","OCCC").replace("First Financial Center","FFC").split("—")[0].trim() : "";
          html += `<div class="grid-cell ${isToday?"grid-today":""} ${ev?"grid-cell-ev":""}"
            style="${t ? `background:${t.bg};border:1px solid ${t.border}` : ""}"
            ${ev ? `onclick="showEventPopup(${JSON.stringify(JSON.stringify(ev))})"` : ""}>
            <div class="grid-dom" style="${isToday?"color:#fff;background:#2563eb;border-radius:99px":""}">${dom}</div>
            ${ev ? `<div class="grid-ev-name" style="color:${t.fg}">${t.emoji} ${shortName}</div>
                    <div class="grid-ev-loc" style="color:${t.fg}">${shortLoc}</div>` : ""}
          </div>`;
        }
      }
      html += `</div>`;
    }
    html += `</div>`;
  });

  return html + `<div id="event-popup" class="popup-overlay" style="display:none" onclick="closePopup()">
    <div class="popup-card" onclick="event.stopPropagation()">
      <div id="popup-content"></div>
      <button class="popup-close" onclick="closePopup()">Close</button>
    </div>
  </div>`;
}

function showEventPopup(evJson) {
  const ev = JSON.parse(evJson);
  document.getElementById("popup-content").innerHTML = renderEventCard(ev);
  document.getElementById("event-popup").style.display = "flex";
}
function closePopup() {
  document.getElementById("event-popup").style.display = "none";
}

function urgencyBadge(days) {
  if (days === 0) return { text:"TODAY",    color:"#dc2626" };
  if (days <= 3)  return { text:`${days}d`, color:"#dc2626" };
  if (days <= 7)  return { text:`${days}d`, color:"#d97706" };
  if (days <= 30) return { text:`${days}d`, color:"#2563eb" };
  return { text:`${days}d`, color:"#6b7280" };
}

// ── Render: Home ──────────────────────────────────────────────
function renderHome() {
  const evs = allEvents();
  const next = evs.find(e => e.tier !== "system" && e.tier !== "regional");
  const nextNAC = evs.find(e => e.tier === "target" || e.tier === "national");
  const daysToOct = daysUntil("2026-10-09");
  const pct = Math.min(100, Math.round((FENCER.points / 400) * 100));
  const filled = Math.round(pct / 5);

  return `
    <div class="hero">
      <div class="hero-title">🤺 ${FENCER.name}</div>
      <div class="hero-sub">${FENCER.weapon} · Division I · ${FENCER.season}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card" style="border-color:#dc2626">
        <div class="stat-label">RANK</div>
        <div class="stat-val" style="color:#dc2626">#${FENCER.rank}</div>
        <div class="stat-sub">Sr. Men's Épée</div>
      </div>
      <div class="stat-card" style="border-color:#2563eb">
        <div class="stat-label">TRIAL PTS</div>
        <div class="stat-val" style="color:#2563eb">${FENCER.points}</div>
        <div class="stat-sub">Carry-over 2025-26</div>
      </div>
      <div class="stat-card" style="border-color:#d97706">
        <div class="stat-label">DAYS TO OCT NAC</div>
        <div class="stat-val" style="color:#d97706">${daysToOct}</div>
        <div class="stat-sub">Oct 9 · Orlando FL</div>
      </div>
      <div class="stat-card" style="border-color:#16a34a">
        <div class="stat-label">ELITE WIN</div>
        <div class="stat-val" style="color:#16a34a">1,000</div>
        <div class="stat-sub">pts (from graphic)</div>
      </div>
    </div>

    <div class="section-title">📈 Points Progress</div>
    <div class="progress-card">
      <div class="progress-row">
        <span class="progress-pts">${FENCER.points} pts</span>
        <span class="progress-pct">${pct}% of ~400 est. Elite threshold</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="progress-goal">Top-12 goal: ${FENCER.top12pts.toLocaleString()} pts</div>
    </div>

    ${nextNAC ? `
    <div class="section-title">🎯 Next NAC</div>
    <div class="event-card target-card">
      ${renderEventCard(nextNAC)}
    </div>` : ""}

    <div class="section-title">📅 Next Up</div>
    ${evs.slice(0,5).map(e => `<div class="event-card">${renderEventCard(e)}</div>`).join("")}

    <div class="section-title">✅ Eligibility</div>
    <div class="info-card green">
      <b>✅ Eligible:</b> Division I Senior Men's Épée · Open/Div IA events
    </div>
    <div class="info-card red">
      <b>❌ Not eligible:</b> SJCC · Junior Olympics · Youth events
    </div>
    <div class="info-card orange">
      <b>⚠️ ROC events</b> do NOT build Div I Trial pts
    </div>
  `;
}

// ── Render: Events ────────────────────────────────────────────
function renderEvents() {
  let evs = allEvents();
  if (currentFilter !== "all") evs = evs.filter(e => e.tier === currentFilter);

  const months = {};
  evs.forEach(e => {
    const m = fmtMonth(e.date);
    if (!months[m]) months[m] = [];
    months[m].push(e);
  });

  const filters = [
    { key:"all",      label:"All" },
    { key:"target",   label:"🎯 Target" },
    { key:"national", label:"🇺🇸 National" },
    { key:"regional", label:"📋 Regional" },
    { key:"training", label:"🇪🇸 Spain" },
  ];

  return `
    <div class="filter-bar">
      ${filters.map(f => `
        <button class="filter-btn ${currentFilter===f.key?"active":""}" onclick="setFilter('${f.key}')">${f.label}</button>
      `).join("")}
    </div>
    ${Object.entries(months).map(([month, evs]) => `
      <div class="month-header">${month.toUpperCase()}</div>
      ${evs.map(e => `<div class="event-card">${renderEventCard(e)}</div>`).join("")}
    `).join("")}
    ${evs.length === 0 ? `<div class="empty">No events for this filter.</div>` : ""}
  `;
}

// ── Render: Points ────────────────────────────────────────────
function renderPoints() {
  const tiers = [
    { name:"🌍 International", color:"#1d4ed8", bg:"#dbeafe", rows:[
      { place:"1st (Win)", pts:"4,000", src:"📊 Graphic", note:"World Cup / Grand Prix win" },
      { place:"Other", pts:"TBD ⏳", src:"Pending", note:"Full Athlete Handbook ~Jul 6" },
    ]},
    { name:"⭐ Elite (NAC Elite field)", color:"#1d4ed8", bg:"#eff6ff", rows:[
      { place:"1st (Win)", pts:"1,000", src:"📊 Graphic", note:"Your key target once in Elite field" },
      { place:"T-64 (est.)", pts:"~100–150", src:"Estimated", note:"Must be < National win by design" },
      { place:"Other", pts:"TBD ⏳", src:"Pending", note:"Full Athlete Handbook ~Jul 6" },
    ]},
    { name:"🇺🇸 National (NAC National field)", color:"#166534", bg:"#dcfce7", rows:[
      { place:"1st (Win) ← YOUR TARGET", pts:"200", src:"✅ Text", note:"~298 pts total → likely qualifies for Elite at Nov NAC", highlight:true },
      { place:"Other", pts:"TBD ⏳", src:"Pending", note:"Full Athlete Handbook ~Jul 6" },
    ]},
    { name:"📋 Regional (ROC — separate list)", color:"#9a3412", bg:"#ffedd5", rows:[
      { place:"1st (Win)", pts:"100", src:"📊 Graphic", note:"ROC list ONLY — does NOT build Div I Trial pts" },
    ]},
    { name:"📍 Local (AskFred — earns Trial pts)", color:"#115e59", bg:"#ccfbf1", rows:[
      { place:"Win — large event", pts:"75", src:"✅ Text", note:"Top-grouped sanctioned event" },
      { place:"Win — standard",    pts:"50", src:"✅ Text", note:"Standard sanctioned event" },
      { place:"Win — small",       pts:"25", src:"✅ Text", note:"Minimum local win" },
      { place:"Other", pts:"TBD ⏳", src:"Pending", note:"Full Athlete Handbook ~Jul 6" },
    ]},
  ];

  const scenarios = [
    { sc:"Win National tier",          earned:"+200",    total:(FENCER.points+200).toFixed(1),  note:"→ very likely qualifies for Elite at Nov NAC" },
    { sc:"Win Elite tier",             earned:"+1,000",  total:(FENCER.points+1000).toFixed(1), note:"→ top-30 territory, firmly in Elite rest of season" },
    { sc:"Win International (future)", earned:"+4,000",  total:(FENCER.points+4000).toFixed(1), note:"→ top-5 territory (needs top-12 first)" },
    { sc:"Sub-placements",             earned:"TBD ⏳",  total:"TBD",                           note:"Pending full Athlete Handbook ~Jul 6, 2026" },
  ];

  return `
    <div class="source-note">
      ✅ Confirmed text &nbsp;·&nbsp; 📊 From article graphic &nbsp;·&nbsp; ⏳ Pending Handbook ~Jul 6
    </div>

    ${tiers.map(t => `
      <div class="pts-tier" style="border-color:${t.color};background:${t.bg}">
        <div class="pts-tier-name" style="color:${t.color}">${t.name}</div>
        ${t.rows.map(r => `
          <div class="pts-row ${r.highlight?"pts-highlight":""}">
            <div class="pts-place">${r.place}</div>
            <div class="pts-val" style="color:${t.color}">${r.pts}</div>
            <div class="pts-src">${r.src}</div>
            <div class="pts-note">${r.note}</div>
          </div>
        `).join("")}
      </div>
    `).join("")}

    <div class="section-title">📊 Oct NAC Scenarios</div>
    ${scenarios.map(s => `
      <div class="scenario-card">
        <div class="scenario-name">${s.sc}</div>
        <div class="scenario-row">
          <span class="scenario-earned">${s.earned}</span>
          <span class="scenario-arrow">→</span>
          <span class="scenario-total">${s.total} pts</span>
        </div>
        <div class="scenario-note">${s.note}</div>
      </div>
    `).join("")}
  `;
}

// ── Render: Event Card ────────────────────────────────────────
function renderEventCard(ev) {
  const t = TIER[ev.tier] || TIER.tba;
  const days = daysUntil(ev.date);
  const badge = urgencyBadge(days);
  const pts = ev.pts > 0 ? `+${ev.pts.toLocaleString()} pts` : "no USA pts";

  return `
    <div class="ec-header" style="background:${t.bg};border-left:4px solid ${t.border}">
      <div class="ec-top">
        <span class="ec-tier" style="color:${t.fg}">${t.emoji} ${t.label}</span>
        <span class="ec-badge" style="background:${badge.color}">${badge.text}</span>
      </div>
      <div class="ec-name">${ev.name}</div>
      <div class="ec-meta">
        <span>📅 ${fmtDate(ev.date)}</span>
      </div>
      <div class="ec-meta">
        <span>📍 ${ev.loc}</span>
      </div>
      <div class="ec-footer">
        <span class="ec-pts" style="color:${t.fg}">${pts}</span>
        ${ev.notes ? `<span class="ec-notes">${ev.notes}</span>` : ""}
      </div>
    </div>
  `;
}

// ── Tab / Filter Control ──────────────────────────────────────
function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  renderPage();
}

function setFilter(f) {
  currentFilter = f;
  renderPage();
}

function renderPage() {
  const content = document.getElementById("content");
  if (currentTab === "home")   content.innerHTML = renderHome();
  if (currentTab === "events") content.innerHTML = renderEvents();
  if (currentTab === "points") content.innerHTML = renderPoints();
  if (currentTab === "grid")   content.innerHTML = renderGrid();
  content.scrollTop = 0;
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
  renderPage();
});

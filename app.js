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
  { date:"2026-08-01", name:"Trial Points System Activates",               loc:"USA-wide",                                tier:"system",   pts:0,              notes:"2025-26 results carry over. New season begins." },
  { date:"2026-10-09", name:"October NAC — Division I Men's Épée",         loc:"Orlando, FL — OCCC",                     tier:"national", pts:PTS.elite_win,  notes:"Elite win = 1,000 pts · National win = 200 pts.", isNAC:true },
  { date:"2026-11-20", name:"November NAC — Division I Men's Épée",        loc:"Columbus, OH",                           tier:"national", pts:PTS.elite_win,  notes:"Strong Oct result may qualify for Elite.", isNAC:true },
  { date:"2027-01-08", name:"January NAC — Division I Men's Épée",         loc:"Oklahoma City, OK",                      tier:"national", pts:PTS.elite_win,  notes:"Third NAC of the season.", isNAC:true },
  { date:"2027-02-01", name:"February NAC — Division I Men's Épée (TBA)",  loc:"TBA",                                    tier:"national", pts:PTS.elite_win,  notes:"Date/location TBA — announced ~Sep 2026.", isNAC:true },
  { date:"2027-04-16", name:"April NAC + Division I National Championship", loc:"Cincinnati, OH — First Financial Center",tier:"national", pts:PTS.elite_win,  notes:"Highest-value domestic event. Apr 16–19, 2027.", isNAC:true },
  { date:"2027-06-27", name:"Summer Nationals / July Challenge",            loc:"TBA",                                    tier:"national", pts:PTS.elite_win,  notes:"Season-ending championship. TBA.", isNAC:true },
  { date:"2026-10-03", name:"FIE World Cup (TBA)",                          loc:"TBA",                                    tier:"intl",     pts:PTS.intl,       notes:"International win = 4,000 pts. Accessible once top-12 USA.", isWorldCup:true },
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
  intl:     { emoji:"🌍", label:"FIE International",  bg:"#f3e8ff", fg:"#6b21a8", border:"#9333ea" },
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

// ── Going / my events (check off competitions you're attending) ──
function goingSet(){ try { return new Set(JSON.parse(localStorage.getItem("fc_going")||"[]")); } catch { return new Set(); } }
function isGoing(ev){ return goingSet().has(ev.date+"|"+ev.name); }
function toggleGoing(enc){
  const key = decodeURIComponent(enc);
  const s = goingSet();
  s.has(key) ? s.delete(key) : s.add(key);
  localStorage.setItem("fc_going", JSON.stringify([...s]));
  renderPage();
}

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

// Live events fetched from events.json (updated weekly by GitHub Actions)
let LIVE_EVENTS = [];

async function loadLiveEvents() {
  try {
    const res = await fetch("events.json?t=" + Date.now());
    const data = await res.json();
    LIVE_EVENTS = data.events || [];
    console.log("Loaded", LIVE_EVENTS.length, "live events, updated", data.updated);
  } catch (e) {
    console.warn("Could not load events.json:", e);
  }
  renderPage();
}

function allEvents() {
  const evs = [...EVENTS.map(e => ({...e, source:"USA Fencing"}))];

  // Merge live events (AskFred, FIE, RFEE) — skip duplicates by date+name
  const existing = new Set(evs.map(e => e.date + "|" + e.name));
  for (const ev of LIVE_EVENTS) {
    const key = ev.date + "|" + ev.name;
    if (!existing.has(key)) {
      existing.add(key);
      const tierMap = { local:"local", training:"training", worldcup:"intl", grandprix:"intl", satellite:"intl", championship:"national", intl:"intl" };
      const mappedTier = ev.source === "RFEE" ? "training" : (tierMap[ev.tier] || "local");
      evs.push({
        ...ev,
        tier: mappedTier,
        pts: mappedTier === "local" ? PTS.local_std : mappedTier === "training" ? 0 : PTS.intl,
        isWorldCup: ["intl"].includes(mappedTier),
        notes: ev.source === "FIE" ? "FIE international event. Win = 4,000 pts." : ev.source === "RFEE" ? "Spain training event — 0 USA Trial pts." : "AskFred local event — check for D1A eligibility.",
      });
    }
  }

  REGIONAL.forEach(d => evs.push({
    date:d, name:"ROC Regional Weekend", loc:REGIONAL_LOCS[d] || "Various, USA",
    tier:"regional", pts:PTS.regional_win, source:"USA Fencing Regional",
    notes:"D1A events at this weekend count for Trial pts. Check Airtable for full schedule."
  }));

  const upcoming = evs.filter(e => daysUntil(e.date) >= 0).sort((a,b) => a.date.localeCompare(b.date));

  // Dynamically assign Primary Target
  const inTop12 = FENCER.rank <= 12;
  const targetKey = inTop12 ? "isWorldCup" : "isNAC";
  const targetEv = upcoming.find(e => e[targetKey]);
  if (targetEv) {
    targetEv.tier = "target";
    targetEv.notes = "🎯 PRIMARY TARGET. " + (targetEv.notes || "");
  }

  return upcoming;
}

// ── Render: Grid Calendar ─────────────────────────────────────
function renderGrid() {
  const evMap = {};
  allEvents().forEach(ev => {
    const key = ev.date.substring(0,10);
    if (!evMap[key]) evMap[key] = [];
    evMap[key].push(ev);
  });
  const going = goingSet();

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
    <span class="gl-item" style="background:#f3e8ff;border-color:#9333ea">🌍 Intl</span>
    <span class="gl-item" style="background:#ffedd5;border-color:#ea580c">📋 Regional</span>
    <span class="gl-item" style="background:#ccfbf1;border-color:#0d9488">🇪🇸 Spain</span>
    <span class="gl-item" style="background:#dcfce7;border-color:#16a34a">✅ Going</span>
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
          const isGoingDay = ev ? evs.some(e => going.has(e.date + "|" + e.name)) : false;
          html += `<div class="grid-cell ${isToday?"grid-today":""} ${isGoingDay?"grid-going":""}"
            style="${t ? `background:${t.bg};border:1px solid ${t.border}` : ""}"
            ${ev ? `onclick="goToEvent('${key}')"` : ""}>
            <div class="grid-dom" style="${isToday?"color:#fff;background:#2563eb;border-radius:99px":""}">${dom}</div>
            ${ev ? `<div class="grid-ev-dot">${isGoingDay?"✅":t.emoji}</div>` : ""}
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

function goToEvent(date) {
  currentTab = "events";
  currentFilter = "all";
  renderPage();
  // After render, scroll to + highlight the card for this date
  setTimeout(() => {
    const card = document.querySelector(`.event-card[data-date="${date}"]`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("event-highlight");
      setTimeout(() => card.classList.remove("event-highlight"), 1800);
    }
  }, 80);
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

  `;
}

// ── Render: Events ────────────────────────────────────────────
function renderEvents() {
  let evs = allEvents();
  if (currentFilter === "mine") evs = evs.filter(isGoing);
  else if (currentFilter !== "all") evs = evs.filter(e => e.tier === currentFilter);

  const months = {};
  evs.forEach(e => {
    const m = fmtMonth(e.date);
    if (!months[m]) months[m] = [];
    months[m].push(e);
  });

  const filters = [
    { key:"all",      label:"All" },
    { key:"mine",     label:"⭐ Mine" },
    { key:"target",   label:"🎯 Target" },
    { key:"national", label:"🇺🇸 National" },
    { key:"intl",     label:"🌍 International" },
    { key:"regional", label:"📋 Regional" },
    { key:"training", label:"🇪🇸 Spain" },
  ];

  return `
    <div class="filter-bar">
      ${filters.map(f => `
        <button class="filter-btn ${currentFilter===f.key?"active":""}" onclick="setFilter('${f.key}')">${f.label}</button>
      `).join("")}
    </div>
    ${currentFilter==="mine" ? `
      <div class="source-note" style="display:flex;flex-direction:column;gap:8px">
        <span>🔔 You'll get an alert the moment registration opens for these events + all NACs.</span>
        <button onclick="exportWatchlist()"
          style="background:#1d4ed8;color:#fff;border:none;padding:9px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">
          📤 Export watch list (sync alerts)
        </button>
      </div>` : ""}
    ${Object.entries(months).map(([month, evs]) => `
      <div class="month-header">${month.toUpperCase()}</div>
      ${evs.map(e => `<div class="event-card" data-date="${e.date}">${renderEventCard(e)}</div>`).join("")}
    `).join("")}
    ${evs.length === 0 ? `<div class="empty">No events for this filter.</div>` : ""}
  `;
}

// Build the watch list (all NACs + checked-off events) and copy it so it can
// be synced to the cloud monitor that emails/pushes when registration opens.
function exportWatchlist() {
  const nacs = EVENTS.filter(e => e.isNAC).map(e => ({ date:e.date, name:e.name, loc:e.loc, source:"NAC" }));
  const going = allEvents().filter(isGoing).map(e => ({ date:e.date, name:e.name, loc:e.loc, source:"going" }));
  const seen = new Set();
  const events = [...nacs, ...going].filter(e => {
    const k = e.date + "|" + e.name;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).sort((a,b) => a.date.localeCompare(b.date));

  const payload = JSON.stringify({ updated: new Date().toISOString(), events }, null, 2);
  const done = () => alert("Watch list copied!\n\nPaste it to Claude (this chat owns the calendar) and it'll sync your alerts.\n\n" + events.length + " events watched.");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(payload).then(done, () => prompt("Copy this watch list and paste to Claude:", payload));
  } else {
    prompt("Copy this watch list and paste to Claude:", payload);
  }
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
  const going = isGoing(ev);

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
      <div class="going-wrap">
        <button class="going-btn ${going?"on":""}" onclick="event.stopPropagation();toggleGoing('${encodeURIComponent(ev.date+"|"+ev.name)}')">${going?"✓ Going — tap to remove":"+ I'm going"}</button>
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

// ── Airport lookup (city → nearest IATA) ─────────────────────
const AIRPORTS = {
  "Orlando":            "MCO", "Columbus":           "CMH",
  "Oklahoma City":      "OKC", "Cincinnati":         "CVG",
  "Edison":             "EWR", "Newark":             "EWR",
  "Ontario":            "ONT", "La Jolla":           "SAN",
  "San Diego":          "SAN", "Myrtle Beach":       "MYR",
  "Evanston":           "ORD", "Libertyville":       "ORD",
  "Grand Rapids":       "GRR", "Suffern":            "EWR",
  "Seattle":            "SEA", "Bellevue":           "SEA",
  "Tigard":             "PDX", "Portland":           "PDX",
  "Houston":            "IAH", "Dallas":             "DFW",
  "Round Rock":         "AUS", "Austin":             "AUS",
  "Santa Clara":        "SJC", "San Jose":           "SJC",
  "Metairie":           "MSY", "New Orleans":        "MSY",
  "Air Force Academy":  "COS", "Colorado Springs":   "COS",
  "Denver":             "DEN", "Virginia Beach":     "ORF",
  "Waterford":          "DTW", "Grand Rapids":       "GRR",
  "Jacksonville":       "JAX", "Providence":         "PVD",
  "Phoenixville":       "PHL", "Philadelphia":       "PHL",
  "College Park":       "BWI", "Fredericksburg":     "DCA",
  "Henderson":          "LAS", "Las Vegas":          "LAS",
  "Atlantic City":      "ACY", "Rochester":          "ROC",
  "Hartford":           "BDL", "New Haven":          "HVN",
  "Secaucus":           "EWR", "Danvers":            "BOS",
  "Torrance":           "LAX", "Pasadena":           "LAX",
  "Pomona":             "LAX", "Anaheim":            "LAX",
  "Suwanee":            "ATL", "Tampa":              "TPA",
  "Oxon Hill":          "DCA", "Richmond":           "RIC",
  "Saint Paul":         "MSP", "Minneapolis":        "MSP",
  "Carrollton":         "DFW", "El Paso":            "ELP",
  "Liberty Township":   "CVG", "Lewisville":         "DFW",
  "Norton":             "BOS", "Newtown":            "HVN",
  "Hillsborough Township": "EWR", "State College":   "SCE",
  "Palm Springs":       "PSP",
};

let flightFrom = "MAD";

function cityToAirport(loc) {
  const city = (loc || "").split(",")[0].split("·")[0].trim();
  return AIRPORTS[city] || null;
}

function flightDateStr(dateStr, offsetDays) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + offsetDays);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}

function googleFlightsUrl(from, to, depart, ret) {
  return `https://www.google.com/flights#flt=${from}.${to}.${depart}*${to}.${from}.${ret};c:USD;e:1;s:0*1;sd:1;t:f`;
}
function googleFlightsViaSD(from, to, departSpain, departSD, ret) {
  // Multi-city: Spain → San Diego → Event City → Spain
  return `https://www.google.com/flights#flt=${from}.SAN.${departSpain}*SAN.${to}.${departSD}*${to}.${from}.${ret};c:USD;e:1;s:0*1;sd:1;t:f`;
}

function renderFlights() {
  const evs = allEvents().filter(e =>
    ["target","national","intl","regional","local"].includes(e.tier) &&
    e.loc && e.loc !== "TBA" && !e.loc.includes("USA-wide")
  );

  const airports = ["MAD","VLC","BCN"];

  return `
    <div style="margin-bottom:12px">
      <div class="section-title" style="margin-top:4px">Departure Airport</div>
      <div style="display:flex;gap:8px">
        ${airports.map(a => `
          <button class="filter-btn ${flightFrom===a?"active":""}"
            onclick="flightFrom='${a}';renderPage()"
            style="flex:1;text-align:center;font-size:14px;font-weight:700">
            ${a==="MAD"?"🛫 Madrid":a==="VLC"?"🛫 Valencia":"🛫 Barcelona"}
          </button>`).join("")}
      </div>
    </div>

    <div class="source-note">
      Tap <b>Search Flights</b> to open Google Flights with airports and dates pre-filled.
      Prices shown are Google Flights estimates — book directly with the airline.
    </div>

    ${evs.map(ev => {
      const iata = cityToAirport(ev.loc);
      const t = TIER[ev.tier] || TIER.national;
      const depart = flightDateStr(ev.date, -2);
      const ret    = flightDateStr(ev.date, 4);
      const url    = iata ? googleFlightsUrl(flightFrom, iata, depart, ret) : null;
      const city   = (ev.loc || "").split(",")[0].split("·")[0].trim();

      return `
        <div class="event-card" style="margin-bottom:10px;overflow:hidden">
          <div class="ec-header">
            <div class="ec-top">
              <span class="ec-tier" style="color:${t.fg}">${t.emoji} ${t.label}</span>
              <span style="font-size:11px;color:#6b7280">${fmtDate(ev.date)}</span>
            </div>
            <div class="ec-name">${ev.name}</div>
            <div class="ec-meta">📍 ${ev.loc}</div>
          </div>
          <div style="padding:0 12px 12px;display:flex;gap:8px;flex-wrap:wrap">
            ${url ? `
              <a href="${url}" target="_blank" rel="noopener"
                style="flex:1;display:block;background:#1d4ed8;color:white;text-align:center;
                       padding:10px;border-radius:8px;font-size:13px;font-weight:700;
                       text-decoration:none">
                ✈️ ${flightFrom} → ${iata} → ${flightFrom}
              </a>` : `
              <span style="flex:1;text-align:center;padding:10px;border-radius:8px;
                           background:#f3f4f6;color:#9ca3af;font-size:13px">
                ✈️ ${city} — airport not mapped yet
              </span>`}
            ${url ? `
              <a href="${googleFlightsViaSD(flightFrom, iata, flightDateStr(ev.date,-4), depart, ret)}" target="_blank" rel="noopener"
                style="flex:1;display:block;background:#16a34a;color:white;text-align:center;
                       padding:10px;border-radius:8px;font-size:13px;font-weight:700;
                       text-decoration:none">
                🏠 Via San Diego
              </a>` : ""}
            ${url ? `
              <a href="https://www.skyscanner.com/transport/flights/${flightFrom.toLowerCase()}/${iata.toLowerCase()}/${depart.replace(/-/g,"").slice(2)}/${ret.replace(/-/g,"").slice(2)}/?adults=1&cabinclass=economy"
                target="_blank" rel="noopener"
                style="background:#00a1df;color:white;text-align:center;
                       padding:10px 14px;border-radius:8px;font-size:13px;font-weight:700;
                       text-decoration:none">
                Sky
              </a>` : ""}
          </div>
        </div>`;
    }).join("")}
    ${evs.length === 0 ? `<div class="empty">No upcoming events with locations.</div>` : ""}
  `;
}

function renderPage() {
  const content = document.getElementById("content");
  if (currentTab === "home")    content.innerHTML = renderHome();
  if (currentTab === "events")  content.innerHTML = renderEvents();
  if (currentTab === "points")  content.innerHTML = renderPoints();
  if (currentTab === "grid")    content.innerHTML = renderGrid();
  if (currentTab === "flights") content.innerHTML = renderFlights();
  content.scrollTop = 0;
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  renderPage();          // show immediately with hardcoded data
  loadLiveEvents();      // then fetch live data and re-render
});

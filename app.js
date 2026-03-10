// ═══════════════════════════════════════════════════
// APP.JS — CloudSec Tracker v4 — All Features
// ═══════════════════════════════════════════════════

// Expose App methods for inline event handlers
const App = {};

let currentFilter = "all";
let currentPage   = 0;
const DAYS_PER_PAGE = 25;
let charts = {};

// ── POMODORO STATE ──
const pomo = {
  active: false, paused: false,
  workMins: 25, breakMins: 5,
  secondsLeft: 25 * 60,
  isBreak: false, session: 0,
  interval: null, dayTarget: null,
};

// ═══ THEME / ACCENT / DENSITY ═══
function setThemeFromState(t) {
  state.theme = t;
  document.documentElement.setAttribute("data-theme", t);
  document.getElementById("btn-dark").classList.toggle("active", t === "dark");
  document.getElementById("btn-light").classList.toggle("active", t === "light");
  saveState();
  if (charts.bar) updateCharts();
}

function setAccent(a) {
  state.accent = a;
  document.documentElement.setAttribute("data-accent", a);
  document.querySelectorAll(".accent-dot").forEach(d => d.classList.toggle("active", d.dataset.a === a));
  saveState();
}

function setDensity(d) {
  state.density = d;
  document.documentElement.setAttribute("data-density", d);
  document.getElementById("btn-comfortable").classList.toggle("active", d === "comfortable");
  document.getElementById("btn-compact").classList.toggle("active", d === "compact");
  saveState();
}

// ═══ RENDER ALL ═══
function render() {
  updateStats();
  updateXpBar();
  updateCharts();
  renderPhases();
  renderDays();
  updateDeadlines();
  checkMilestones();
  renderHeatmap();
  updateForecastCard();
}

// ═══ COUNT-UP ANIMATION ═══
const countUpTargets = {};
function animateCount(el, target, suffix = "") {
  if (!el) return;
  const key = el.id;
  clearInterval(countUpTargets[key]);
  const start = parseInt(el.textContent) || 0;
  if (start === target) { el.textContent = target + suffix; return; }
  const diff = Math.abs(target - start);
  const step = target > start ? 1 : -1;
  const delay = diff > 20 ? 15 : diff > 10 ? 25 : 40;
  let cur = start;
  countUpTargets[key] = setInterval(() => {
    cur += step;
    el.textContent = cur + suffix;
    if (cur === target) clearInterval(countUpTargets[key]);
  }, delay);
}

// ═══ STATS ═══
function updateStats() {
  const { done, missed, frozen, streak, bestWeek, totalMinutes } = calcStats();

  animateCount(document.getElementById("stat-done"),   done);
  animateCount(document.getElementById("stat-missed"), missed);
  animateCount(document.getElementById("stat-streak"), streak);
  animateCount(document.getElementById("stat-pct"),    done, "%");
  animateCount(document.getElementById("stat-frozen"), frozen);

  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  const timeEl = document.getElementById("stat-time");
  if (timeEl) timeEl.textContent = totalMinutes > 0 ? timeStr : "—";

  document.getElementById("bar-done").style.width   = done   + "%";
  document.getElementById("bar-missed").style.width = missed + "%";
  document.getElementById("bar-streak").style.width = Math.min(streak, 100) + "%";
  document.getElementById("bar-pct").style.width    = done   + "%";

  document.getElementById("global-green").style.width = done   + "%";
  document.getElementById("global-red").style.width   = missed + "%";
  document.getElementById("global-red").style.left    = done   + "%";

  const frozenEl = document.getElementById("global-frozen");
  if (frozenEl) {
    frozenEl.style.width = frozen + "%";
    frozenEl.style.left  = (done + missed) + "%";
  }

  document.getElementById("progress-text").textContent = done + " / 100 days";
  document.getElementById("pie-pct-text").textContent   = done + "%";

  // Motivation ring
  const offset = 201 - (done / 100 * 201);
  document.getElementById("mot-ring-fill").style.strokeDashoffset = offset;
  document.getElementById("mot-ring-pct").textContent = done + "%";
  const nextDay = getNextDay();
  document.getElementById("mot-next").textContent = nextDay || 100;
}

// ═══ XP BAR ═══
function updateXpBar() {
  const rank = getRank(state.xp);
  const next = getNextRank(state.xp);

  document.getElementById("rank-icon").textContent = rank.icon;
  document.getElementById("rank-name").textContent = rank.name;
  document.getElementById("rank-name").style.color = rank.color;
  document.getElementById("rank-xp-total").textContent = state.xp.toLocaleString() + " XP";

  const barEl = document.getElementById("rank-bar-fill");
  if (next) {
    const pct = Math.round(((state.xp - rank.min) / (next.min - rank.min)) * 100);
    barEl.style.width = pct + "%";
    document.getElementById("rank-xp-text").textContent =
      `${state.xp - rank.min} / ${next.min - rank.min} XP to ${next.name}`;
  } else {
    barEl.style.width = "100%";
    document.getElementById("rank-xp-text").textContent = "MAX RANK ACHIEVED 👑";
  }
}

// ═══ FORECAST ═══
function updateForecastCard() {
  const { done, forecast } = calcStats();
  const { status, daysAhead } = getScheduleStatus();
  const el = document.getElementById("forecast-val");
  const subEl = document.getElementById("forecast-sub");
  const statusEl = document.getElementById("forecast-status");

  if (!el) return;

  if (forecast) {
    const fmt = d => d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
    el.textContent = fmt(forecast.date);
    subEl.textContent = `At ${forecast.rate} days/day pace · ${forecast.daysNeeded} calendar days left`;
  } else {
    el.textContent = "Set a start date";
    subEl.textContent = "to see your completion forecast";
  }

  if (statusEl) {
    const statusMap = {
      ahead:   { text: `⚡ ${Math.abs(daysAhead)} days ahead of schedule`, cls: "s-green" },
      behind:  { text: `⏰ ${Math.abs(daysAhead)} days behind schedule`,   cls: "s-red" },
      ontrack: { text: "✅ Right on track",                                  cls: "s-ac" },
    };
    const s = statusMap[status] || statusMap.ontrack;
    statusEl.textContent = s.text;
  }
}

// ═══ DEADLINE ═══
function updateDeadlines() {
  const disp  = document.getElementById("deadline-display");
  const badge = document.getElementById("hero-today-badge");
  if (!state.startDate) {
    disp.innerHTML  = "Set a start date to see your exam deadlines →";
    badge.innerHTML = "📅 <strong>Set a start date below</strong>";
    return;
  }
  const start = new Date(state.startDate);
  const ccp   = new Date(start); ccp.setDate(ccp.getDate() + 62);
  const sec   = new Date(start); sec.setDate(sec.getDate() + 99);
  const fmt   = d => d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  disp.innerHTML = `🎯 CCP: <strong>${fmt(ccp)}</strong> &nbsp;·&nbsp; 🏆 Sec+: <strong>${fmt(sec)}</strong>`;

  const { calDay, nextDay, daysAhead, status } = getScheduleStatus();
  if (new Date(state.startDate) > new Date()) {
    const d = Math.ceil((new Date(state.startDate) - new Date()) / (1000*60*60*24));
    badge.innerHTML = `📅 Journey starts in <strong>${d} day${d===1?"":"s"}</strong>`;
  } else if (!nextDay) {
    badge.innerHTML = `🏆 <strong>All 100 days complete!</strong> You did it!`;
  } else if (daysAhead > 2) {
    badge.innerHTML = `⚡ <strong>${daysAhead} days ahead!</strong> Up next: Day ${nextDay} — ${TOPICS[nextDay]||""}`;
  } else if (daysAhead < -2) {
    badge.innerHTML = `⏰ <strong>${Math.abs(daysAhead)} days behind.</strong> Catch up: Day ${nextDay}`;
  } else {
    badge.innerHTML = `📅 Today: <strong>Day ${nextDay}</strong> — ${TOPICS[nextDay]||""}`;
  }

  // Update motivation quote
  document.getElementById("motivational-quote").textContent = '"' + getMotivationalQuote() + '"';
}

// ═══ CHARTS ═══
function getChartDefaults() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    grid: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.07)",
    text: isDark ? "#444" : "#bbb",
    legend: isDark ? "#666" : "#999",
  };
}

function initCharts() {
  const c = getChartDefaults();
  Chart.defaults.font.family = "'DM Mono', monospace";
  Chart.defaults.color = c.text;

  // Doughnut
  charts.pie = new Chart(document.getElementById("pieChart"), {
    type: "doughnut",
    data: {
      labels: ["Completed ✅", "Missed ❌", "Frozen ❄️", "Remaining"],
      datasets: [{ data: [0,0,0,100], backgroundColor: ["#34d399","#f87171","#60a5fa55","#1e1e1e"], borderWidth:0, hoverOffset:6 }]
    },
    options: {
      responsive:true, maintainAspectRatio:false, cutout:"70%",
      plugins: {
        legend: { position:"bottom", labels:{ padding:12, usePointStyle:true, pointStyle:"circle", font:{size:10} } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} days` } }
      }
    }
  });

  // Bar
  charts.bar = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: Array.from({length:14}, (_,i) => "W"+(i+1)),
      datasets: [
        { label:"Done",    data:Array(14).fill(0), backgroundColor:"rgba(52,211,153,.25)",  borderColor:"#34d399", borderWidth:1, borderRadius:4 },
        { label:"Missed",  data:Array(14).fill(0), backgroundColor:"rgba(248,113,113,.25)", borderColor:"#f87171", borderWidth:1, borderRadius:4 },
        { label:"StudyHrs",data:Array(14).fill(0), backgroundColor:"rgba(96,165,250,.2)",   borderColor:"#60a5fa", borderWidth:1, borderRadius:4, yAxisID:"y2" },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      scales: {
        x:  { grid:{color:c.grid}, ticks:{font:{size:9}} },
        y:  { grid:{color:c.grid}, ticks:{stepSize:1}, beginAtZero:true, position:"left" },
        y2: { grid:{display:false}, ticks:{font:{size:9}}, beginAtZero:true, position:"right" }
      },
      plugins: { legend:{ labels:{ padding:12, font:{size:10} } } }
    }
  });

  // Line (cumulative)
  charts.line = new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels: Array.from({length:100}, (_,i) => i+1),
      datasets: [
        { label:"Your Progress", data:Array(100).fill(0), borderColor:"#60a5fa", backgroundColor:"rgba(96,165,250,.06)", fill:true, tension:.35, pointRadius:0, borderWidth:2 },
        { label:"Ideal",         data:Array.from({length:100},(_,i)=>i+1), borderColor:"#333", borderDash:[5,4], fill:false, tension:0, pointRadius:0, borderWidth:1.5 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      scales: {
        x: { grid:{color:c.grid}, ticks:{maxTicksLimit:10,font:{size:9}} },
        y: { grid:{color:c.grid}, beginAtZero:true, max:100 }
      },
      plugins: { legend:{ labels:{padding:12,font:{size:10}} } }
    }
  });

  // Radar
  charts.radar = new Chart(document.getElementById("radarChart"), {
    type: "radar",
    data: {
      labels: PHASES.map(p => p.name),
      datasets: [{
        label:"% Done", data:[0,0,0,0],
        backgroundColor:"rgba(96,165,250,.1)", borderColor:"#60a5fa",
        pointBackgroundColor:"#60a5fa", borderWidth:1.5, pointRadius:3
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      scales: { r: {
        grid:{color:c.grid}, ticks:{stepSize:25,backdropColor:"transparent",font:{size:9}},
        pointLabels:{font:{size:10}}, min:0, max:100
      }},
      plugins: { legend:{ labels:{padding:12,font:{size:10}} } }
    }
  });

  // Study time area
  charts.study = new Chart(document.getElementById("studyChart"), {
    type: "line",
    data: {
      labels: Array.from({length:100}, (_,i) => i+1),
      datasets: [{
        label:"Study Minutes",
        data: Array.from({length:100}, (_,i) => state.studyTime[i+1] || 0),
        borderColor:"#fbbf24", backgroundColor:"rgba(251,191,36,.07)",
        fill:true, tension:.4, pointRadius:0, borderWidth:2
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      scales: {
        x: { grid:{color:c.grid}, ticks:{maxTicksLimit:10,font:{size:9}} },
        y: { grid:{color:c.grid}, beginAtZero:true }
      },
      plugins: { legend:{ labels:{padding:12,font:{size:10}} } }
    }
  });
}

function updateCharts() {
  if (!charts.pie) return;
  const { done, missed, frozen } = calcStats();
  const c = getChartDefaults();
  const remaining = Math.max(0, 100 - done - missed - frozen);

  charts.pie.data.datasets[0].data = [done, missed, frozen, remaining];
  charts.pie.data.datasets[0].backgroundColor = ["#34d399","#f87171","rgba(96,165,250,.4)","#1e1e1e"];
  if (document.documentElement.getAttribute("data-theme") === "light") {
    charts.pie.data.datasets[0].backgroundColor[3] = "#f0f0f0";
  }
  charts.pie.update("none");

  const weekly = getWeeklyData();
  charts.bar.data.datasets[0].data = weekly.map(w => w.done);
  charts.bar.data.datasets[1].data = weekly.map(w => w.missed);
  charts.bar.data.datasets[2].data = weekly.map(w => Math.round(w.minutes / 60 * 10) / 10);
  charts.bar.options.scales.x.grid.color = c.grid;
  charts.bar.options.scales.y.grid.color = c.grid;
  charts.bar.update("none");

  let cum = 0;
  charts.line.data.datasets[0].data = Array.from({length:100}, (_,i) => {
    if (state.progress[i+1] === "yes") cum++;
    return cum;
  });
  charts.line.options.scales.x.grid.color = c.grid;
  charts.line.options.scales.y.grid.color = c.grid;
  charts.line.update("none");

  charts.radar.data.datasets[0].data = phaseStats().map(p => p.pct);
  charts.radar.update("none");

  charts.study.data.datasets[0].data = Array.from({length:100}, (_,i) => state.studyTime[i+1] || 0);
  charts.study.options.scales.x.grid.color = c.grid;
  charts.study.options.scales.y.grid.color = c.grid;
  charts.study.update("none");
}

// ═══ HEATMAP (GitHub style) ═══
function renderHeatmap() {
  const wrap = document.getElementById("heatmap-wrap");
  if (!wrap) return;
  const nextDay = getNextDay();

  // 14 weeks x 7 days
  let html = '<div class="heatmap-labels">';
  for (let w = 1; w <= 14; w++) html += `<div class="heatmap-wlbl">W${w}</div>`;
  html += '</div><div class="heatmap-grid">';

  for (let w = 0; w < 14; w++) {
    html += '<div class="heatmap-week">';
    for (let d = 0; d < 7; d++) {
      const day = w * 7 + d + 1;
      if (day > 100) { html += '<div></div>'; continue; }
      const st  = state.progress[day];
      const cls = st === "yes" ? "done" : st === "no" ? "missed" : st === "freeze" ? "frozen" : "";
      const today = nextDay === day ? "today" : "";
      const mins  = state.studyTime[day] || 0;
      html += `<div class="heatmap-cell ${cls} ${today}" 
        title="Day ${day}: ${TOPICS[day]}${mins ? ' · '+mins+'min' : ''}"
        onclick="jumpToDay(${day})"></div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  wrap.innerHTML = html;
}

// Jump to day in tracker
function jumpToDay(day) {
  const page = Math.floor((day - 1) / DAYS_PER_PAGE);
  App.setPage(page);
  currentFilter = "all";
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.textContent.trim().startsWith("All")));
  document.getElementById("tracker")?.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    document.getElementById(`dc-${day}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 400);
}

// ═══ PHASES ═══
function renderPhases() {
  document.getElementById("phases-grid").innerHTML = phaseStats().map(p => `
    <div class="phase-card" style="background:${p.bg};border-color:${p.border}">
      <div class="phase-top">
        <div>
          <div class="phase-name" style="color:${p.color}">${p.name}</div>
          <div class="phase-lbl">${p.label}</div>
          <div class="phase-range">Days ${p.days[0]}–${p.days[1]} · ${p.total} days</div>
        </div>
        <div class="phase-pct" style="color:${p.color}">${p.pct}%</div>
      </div>
      <div class="phase-track"><div class="phase-fill" style="width:${p.pct}%;background:${p.color}"></div></div>
      <div class="phase-stats-row">
        <div class="phase-stat"><div class="phase-stat-val" style="color:#34d399">${p.done}</div><div class="phase-stat-lbl">Done</div></div>
        <div class="phase-stat"><div class="phase-stat-val" style="color:#f87171">${p.missed}</div><div class="phase-stat-lbl">Missed</div></div>
        <div class="phase-stat"><div class="phase-stat-val" style="color:#60a5fa">${p.frozen}</div><div class="phase-stat-lbl">Frozen</div></div>
      </div>
      ${p.minutes > 0 ? `<div style="font-size:10px;color:var(--muted);margin-top:10px">⏱ ${Math.floor(p.minutes/60)}h ${p.minutes%60}m studied</div>` : ""}
    </div>`).join("");
}

// ═══ DAYS GRID ═══
function renderDays() {
  const grid  = document.getElementById("days-grid");
  const start = currentPage * DAYS_PER_PAGE + 1;
  const end   = Math.min(start + DAYS_PER_PAGE - 1, 100);
  let days    = Array.from({length: end - start + 1}, (_, i) => start + i);
  const nextDay = getNextDay();

  if (currentFilter === "done")    days = days.filter(d => state.progress[d] === "yes");
  else if (currentFilter === "missed")  days = days.filter(d => state.progress[d] === "no");
  else if (currentFilter === "pending") days = days.filter(d => !state.progress[d]);
  else if (currentFilter === "frozen")  days = days.filter(d => state.progress[d] === "freeze");

  grid.innerHTML = days.map(day => {
    const phase  = getPhase(day);
    const st     = state.progress[day];
    const note   = state.notes[day] || "";
    const mins   = state.studyTime[day] || "";
    const isNext = nextDay === day;
    const xp     = state.studyTime[day] ? getXpForDay(day, state.studyTime[day]) : 10;

    return `
    <div class="day-card ${st==="yes"?"done":st==="no"?"missed":st==="freeze"?"frozen":""} ${isNext?"today-c":""}" id="dc-${day}">
      <div class="day-stripe" style="background:${phase.color}"></div>
      ${st==="yes" ? `<div class="day-xp-chip">+${xp} XP</div>` : ""}
      <div class="day-meta">
        <span class="day-num">DAY ${day}</span>
        <span class="day-tag" style="background:${phase.color}18;color:${phase.color};border:1px solid ${phase.color}28">${phase.name}</span>
      </div>
      ${isNext ? '<div class="day-next-badge">📍 UP NEXT</div>' : ""}
      <div class="day-topic">${TOPICS[day]}</div>
      <div class="day-time-row">
        <span class="day-time-icon">⏱</span>
        <input class="day-time-input" type="number" min="0" max="999" placeholder="mins"
          value="${mins}" title="Study time in minutes"
          onchange="App.saveTime(${day}, this.value)"
          onblur="App.saveTime(${day}, this.value)"/>
        <span class="day-time-lbl">min</span>
      </div>
      <textarea class="day-note-area" placeholder="Notes..."
        onchange="App.saveNote(${day}, this.value)"
        onblur="App.saveNote(${day}, this.value)">${escapeHtml(note)}</textarea>
      <div class="day-btns">
        <button class="day-btn ${st==="yes"?"yes-on":""}" onclick="App.markDay(${day},'yes')" title="Done ✅">✅</button>
        <button class="day-btn ${st==="no"?"no-on":""}"  onclick="App.markDay(${day},'no')"  title="Missed ❌">❌</button>
        <button class="day-btn ${st==="freeze"?"ice-on":""}" onclick="App.markDay(${day},'freeze')" title="Freeze Day ❄️">❄️</button>
      </div>
    </div>`;
  }).join("");
}

function renderPageBtns() {
  const total = Math.ceil(100 / DAYS_PER_PAGE);
  document.getElementById("page-btns").innerHTML = Array.from({length:total}, (_, i) =>
    `<button class="page-btn ${i===currentPage?"active":""}" onclick="App.setPage(${i})">P${i+1}</button>`
  ).join("");
}

// ═══ RESOURCES ═══
function renderResources() {
  document.getElementById("resources-container").innerHTML = RESOURCES.map(sec => `
    <div class="res-block">
      <div class="res-sec-title" style="background:${sec.color}12;color:${sec.color};border:1px solid ${sec.color}28;border-bottom:none">${sec.title}</div>
      <table class="res-table">
        <thead><tr><th></th><th>#</th><th>Resource</th><th>What</th><th>Cost</th><th>★</th><th>Tip</th></tr></thead>
        <tbody>${sec.items.map((r,i) => `
          <tr>
            <td><input type="checkbox" class="res-check" ${state.resources[r.name]?"checked":""}
              onchange="App.toggleResource('${escapeHtml(r.name)}', this.checked)" title="Mark as completed"/></td>
            <td style="color:var(--muted);font-size:9px">${i+1}</td>
            <td><a class="res-link ${state.resources[r.name]?"" :""}" href="${r.url}" target="_blank" rel="noopener"
              style="${state.resources[r.name]?"text-decoration:line-through;opacity:.5":""}">${r.name}</a></td>
            <td style="color:var(--text2)">${r.what}</td>
            <td>${getBadge(r.cost)}</td>
            <td><span class="stars">${"★".repeat(r.stars)}${"☆".repeat(5-r.stars)}</span></td>
            <td style="color:var(--muted);font-style:italic;font-size:9.5px">${r.tip}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`).join("");
}

function getBadge(cost) {
  if (cost === "free")      return '<span class="res-badge badge-free">FREE</span>';
  if (cost.includes("trial")) return '<span class="res-badge badge-trial">TRIAL</span>';
  if (cost === "free+paid") return '<span class="res-badge badge-free">FREE</span><span class="res-badge badge-paid">+PAID</span>';
  return `<span class="res-badge badge-paid">${cost.toUpperCase()}</span>`;
}

// ═══ CERTS ═══
function renderCerts() {
  const stars = n => "⭐".repeat(n);
  document.getElementById("cert-tbody").innerHTML = CERTS.map(c => `
    <tr>
      <td style="font-weight:600">${c.name}</td>
      <td style="color:#fbbf24">${c.cost}</td>
      <td style="color:var(--text2)">${c.diff}</td>
      <td style="color:var(--text2)">${c.time}</td>
      <td>${stars(c.job)}</td>
      <td>${stars(c.cloud)}</td>
      <td class="${c.vtype==="do"?"v-do":c.vtype==="skip"?"v-skip":"v-late"}">${c.verdict}</td>
      <td><a href="${c.url}" target="_blank" rel="noopener" class="res-link" style="font-size:9px">↗</a></td>
    </tr>
    <tr>
      <td colspan="8" style="color:var(--muted);font-size:9.5px;padding:4px 14px 12px;font-style:italic;border-bottom:1px solid var(--border)">💡 ${c.reason}</td>
    </tr>`).join("");
}

// ═══ CAREER ═══
function renderCareer() {
  document.getElementById("career-grid").innerHTML = CAREER_ROLES.map(r => `
    <div class="career-card">
      <div class="career-icon">${r.icon}</div>
      <div class="career-title">${r.title}</div>
      <div class="career-sal">${r.sal}</div>
      <div class="career-skills"><span style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Skills: </span>${r.skills}</div>
      <div class="career-helps">${r.helps}</div>
      <a href="${r.link}" target="_blank" rel="noopener" class="career-link">View Jobs ↗</a>
    </div>`).join("");
}

// ═══ MILESTONES ═══
function checkMilestones() {
  const { done } = calcStats();
  const milestone = MILESTONES.filter(m => m.at <= done).pop();
  if (!milestone || milestone.at <= state.lastMilestone) return;

  // Boss battle for phase endings
  const isBoss = [30, 60, 75, 100].includes(milestone.at);
  state.lastMilestone = milestone.at;
  saveState();

  if (isBoss) {
    showBossBattle(milestone);
  } else {
    showMilestone(milestone);
  }
}

function showMilestone(m) {
  document.getElementById("m-emoji").textContent  = m.emoji;
  document.getElementById("m-title").textContent  = m.title;
  document.getElementById("m-msg").textContent    = m.msg;
  document.getElementById("milestone-banner").classList.add("show");
  if (m.at >= 50) launchConfetti();
  setTimeout(() => document.getElementById("milestone-banner").classList.remove("show"), 8000);
}

function showBossBattle(m) {
  const modal = document.getElementById("boss-modal");
  document.getElementById("boss-emoji").textContent = m.emoji;
  document.getElementById("boss-title").textContent = m.title;
  document.getElementById("boss-msg").textContent   = m.msg;
  document.getElementById("boss-xp").textContent    = `+${m.xp} XP`;
  state.xp += m.xp;
  saveState();
  updateXpBar();
  modal.classList.add("show");
  launchConfetti();
}

// ═══ INTERACTIONS ═══
App.markDay = function(day, val) {
  const prev = state.progress[day];
  if (prev === val) {
    delete state.progress[day];
    // remove xp
    if (val === "yes") {
      const xp = getXpForDay(day, state.studyTime[day] || 0);
      state.xp = Math.max(0, state.xp - xp);
    }
  } else {
    // Add xp when marking done
    if (val === "yes" && prev !== "yes") {
      const xp = getXpForDay(day, state.studyTime[day] || 0);
      state.xp += xp;
      showToast(`Day ${day} done! +${xp} XP 🎉`, "✅", "#34d399");
    } else if (val === "freeze") {
      showToast(`Day ${day} frozen ❄️ — streak protected!`, "❄️", "#60a5fa");
    }
    state.progress[day] = val;
  }
  saveState();
  render();
};

App.saveNote = function(day, val) {
  if (val.trim()) state.notes[day] = val.trim();
  else delete state.notes[day];
  saveState();
};

App.saveTime = function(day, val) {
  const mins = parseInt(val) || 0;
  if (mins > 0) {
    // Recalculate XP if day is marked done
    if (state.progress[day] === "yes") {
      const oldXp = getXpForDay(day, state.studyTime[day] || 0);
      const newXp = getXpForDay(day, mins);
      state.xp = Math.max(0, state.xp - oldXp + newXp);
    }
    state.studyTime[day] = mins;
  } else {
    delete state.studyTime[day];
  }
  saveState();
  updateStats();
  updateXpBar();
  updateCharts();
  renderHeatmap();
};

App.toggleResource = function(name, checked) {
  if (checked) state.resources[name] = true;
  else delete state.resources[name];
  saveState();
  const done  = Object.keys(state.resources).length;
  const total = RESOURCES.reduce((a,s) => a + s.items.length, 0);
  showToast(`Resources: ${done}/${total} completed`, "📚", "#a78bfa");
};

App.setFilter = function(f, el) {
  currentFilter = f;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  renderDays();
};

App.setPage = function(p) {
  currentPage = p;
  renderDays();
  renderPageBtns();
};

// ═══ SEARCH ═══
function initSearch() {
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { results.classList.remove("show"); return; }
    const matches = [];
    for (let d = 1; d <= 100; d++) {
      const topic = (TOPICS[d] || "").toLowerCase();
      const tag   = (TOPIC_TAGS[d] || "").toLowerCase();
      if (topic.includes(q) || tag.includes(q) || String(d).includes(q)) {
        matches.push({ day: d, topic: TOPICS[d], tag: TOPIC_TAGS[d] });
      }
    }
    if (!matches.length) {
      results.innerHTML = `<div class="search-item"><span class="search-item-topic" style="color:var(--muted)">No results for "${input.value}"</span></div>`;
    } else {
      results.innerHTML = matches.slice(0, 8).map(m => `
        <div class="search-item" onclick="jumpToDay(${m.day}); document.getElementById('search-input').value=''; document.getElementById('search-results').classList.remove('show')">
          <span class="search-item-day">Day ${m.day}</span>
          <span class="search-item-topic">${m.topic}</span>
          <span class="search-item-tag">${m.tag}</span>
        </div>`).join("");
    }
    results.classList.add("show");
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Escape") { results.classList.remove("show"); input.blur(); }
  });

  document.addEventListener("click", e => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.remove("show");
    }
  });
}

// ═══ POMODORO ═══
function openPomodoro() {
  document.getElementById("pomo-modal").classList.add("show");
  updatePomoDisplay();
}

function closePomodoro() {
  document.getElementById("pomo-modal").classList.remove("show");
}

function startPomo() {
  if (pomo.interval) return;
  pomo.active = true;
  pomo.paused = false;
  pomo.interval = setInterval(tickPomo, 1000);
  document.getElementById("pomo-start").textContent = "Running...";
}

function pausePomo() {
  if (!pomo.active) return;
  pomo.paused = !pomo.paused;
  if (pomo.paused) {
    clearInterval(pomo.interval);
    pomo.interval = null;
    document.getElementById("pomo-start").textContent = "Resume";
  } else {
    startPomo();
  }
}

function resetPomo() {
  clearInterval(pomo.interval);
  pomo.interval   = null;
  pomo.active     = false;
  pomo.paused     = false;
  pomo.isBreak    = false;
  pomo.session    = 0;
  pomo.secondsLeft = pomo.workMins * 60;
  document.getElementById("pomo-start").textContent = "Start";
  updatePomoDisplay();
}

function tickPomo() {
  pomo.secondsLeft--;
  updatePomoDisplay();
  if (pomo.secondsLeft <= 0) {
    clearInterval(pomo.interval);
    pomo.interval = null;
    if (!pomo.isBreak) {
      pomo.session++;
      // Auto-log 25 min to next pending day
      const nd = getNextDay();
      if (nd) {
        state.studyTime[nd] = (state.studyTime[nd] || 0) + pomo.workMins;
        saveState();
        showToast(`+${pomo.workMins}min logged to Day ${nd} ⏱`, "⏱", "#fbbf24");
        updateCharts();
        renderDays();
      }
      pomo.isBreak    = true;
      pomo.secondsLeft = pomo.breakMins * 60;
    } else {
      pomo.isBreak    = false;
      pomo.secondsLeft = pomo.workMins * 60;
    }
    // Auto-start next
    pomo.active = true;
    pomo.interval = setInterval(tickPomo, 1000);
    document.getElementById("pomo-start").textContent = "Running...";
    updatePomoDisplay();
    // Browser notification
    sendNotification(pomo.isBreak ? "Break time! 5 min 🧘" : "Back to work! 25 min 💪");
  }
}

function updatePomoDisplay() {
  const m = Math.floor(pomo.secondsLeft / 60).toString().padStart(2,"0");
  const s = (pomo.secondsLeft % 60).toString().padStart(2,"0");
  document.getElementById("pomo-time").textContent = `${m}:${s}`;

  const total = (pomo.isBreak ? pomo.breakMins : pomo.workMins) * 60;
  const progress = 1 - pomo.secondsLeft / total;
  const circ = 282; // 2π * 45
  const offset = circ - progress * circ;
  const ring = document.getElementById("pomo-ring");
  if (ring) ring.style.strokeDashoffset = offset;

  document.getElementById("pomo-phase").textContent = pomo.isBreak ? "BREAK TIME 🧘" : "FOCUS TIME 💪";

  // Session dots
  const dotsEl = document.getElementById("pomo-dots");
  if (dotsEl) {
    dotsEl.innerHTML = Array.from({length:4}, (_,i) =>
      `<div class="pomo-dot ${i < pomo.session ? "done" : ""}"></div>`
    ).join("");
  }
}

// ═══ REMINDER ═══
function saveReminder() {
  state.reminderTime    = document.getElementById("reminder-time").value;
  state.reminderEnabled = document.getElementById("reminder-toggle").checked;
  saveState();
  if (state.reminderEnabled && state.reminderTime) {
    requestNotificationPermission();
    showToast(`Reminder set for ${state.reminderTime} ⏰`, "⏰", "#fbbf24");
  } else {
    showToast("Reminder disabled", "🔕", "#888");
  }
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendNotification(msg) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("☁️ CloudSec Tracker", { body: msg, icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☁️</text></svg>" });
  }
}

// Check reminder time every minute
function startReminderLoop() {
  setInterval(() => {
    if (!state.reminderEnabled || !state.reminderTime) return;
    const now = new Date();
    const [h, m] = state.reminderTime.split(":").map(Number);
    if (now.getHours() === h && now.getMinutes() === m) {
      const nd = getNextDay();
      if (nd) sendNotification(`Time to study! Day ${nd}: ${TOPICS[nd]}`);
    }
  }, 60000);
}

// ═══ EXPORT / IMPORT / SHARE ═══
App.exportData = function() {
  const { done, missed, streak } = calcStats();
  const blob = new Blob([JSON.stringify({ version:4, exported:new Date().toISOString(), summary:{done,missed,streak}, state }, null, 2)], { type:"application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `cloudsec_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported! (${done} days done)`, "⬇️", "#34d399");
};

App.importData = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (parsed.state?.progress) { Object.assign(state, parsed.state); }
      else if (parsed.progress)   { state.progress = parsed.progress; }
      saveState();
      if (state.startDate) document.getElementById("start-date").value = state.startDate;
      setThemeFromState(state.theme || "dark");
      setAccent(state.accent || "blue");
      setDensity(state.density || "comfortable");
      updateDeadlines();
      render();
      renderResources();
      showToast(`Imported! ${Object.values(state.progress).filter(v=>v==="yes").length} days restored`, "⬆️", "#60a5fa");
    } catch { showToast("Could not read file", "❌", "#f87171"); }
    e.target.value = "";
  };
  reader.readAsText(file);
};

App.exportPdf = function() {
  const { done, missed, streak } = calcStats();
  const rank = getRank(state.xp);
  const startFmt = state.startDate ? new Date(state.startDate).toLocaleDateString("en-IN") : "Not set";

  const win = window.open("", "_blank");
  win.document.write(`
    <html><head><title>CloudSec Progress Certificate</title>
    <style>
      body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:24px;color:#0a0a0a}
      h1{font-size:28px;font-weight:900;margin-bottom:4px}
      .sub{color:#666;margin-bottom:30px}
      .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:30px}
      .stat{border:2px solid #eee;border-radius:8px;padding:16px;text-align:center}
      .stat-v{font-size:32px;font-weight:900}
      .stat-l{font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px}
      .rank{background:#0a0a0a;color:#fbbf24;padding:14px 20px;border-radius:8px;font-size:16px;font-weight:700;text-align:center;margin-bottom:20px}
      .bar-wrap{margin-bottom:20px}
      .bar-lbl{font-size:11px;color:#666;margin-bottom:4px;display:flex;justify-content:space-between}
      .bar{height:12px;background:#eee;border-radius:99px;overflow:hidden}
      .bar-fill{height:100%;background:linear-gradient(90deg,#34d399,#60a5fa);border-radius:99px}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th,td{border:1px solid #eee;padding:8px 10px;font-size:11px;text-align:left}
      th{background:#f8f8f8;font-weight:600}
      .footer{color:#999;font-size:10px;text-align:center;margin-top:30px}
    </style></head><body>
    <h1>☁️ CloudSec Journey Report</h1>
    <div class="sub">Generated on ${new Date().toLocaleDateString("en-IN")} · Started: ${startFmt}</div>
    <div class="rank">${rank.icon} ${rank.name} · ${state.xp.toLocaleString()} XP</div>
    <div class="grid">
      <div class="stat"><div class="stat-v" style="color:#34d399">${done}</div><div class="stat-l">Days Done</div></div>
      <div class="stat"><div class="stat-v" style="color:#f87171">${missed}</div><div class="stat-l">Missed</div></div>
      <div class="stat"><div class="stat-v" style="color:#fbbf24">${streak}</div><div class="stat-l">Streak</div></div>
    </div>
    <div class="bar-wrap">
      <div class="bar-lbl"><span>Overall Progress</span><span>${done}/100 days (${done}%)</span></div>
      <div class="bar"><div class="bar-fill" style="width:${done}%"></div></div>
    </div>
    <table>
      <tr><th>Phase</th><th>Done</th><th>Missed</th><th>Progress</th></tr>
      ${phaseStats().map(p => `<tr><td>${p.name}: ${p.label}</td><td>${p.done}</td><td>${p.missed}</td><td>${p.pct}%</td></tr>`).join("")}
    </table>
    <div class="footer">CloudSec 100-Day Tracker · AWS CCP → CompTIA Security+ · Share on LinkedIn!</div>
    <script>window.print();<\/script>
    </body></html>`);
  win.document.close();
};

App.shareUrl = function() {
  const url = encodeStateToUrl();
  const modal = document.getElementById("share-modal");
  document.getElementById("share-url-display").textContent = url;
  modal.classList.add("show");
};

App.copyShareUrl = function() {
  const url = document.getElementById("share-url-display").textContent;
  navigator.clipboard.writeText(url).then(() => {
    showToast("Link copied to clipboard!", "🔗", "#a78bfa");
  });
};

// ═══ KEYBOARD SHORTCUTS ═══
function initKeyboardShortcuts() {
  document.addEventListener("keydown", e => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    if (e.ctrlKey || e.metaKey) return;

    const shortcut = SHORTCUTS[e.key];
    if (shortcut) shortcut(e);

    if (e.key === "?") {
      document.getElementById("kbd-overlay").classList.toggle("show");
    }
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("show"));
      document.getElementById("kbd-overlay").classList.remove("show");
    }
  });
}

// ═══ SECTION COLLAPSE ═══
function toggleSection(bodyId) {
  const body   = document.getElementById(bodyId);
  const toggle = document.getElementById("toggle-" + bodyId);
  if (!body) return;
  if (window.innerWidth > 600) { body.classList.remove("collapsed"); if (toggle) toggle.textContent = "▾"; return; }
  const collapsed = body.classList.toggle("collapsed");
  if (toggle) toggle.textContent = collapsed ? "▸" : "▾";
}

function setActive(el) {
  document.querySelectorAll(".nav-link").forEach(n => n.classList.remove("active"));
  el.classList.add("active");
}

// ═══ MOBILE NAV ═══
function toggleDrawer() {
  const d = document.getElementById("mob-drawer");
  const h = document.getElementById("hamburger");
  d.classList.toggle("open");
  h.classList.toggle("open", d.classList.contains("open"));
}

function drawerNav(el, hash) {
  document.getElementById("mob-drawer").classList.remove("open");
  document.getElementById("hamburger").classList.remove("open");
  document.querySelectorAll(".mob-drawer .nav-link").forEach(n => n.classList.remove("active"));
  el.classList.add("active");
  const bodyId = hash.replace("#","") + "-body";
  const body   = document.getElementById(bodyId);
  if (body?.classList.contains("collapsed")) toggleSection(bodyId);
  setTimeout(() => document.querySelector(hash)?.scrollIntoView({behavior:"smooth"}), 80);
}

function tabNav(el, hash) {
  document.querySelectorAll(".tab-item").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  const bodyId = hash.replace("#","") + "-body";
  const body   = document.getElementById(bodyId);
  if (body?.classList.contains("collapsed")) toggleSection(bodyId);
  document.querySelector(hash)?.scrollIntoView({behavior:"smooth"});
}

document.addEventListener("click", e => {
  const d = document.getElementById("mob-drawer");
  const h = document.getElementById("hamburger");
  if (d?.classList.contains("open") && !d.contains(e.target) && !h?.contains(e.target)) {
    d.classList.remove("open"); h?.classList.remove("open");
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 600) {
    document.querySelectorAll(".section-body").forEach(b => b.classList.remove("collapsed"));
    document.querySelectorAll(".section-toggle").forEach(t => t.textContent = "▾");
  }
});

// ═══ TOAST ═══
let toastTimer = null;
function showToast(msg, icon = "✅", color = "#34d399") {
  const t = document.getElementById("toast");
  document.getElementById("toast-msg").textContent  = msg;
  document.getElementById("toast-icon").textContent = icon;
  t.style.borderColor  = color + "44";
  t.style.transform    = "translateY(0)";
  t.style.opacity      = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.style.transform = "translateY(80px)";
    t.style.opacity   = "0";
  }, 3200);
}

// ═══ CONFETTI ═══
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx    = canvas.getContext("2d");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = "block";
  const COLORS = ["#60a5fa","#34d399","#fbbf24","#f87171","#a78bfa","#f472b6","#34d399"];
  const pieces = Array.from({length:130}, () => ({
    x: Math.random()*canvas.width, y:-20,
    w: Math.random()*11+3, h: Math.random()*5+2,
    r: Math.random()*Math.PI*2,
    vx: (Math.random()-.5)*4.5,
    vy: Math.random()*4+2,
    vr: (Math.random()-.5)*.2,
    color: COLORS[Math.floor(Math.random()*COLORS.length)],
    opacity: 1,
  }));
  let frame = 0;
  const tick = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (frame > 100) p.opacity = Math.max(0, p.opacity - .012);
      ctx.save(); ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 260 && pieces.some(p => p.opacity > 0)) requestAnimationFrame(tick);
    else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display = "none"; }
  };
  requestAnimationFrame(tick);
}

// ═══ START DATE ═══
function saveStartDate() {
  state.startDate = document.getElementById("start-date").value || null;
  saveState();
  updateDeadlines();
  renderDays();
}

// ═══ SCROLL SPY ═══
function initScrollSpy() {
  const sections = ["overview","charts","phases","tracker","resources","certs","career"];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        document.querySelectorAll(".nav-link").forEach(n =>
          n.classList.toggle("active", n.getAttribute("href") === "#" + id));
      }
    });
  }, { threshold: .15, rootMargin: "-60px 0px 0px 0px" });
  sections.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
}

// ═══ HELPER ═══
function getPhase(day) { return PHASES.find(p => day >= p.days[0] && day <= p.days[1]) || PHASES[0]; }
function escapeHtml(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
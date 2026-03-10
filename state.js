// ═══════════════════════════════════════════════════
// STATE.JS — Persistence, XP, Streaks, Game Logic
// ═══════════════════════════════════════════════════

const STORAGE_KEY = "cloudsec_v4";

const DEFAULT_STATE = {
  // Core progress
  progress: {},      // {1: "yes"|"no"|"freeze", ...}
  notes: {},         // {1: "note text", ...}
  studyTime: {},     // {1: 90, ...} minutes per day
  resources: {},     // {"resource_name": true, ...}

  // Settings
  startDate: null,
  theme: "dark",
  accent: "blue",
  density: "comfortable",

  // Gamification
  xp: 0,
  lastMilestone: 0,

  // Reminder
  reminderTime: null,  // "HH:MM" or null
  reminderEnabled: false,

  // Meta
  version: 4,
  createdAt: null,
};

let state = { ...DEFAULT_STATE };

// ── LOAD ──
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...DEFAULT_STATE, ...parsed };
    }
  } catch(e) { console.warn("State load failed", e); }

  // Migrate from v3
  try {
    const old = localStorage.getItem("cloudsec_v3");
    if (old && !Object.keys(state.progress).length) {
      const o = JSON.parse(old);
      if (o.progress) state.progress = o.progress;
      if (o.notes)    state.notes    = o.notes;
      if (o.startDate) state.startDate = o.startDate;
      saveState();
    }
  } catch(e) {}
}

// ── SAVE ──
function saveState() {
  try {
    if (!state.createdAt) state.createdAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) { console.warn("State save failed", e); }
}

// ── COMPUTED STATS ──
function calcStats() {
  const done   = Object.values(state.progress).filter(v => v === "yes").length;
  const missed = Object.values(state.progress).filter(v => v === "no").length;
  const frozen = Object.values(state.progress).filter(v => v === "freeze").length;
  const marked = done + missed + frozen;

  // Current streak from day 1 (consecutive yes or freeze)
  let streak = 0;
  for (let d = 1; d <= 100; d++) {
    if (state.progress[d] === "yes" || state.progress[d] === "freeze") streak++;
    else if (state.progress[d] === "no") break;
    else break;
  }

  // Best week
  let bestWeek = 0, worstWeek = 7;
  let bestWeekNum = 1, worstWeekNum = 1;
  for (let w = 0; w < 14; w++) {
    const s = w*7+1, e = Math.min(s+6, 100);
    const days = Array.from({length: e-s+1}, (_,i) => s+i);
    const weekDone = days.filter(d => state.progress[d] === "yes").length;
    const weekMarked = days.filter(d => state.progress[d] && state.progress[d] !== "freeze").length;
    if (weekMarked > 0) {
      if (weekDone > bestWeek)  { bestWeek = weekDone; bestWeekNum = w+1; }
      if (weekDone <= worstWeek && weekMarked >= 3) { worstWeek = weekDone; worstWeekNum = w+1; }
    }
  }

  // Total study time
  const totalMinutes = Object.values(state.studyTime).reduce((a,b) => a+b, 0);

  // Completion forecast
  let forecast = null;
  if (done > 0 && state.startDate) {
    const start = new Date(state.startDate);
    const now = new Date();
    const elapsed = Math.max(1, Math.ceil((now - start) / (1000*60*60*24)));
    const rate = done / elapsed; // days done per calendar day
    if (rate > 0) {
      const remaining = 100 - done;
      const daysNeeded = Math.ceil(remaining / rate);
      const finishDate = new Date();
      finishDate.setDate(finishDate.getDate() + daysNeeded);
      forecast = { date: finishDate, daysNeeded, rate: rate.toFixed(2) };
    }
  }

  return { done, missed, frozen, marked, streak, bestWeek, bestWeekNum,
           worstWeek: worstWeek === 7 ? 0 : worstWeek, worstWeekNum,
           totalMinutes, forecast, pct: done };
}

function phaseStats() {
  return PHASES.map(p => {
    const days = Array.from({length: p.days[1]-p.days[0]+1}, (_,i) => i+p.days[0]);
    const done   = days.filter(d => state.progress[d] === "yes").length;
    const missed = days.filter(d => state.progress[d] === "no").length;
    const frozen = days.filter(d => state.progress[d] === "freeze").length;
    const minutes = days.reduce((a,d) => a + (state.studyTime[d] || 0), 0);
    return { ...p, done, missed, frozen, total: days.length,
             pct: Math.round(done/days.length*100), minutes };
  });
}

// ── XP SYSTEM ──
function getXpForDay(day, minutes) {
  let xp = 10; // base
  if (minutes >= 30)  xp += 10;
  if (minutes >= 60)  xp += 15;
  if (minutes >= 90)  xp += 25;
  if (minutes >= 120) xp += 20; // bonus for 2hr+

  // Bonus for special days
  const topic = TOPICS[day] || "";
  if (topic.includes("EXAM"))  xp += 50;
  if (topic.includes("MOCK"))  xp += 30;
  if (topic.includes("LAB") || topic.includes("Lab")) xp += 20;
  if (topic.includes("Review")) xp += 5;

  return xp;
}

function getRank(xp) {
  let rank = XP_RANKS[0];
  for (const r of XP_RANKS) {
    if (xp >= r.min) rank = r;
  }
  return rank;
}

function getNextRank(xp) {
  for (let i = 0; i < XP_RANKS.length - 1; i++) {
    if (xp < XP_RANKS[i+1].min) return XP_RANKS[i+1];
  }
  return null;
}

// ── SCHEDULE ──
function getCalendarDay() {
  if (!state.startDate) return null;
  const start = new Date(state.startDate);
  const now   = new Date();
  start.setHours(0,0,0,0); now.setHours(0,0,0,0);
  const diff = Math.floor((now - start) / (1000*60*60*24)) + 1;
  return (diff >= 1 && diff <= 100) ? diff : null;
}

function getNextDay() {
  for (let d = 1; d <= 100; d++) {
    if (!state.progress[d]) return d;
  }
  return null;
}

function getScheduleStatus() {
  const calDay  = getCalendarDay();
  const nextDay = getNextDay();
  if (!calDay || !nextDay) return { calDay, nextDay, daysAhead: 0, status: "ontrack" };
  const diff = calDay - nextDay; // positive = ahead
  const status = diff > 2 ? "ahead" : diff < -2 ? "behind" : "ontrack";
  return { calDay, nextDay, daysAhead: diff, status };
}

function getMotivationalQuote() {
  const { status } = getScheduleStatus();
  const pool = QUOTES_BY_STATUS[status] || QUOTES_BY_STATUS.general;
  return pool[Math.floor(Date.now() / 86400000) % pool.length];
}

// ── WEEK STATS ──
function getWeeklyData() {
  return Array.from({length:14}, (_,w) => {
    const s = w*7+1, e = Math.min(s+6, 100);
    const days = Array.from({length: e-s+1}, (_,i) => s+i);
    return {
      week: w+1,
      done:    days.filter(d => state.progress[d] === "yes").length,
      missed:  days.filter(d => state.progress[d] === "no").length,
      frozen:  days.filter(d => state.progress[d] === "freeze").length,
      minutes: days.reduce((a,d) => a + (state.studyTime[d]||0), 0),
    };
  });
}

// ── URL SYNC ──
function encodeStateToUrl() {
  // Compact encoding: "1y2n3y..." for progress
  let encoded = "";
  for (let d = 1; d <= 100; d++) {
    const v = state.progress[d];
    encoded += v === "yes" ? "y" : v === "no" ? "n" : v === "freeze" ? "f" : ".";
  }
  const url = new URL(window.location.href);
  url.searchParams.set("p", encoded);
  if (state.startDate) url.searchParams.set("s", state.startDate);
  return url.toString();
}

function decodeStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get("p");
  const s = params.get("s");
  if (!p || p.length !== 100) return false;
  const map = { "y":"yes", "n":"no", "f":"freeze", ".": undefined };
  const progress = {};
  for (let i = 0; i < 100; i++) {
    const v = map[p[i]];
    if (v) progress[i+1] = v;
  }
  state.progress = progress;
  if (s) state.startDate = s;
  saveState();
  return true;
}

// ── KEYBOARD SHORTCUTS ──
const SHORTCUTS = {
  "d": () => { const nd = getNextDay(); if(nd) App.markDay(nd, "yes"); },
  "m": () => { const nd = getNextDay(); if(nd) App.markDay(nd, "no"); },
  "f": () => { const nd = getNextDay(); if(nd) App.markDay(nd, "freeze"); },
  "n": () => {
    const nd = getNextDay();
    if (!nd) return;
    const page = Math.floor((nd-1)/25);
    App.setPage(page);
    document.getElementById("tracker")?.scrollIntoView({behavior:"smooth"});
    setTimeout(() => document.querySelector(`#dc-${nd} textarea`)?.focus(), 400);
  },
  "/": (e) => {
    e.preventDefault();
    document.getElementById("search-input")?.focus();
  },
  "t": () => setThemeFromState(state.theme === "dark" ? "light" : "dark"),
};
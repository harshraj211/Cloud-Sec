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
  bestStreak: 0,
  lastPhaseUnlocked: 0,

  // Tags & custom topics
  revisionTags: {},   // {day: true}
  customTopics: {},   // {day: "custom text"}

  // Week summaries (auto-generated)
  weekSummaries: {},  // {weekNum: {done, missed, minutes, xp, generatedAt}}

  // Exam dates
  ccpExamDate: null,
  secExamDate: null,

  // Streak shield
  maxFreezes: 5,

  // Sound
  soundEnabled: true,

  // Reminder
  reminderTime: null,
  reminderEnabled: false,

  // Late freeze suggestion (track last shown)
  lastFreezePrompt: null,

  // Meta
  version: 5,
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

  // Best streak ever
  let runStreak = 0, bestStreak = state.bestStreak || 0;
  for (let d = 1; d <= 100; d++) {
    if (state.progress[d] === "yes" || state.progress[d] === "freeze") {
      runStreak++;
      if (runStreak > bestStreak) bestStreak = runStreak;
    } else if (state.progress[d] === "no") {
      runStreak = 0;
    }
  }
  if (bestStreak > (state.bestStreak || 0)) { state.bestStreak = bestStreak; }

  // Freeze count used
  const freezesUsed = frozen;

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

  return { done, missed, frozen, marked, streak, bestStreak, freezesUsed,
           bestWeek, bestWeekNum,
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

// ── WEEK SUMMARY GENERATOR ──
function generateWeekSummary(weekNum) {
  const s = (weekNum-1)*7+1, e = Math.min(s+6, 100);
  const days = Array.from({length: e-s+1}, (_,i) => s+i);
  const done    = days.filter(d => state.progress[d] === "yes").length;
  const missed  = days.filter(d => state.progress[d] === "no").length;
  const frozen  = days.filter(d => state.progress[d] === "freeze").length;
  const minutes = days.reduce((a,d) => a + (state.studyTime[d]||0), 0);
  const xpEarned = days.filter(d => state.progress[d]==="yes")
                       .reduce((a,d) => a + getXpForDay(d, state.studyTime[d]||0), 0);
  const topics  = days.filter(d => state.progress[d]==="yes").map(d => TOPICS[d]).filter(Boolean);
  const phase   = PHASES.find(p => s >= p.days[0] && s <= p.days[1]) || PHASES[0];
  const hrs     = Math.floor(minutes/60), mins = minutes%60;
  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  const emoji   = done >= 6 ? "🔥" : done >= 4 ? "💪" : done >= 2 ? "📈" : "😤";
  return { weekNum, done, missed, frozen, minutes, timeStr, xpEarned, topics, phase, emoji,
           total: days.length, generatedAt: Date.now() };
}

function shouldShowWeeklySummary() {
  const { done } = calcStats();
  if (!done) return null;
  // Check each completed week
  for (let w = 1; w <= 14; w++) {
    const e = Math.min(w*7, 100);
    const days = Array.from({length:7}, (_,i) => (w-1)*7+1+i).filter(d=>d<=100);
    const allMarked = days.every(d => state.progress[d]);
    if (allMarked && !state.weekSummaries?.[w]) return w;
  }
  return null;
}

// ── PHASE UNLOCK DETECTOR ──
function getCurrentPhase() {
  const { done } = calcStats();
  for (let i = PHASES.length-1; i >= 0; i--) {
    if (done >= PHASES[i].days[0]-1) return { phase: PHASES[i], index: i };
  }
  return { phase: PHASES[0], index: 0 };
}

function checkPhaseUnlock() {
  const { done } = calcStats();
  for (let i = 1; i < PHASES.length; i++) {
    const threshold = PHASES[i].days[0] - 1;
    if (done >= threshold && (state.lastPhaseUnlocked || 0) < i) {
      state.lastPhaseUnlocked = i;
      saveState();
      return { phase: PHASES[i], index: i };
    }
  }
  return null;
}

// ── EXAM COUNTDOWN ──
function getExamCountdowns() {
  const result = { ccp: null, sec: null };
  const now = new Date(); now.setHours(0,0,0,0);

  if (state.ccpExamDate) {
    const d = new Date(state.ccpExamDate); d.setHours(0,0,0,0);
    const diff = Math.ceil((d - now) / (1000*60*60*24));
    result.ccp = { date: d, days: diff, passed: diff < 0 };
  }
  if (state.secExamDate) {
    const d = new Date(state.secExamDate); d.setHours(0,0,0,0);
    const diff = Math.ceil((d - now) / (1000*60*60*24));
    result.sec = { date: d, days: diff, passed: diff < 0 };
  }
  // Fallback from start date
  if (!result.ccp && state.startDate) {
    const s = new Date(state.startDate);
    const ccp = new Date(s); ccp.setDate(ccp.getDate()+62); ccp.setHours(0,0,0,0);
    const diff = Math.ceil((ccp - now) / (1000*60*60*24));
    result.ccpEstimate = { date: ccp, days: diff, passed: diff < 0 };
  }
  if (!result.sec && state.startDate) {
    const s = new Date(state.startDate);
    const sec = new Date(s); sec.setDate(sec.getDate()+99); sec.setHours(0,0,0,0);
    const diff = Math.ceil((sec - now) / (1000*60*60*24));
    result.secEstimate = { date: sec, days: diff, passed: diff < 0 };
  }
  return result;
}

// ── LINKEDIN POST GENERATOR ──
function generateLinkedInPost() {
  const { done, streak, totalMinutes } = calcStats();
  const rank = getRank(state.xp);
  const phase = getCurrentPhase().phase;
  const hrs = Math.floor(totalMinutes/60);
  const templates = [
    `🚀 Day ${done} of my 100-day Cloud Security journey — just completed!\n\n` +
    `Currently in ${phase.name}: ${phase.label}\n` +
    `🔥 ${streak}-day streak | ⏱ ${hrs}+ hours studied | 🏅 Rank: ${rank.name}\n\n` +
    `Working toward: AWS Cloud Practitioner → CompTIA Security+\n\n` +
    `The grind is real but so is the progress. If you're on a similar journey, let's connect!\n\n` +
    `#CloudSecurity #AWS #CompTIA #SecurityPlus #100DaysOfCloud #Cybersecurity #LearningInPublic`,

    `📊 ${done}/100 days done on my Cloud Security roadmap.\n\n` +
    `What I've covered so far:\n` +
    `${phase.name}: ${phase.label}\n\n` +
    `Key tools I've been working with: AWS, IAM, VPC, CloudTrail, GuardDuty, CloudGoat\n\n` +
    `Target certs: AWS CCP + CompTIA Security+\n` +
    `Current streak: ${streak} days 🔥\n\n` +
    `Building in public. Sharing everything I learn.\n\n` +
    `#AWS #CloudSecurity #Cybersecurity #SecurityPlus #LearningInPublic`,

    `💡 ${done} days into my 100-day Cloud Security challenge.\n\n` +
    `Today's focus: ${TOPICS[done] || phase.label}\n\n` +
    `This roadmap has completely changed how I think about cloud infrastructure security.\n\n` +
    `Rank achieved: ${rank.icon} ${rank.name}\n\n` +
    `Anyone else doing a structured cybersecurity learning sprint? Drop a comment 👇\n\n` +
    `#CloudSecurity #AWS #100DayChallenge #Cybersecurity #TechCareer`,
  ];
  return templates[done % templates.length];
}

// ── NOTES EXPORT (Markdown journal) ──
function exportNotesAsMarkdown() {
  const { done } = calcStats();
  let md = `# ☁️ CloudSec Study Journal\n\n`;
  md += `**Generated:** ${new Date().toLocaleDateString("en-IN")}\n`;
  md += `**Progress:** ${done}/100 days\n\n---\n\n`;

  for (let d = 1; d <= 100; d++) {
    const note    = state.notes[d];
    const status  = state.progress[d];
    const mins    = state.studyTime[d];
    const topic   = TOPICS[d];
    const phase   = getPhaseForDay(d);
    const isRevision = state.revisionTags?.[d];

    if (!note && !status) continue;

    const statusIcon = status === "yes" ? "✅" : status === "no" ? "❌" : status === "freeze" ? "❄️" : "⏳";
    md += `## ${statusIcon} Day ${d} — ${topic}\n`;
    md += `*${phase.name} · ${phase.label}*`;
    if (mins) md += ` · ⏱ ${mins} min`;
    if (isRevision) md += ` · 🔖 NEEDS REVISION`;
    md += `\n\n`;
    if (note) md += `${note}\n\n`;
    md += `---\n\n`;
  }
  return md;
}

function getPhaseForDay(day) {
  return PHASES.find(p => day >= p.days[0] && day <= p.days[1]) || PHASES[0];
}

// ── LATE FREEZE SUGGESTION ──
function shouldSuggestFreeze() {
  if (!state.startDate) return false;
  const now = new Date();
  const hour = now.getHours();
  if (hour < 21) return false; // Only after 9pm

  const calDay = getCalendarDay();
  if (!calDay) return false;

  const todayKey = now.toISOString().slice(0,10);
  if (state.lastFreezePrompt === todayKey) return false;

  // Today's calendar day not marked yet
  if (!state.progress[calDay]) return calDay;
  return false;
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
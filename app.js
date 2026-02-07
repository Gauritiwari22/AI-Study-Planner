const formData = { student: { name: "", college: "", branch: "", gradYear: "", email: "" }, availability: { weekdays: "", weekends: "", preferred: "morning" }, target: "", subjects: [] };

const el = (q) => document.querySelector(q);
const els = (q) => document.querySelectorAll(q);
const state = { student: {}, availability: {}, target: "", subjects: [], weights: {}, calendar: {}, adapt: {}, subjectsLocked: false };

function initInputs() {
    el("#student-name").value = formData.student.name;
    el("#student-college").value = formData.student.college;
    el("#student-branch").value = formData.student.branch;
    el("#student-gradyear").value = formData.student.gradYear;
    el("#student-email").value = formData.student.email;
    el("#weekdays-hours").value = formData.availability.weekdays;
    el("#weekends-hours").value = formData.availability.weekends;
    el("#preferred-time").value = formData.availability.preferred;
    el("#target-date").value = formData.target;
    renderSubjects(formData.subjects);
}

function renderSubjects(list) {
    const c = el("#subjects-list");
    c.innerHTML = "";
    list.forEach((s, i) => {
        const d = document.createElement("div");
        d.className = "subject-card";
        d.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center"><strong>${i + 1}. ${s.name}</strong><span class="chip">Credits: ${s.credits}</span></div><div class="subject-grid"><label>Strong Areas<input type="text" data-id="${s.id}" data-key="strong" value="${s.strong.join(", ")}"></label><label>Weak Areas<input type="text" data-id="${s.id}" data-key="weak" value="${s.weak.join(", ")}"></label><label>Confidence (1-5)<input type="number" min="1" max="5" data-id="${s.id}" data-key="confidence" value="${s.confidence}"></label></div>`;
        c.appendChild(d);
    });
    c.querySelectorAll('input[data-key]').forEach(inp => {
        inp.addEventListener("change", (e) => {
            const id = e.target.getAttribute("data-id");
            const key = e.target.getAttribute("data-key");
            const subj = formData.subjects.find(x => x.id === id);
            if (key === "strong" || key === "weak") {
                subj[key] = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
            } else {
                subj[key] = Number(e.target.value);
            }
            state.subjectsLocked = false;
        });
    });
}

function addSubject() {
    const n = el("#new-subject-name").value.trim();
    const cr = Number(el("#new-subject-credits").value);
    if (!n || !cr) return;
    const id = n.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    formData.subjects.push({ id, name: n, credits: cr, strong: [], weak: [], confidence: 3 });
    renderSubjects(formData.subjects);
    state.subjectsLocked = false;
    el("#new-subject-name").value = "";
    el("#new-subject-credits").value = "";
}

function readState() {
    state.student = { name: el("#student-name").value.trim(), college: el("#student-college").value.trim(), branch: el("#student-branch").value.trim(), gradYear: Number(el("#student-gradyear").value), email: el("#student-email").value.trim() };
    state.availability = { weekdays: Number(el("#weekdays-hours").value), weekends: Number(el("#weekends-hours").value), preferred: el("#preferred-time").value };
    state.target = el("#target-date").value;
    if (!state.subjectsLocked) {
        state.subjects = JSON.parse(JSON.stringify(formData.subjects));
    }
}

function scoreSubject(s) {
    const base = s.credits;
    const weak = s.weak.length;
    const conf = s.confidence;
    return base + weak * 0.75 + (4 - conf) * 1.1;
}

function computeWeights() {
    const scores = state.subjects.map(s => ({ id: s.id, score: scoreSubject(s) }));
    const sum = scores.reduce((a, b) => a + b.score, 0);
    const weights = {};
    scores.forEach(x => { weights[x.id] = x.score / sum });
    state.weights = weights;
}

function preferredSlots(pref) {
    if (pref === "morning") return [{ start: 6, end: 9, focus: "high" }, { start: 9, end: 11, focus: "medium" }];
    if (pref === "afternoon") return [{ start: 13, end: 15, focus: "high" }, { start: 15, end: 17, focus: "medium" }];
    if (pref === "evening") return [{ start: 17, end: 19, focus: "high" }, { start: 19, end: 21, focus: "medium" }];
    return [{ start: 19, end: 22, focus: "high" }, { start: 22, end: 23, focus: "medium" }];
}

function lowSlots(pref) {
    if (pref === "morning") return [{ start: 11, end: 12, focus: "low" }];
    if (pref === "afternoon") return [{ start: 10, end: 12, focus: "low" }];
    if (pref === "evening") return [{ start: 13, end: 15, focus: "low" }];
    return [{ start: 17, end: 18, focus: "low" }];
}

function hoursPerWeek() { return state.availability.weekdays * 5 + state.availability.weekends * 2; }
function bufferHours(total) { return Math.max(1, Math.round(total * 0.1)); }
function chooseByWeight() { return [...state.subjects].sort((a, b) => state.weights[b.id] - state.weights[a.id]); }
function blockTypeFor(focus) { return focus === "high" ? "learning" : focus === "medium" ? "practice" : "revision"; }
function displayWindow(pref) {
    if (pref === "morning") return { start: 6, end: 12 };
    if (pref === "afternoon") return { start: 10, end: 18 };
    if (pref === "evening") return { start: 13, end: 22 };
    return { start: 17, end: 23 };
}
function buildHourSlots(days, blocks) {
    const slots = [];
    blocks.forEach(b => {
        for (let h = b.start; h < b.end; h++) {
            slots.push({ day: b.day, hour: h, focus: b.focus });
        }
    });
    return slots;
}
function distributeCounts(totalSlots) {
    const base = state.subjects.map(s => ({ id: s.id, weight: state.weights[s.id] || 0 }));
    const raw = base.map(x => ({ id: x.id, exact: x.weight * totalSlots }));
    const counts = {};
    raw.forEach(r => { counts[r.id] = Math.floor(r.exact); });
    let used = Object.values(counts).reduce((a, b) => a + b, 0);
    const remainder = totalSlots - used;
    const byFrac = raw.sort((a, b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)));
    for (let i = 0; i < remainder; i++) {
        const id = byFrac[i % byFrac.length].id;
        counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
}
function hasTopic(subject, topic) {
    const t = topic.toLowerCase();
    return subject.strong.some(s => s.toLowerCase().includes(t)) || subject.weak.some(s => s.toLowerCase().includes(t));
}

function buildWeekCalendar() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const pref = preferredSlots(state.availability.preferred);
    const low = lowSlots(state.availability.preferred);
    const total = hoursPerWeek();
    const buf = bufferHours(total);
    const allocHours = total - buf;
    const cal = { headers: days, rows: [] };
    const blocks = [];
    pref.forEach(ps => { days.forEach(d => { blocks.push({ day: d, start: ps.start, end: ps.end, focus: ps.focus }) }) });
    low.forEach(ls => { days.forEach(d => { blocks.push({ day: d, start: ls.start, end: ls.end, focus: ls.focus }) }) });
    const slots = buildHourSlots(days, blocks);
    const usableSlots = Math.min(allocHours, slots.length);
    const counts = distributeCounts(usableSlots);
    const subjectById = Object.fromEntries(state.subjects.map(s => [s.id, s]));
    const sequence = [];
    const prereqMap = {};
    state.subjects.forEach(s => {
        const name = s.name.toLowerCase();
        if (name.includes("data structure") && s.weak.some(w => /graphs?/i.test(w)) && hasTopic(s, "trees")) {
            prereqMap[s.id] = { topic: "Trees", target: Math.max(1, Math.floor((counts[s.id] || 0) * 0.3)), used: 0 };
        }
    });
    for (let i = 0; i < usableSlots; i++) {
        const remaining = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const pick = remaining.find(([id]) => {
            const req = prereqMap[id];
            return req && req.used < req.target;
        }) || remaining[0];
        if (!pick) break;
        const [id] = pick;
        counts[id] -= 1;
        const subject = subjectById[id];
        const prereq = prereqMap[id];
        const topic = prereq && prereq.used < prereq.target ? prereq.topic : "";
        if (prereq && prereq.used < prereq.target) prereq.used += 1;
        sequence.push({ subject, topic });
    }
    const assignments = [];
    for (let i = 0; i < usableSlots; i++) {
        const slot = slots[i];
        const chosen = sequence[i];
        if (!chosen) break;
        assignments.push({ day: slot.day, start: slot.hour, end: slot.hour + 1, focus: slot.focus, subject: chosen.subject, kind: blockTypeFor(slot.focus), topic: chosen.topic, use: 1 });
    }
    const window = displayWindow(state.availability.preferred);
    const bufBlocks = [];
    for (let k = 0; k < buf; k++) {
        const day = days[(usableSlots + k) % days.length];
        const hour = Math.min(window.end, Math.max(window.start, window.start + (k % Math.max(1, window.end - window.start + 1))));
        bufBlocks.push({ day, start: hour, end: hour + 1, focus: "low", subject: null, kind: "buffer", use: 1 });
    }
    cal.rows = assignments.concat(bufBlocks);
    state.calendar = cal;
}

function renderCalendar() {
    const c = el("#calendar");
    c.innerHTML = "";
    const window = displayWindow(state.availability.preferred);
    const totalRows = window.end - window.start + 1;
    c.style.gridTemplateRows = `36px repeat(${totalRows}, 60px)`;
    const head = document.createElement("div");
    head.className = "col-head";
    head.textContent = "Time";
    head.style.gridRow = "1";
    head.style.gridColumn = "1";
    c.appendChild(head);
    state.calendar.headers.forEach((h, idx) => {
        const d = document.createElement("div");
        d.className = "col-head";
        d.textContent = h;
        d.style.gridRow = "1";
        d.style.gridColumn = String(idx + 2);
        c.appendChild(d);
    });
    for (let h = window.start; h <= window.end; h++) {
        const t = document.createElement("div");
        t.className = "time-cell";
        t.textContent = (h < 10 ? "0" + h : h) + ":00";
        t.style.gridRow = String(h - window.start + 2);
        t.style.gridColumn = "1";
        c.appendChild(t);
    }
    state.calendar.headers.forEach((day, dayIdx) => {
        for (let h = window.start; h <= window.end; h++) {
            const slot = document.createElement("div");
            slot.className = "slot";
            slot.style.gridRow = String(h - window.start + 2);
            slot.style.gridColumn = String(dayIdx + 2);
            const blocks = state.calendar.rows.filter(r => r.day === day && h >= r.start && h < r.end);
            if (blocks.length) {
                const b = blocks[0];
                const title = document.createElement("div");
                title.className = "title";
                title.textContent = b.subject ? b.subject.name : "Buffer";
                const meta = document.createElement("div");
                meta.className = "meta";
                meta.textContent = b.topic ? `${b.kind} • ${b.topic}` : b.kind;
                slot.appendChild(title);
                slot.appendChild(meta);
                if (b.kind === "learning") slot.classList.add("learn");
                if (b.kind === "practice") slot.classList.add("prac");
                if (b.kind === "revision") slot.classList.add("rev");
                if (b.kind === "buffer") slot.classList.add("buf");
                if (b.kind === "learning") slot.classList.add("hl");
                else if (b.kind === "practice") slot.classList.add("ml");
                else slot.classList.add("ll");
            }
            c.appendChild(slot);
        }
    });
}

function renderBreakdown() {
    const b = el("#breakdown");
    b.innerHTML = "";
    const total = hoursPerWeek();
    const buf = bufferHours(total);
    const alloc = total - buf;
    state.subjects.forEach(s => {
        const pct = state.weights[s.id];
        const hrs = Math.round(pct * alloc);
        const row = document.createElement("div");
        const bar = document.createElement("div");
        bar.className = "bar";
        const fill = document.createElement("span");
        fill.style.width = (pct * 100).toFixed(0) + "%";
        fill.style.background = pct > 0.45 ? "#ff6b6b" : pct > 0.25 ? "#f4b942" : "#4cd4a0";
        bar.appendChild(fill);
        const title = document.createElement("div");
        title.innerHTML = `<strong>${s.name}</strong> — ${hrs} hrs/week`;
        const justify = document.createElement("div");
        const j = [];
        if (s.confidence <= 2) j.push("Low confidence");
        if (s.credits >= 4) j.push("Higher credits");
        if (s.weak.length > 0) j.push("Weak topics present");
        justify.className = "justify";
        justify.textContent = j.length ? j.join(" • ") : "Balanced load";
        row.appendChild(title); row.appendChild(bar); row.appendChild(justify);
        b.appendChild(row);
    });
}

function prerequisiteTips() {
    const tips = [];
    state.subjects.forEach(s => {
        const name = s.name.toLowerCase();
        if (name.includes("data structure")) {
            if (s.weak.find(w => /graphs?/i.test(w)) && hasTopic(s, "trees")) tips.push("Revise Trees before Graphs");
            if (s.weak.find(w => /graphs?/i.test(w)) && !hasTopic(s, "trees")) tips.push("Add Trees as a prerequisite topic before Graphs");
        }
        if (name.includes("operating")) { if (s.weak.find(w => /deadlocks?/i.test(w))) tips.push("Review synchronization before Deadlocks") }
        if (name.includes("math")) { if (s.weak.find(w => /laplace/i.test(w))) tips.push("Complete Laplace Transform by Week 3") }
    });
    return tips;
}

function renderPriorities() {
    const p = el("#priorities");
    p.innerHTML = "";
    const ordered = chooseByWeight();
    const tips = prerequisiteTips();
    tips.forEach(t => { const d = document.createElement("div"); d.className = "justify"; d.textContent = t; p.appendChild(d) });
    const list = document.createElement("div");
    list.innerHTML = ordered.map(s => `<div><strong>${s.name}</strong> — focus first on ${s.weak.slice(0, 2).join(", ") || "core concepts"}</div>`).join("");
    p.appendChild(list);
}

function renderNextSteps() {
    const n = el("#next-steps");
    n.innerHTML = "";
    const ordered = chooseByWeight();
    const items = [];
    ordered.forEach(s => { if (s.weak.length) items.push(`Focus: ${s.weak[0]}`) });
    if (items.length < 2) { ordered.forEach(s => { items.push(`Practice: ${s.strong[0] || "key problems"}`) }) }
    const d = document.createElement("div");
    d.innerHTML = items.slice(0, 4).map(x => `<div>Next 7 days: ${x}</div>`).join("");
    n.appendChild(d);
}

function renderAdaptation() {
    const a = el("#adaptation");
    a.innerHTML = "";
    state.subjects.forEach(s => {
        const row = document.createElement("div");
        row.className = "adapt-row";
        const label = document.createElement("div");
        label.textContent = `${s.name} confidence: ${s.confidence}`;
        const input = document.createElement("input");
        input.type = "range"; input.min = "1"; input.max = "5"; input.value = String(s.confidence);
        input.addEventListener("input", e => {
            const old = s.confidence;
            s.confidence = Number(e.target.value);
            state.subjectsLocked = true;
            computeWeights(); renderBreakdown(); renderCalendar(); renderSummary();
            const diff = s.confidence - old;
            if (diff !== 0) {
                const existing = row.querySelector(".suggest-msg");
                if (existing) existing.remove();
                const suggest = document.createElement("div");
                suggest.className = "justify suggest-msg";
                const redirect = chooseByWeight()[0].name;
                suggest.textContent = `Confidence changed; reallocating time to ${redirect}`;
                row.appendChild(suggest);
            }
        });
        row.appendChild(label); row.appendChild(input); a.appendChild(row);
    });
}

function estimatedHoursForSubject(s) { return s.credits * 10; }

function renderSummary() {
    const s = el("#summary");
    s.innerHTML = "";
    const total = hoursPerWeek();
    const buf = bufferHours(total);
    const alloc = total - buf;
    const eta = state.subjects.map(sub => ({ name: sub.name, weeks: Math.max(1, Math.ceil(estimatedHoursForSubject(sub) / (state.weights[sub.id] * alloc))) }));
    const fin = Math.max(...eta.map(e => e.weeks));
    const finish = document.createElement("div");
    finish.innerHTML = `Estimated completion timeline: ${fin} weeks`;
    const stress = document.createElement("div");
    stress.className = "justify"; stress.textContent = "Expected reduction in last-minute workload via 10% weekly buffer";
    s.appendChild(finish); s.appendChild(stress);
}

function validate() { return !!(state.student.name && state.target && state.subjects.length > 0); }

function generate() {
    readState();
    if (!validate()) return;
    computeWeights();
    buildWeekCalendar();
    renderCalendar();
    renderBreakdown();
    renderPriorities();
    renderNextSteps();
    renderAdaptation();
    renderSummary();
}

function reset() {
    formData.student = { name: "", college: "", branch: "", gradYear: "", email: "" };
    formData.availability = { weekdays: "", weekends: "", preferred: "morning" };
    formData.target = "";
    formData.subjects = [];
    initInputs();
    el("#breakdown").innerHTML = "";
    el("#priorities").innerHTML = "";
    el("#next-steps").innerHTML = "";
    el("#adaptation").innerHTML = "";
    el("#summary").innerHTML = "";
    el("#calendar").innerHTML = "";
}

document.addEventListener("DOMContentLoaded", () => {
    initInputs();
    el("#add-subject").addEventListener("click", addSubject);
    el("#generate-plan").addEventListener("click", generate);
    el("#reset-form").addEventListener("click", reset);
});

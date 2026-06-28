import { db, isConfigured, wireMobileNav, wireLoginModal, renderAuthFooter, onAdminChange, escapeHtml, escapeAttr, showToast } from "../common.js";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

wireMobileNav();
wireLoginModal();
renderAuthFooter();

const PALETTE = ["#3B6FF0", "#4FD3FF", "#7C6FF0", "#5EEAD4", "#A78BFA", "#2447A8"];
const CX = 160, CY = 160, R_OUTER = 130, R_INNER = 80;

let liveDocs = [];
let workingCopy = [];
let unsubscribe = null;
let isAdmin = false;
let editing = false;

function currentHolders() { return editing ? workingCopy : liveDocs; }
function totalAssigned(list) { return list.reduce((s, h) => s + (parseFloat(h.percent) || 0), 0); }
function isOverAllocated(list) { return totalAssigned(list) > 100.0001; }

function polar(cx, cy, r, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}
function slicePath(startAngle, endAngle) {
  const span = Math.min(endAngle - startAngle, 359.99);
  endAngle = startAngle + span;
  const oStart = polar(CX, CY, R_OUTER, startAngle);
  const oEnd = polar(CX, CY, R_OUTER, endAngle);
  const iStart = polar(CX, CY, R_INNER, startAngle);
  const iEnd = polar(CX, CY, R_INNER, endAngle);
  const large = span > 180 ? 1 : 0;
  return [
    `M ${oStart.x.toFixed(2)} ${oStart.y.toFixed(2)}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${oEnd.x.toFixed(2)} ${oEnd.y.toFixed(2)}`,
    `L ${iEnd.x.toFixed(2)} ${iEnd.y.toFixed(2)}`,
    `A ${R_INNER} ${R_INNER} 0 ${large} 0 ${iStart.x.toFixed(2)} ${iStart.y.toFixed(2)}`,
    "Z"
  ].join(" ");
}
function renderTicks() {
  const group = document.getElementById("tickGroup");
  let marks = "";
  for (let i = 0; i < 10; i++) {
    const angle = i * 36;
    const p1 = polar(CX, CY, R_OUTER + 4, angle);
    const p2 = polar(CX, CY, R_OUTER + 12, angle);
    marks += `<line x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}" stroke="#33406B" stroke-width="2" stroke-linecap="round"></line>`;
  }
  group.innerHTML = marks;
}

function renderChart() {
  const list = currentHolders();
  const group = document.getElementById("sliceGroup");
  const raw = totalAssigned(list);
  const over = isOverAllocated(list);
  const scale = over ? 100 / raw : 1;

  let angle = 0, html = "";
  list.forEach((h, i) => {
    const pct = (parseFloat(h.percent) || 0) * scale;
    if (pct <= 0) return;
    const start = angle, end = angle + (pct / 100) * 360;
    html += `<path d="${slicePath(start, end)}" fill="${PALETTE[i % PALETTE.length]}"></path>`;
    angle = end;
  });
  if (!over) {
    const available = Math.max(0, 100 - raw);
    if (available > 0.0001) {
      const start = angle, end = angle + (available / 100) * 360;
      html += `<path d="${slicePath(start, end)}" fill="url(#availablePattern)"></path>`;
    }
  }
  group.innerHTML = html;

  const assignedEl = document.getElementById("assignedPct");
  const availableEl = document.getElementById("availableSub");
  assignedEl.textContent = raw.toFixed(1) + "%";
  if (over) {
    availableEl.textContent = "überallokiert";
    availableEl.style.color = "var(--danger)";
  } else {
    availableEl.textContent = (100 - raw).toFixed(1) + "% verfügbar";
    availableEl.style.color = "var(--accent-2)";
  }
}

function renderWarning() {
  const list = currentHolders();
  const el = document.getElementById("warningBanner");
  if (isOverAllocated(list)) {
    const over = (totalAssigned(list) - 100).toFixed(1);
    el.textContent = `Anteile überschreiten 100% um ${over}%. Bitte reduzieren, um zu speichern.`;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

function renderReadOnlyList() {
  const list = liveDocs;
  const el = document.getElementById("holderList");
  const raw = totalAssigned(list);
  const available = Math.max(0, 100 - raw);

  let html = list.map((h, i) => `
    <li class="holder-row">
      <span class="swatch" style="background:${PALETTE[i % PALETTE.length]}"></span>
      <span class="holder-name">${escapeHtml(h.name)}</span>
      <span class="holder-role">${escapeHtml(h.role)}</span>
      <span class="holder-pct">${(parseFloat(h.percent) || 0).toFixed(1)}%</span>
    </li>`).join("");

  html += `
    <li class="holder-row available">
      <span class="swatch available"></span>
      <span class="holder-name">Verfügbare Anteile</span>
      <span class="holder-role">Unvergeben</span>
      <span class="holder-pct">${available.toFixed(1)}%</span>
    </li>`;

  el.innerHTML = html || `<li class="empty-state">Noch keine Anteilseigner erfasst.</li>`;
  renderChart();
  renderWarning();
}

function renderEditableList() {
  const list = workingCopy;
  const el = document.getElementById("holderList");

  let html = list.map((h, i) => `
    <li class="holder-row editing" data-index="${i}">
      <span class="swatch" style="background:${PALETTE[i % PALETTE.length]}"></span>
      <input type="text" class="input-name" value="${escapeAttr(h.name)}" aria-label="Name">
      <input type="text" class="input-role" value="${escapeAttr(h.role)}" aria-label="Rolle">
      <input type="number" class="input-pct" value="${h.percent}" min="0" max="100" step="0.1" aria-label="Anteil in Prozent">
      <button class="btn-icon" aria-label="Entfernen" data-index="${i}">✕</button>
    </li>`).join("");

  const raw = totalAssigned(list);
  const available = Math.max(0, 100 - raw);
  html += `
    <li class="holder-row available">
      <span class="swatch available"></span>
      <span class="holder-name">Verfügbare Anteile</span>
      <span class="holder-role">Unvergeben</span>
      <span class="holder-pct" id="availablePctLive">${available.toFixed(1)}%</span>
    </li>`;
  html += `<li class="add-row"><button class="btn-secondary" id="addHolderBtn">+ Anteilseigner hinzufügen</button></li>`;

  el.innerHTML = html;

  document.getElementById("addHolderBtn").addEventListener("click", () => {
    workingCopy.push({ name: "Neuer Anteilseigner", role: "Shareholder", percent: 0 });
    renderEditableList();
    renderChart(); renderWarning(); syncSaveState();
  });
  el.querySelectorAll(".btn-icon").forEach(btn => {
    btn.addEventListener("click", () => {
      workingCopy.splice(parseInt(btn.dataset.index, 10), 1);
      renderEditableList();
      renderChart(); renderWarning(); syncSaveState();
    });
  });
  el.querySelectorAll(".holder-row.editing").forEach(row => {
    const idx = parseInt(row.dataset.index, 10);
    row.querySelector(".input-name").addEventListener("input", e => workingCopy[idx].name = e.target.value);
    row.querySelector(".input-role").addEventListener("input", e => workingCopy[idx].role = e.target.value);
    row.querySelector(".input-pct").addEventListener("input", e => {
      workingCopy[idx].percent = parseFloat(e.target.value) || 0;
      renderChart(); renderWarning(); syncSaveState();
      const availEl = document.getElementById("availablePctLive");
      if (availEl) availEl.textContent = Math.max(0, 100 - totalAssigned(workingCopy)).toFixed(1) + "%";
    });
  });
}

function renderEditControls() {
  const el = document.getElementById("editControls");
  if (!isAdmin) { el.innerHTML = ""; return; }
  if (!editing) {
    el.innerHTML = `<button class="btn-secondary" id="editBtn">Bearbeiten</button>`;
    document.getElementById("editBtn").addEventListener("click", enterEditMode);
  } else {
    el.innerHTML = `<button class="btn-ghost" id="cancelEditBtn">Abbrechen</button><button class="btn-primary" id="saveBtn">Speichern</button>`;
    document.getElementById("cancelEditBtn").addEventListener("click", exitEditMode);
    document.getElementById("saveBtn").addEventListener("click", saveAll);
    syncSaveState();
  }
}
function syncSaveState() {
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) saveBtn.disabled = isOverAllocated(workingCopy);
}

function enterEditMode() {
  editing = true;
  if (unsubscribe) unsubscribe();
  workingCopy = liveDocs.map(d => ({ ...d }));
  renderEditableList();
  renderChart(); renderWarning();
  renderEditControls();
}
function exitEditMode() {
  editing = false;
  workingCopy = [];
  subscribeLive();
  renderEditControls();
}

async function saveAll() {
  if (isOverAllocated(workingCopy)) {
    showToast("Bitte zuerst die Überallokation korrigieren.", true);
    return;
  }
  try {
    const originalIds = new Set(liveDocs.map(d => d.id));
    const keptIds = new Set(workingCopy.filter(d => d.id).map(d => d.id));
    const toDelete = [...originalIds].filter(id => !keptIds.has(id));

    for (const item of workingCopy) {
      const payload = {
        name: item.name || "",
        role: item.role || "",
        percent: parseFloat(item.percent) || 0
      };
      if (item.id) {
        await updateDoc(doc(db, "shares", item.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "shares"), payload);
      }
    }
    for (const id of toDelete) {
      await deleteDoc(doc(db, "shares", id));
    }
    showToast("Anteile gespeichert.");
    exitEditMode();
  } catch (e) {
    showToast("Speichern fehlgeschlagen: " + e.message, true);
  }
}

function subscribeLive() {
  if (!isConfigured) {
    document.getElementById("holderList").innerHTML = `<li class="empty-state">Firebase ist noch nicht eingerichtet.</li>`;
    return;
  }
  const q = query(collection(db, "shares"), orderBy("createdAt", "asc"));
  unsubscribe = onSnapshot(q, (snap) => {
    liveDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!editing) renderReadOnlyList();
  }, () => {
    document.getElementById("holderList").innerHTML = `<li class="empty-state">Anteile konnten nicht geladen werden. Sind die Firestore-Regeln veröffentlicht?</li>`;
  });
}

onAdminChange((user) => {
  isAdmin = !!user;
  if (!isAdmin && editing) exitEditMode();
  else renderEditControls();
});

renderTicks();
subscribeLive();

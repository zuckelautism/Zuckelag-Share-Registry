import { db, isConfigured, wireMobileNav, wireLoginModal, renderAuthFooter, onAdminChange, escapeHtml, formatDate, showToast } from "../common.js";
import {
  doc, setDoc, addDoc, collection, onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

wireMobileNav();
wireLoginModal();
renderAuthFooter();

let isAdmin = false;
let currentData = { value: 50000, unit: "" };
let isDefaultValue = true;
let history = [];

function renderDelta() {
  if (history.length < 2) return "";
  const last = history[history.length - 1].value || 0;
  const prev = history[history.length - 2].value || 0;
  const diff = last - prev;
  if (diff === 0) return `<div class="delta flat">± 0 seit letzter Aktualisierung</div>`;
  const cls = diff > 0 ? "up" : "down";
  const arrow = diff > 0 ? "↑" : "↓";
  return `<div class="delta ${cls}">${arrow} ${Math.abs(diff).toLocaleString("de-DE")} seit letzter Aktualisierung</div>`;
}

function renderValueDisplay() {
  const el = document.getElementById("valueDisplay");
  const unit = currentData.unit ? ` <span class="unit">${escapeHtml(currentData.unit)}</span>` : "";
  el.innerHTML = `
    <div class="big-value">${Number(currentData.value || 0).toLocaleString("de-DE")}${unit}</div>
    ${renderDelta()}
    <p class="muted" style="margin-top:8px;">
      ${isDefaultValue ? "Standardwert — noch nicht gespeichert." : "Stand: " + formatDate(currentData.updatedAt)}
    </p>`;
}

function buildLineChart(items) {
  if (!items.length) {
    return `<div class="empty-state">Noch keine Verlaufsdaten.</div>`;
  }
  const W = 600, H = 220, P = 36;
  const values = items.map(h => h.value || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) || 1;
  const n = items.length;

  const points = items.map((h, i) => {
    const x = n === 1 ? W / 2 : P + (i * (W - 2 * P)) / (n - 1);
    const y = P + (1 - ((h.value || 0) - min) / range) * (H - 2 * P);
    return { x, y };
  });

  const pointsAttr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const gridLines = [0, 1, 2, 3].map(i => {
    const y = P + (i * (H - 2 * P)) / 3;
    return `<line x1="${P}" y1="${y.toFixed(1)}" x2="${W - P}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"></line>`;
  }).join("");
  const dots = points.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#4FD3FF"></circle>`).join("");

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf des Unternehmenswerts">
    ${gridLines}
    <polyline points="${pointsAttr}" fill="none" stroke="#4FD3FF" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></polyline>
    ${dots}
  </svg>`;
}

function renderHistoryTable() {
  const el = document.getElementById("historyContainer");
  if (!history.length) {
    el.innerHTML = `<div class="empty-state">Noch keine Einträge.</div>`;
    return;
  }
  const rows = [...history].reverse();
  el.innerHTML = `<div class="table-wrap"><table class="ledger">
    <thead><tr><th>Datum</th><th>Wert</th><th>Notiz</th></tr></thead>
    <tbody>
      ${rows.map(h => `
        <tr>
          <td>${formatDate(h.createdAt)}</td>
          <td>${Number(h.value || 0).toLocaleString("de-DE")}${currentData.unit ? " " + escapeHtml(currentData.unit) : ""}</td>
          <td>${escapeHtml(h.note || "—")}</td>
        </tr>
      `).join("")}
    </tbody>
  </table></div>`;
}

function renderEditControls() {
  const el = document.getElementById("editControls");
  const form = document.getElementById("updateForm");
  if (!isAdmin) { el.innerHTML = ""; form.classList.add("hidden"); return; }
  el.innerHTML = `<button class="btn-secondary" id="updateBtn">Wert aktualisieren</button>`;
  document.getElementById("updateBtn").addEventListener("click", () => {
    document.getElementById("newValue").value = currentData.value || 0;
    document.getElementById("newUnit").value = currentData.unit || "";
    document.getElementById("newNote").value = "";
    form.classList.remove("hidden");
  });
}

document.getElementById("cancelUpdate").addEventListener("click", () => {
  document.getElementById("updateForm").classList.add("hidden");
});

document.getElementById("updateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isConfigured) { showToast("Firebase ist noch nicht eingerichtet.", true); return; }
  const value = parseFloat(document.getElementById("newValue").value) || 0;
  const unit = document.getElementById("newUnit").value.trim();
  const note = document.getElementById("newNote").value.trim();
  try {
    await setDoc(doc(db, "valuation", "current"), { value, unit, updatedAt: serverTimestamp() });
    await addDoc(collection(db, "valuationHistory"), { value, note, createdAt: serverTimestamp() });
    document.getElementById("updateForm").classList.add("hidden");
    showToast("Unternehmenswert aktualisiert.");
  } catch (err) {
    showToast("Speichern fehlgeschlagen: " + err.message, true);
  }
});

function subscribeValue() {
  if (!isConfigured) {
    document.getElementById("valueDisplay").innerHTML = `<div class="empty-state">Firebase ist noch nicht eingerichtet.</div>`;
    return;
  }
  onSnapshot(doc(db, "valuation", "current"), (snap) => {
    if (snap.exists()) {
      currentData = snap.data();
      isDefaultValue = false;
    } else {
      currentData = { value: 50000, unit: "" };
      isDefaultValue = true;
    }
    renderValueDisplay();
  }, () => {
    document.getElementById("valueDisplay").innerHTML = `<div class="empty-state">Wert konnte nicht geladen werden.</div>`;
  });
}

function subscribeHistory() {
  if (!isConfigured) {
    document.getElementById("chartContainer").innerHTML = "";
    return;
  }
  const q = query(collection(db, "valuationHistory"), orderBy("createdAt", "asc"));
  onSnapshot(q, (snap) => {
    history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    document.getElementById("chartContainer").innerHTML = buildLineChart(history);
    renderHistoryTable();
    renderValueDisplay();
  }, () => {
    document.getElementById("chartContainer").innerHTML = `<div class="empty-state">Verlauf konnte nicht geladen werden.</div>`;
  });
}

onAdminChange((user) => {
  isAdmin = !!user;
  renderEditControls();
});

subscribeValue();
subscribeHistory();

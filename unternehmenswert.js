import { db, isConfigured, wireMobileNav, wireLoginModal, renderAuthFooter, onAdminChange, escapeHtml, escapeAttr, showToast } from "../common.js";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

wireMobileNav();
wireLoginModal();
renderAuthFooter();

const STATUS_LABELS = { active: "Aktiv", building: "Im Bau", planned: "Geplant" };

let liveDocs = [];
let workingCopy = [];
let unsubscribe = null;
let isAdmin = false;
let editing = false;

function renderReadOnly(items) {
  const el = document.getElementById("locationsContainer");
  if (!items.length) {
    el.innerHTML = `<div class="empty-state"><span class="big-icon">◇</span>Noch keine Standorte erfasst.</div>`;
    return;
  }
  el.innerHTML = `<div class="card-grid">` + items.map(loc => `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
        <h3>${escapeHtml(loc.name)}</h3>
        <span class="badge ${loc.status || 'planned'}">${STATUS_LABELS[loc.status] || 'Geplant'}</span>
      </div>
      <p>${escapeHtml(loc.description || "")}</p>
      ${loc.coords ? `<p class="meta">Koordinaten: ${escapeHtml(loc.coords)}</p>` : ``}
    </div>
  `).join("") + `</div>`;
}

function renderEditable(items) {
  const el = document.getElementById("locationsContainer");
  el.innerHTML = `<div class="card-grid">` + items.map((loc, i) => `
    <div class="card" data-index="${i}">
      <div class="field"><label>Name</label><input class="f-name" value="${escapeAttr(loc.name)}"></div>
      <div class="field"><label>Status</label>
        <select class="f-status">
          <option value="active" ${loc.status === 'active' ? 'selected' : ''}>Aktiv</option>
          <option value="building" ${loc.status === 'building' ? 'selected' : ''}>Im Bau</option>
          <option value="planned" ${loc.status === 'planned' ? 'selected' : ''}>Geplant</option>
        </select>
      </div>
      <div class="field"><label>Beschreibung</label><textarea class="f-desc" rows="3">${escapeHtml(loc.description || "")}</textarea></div>
      <div class="field"><label>Koordinaten (optional)</label><input class="f-coords" value="${escapeAttr(loc.coords || '')}"></div>
      <button class="btn-danger f-remove" data-index="${i}">Entfernen</button>
    </div>
  `).join("") + `
    <div class="card" style="align-items:center; justify-content:center;">
      <button class="btn-secondary" id="addLocationBtn">+ Standort hinzufügen</button>
    </div>
  </div>`;

  document.getElementById("addLocationBtn").addEventListener("click", () => {
    workingCopy.push({ name: "Neuer Standort", status: "planned", description: "", coords: "" });
    renderEditable(workingCopy);
  });

  el.querySelectorAll(".f-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      workingCopy.splice(parseInt(btn.dataset.index, 10), 1);
      renderEditable(workingCopy);
    });
  });

  el.querySelectorAll(".card[data-index]").forEach(card => {
    const idx = parseInt(card.dataset.index, 10);
    card.querySelector(".f-name").addEventListener("input", e => workingCopy[idx].name = e.target.value);
    card.querySelector(".f-status").addEventListener("change", e => workingCopy[idx].status = e.target.value);
    card.querySelector(".f-desc").addEventListener("input", e => workingCopy[idx].description = e.target.value);
    card.querySelector(".f-coords").addEventListener("input", e => workingCopy[idx].coords = e.target.value);
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
  }
}

function enterEditMode() {
  editing = true;
  if (unsubscribe) unsubscribe();
  workingCopy = liveDocs.map(d => ({ ...d }));
  renderEditable(workingCopy);
  renderEditControls();
}

function exitEditMode() {
  editing = false;
  workingCopy = [];
  subscribeLive();
  renderEditControls();
}

async function saveAll() {
  try {
    const originalIds = new Set(liveDocs.map(d => d.id));
    const keptIds = new Set(workingCopy.filter(d => d.id).map(d => d.id));
    const toDelete = [...originalIds].filter(id => !keptIds.has(id));

    for (const item of workingCopy) {
      const payload = {
        name: item.name || "",
        status: item.status || "planned",
        description: item.description || "",
        coords: item.coords || ""
      };
      if (item.id) {
        await updateDoc(doc(db, "locations", item.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "locations"), payload);
      }
    }
    for (const id of toDelete) {
      await deleteDoc(doc(db, "locations", id));
    }
    showToast("Standorte gespeichert.");
    exitEditMode();
  } catch (e) {
    showToast("Speichern fehlgeschlagen: " + e.message, true);
  }
}

function subscribeLive() {
  if (!isConfigured) {
    document.getElementById("locationsContainer").innerHTML = `<div class="empty-state">Firebase ist noch nicht eingerichtet.</div>`;
    return;
  }
  const q = query(collection(db, "locations"), orderBy("createdAt", "asc"));
  unsubscribe = onSnapshot(q, (snap) => {
    liveDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!editing) renderReadOnly(liveDocs);
  }, () => {
    document.getElementById("locationsContainer").innerHTML = `<div class="empty-state">Standorte konnten nicht geladen werden. Sind die Firestore-Regeln veröffentlicht?</div>`;
  });
}

onAdminChange((user) => {
  isAdmin = !!user;
  if (!isAdmin && editing) exitEditMode();
  else renderEditControls();
});

subscribeLive();

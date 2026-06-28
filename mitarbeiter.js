import { db, isConfigured, wireMobileNav, wireLoginModal, renderAuthFooter, onAdminChange, escapeHtml, escapeAttr, showToast } from "../common.js";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

wireMobileNav();
wireLoginModal();
renderAuthFooter();

let liveDocs = [];
let workingCopy = [];
let unsubscribe = null;
let isAdmin = false;
let editing = false;

function renderReadOnly(items) {
  const el = document.getElementById("careersContainer");
  if (!items.length) {
    el.innerHTML = `<div class="empty-state"><span class="big-icon">◇</span>Aktuell keine offenen Positionen.</div>`;
    return;
  }
  el.innerHTML = `<div class="card-grid">` + items.map(c => `
    <div class="card">
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.description || "")}</p>
    </div>
  `).join("") + `</div>`;
}

function renderEditable(items) {
  const el = document.getElementById("careersContainer");
  el.innerHTML = `<div class="card-grid">` + items.map((c, i) => `
    <div class="card" data-index="${i}">
      <div class="field"><label>Titel</label><input class="f-title" value="${escapeAttr(c.title)}"></div>
      <div class="field"><label>Beschreibung</label><textarea class="f-desc" rows="3">${escapeHtml(c.description || "")}</textarea></div>
      <button class="btn-danger f-remove" data-index="${i}">Entfernen</button>
    </div>
  `).join("") + `
    <div class="card" style="align-items:center; justify-content:center;">
      <button class="btn-secondary" id="addCareerBtn">+ Position hinzufügen</button>
    </div>
  </div>`;

  document.getElementById("addCareerBtn").addEventListener("click", () => {
    workingCopy.push({ title: "Neue Position", description: "" });
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
    card.querySelector(".f-title").addEventListener("input", e => workingCopy[idx].title = e.target.value);
    card.querySelector(".f-desc").addEventListener("input", e => workingCopy[idx].description = e.target.value);
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
      const payload = { title: item.title || "", description: item.description || "" };
      if (item.id) {
        await updateDoc(doc(db, "careers", item.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "careers"), payload);
      }
    }
    for (const id of toDelete) {
      await deleteDoc(doc(db, "careers", id));
    }
    showToast("Positionen gespeichert.");
    exitEditMode();
  } catch (e) {
    showToast("Speichern fehlgeschlagen: " + e.message, true);
  }
}

function subscribeLive() {
  if (!isConfigured) {
    document.getElementById("careersContainer").innerHTML = `<div class="empty-state">Firebase ist noch nicht eingerichtet.</div>`;
    return;
  }
  const q = query(collection(db, "careers"), orderBy("createdAt", "asc"));
  unsubscribe = onSnapshot(q, (snap) => {
    liveDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!editing) renderReadOnly(liveDocs);
  }, () => {
    document.getElementById("careersContainer").innerHTML = `<div class="empty-state">Positionen konnten nicht geladen werden. Sind die Firestore-Regeln veröffentlicht?</div>`;
  });
}

onAdminChange((user) => {
  isAdmin = !!user;
  if (!isAdmin && editing) exitEditMode();
  else renderEditControls();
});

subscribeLive();

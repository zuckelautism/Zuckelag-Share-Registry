import { db, isConfigured, wireMobileNav, wireLoginModal, renderAuthFooter, onAdminChange, escapeHtml, escapeAttr, formatDate, showToast } from "../common.js";
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

function matchesSearch(emp, term) {
  if (!term) return true;
  const haystack = `${emp.ign || ""} ${emp.role || ""} ${emp.location || ""}`.toLowerCase();
  return haystack.includes(term.toLowerCase());
}

function renderReadOnly(items) {
  const el = document.getElementById("employeesContainer");
  const term = document.getElementById("searchInput").value.trim();
  const filtered = items.filter(e => matchesSearch(e, term));

  if (!items.length) {
    el.innerHTML = `<div class="empty-state"><span class="big-icon">◇</span>Noch keine Mitarbeiter erfasst.</div>`;
    return;
  }
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state">Keine Treffer für "${escapeHtml(term)}".</div>`;
    return;
  }

  el.innerHTML = `<div class="table-wrap"><table class="ledger">
    <thead><tr><th>IGN</th><th>Rolle</th><th>Standort</th><th>Seit</th><th>Status</th></tr></thead>
    <tbody>
      ${filtered.map(e => `
        <tr>
          <td>${escapeHtml(e.ign)}</td>
          <td>${escapeHtml(e.role || "—")}</td>
          <td>${escapeHtml(e.location || "—")}</td>
          <td>${formatDate(e.joinedDate)}</td>
          <td><span class="badge ${e.status === 'active' ? 'active' : 'inactive'}">${e.status === 'active' ? 'Aktiv' : 'Inaktiv'}</span></td>
        </tr>
      `).join("")}
    </tbody>
  </table></div>`;
}

function renderEditable(items) {
  const el = document.getElementById("employeesContainer");
  el.innerHTML = `<div class="table-wrap"><table class="ledger">
    <thead><tr><th>IGN</th><th>Rolle</th><th>Standort</th><th>Seit</th><th>Status</th><th></th></tr></thead>
    <tbody>
      ${items.map((e, i) => `
        <tr data-index="${i}">
          <td><input class="f-ign" value="${escapeAttr(e.ign)}"></td>
          <td><input class="f-role" value="${escapeAttr(e.role || '')}"></td>
          <td><input class="f-location" value="${escapeAttr(e.location || '')}"></td>
          <td><input type="date" class="f-joined" value="${e.joinedDate || ''}"></td>
          <td>
            <select class="f-status">
              <option value="active" ${e.status === 'active' ? 'selected' : ''}>Aktiv</option>
              <option value="inactive" ${e.status === 'inactive' ? 'selected' : ''}>Inaktiv</option>
            </select>
          </td>
          <td><button class="btn-icon f-remove" data-index="${i}" aria-label="Entfernen">✕</button></td>
        </tr>
      `).join("")}
    </tbody>
  </table></div>
  <div style="margin-top:12px;"><button class="btn-secondary" id="addEmployeeBtn">+ Mitarbeiter hinzufügen</button></div>`;

  document.getElementById("addEmployeeBtn").addEventListener("click", () => {
    workingCopy.push({ ign: "NeuerSpieler", role: "Mitarbeiter", location: "", joinedDate: "", status: "active" });
    renderEditable(workingCopy);
  });

  el.querySelectorAll(".f-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      workingCopy.splice(parseInt(btn.dataset.index, 10), 1);
      renderEditable(workingCopy);
    });
  });

  el.querySelectorAll("tr[data-index]").forEach(row => {
    const idx = parseInt(row.dataset.index, 10);
    row.querySelector(".f-ign").addEventListener("input", e => workingCopy[idx].ign = e.target.value);
    row.querySelector(".f-role").addEventListener("input", e => workingCopy[idx].role = e.target.value);
    row.querySelector(".f-location").addEventListener("input", e => workingCopy[idx].location = e.target.value);
    row.querySelector(".f-joined").addEventListener("input", e => workingCopy[idx].joinedDate = e.target.value);
    row.querySelector(".f-status").addEventListener("change", e => workingCopy[idx].status = e.target.value);
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
  document.getElementById("searchField").classList.add("hidden");
  if (unsubscribe) unsubscribe();
  workingCopy = liveDocs.map(d => ({ ...d }));
  renderEditable(workingCopy);
  renderEditControls();
}

function exitEditMode() {
  editing = false;
  document.getElementById("searchField").classList.remove("hidden");
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
        ign: item.ign || "",
        role: item.role || "",
        location: item.location || "",
        joinedDate: item.joinedDate || "",
        status: item.status || "active"
      };
      if (item.id) {
        await updateDoc(doc(db, "employees", item.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "employees"), payload);
      }
    }
    for (const id of toDelete) {
      await deleteDoc(doc(db, "employees", id));
    }
    showToast("Mitarbeiterregister gespeichert.");
    exitEditMode();
  } catch (e) {
    showToast("Speichern fehlgeschlagen: " + e.message, true);
  }
}

function subscribeLive() {
  if (!isConfigured) {
    document.getElementById("employeesContainer").innerHTML = `<div class="empty-state">Firebase ist noch nicht eingerichtet.</div>`;
    return;
  }
  const q = query(collection(db, "employees"), orderBy("createdAt", "asc"));
  unsubscribe = onSnapshot(q, (snap) => {
    liveDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!editing) renderReadOnly(liveDocs);
  }, () => {
    document.getElementById("employeesContainer").innerHTML = `<div class="empty-state">Register konnte nicht geladen werden. Sind die Firestore-Regeln veröffentlicht?</div>`;
  });
}

document.getElementById("searchInput").addEventListener("input", () => {
  if (!editing) renderReadOnly(liveDocs);
});

onAdminChange((user) => {
  isAdmin = !!user;
  if (!isAdmin && editing) exitEditMode();
  else renderEditControls();
});

subscribeLive();

import { db, isConfigured, wireMobileNav, wireLoginModal, renderAuthFooter } from "../common.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

wireMobileNav();
wireLoginModal();
renderAuthFooter();

async function loadStats() {
  if (!isConfigured) return;
  try {
    const employeesSnap = await getDocs(collection(db, "employees"));
    document.getElementById("statEmployees").textContent = employeesSnap.size;
  } catch (e) { /* leave placeholder */ }

  try {
    const locationsSnap = await getDocs(collection(db, "locations"));
    document.getElementById("statLocations").textContent = locationsSnap.size;
  } catch (e) { /* leave placeholder */ }

  try {
    const valSnap = await getDoc(doc(db, "valuation", "current"));
    if (valSnap.exists()) {
      const data = valSnap.data();
      const unit = data.unit ? " " + data.unit : "";
      document.getElementById("statValue").textContent = Number(data.value || 0).toLocaleString("de-DE") + unit;
    }
  } catch (e) { /* leave placeholder */ }
}

loadStats();

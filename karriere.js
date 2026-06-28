// ==========================================================================
// ZUCKEL AG — SHARED SITE LOGIC
// Firebase init, admin auth, login modal wiring, toast, small utilities.
// Every page imports what it needs from this module.
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

// --------------------------------------------------------------------------
// Firebase init
// --------------------------------------------------------------------------
const isConfigured = !!firebaseConfig.apiKey;

let app = null, auth = null, db = null;
if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db, isConfigured };

// If the config hasn't been filled in yet, show a friendly banner instead
// of letting every page fail silently with a console error.
function renderNotConfiguredBanner() {
  const el = document.createElement("div");
  el.className = "page";
  el.style.marginTop = "20px";
  el.innerHTML = `
    <div class="notice" style="border-color:rgba(251,191,36,0.4); background:rgba(251,191,36,0.08); color:#FCD34D;">
      <strong>Firebase ist noch nicht eingerichtet.</strong>
      Trag deine Projekt-Daten in <code>assets/firebase-config.js</code> ein — Details dazu stehen in der README.
    </div>`;
  document.body.prepend(el);
}
if (!isConfigured) {
  document.addEventListener("DOMContentLoaded", renderNotConfiguredBanner);
}

// --------------------------------------------------------------------------
// Small utilities
// --------------------------------------------------------------------------
export function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
export function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
export function formatDate(value) {
  if (!value) return "—";
  const d = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "numeric" });
}

let toastTimer = null;
export function showToast(msg, isError) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.toggle("error", !!isError);
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

// --------------------------------------------------------------------------
// Mobile nav toggle
// --------------------------------------------------------------------------
export function wireMobileNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.querySelector(".topnav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => links.classList.toggle("open"));
}

// --------------------------------------------------------------------------
// Admin auth state + login modal
// --------------------------------------------------------------------------
const authListeners = [];

export function onAdminChange(callback) {
  authListeners.push(callback);
  if (!isConfigured) {
    callback(null);
    return;
  }
  onAuthStateChanged(auth, (user) => callback(user));
}

export function logoutAdmin() {
  if (!isConfigured) return;
  signOut(auth);
}

// Login modal: expects this markup somewhere in the page (ids must match):
// #loginOverlay > #emailInput, #passwordInput, #loginError, #cancelLogin, #submitLogin

export function openLoginModal() {
  const overlay = document.getElementById("loginOverlay");
  if (!overlay) return;
  document.getElementById("loginError").classList.add("hidden");
  document.getElementById("emailInput").value = "";
  document.getElementById("passwordInput").value = "";
  overlay.classList.remove("hidden");
  document.getElementById("emailInput").focus();
}
export function closeLoginModal() {
  const overlay = document.getElementById("loginOverlay");
  if (overlay) overlay.classList.add("hidden");
}

// Wires up the static parts of the modal (buttons, overlay click, keys),
// plus any element already in the markup with [data-admin-trigger].
export function wireLoginModal() {
  const overlay = document.getElementById("loginOverlay");
  if (!overlay) return;
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginError = document.getElementById("loginError");
  const cancelBtn = document.getElementById("cancelLogin");
  const submitBtn = document.getElementById("submitLogin");

  async function attempt() {
    if (!isConfigured) {
      loginError.textContent = "Firebase ist noch nicht eingerichtet.";
      loginError.classList.remove("hidden");
      return;
    }
    submitBtn.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      closeLoginModal();
      showToast("Admin-Modus aktiviert.");
    } catch (e) {
      loginError.textContent = "Login fehlgeschlagen. E-Mail oder Passwort prüfen.";
      loginError.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
    }
  }

  document.querySelectorAll("[data-admin-trigger]").forEach(btn => {
    btn.addEventListener("click", openLoginModal);
  });
  cancelBtn.addEventListener("click", closeLoginModal);
  submitBtn.addEventListener("click", attempt);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeLoginModal(); });
  passwordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attempt(); if (e.key === "Escape") closeLoginModal(); });
  emailInput.addEventListener("keydown", (e) => { if (e.key === "Enter") passwordInput.focus(); });
}

// Renders the standard "Admin-Zugang" / "ADMIN MODE + Abmelden" footer
// control, kept identical across every page.
export function renderAuthFooter(containerId = "footerControls") {
  const el = document.getElementById(containerId);
  if (!el) return;
  onAdminChange((user) => {
    if (user) {
      el.innerHTML = `<span class="admin-badge">ADMIN MODE</span><button class="btn-ghost" id="logoutBtn">Abmelden</button>`;
      document.getElementById("logoutBtn").addEventListener("click", logoutAdmin);
    } else {
      el.innerHTML = `<button class="btn-ghost" id="adminTriggerBtn">Admin-Zugang</button>`;
      document.getElementById("adminTriggerBtn").addEventListener("click", openLoginModal);
    }
  });
}

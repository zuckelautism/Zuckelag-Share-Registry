<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0A0E1A">
<title>Zuckel AG — Startseite</title>
<meta name="description" content="Zuckel Aktiengesellschaft — Stellari Continuum.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/styles.css">
</head>
<body>

<nav class="topnav">
  <div class="topnav-inner">
    <a class="topnav-brand" href="index.html">
      <img src="assets/img/logo.png" alt="Zuckel AG">
      <span>ZUCKEL AG</span>
    </a>
    <button class="nav-toggle" id="navToggle" aria-label="Menü öffnen">☰</button>
    <div class="topnav-links">
      <a href="index.html" class="active">Home</a>
      <a href="standorte.html">Standorte</a>
      <a href="mitarbeiter.html">Mitarbeiter</a>
      <a href="unternehmenswert.html">Unternehmenswert</a>
      <a href="anteile.html">Investor Relations</a>
      <a href="karriere.html">Karriere</a>
      <a href="impressum.html">Impressum</a>
    </div>
  </div>
</nav>

<div class="page">

  <section class="panel hero">
    <img class="hero-logo" src="assets/img/logo.png" alt="Zuckel AG">
    <h1>Modernisierung beginnt im Kleinen.</h1>
    <p class="lede">
      Zuckel Aktiengesellschaft ist ein Agrar- und Logistikunternehmen im Stellari Continuum.
      Im Auftrag des Imperialen Throns modernisiert die Firma derzeit die Region Salaria —
      von einer einzelnen Plantagenhalle zu einer vollständig versorgten Produktionskolonie.
    </p>
    <div class="stat-row" id="statRow">
      <div class="stat"><span class="num" id="statEmployees">—</span><span class="lbl">Mitarbeiter</span></div>
      <div class="stat"><span class="num" id="statLocations">—</span><span class="lbl">Standorte</span></div>
      <div class="stat"><span class="num" id="statValue">—</span><span class="lbl">Unternehmenswert</span></div>
    </div>
  </section>

  <section class="panel">
    <div class="section-head">
      <h2>Führung</h2>
    </div>
    <div class="card-grid">
      <div class="card">
        <h3>Zuckel</h3>
        <p>Chief Executive Officer</p>
        <p class="meta">Gesamtverantwortung &amp; Mandat gegenüber dem Imperialen Thron</p>
      </div>
      <div class="card">
        <h3>hansylp</h3>
        <p>Chief Commercial Officer</p>
        <p class="meta">Handel, Logistik &amp; Versorgung</p>
      </div>
      <div class="card">
        <h3>Cassian Adler</h3>
        <p>Chief Marketing Officer</p>
        <p class="meta">Außendarstellung &amp; Beziehungen</p>
      </div>
    </div>
  </section>

  <section class="panel">
    <div class="section-head">
      <h2>Erkunden</h2>
    </div>
    <div class="card-grid">
      <a class="card" href="standorte.html">
        <h3>Standorte</h3>
        <p>Außenposten und Anlagen der Firma in Salaria.</p>
      </a>
      <a class="card" href="mitarbeiter.html">
        <h3>Mitarbeiterregister</h3>
        <p>Wer für Zuckel AG im Einsatz ist, mit IGN und Rolle.</p>
      </a>
      <a class="card" href="unternehmenswert.html">
        <h3>Unternehmenswert</h3>
        <p>Aktueller Wert der Firma und sein Verlauf.</p>
      </a>
      <a class="card" href="anteile.html">
        <h3>Investor Relations</h3>
        <p>Anteilseigner und verfügbare Anteile.</p>
      </a>
      <a class="card" href="karriere.html">
        <h3>Karriere</h3>
        <p>Offene Positionen bei Zuckel AG.</p>
      </a>
    </div>
  </section>

  <footer class="site-footer">
    <span class="muted">Stellari Continuum · Salaria</span>
    <div class="footer-controls" id="footerControls"></div>
  </footer>

  <p class="legal">Zuckel Aktiengesellschaft. Diese Seite und ihre Inhalte sind Eigentum der Firma.</p>

</div>

<div class="overlay hidden" id="loginOverlay">
  <div class="modal">
    <h2>Admin-Zugang</h2>
    <p class="muted">Mit deinem Firebase-Konto anmelden, um Inhalte zu bearbeiten.</p>
    <div class="field">
      <label for="emailInput">E-Mail</label>
      <input type="email" id="emailInput" autocomplete="username" placeholder="admin@example.com">
    </div>
    <div class="field">
      <label for="passwordInput">Passwort</label>
      <input type="password" id="passwordInput" autocomplete="current-password" placeholder="Passwort">
    </div>
    <div class="error hidden" id="loginError">Login fehlgeschlagen.</div>
    <div class="modal-actions">
      <button class="btn-ghost" id="cancelLogin">Abbrechen</button>
      <button class="btn-primary" id="submitLogin">Anmelden</button>
    </div>
  </div>
</div>

<script type="module" src="assets/pages/home.js"></script>
</body>
</html>

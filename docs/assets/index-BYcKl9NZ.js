(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`https://github.com/baditaflorin/world-demucs`,t=`https://www.paypal.com/paypalme/florinbadita`;document.querySelector(`#app`).innerHTML=`
  <main class="app-shell">
    <section class="hero" aria-labelledby="page-title">
      <div class="hero__copy">
        <p class="eyebrow">Local browser audio unmixing</p>
        <h1 id="page-title">World-Demucs</h1>
        <p class="lede">
          Real-time environment unmixing for vocals, percussion, melody, and ambient residue.
        </p>
      </div>
      <nav class="links" aria-label="Project links">
        <a href="${e}" target="_blank" rel="noreferrer">GitHub repo</a>
        <a href="${t}" target="_blank" rel="noreferrer">Support via PayPal</a>
      </nav>
    </section>

    <section class="status-panel" aria-label="Build status">
      <div>
        <span>Version</span>
        <strong>0.1.0</strong>
      </div>
      <div>
        <span>Commit</span>
        <strong>local-dev</strong>
      </div>
      <div>
        <span>Mode</span>
        <strong>GitHub Pages</strong>
      </div>
    </section>
  </main>
`;
//# sourceMappingURL=index-BYcKl9NZ.js.map
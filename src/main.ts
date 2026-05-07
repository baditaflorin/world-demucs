import './style.css'

declare const __APP_VERSION__: string
declare const __GIT_COMMIT__: string

const repoUrl = 'https://github.com/baditaflorin/world-demucs'
const paypalUrl = 'https://www.paypal.com/paypalme/florinbadita'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
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
        <a href="${repoUrl}" target="_blank" rel="noreferrer">GitHub repo</a>
        <a href="${paypalUrl}" target="_blank" rel="noreferrer">Support via PayPal</a>
      </nav>
    </section>

    <section class="status-panel" aria-label="Build status">
      <div>
        <span>Version</span>
        <strong>${__APP_VERSION__}</strong>
      </div>
      <div>
        <span>Commit</span>
        <strong>${__GIT_COMMIT__}</strong>
      </div>
      <div>
        <span>Mode</span>
        <strong>GitHub Pages</strong>
      </div>
    </section>
  </main>
`

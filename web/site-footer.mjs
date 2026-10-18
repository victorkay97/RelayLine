// Shared footer for the GitHub Pages routes. One source of truth for copy,
// navigation, accessibility and structure across Home, Workspace, Reader and Docs.
export function renderSiteFooter(){
  for(const footer of document.querySelectorAll('[data-site-footer]')){
    footer.innerHTML = `
      <div class="footer-inner">
        <a class="brand footer-brand" href="./" aria-label="RelayLine home">
          <span class="brand-name">relayline<span class="brand-dot">.</span></span>
        </a>
        <p>Independent discovery. Verifiable publishers.</p>
        <nav class="footer-links" aria-label="Footer navigation">
          <a href="./workspace.html">Workspace</a>
          <a href="./recover.html">Find a Service</a>
          <a href="./docs.html">Documentation</a>
          <a href="https://github.com/victorkay97/RelayLine" target="_blank" rel="noopener noreferrer">GitHub <i data-lucide="arrow-up-right"></i></a>
        </nav>
      </div>
      <div class="footer-bottom">
        <span>RelayLine · Experimental Arkiv testnet prototype</span>
        <a href="https://github.com/victorkay97/RelayLine/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT licensed</a>
      </div>
    `;
  }
}

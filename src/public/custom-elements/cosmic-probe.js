// D9 probe: confirms a Wix custom element defined in public/ renders on the published site.
// Remove after the experiment is recorded.
class CosmicProbe extends HTMLElement {
  connectedCallback() {
    this.textContent = 'probe';
    this.style.color = '#C29B1C';
    this.style.display = 'block';
  }
}
if (!customElements.get('cosmic-probe')) customElements.define('cosmic-probe', CosmicProbe);

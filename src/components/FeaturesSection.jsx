/** "One platform" features grid. Purely presentational. */
function FeaturesSection() {
  return (
    <section className="features" id="features">
      <div className="section-title">
        <p>ONE PLATFORM</p>
        <h2>India's heritage, connected.</h2>
        <span>
          Discover, document and preserve cultural heritage with the power of community and AI.
        </span>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">🗺️</div>
          <h3>Khoj</h3>
          <p>Discover undocumented temples, monuments, sacred sites and hidden heritage places.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎙️</div>
          <h3>Living Heritage</h3>
          <p>Record folk songs, stories, dialects, rituals, recipes and traditional practices.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🤖</div>
          <h3>AI Intelligence</h3>
          <p>AI transcribes oral history audio and helps organize cultural information.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔴</div>
          <h3>Risk Score</h3>
          <p>Identify heritage and traditions that may be at risk of disappearing.</p>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;

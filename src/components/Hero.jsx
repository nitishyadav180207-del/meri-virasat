import PropTypes from "prop-types";
import heroBanner from "../assets/hereo_banner.png";

/** Landing hero banner — full-width background image with the mission statement.
 * The "Add Heritage" link only makes sense on the home page (where that
 * section actually exists), so it's opt-in via a prop rather than always shown. */
function Hero({ showAddHeritageLink }) {
  return (
    <section
      className="hero-banner"
      id="home"
      style={{ backgroundImage: `url("${heroBanner}")` }}
    >
      <div className="hero-banner-content">
        <h1>
          Join <span>Meri Virasat</span>
        </h1>
        <p className="hero-banner-tagline">Preserve • Promote • Empower</p>
        <p className="hero-banner-text">
          Be a part of our mission to support local artisans and keep our rich cultural
          heritage alive.
        </p>
        {showAddHeritageLink && (
          <a href="#add-heritage" className="hero-banner-cta">
            + Add Heritage
          </a>
        )}
      </div>
    </section>
  );
}

Hero.propTypes = {
  showAddHeritageLink: PropTypes.bool,
};

Hero.defaultProps = {
  showAddHeritageLink: false,
};

export default Hero;

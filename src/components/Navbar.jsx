import PropTypes from "prop-types";
import { Api } from "../api";
import logo from "../assets/logo.png";

/** Top navigation bar. Shows Login/Register, or the current user + Logout
 * once signed in — the one header shared across the whole app. */
function Navbar({ currentUser, onGoHome, onOpenLogin, onOpenRegister, onLogout }) {
  return (
    <nav className="navbar">
      <button type="button" className="brand" onClick={onGoHome}>
        <img className="brand-logo" src={logo} alt="Meri Virasat — Our Heritage, Our Pride" />
      </button>

      <div className="nav-links">
        <a href="#home" onClick={onGoHome}>Home</a>
        <a href="#about" onClick={onGoHome}>About</a>
        <a href="#discover" onClick={onGoHome}>Artisans</a>
        <a href="#features" onClick={onGoHome}>Explore</a>
        <a href="#about" onClick={onGoHome}>Contact</a>
      </div>

      <div className="nav-actions">
        {currentUser ? (
          <>
            <div className="nav-user-chip">
              <div className="nav-user-avatar">
                {currentUser.profilePictureUrl ? (
                  <img src={Api.mediaUrl(currentUser.profilePictureUrl)} alt={currentUser.fullName} />
                ) : (
                  <span>{currentUser.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span>{currentUser.fullName}</span>
            </div>
            <button className="login-btn" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="login-btn" onClick={onOpenLogin}>
              Login
            </button>
            <button className="register-btn" onClick={onOpenRegister}>
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  currentUser: PropTypes.shape({
    fullName: PropTypes.string,
    profilePictureUrl: PropTypes.string,
  }),
  onGoHome: PropTypes.func.isRequired,
  onOpenLogin: PropTypes.func.isRequired,
  onOpenRegister: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

Navbar.defaultProps = {
  currentUser: null,
};

export default Navbar;

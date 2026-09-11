import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Hero from "./Hero";
import FieldIcon from "./FieldIcon";
import leftSidebarPhoto from "../assets/left_sidebar.png";
import traditionIcon from "../assets/tredition.png";
import supportIcon from "../assets/support.png";
import preserveIcon from "../assets/preserve.png";
import growIcon from "../assets/grow.png";
import loginVisual from "../assets/login.png";

const CRAFT_CATEGORY_OPTIONS = [
  "Pottery & Ceramics",
  "Handloom & Textiles",
  "Wood Carving",
  "Metal Craft",
  "Jewellery Making",
  "Painting & Folk Art",
  "Embroidery",
  "Other",
];

const EXPERIENCE_OPTIONS = ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

const ABOUT_CRAFT_MAX_LENGTH = 500;

const EMPTY_REGISTER_FORM = {
  fullName: "",
  mobile: "",
  email: "",
  state: "",
  district: "",
  craftCategory: "",
  yearsExperience: "",
  aboutCraft: "",
  address: "",
  password: "",
  confirmPassword: "",
};

/**
 * Register + Login as a dedicated full page (replaces the home page's
 * sections while open, rather than floating over them as a popup) — swaps
 * between the two modes in place. Navbar stays mounted above it as the
 * one shared header, and the same Hero banner runs across the top of
 * both modes for a consistent look with the home page.
 */
function AuthPage({ mode, onSwitchMode, onBackHome, onRegister, onLogin, busy }) {
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER_FORM);
  const [craftPhotoFiles, setCraftPhotoFiles] = useState([]);
  const [craftPhotoPreviews, setCraftPhotoPreviews] = useState([]);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    setError("");
    if (mode === "register") setNotice("");
  }, [mode]);

  // Object URL previews for the selected craft photos — same pattern as
  // useHeritageForm's photo previews: one object URL per file, revoked on change.
  useEffect(() => {
    if (craftPhotoFiles.length === 0) {
      setCraftPhotoPreviews([]);
      return undefined;
    }
    const urls = craftPhotoFiles.map((file) => URL.createObjectURL(file));
    setCraftPhotoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [craftPhotoFiles]);

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  // Adds to the current selection rather than replacing it, so the input can
  // be cleared after each pick and re-selecting the same file still fires onChange.
  const handleCraftPhotosChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;
    if (newFiles.some((file) => !file.type.startsWith("image/"))) {
      setError("Please choose image files only.");
      e.target.value = "";
      return;
    }
    setCraftPhotoFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeCraftPhoto = (index) => setCraftPhotoFiles((prev) => prev.filter((_, i) => i !== index));

  const handleRegisterSubmit = async () => {
    setError("");
    if (
      !registerForm.fullName.trim() ||
      !registerForm.mobile.trim() ||
      !registerForm.email.trim() ||
      !registerForm.state.trim() ||
      !registerForm.district.trim() ||
      !registerForm.craftCategory.trim() ||
      !registerForm.yearsExperience.trim() ||
      !registerForm.aboutCraft.trim() ||
      !registerForm.address.trim() ||
      !registerForm.password
    ) {
      setError("Please fill all required fields.");
      return;
    }
    if (registerForm.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const formData = new FormData();
    formData.append("full_name", registerForm.fullName.trim());
    formData.append("email", registerForm.email.trim());
    formData.append("password", registerForm.password);
    formData.append("mobile", registerForm.mobile.trim());
    formData.append("address", registerForm.address.trim());
    formData.append("state", registerForm.state.trim());
    formData.append("district", registerForm.district.trim());
    formData.append("craft_category", registerForm.craftCategory);
    formData.append("years_experience", registerForm.yearsExperience);
    formData.append("about_craft", registerForm.aboutCraft.trim());
    craftPhotoFiles.forEach((file) => formData.append("craft_photos", file));

    try {
      await onRegister(formData);
      setNotice("Account created! Please log in below.");
      onSwitchMode("login");
      setRegisterForm(EMPTY_REGISTER_FORM);
      setCraftPhotoFiles([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoginSubmit = async () => {
    setError("");
    if (!loginForm.email.trim() || !loginForm.password) {
      setError("Please enter your email and password.");
      return;
    }
    try {
      await onLogin(loginForm.email.trim(), loginForm.password);
      onBackHome();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="auth-page-section">
      {mode === "register" && <Hero />}

      <div className="auth-page-container">
        {mode === "register" ? (
          <div className="register-layout">
            <aside
              className="register-sidebar"
              style={{
                "--register-sidebar-photo": `url("${leftSidebarPhoto}")`,
                "--register-sidebar-watermark": `url("${traditionIcon}")`,
              }}
            >
              <div className="register-sidebar-header">
                <img src={traditionIcon} alt="" className="register-sidebar-mark" />
                <h3>Keep Tradition Alive</h3>
              </div>
              <ul className="register-sidebar-list">
                <li>
                  <img src={supportIcon} alt="" className="register-sidebar-icon" />
                  <div>
                    <strong>Support</strong>
                    Local Artisans
                  </div>
                </li>
                <li>
                  <img src={preserveIcon} alt="" className="register-sidebar-icon" />
                  <div>
                    <strong>Preserve</strong>
                    Cultural Heritage
                  </div>
                </li>
                <li>
                  <img src={growIcon} alt="" className="register-sidebar-icon" />
                  <div>
                    <strong>Grow</strong>
                    Sustainable Livelihoods
                  </div>
                </li>
              </ul>
              <blockquote>&ldquo;Every craft tells a story, let&apos;s keep it alive.&rdquo;</blockquote>
            </aside>

            <div className="auth-page-card register-card">
              <div className="auth-card-heading">
                <div className="auth-card-icon">
                  <FieldIcon name="user" />
                </div>
                <div>
                  <h2>Register</h2>
                  <p>Create your account and become a part of Meri Virasat.</p>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FieldIcon name="user" /> Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={registerForm.fullName}
                    onChange={handleRegisterChange}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FieldIcon name="phone" /> Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={registerForm.mobile}
                    onChange={handleRegisterChange}
                    placeholder="Enter 10 digit mobile number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FieldIcon name="mail" /> Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FieldIcon name="pin" /> State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={registerForm.state}
                    onChange={handleRegisterChange}
                    placeholder="Select your state"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FieldIcon name="pin" /> District *
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={registerForm.district}
                    onChange={handleRegisterChange}
                    placeholder="Select your district"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FieldIcon name="tag" /> Art / Craft Category *
                  </label>
                  <select name="craftCategory" value={registerForm.craftCategory} onChange={handleRegisterChange}>
                    <option value="" disabled>
                      Select craft category
                    </option>
                    {CRAFT_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <FieldIcon name="calendar" /> Years of Experience *
                </label>
                <select name="yearsExperience" value={registerForm.yearsExperience} onChange={handleRegisterChange}>
                  <option value="" disabled>
                    Select experience range
                  </option>
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FieldIcon name="edit" /> About Your Craft *
                </label>
                <textarea
                  name="aboutCraft"
                  rows={2}
                  maxLength={ABOUT_CRAFT_MAX_LENGTH}
                  value={registerForm.aboutCraft}
                  onChange={handleRegisterChange}
                  placeholder="Tell us about your craft, materials, specialties, etc."
                />
                <span className="field-hint char-counter">
                  {registerForm.aboutCraft.length}/{ABOUT_CRAFT_MAX_LENGTH}
                </span>
              </div>

              <div className="form-group">
                <label>
                  <FieldIcon name="image" /> Upload Craft / Product Photos
                </label>
                <label className="upload-box craft-photo-upload" htmlFor="craft-photos-input">
                  <div className="craft-photo-upload-prompt">
                    <FieldIcon name="uploadCloud" className="upload-cloud-icon" />
                    <strong>Click to upload or drag and drop</strong>
                    <span>(JPG, PNG - Max 5MB each)</span>
                  </div>

                  {craftPhotoPreviews.length > 0 && (
                    <div className="craft-photo-thumbs">
                      {craftPhotoPreviews.map((src, i) => (
                        <div key={src} className="preview-thumb-wrap">
                          <img className="photo-preview" src={src} alt={`Craft photo ${i + 1}`} />
                          <button
                            type="button"
                            className="preview-remove-btn"
                            aria-label="Remove photo"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeCraftPhoto(i);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <span className="craft-photo-add" aria-hidden="true">
                        +
                      </span>
                    </div>
                  )}
                  <input
                    id="craft-photos-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCraftPhotosChange}
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  <FieldIcon name="home" /> Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={registerForm.address}
                  onChange={handleRegisterChange}
                  placeholder="House No., Street, Village/City"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FieldIcon name="lock" /> Password *
                  </label>
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <FieldIcon name={showPassword ? "eyeOff" : "eye"} />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <FieldIcon name="lock" /> Confirm Password *
                  </label>
                  <div className="password-field">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      <FieldIcon name={showConfirmPassword ? "eyeOff" : "eye"} />
                    </button>
                  </div>
                </div>
              </div>

              {error && <p className="status-text status-error auth-modal-error">{error}</p>}

              <button
                type="button"
                className="submit-heritage-btn"
                onClick={handleRegisterSubmit}
                disabled={busy}
              >
                {busy ? (
                  "Creating account…"
                ) : (
                  <>
                    <FieldIcon name="userPlus" /> Register →
                  </>
                )}
              </button>

              <p className="auth-modal-switch">
                Already have an account?{" "}
                <button type="button" onClick={() => onSwitchMode("login")}>
                  Login
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div className="login-layout">
            <div
              className="login-visual"
              style={{ "--login-visual-photo": `url("${loginVisual}")` }}
            />

            <div className="auth-page-card login-card">
              <div className="auth-card-icon login-card-icon">
                <FieldIcon name="user" />
              </div>
              <h2 className="login-card-title">Welcome Back</h2>
              <p className="login-card-subtitle">Login to your Meri Virasat account</p>

              {notice && <p className="auth-modal-notice">{notice}</p>}

              <div className="form-group">
                <label>
                  <FieldIcon name="mail" /> Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  placeholder="Enter your email address"
                />
              </div>

              <div className="form-group">
                <label>
                  <FieldIcon name="lock" /> Password *
                </label>
                <div className="password-field">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                  >
                    <FieldIcon name={showLoginPassword ? "eyeOff" : "eye"} />
                  </button>
                </div>
              </div>

              {error && <p className="status-text status-error auth-modal-error">{error}</p>}

              <button
                type="button"
                className="submit-heritage-btn"
                onClick={handleLoginSubmit}
                disabled={busy}
              >
                {busy ? (
                  "Logging in…"
                ) : (
                  <>
                    <FieldIcon name="login" /> Login
                  </>
                )}
              </button>

              <p className="auth-modal-switch">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => onSwitchMode("register")}>
                  Register
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

AuthPage.propTypes = {
  mode: PropTypes.oneOf(["register", "login"]).isRequired,
  onSwitchMode: PropTypes.func.isRequired,
  onBackHome: PropTypes.func.isRequired,
  onRegister: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  busy: PropTypes.bool,
};

AuthPage.defaultProps = {
  busy: false,
};

export default AuthPage;

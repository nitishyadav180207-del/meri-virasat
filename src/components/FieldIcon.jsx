import PropTypes from "prop-types";

const COMMON_PROPS = {
  viewBox: "0 0 18 18",
  width: 16,
  height: 16,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const PATHS = {
  user: (
    <>
      <circle cx="9" cy="6" r="3" />
      <path d="M3.2 15c0-3.2 2.6-5.5 5.8-5.5s5.8 2.3 5.8 5.5" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="7" cy="6.5" r="3" />
      <path d="M1.5 15c0-3.2 2.5-5.5 5.5-5.5 1 0 1.9.25 2.7.7" />
      <line x1="14" y1="4" x2="14" y2="9" />
      <line x1="11.5" y1="6.5" x2="16.5" y2="6.5" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="6" height="14" rx="1.5" />
      <circle cx="9" cy="13.1" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="14" height="10" rx="1.5" />
      <path d="M2.5 5.2L9 10l6.5-4.8" />
    </>
  ),
  pin: (
    <>
      <path d="M9 16s5-4.7 5-8.3A5 5 0 0 0 4 7.7C4 11.3 9 16 9 16z" />
      <circle cx="9" cy="7.6" r="1.8" />
    </>
  ),
  tag: (
    <>
      <path d="M3 9V4a1 1 0 0 1 1-1h5l6 6-6 6-6-6z" />
      <circle cx="6.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  calendar: (
    <>
      <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" />
      <line x1="2.5" y1="7" x2="15.5" y2="7" />
      <line x1="6" y1="2" x2="6" y2="5" />
      <line x1="12" y1="2" x2="12" y2="5" />
    </>
  ),
  edit: <path d="M11.8 2.8l3.4 3.4-8.7 8.7H2.9v-3.4l8.9-8.7z" />,
  image: (
    <>
      <rect x="2" y="3" width="14" height="12" rx="1.5" />
      <circle cx="6" cy="7" r="1.3" />
      <path d="M3 13l4-4 3 3 2.5-2.5L15 13" />
    </>
  ),
  home: (
    <>
      <path d="M3 9l6-5.5L15 9" />
      <path d="M4.5 8v6.5h9V8" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="8" width="10" height="7" rx="1.5" />
      <path d="M6 8V5.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  uploadCloud: (
    <>
      <path d="M5.7 13a3.2 3.2 0 0 1-.5-6.36A4 4 0 0 1 12.9 5.5 3.3 3.3 0 0 1 12.5 13h-1.6" />
      <path d="M9 15V9" />
      <path d="M6.5 11.3L9 9l2.5 2.3" />
    </>
  ),
  eye: (
    <>
      <path d="M1.5 9S4 4 9 4s7.5 5 7.5 5-2.5 5-7.5 5-7.5-5-7.5-5z" />
      <circle cx="9" cy="9" r="2.2" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M1.5 9S4 4 9 4s7.5 5 7.5 5-2.5 5-7.5 5-7.5-5-7.5-5z" />
      <circle cx="9" cy="9" r="2.2" />
      <line x1="2.5" y1="15.5" x2="15.5" y2="2.5" />
    </>
  ),
  login: (
    <>
      <path d="M7 3.2H4.2a1 1 0 0 0-1 1v9.6a1 1 0 0 0 1 1H7" />
      <line x1="6.5" y1="9" x2="15" y2="9" />
      <path d="M11.8 5.2L15.6 9l-3.8 3.8" />
    </>
  ),
};

/** A small outline icon used next to form labels — a shared set so every
 * field icon in the register form comes from one place instead of being
 * hand-drawn per call site. */
function FieldIcon({ name, className }) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      {PATHS[name]}
    </svg>
  );
}

FieldIcon.propTypes = {
  name: PropTypes.oneOf(Object.keys(PATHS)).isRequired,
  className: PropTypes.string,
};

FieldIcon.defaultProps = {
  className: "",
};

export default FieldIcon;

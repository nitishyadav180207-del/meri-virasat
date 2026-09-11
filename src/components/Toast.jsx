import { useEffect } from "react";
import PropTypes from "prop-types";

const AUTO_CLOSE_MS = 5000;

/** A brief success banner, fixed to the viewport — closes itself after
 * AUTO_CLOSE_MS, or immediately if the viewer dismisses it. */
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="toast" role="status">
      <span className="toast-icon">✓</span>
      <span>{message}</span>
      <button type="button" className="toast-close" aria-label="Dismiss" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Toast;

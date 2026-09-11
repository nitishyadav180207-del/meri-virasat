import PropTypes from "prop-types";
import { Api } from "../api";

/** Confirmation banner shown right after a heritage record is submitted. */
function SubmittedHeritage({ record }) {
  if (!record) return null;

  return (
    <section className="submitted-section">
      <div className="submitted-container">
        <div className="submitted-badge">✓ New Record Added</div>

        <h2>{record.name}</h2>
        <p className="submitted-location">📍 {record.location}</p>

        <div className="submitted-grid">
          <div>
            <span>Category</span>
            <strong>{record.categoryLabel}</strong>
          </div>
          <div>
            <span>Verification</span>
            <strong>○ Pending Verification</strong>
          </div>
          <div>
            <span>Computed Risk</span>
            <strong>{record.risk}/100</strong>
          </div>
        </div>

        <div className="submitted-story">
          {record.mediaUrls[0] && (
            <img
              className="submitted-photo"
              src={Api.mediaUrl(record.mediaUrls[0])}
              alt={`Submitted heritage: ${record.name}`}
            />
          )}
          <h3>📜 Local Story</h3>
          <p>{record.story}</p>
          {record.transcript && (
            <>
              <h3>🎙️ Transcript</h3>
              <p>{record.transcript}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

SubmittedHeritage.propTypes = {
  record: PropTypes.shape({
    name: PropTypes.string,
    location: PropTypes.string,
    categoryLabel: PropTypes.string,
    risk: PropTypes.number,
    mediaUrls: PropTypes.arrayOf(PropTypes.string),
    story: PropTypes.string,
    transcript: PropTypes.string,
  }),
};

SubmittedHeritage.defaultProps = {
  record: null,
};

export default SubmittedHeritage;

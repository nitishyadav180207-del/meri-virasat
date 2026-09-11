import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Api } from "../api";

const AUDIO_EXTENSION_PATTERN = /\.(mp3|wav|m4a|ogg)$/i;
const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov)$/i;

/**
 * The Heritage Profile detail view: story, transcript, media, evidence, and
 * the community verification action. Renders nothing if `placeId` is null.
 */
function HeritageProfile({ placeId, detail, loading, verifying, onClose, onVerify }) {
  const [verifyNote, setVerifyNote] = useState("");
  const [activeMedia, setActiveMedia] = useState(null);
  const sectionRef = useRef(null);
  const activeMediaRef = useRef(null);

  const closeLightbox = () => {
    // Pausing explicitly (rather than relying on unmount) guarantees audio
    // stops immediately, even if the element is still mid-teardown.
    activeMediaRef.current?.pause?.();
    setActiveMedia(null);
  };

  // Scroll the profile into view as soon as a record is selected, since it
  // renders below the (often tall) map + record list and would otherwise
  // open off-screen.
  useEffect(() => {
    if (placeId) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [placeId]);

  // Close the lightbox on Escape, same as clicking the close button.
  useEffect(() => {
    if (!activeMedia) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMedia]);

  if (!placeId) return null;

  const handleVerifyClick = async () => {
    await onVerify(verifyNote.trim());
    setVerifyNote("");
  };

  return (
    <section className="profile-section" ref={sectionRef}>
      <div className="profile-container">
        {loading && <p className="status-text">Loading profile…</p>}

        {!loading && detail && (
          <>
            <div className="profile-top">
              <div>
                <p className="profile-label">HERITAGE PROFILE</p>
                <h2>{detail.name}</h2>
                <p className="profile-location">📍 {detail.location || "Location not set"}</p>
              </div>

              <button className="close-profile" onClick={onClose}>
                ✕ Close
              </button>
            </div>

            <div className="profile-grid">
              <div className="profile-main">
                <div className="profile-card">
                  <h3>📜 Local Story</h3>
                  <p>{detail.story || "No story added yet."}</p>
                </div>

                {detail.transcript && (
                  <div className="profile-card">
                    <h3>🎙️ Transcript</h3>
                    <p>{detail.transcript}</p>
                  </div>
                )}

                {detail.mediaUrls.length > 0 && (() => {
                  const photoUrls = [];
                  const videoUrls = [];
                  const audioUrls = [];
                  detail.mediaUrls.forEach((url) => {
                    if (AUDIO_EXTENSION_PATTERN.test(url)) audioUrls.push(url);
                    else if (VIDEO_EXTENSION_PATTERN.test(url)) videoUrls.push(url);
                    else photoUrls.push(url);
                  });

                  return (
                    <div className="profile-card">
                      <h3>🖼️ Media</h3>

                      {photoUrls.length > 0 && (
                        <div className="media-grid">
                          {photoUrls.map((url) => {
                            const full = Api.mediaUrl(url);
                            return (
                              <button
                                key={url}
                                type="button"
                                className="media-thumb"
                                onClick={() => setActiveMedia({ url: full, type: "image" })}
                              >
                                <img src={full} alt="Heritage media" />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {videoUrls.length > 0 && (
                        <div className="media-grid">
                          {videoUrls.map((url) => {
                            const full = Api.mediaUrl(url);
                            return (
                              <button
                                key={url}
                                type="button"
                                className="media-thumb media-thumb-video"
                                onClick={() => setActiveMedia({ url: full, type: "video" })}
                              >
                                <video src={full} muted preload="metadata" />
                                <span className="media-thumb-play">▶</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {audioUrls.length > 0 && (
                        <div className="media-grid">
                          {audioUrls.map((url) => {
                            const full = Api.mediaUrl(url);
                            return (
                              <button
                                key={url}
                                type="button"
                                className="media-thumb media-thumb-audio"
                                onClick={() => setActiveMedia({ url: full, type: "audio" })}
                              >
                                🎧 Play audio recording
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="profile-card">
                  <h3>🔎 Evidence &amp; Community Verification</h3>
                  <div className="evidence-list">
                    {detail.evidenceNotes.length === 0 && (
                      <div>No confirmations yet — be the first to verify this record.</div>
                    )}
                    {detail.evidenceNotes.map((note, i) => (
                      <div key={i}>👥 {note}</div>
                    ))}
                  </div>

                  <div className="verify-row">
                    <input
                      type="text"
                      placeholder="e.g. Confirmed by village elder Ramesh"
                      value={verifyNote}
                      onChange={(e) => setVerifyNote(e.target.value)}
                    />
                    <button
                      className="location-btn"
                      onClick={handleVerifyClick}
                      disabled={verifying}
                    >
                      {verifying ? "Verifying…" : "Verify this record"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="profile-side">
                <div className="profile-stat-card">
                  <span>Category</span>
                  <strong>{detail.categoryLabel}</strong>
                </div>

                <div className="profile-stat-card">
                  <span>Verification</span>
                  <strong className="verified-text">
                    {detail.verificationCount} confirmation
                    {detail.verificationCount === 1 ? "" : "s"}
                    {detail.verified ? " · ✓ Verified" : ""}
                  </strong>
                </div>

                <div className="profile-stat-card risk-card">
                  <span>Preservation Risk</span>
                  <strong>{detail.risk}/100</strong>
                  <div className="risk-bar">
                    <div className="risk-fill" style={{ width: `${detail.risk}%` }}></div>
                  </div>
                </div>

                <div className="profile-stat-card">
                  <span>Preservation signals</span>
                  <strong style={{ fontSize: "14px" }}>
                    {detail.knownElders} elders · {detail.youngPractitioners} young
                    practitioners · {detail.practiceFrequency}
                  </strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {activeMedia && (
        <div className="media-lightbox" onClick={closeLightbox}>
          <button
            type="button"
            className="media-lightbox-close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            ✕
          </button>

          <div className="media-lightbox-content" onClick={(e) => e.stopPropagation()}>
            {activeMedia.type === "image" && (
              <img src={activeMedia.url} alt="Heritage media" />
            )}
            {activeMedia.type === "video" && (
              <video ref={activeMediaRef} src={activeMedia.url} controls autoPlay />
            )}
            {activeMedia.type === "audio" && (
              <audio ref={activeMediaRef} src={activeMedia.url} controls autoPlay />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

HeritageProfile.propTypes = {
  placeId: PropTypes.string,
  detail: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    location: PropTypes.string,
    story: PropTypes.string,
    transcript: PropTypes.string,
    mediaUrls: PropTypes.arrayOf(PropTypes.string),
    evidenceNotes: PropTypes.arrayOf(PropTypes.string),
    categoryLabel: PropTypes.string,
    verificationCount: PropTypes.number,
    verified: PropTypes.bool,
    risk: PropTypes.number,
    knownElders: PropTypes.number,
    youngPractitioners: PropTypes.number,
    practiceFrequency: PropTypes.string,
  }),
  loading: PropTypes.bool.isRequired,
  verifying: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onVerify: PropTypes.func.isRequired,
};

HeritageProfile.defaultProps = {
  placeId: null,
  detail: null,
};

export default HeritageProfile;

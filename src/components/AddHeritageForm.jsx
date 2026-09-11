import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Api, CATEGORY_OPTIONS, PRACTICE_FREQUENCY_OPTIONS } from "../api";
import LocationPickerModal from "./LocationPickerModal";

/**
 * The "Add a Heritage Record" form. All state and handlers come from the
 * useHeritageForm hook (owned by App) — this component is purely the form UI.
 * Also doubles as the edit form: when `editingId` is set, submitting updates
 * that record instead of creating a new one.
 */
function AddHeritageForm({
  heritageForm,
  editingId,
  photoFiles,
  photoPreviews,
  videoFiles,
  videoPreviews,
  audioFiles,
  audioPreviews,
  existingPhotoUrls,
  existingVideoUrls,
  existingAudioUrls,
  submitting,
  gpsStatus,
  showLocationPicker,
  onFormChange,
  onPhotoChange,
  onVideoChange,
  onAudioChange,
  onRemovePhotoFile,
  onRemoveVideoFile,
  onRemoveAudioFile,
  onRemoveExistingPhoto,
  onRemoveExistingVideo,
  onRemoveExistingAudio,
  onCaptureLocation,
  onOpenLocationPicker,
  onCloseLocationPicker,
  onManualLocationSelect,
  onCancelEdit,
  onSubmit,
}) {
  const sectionRef = useRef(null);

  // Jump to the form as soon as an edit starts, since the record being
  // edited is usually further up the page (in the record list).
  useEffect(() => {
    if (editingId) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingId]);

  return (
    <section className="add-heritage-section" id="add-heritage" ref={sectionRef}>
      <div className="add-heritage-container">
        <div className="add-heritage-heading">
          <p>{editingId ? "UPDATE HERITAGE RECORD" : "DOCUMENT YOUR HERITAGE"}</p>
          <h2>{editingId ? "Edit Heritage Record" : "Add a Heritage Record"}</h2>
          <span>Help preserve a place, story or tradition by adding it to Meri Virasat.</span>
        </div>

        <div className="add-heritage-card">
          <div className="form-group">
            <label>Heritage Name</label>
            <input
              type="text"
              name="name"
              value={heritageForm.name}
              onChange={onFormChange}
              placeholder="Example: Ancient Village Temple"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={heritageForm.category} onChange={onFormChange}>
                <option value="" disabled>
                  Select category
                </option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={heritageForm.location}
                onChange={onFormChange}
                placeholder="Village, District, State"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Local Story / Description</label>
            <textarea
              name="story"
              value={heritageForm.story}
              onChange={onFormChange}
              rows="5"
              placeholder="Tell us what the community knows about this heritage..."
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Known elders who remember it</label>
              <input
                type="number"
                name="knownElders"
                min="0"
                value={heritageForm.knownElders}
                onChange={onFormChange}
              />
            </div>
            <div className="form-group">
              <label>Young practitioners</label>
              <input
                type="number"
                name="youngPractitioners"
                min="0"
                value={heritageForm.youngPractitioners}
                onChange={onFormChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>How often is it practiced / visited?</label>
            <select
              name="practiceFrequency"
              value={heritageForm.practiceFrequency}
              onChange={onFormChange}
            >
              {PRACTICE_FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="field-hint">
              This drives the Heritage Risk Score — fewer elders, no young practitioners and
              declining practice all raise the risk.
            </span>
          </div>

          <div className="upload-grid">
            <div className="upload-box">
              <div>📸</div>
              <strong>Add Photo</strong>
              <span>Upload one or more images</span>

              {(existingPhotoUrls.length > 0 || photoPreviews.length > 0) && (
                <div className="photo-preview-grid">
                  {existingPhotoUrls.map((url) => (
                    <div key={url} className="preview-thumb-wrap">
                      <img className="photo-preview" src={Api.mediaUrl(url)} alt="Existing heritage" />
                      <button
                        type="button"
                        className="preview-remove-btn"
                        aria-label="Remove photo"
                        onClick={() => onRemoveExistingPhoto(url)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {photoPreviews.map((src, i) => (
                    <div key={src} className="preview-thumb-wrap">
                      <img className="photo-preview" src={src} alt={`Selected heritage ${i + 1}`} />
                      <button
                        type="button"
                        className="preview-remove-btn"
                        aria-label="Remove photo"
                        onClick={() => onRemovePhotoFile(i)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input type="file" accept="image/*" multiple onChange={onPhotoChange} />
              {photoFiles.length > 0 && (
                <span className="field-hint">
                  {photoFiles.length} new photo{photoFiles.length > 1 ? "s" : ""} selected
                </span>
              )}
            </div>

            <div className="upload-box">
              <div>🎥</div>
              <strong>Add Video</strong>
              <span>Upload one or more short videos</span>

              {(existingVideoUrls.length > 0 || videoPreviews.length > 0) && (
                <div className="upload-preview-list">
                  {existingVideoUrls.map((url) => (
                    <div key={url} className="preview-thumb-wrap">
                      <video className="video-preview" src={Api.mediaUrl(url)} controls />
                      <button
                        type="button"
                        className="preview-remove-btn"
                        aria-label="Remove video"
                        onClick={() => onRemoveExistingVideo(url)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {videoPreviews.map((src, i) => (
                    <div key={src} className="preview-thumb-wrap">
                      <video className="video-preview" src={src} controls />
                      <button
                        type="button"
                        className="preview-remove-btn"
                        aria-label="Remove video"
                        onClick={() => onRemoveVideoFile(i)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input type="file" accept="video/*" multiple onChange={onVideoChange} />
              {videoFiles.length > 0 && (
                <span className="field-hint">
                  {videoFiles.length} new video{videoFiles.length > 1 ? "s" : ""} selected
                </span>
              )}
            </div>

            <div className="upload-box">
              <div>🎙️</div>
              <strong>Add Audio</strong>
              <span>Upload oral history — will be transcribed automatically</span>

              {(existingAudioUrls.length > 0 || audioPreviews.length > 0) && (
                <div className="upload-preview-list">
                  {existingAudioUrls.map((url) => (
                    <div key={url} className="preview-thumb-wrap">
                      <audio className="audio-preview" src={Api.mediaUrl(url)} controls />
                      <button
                        type="button"
                        className="preview-remove-btn"
                        aria-label="Remove audio"
                        onClick={() => onRemoveExistingAudio(url)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {audioPreviews.map((src, i) => (
                    <div key={src} className="preview-thumb-wrap">
                      <audio className="audio-preview" src={src} controls />
                      <button
                        type="button"
                        className="preview-remove-btn"
                        aria-label="Remove audio"
                        onClick={() => onRemoveAudioFile(i)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input type="file" accept="audio/*" multiple onChange={onAudioChange} />
              {audioFiles.length > 0 && (
                <span className="field-hint">
                  {audioFiles.length} new audio file{audioFiles.length > 1 ? "s" : ""} selected
                </span>
              )}
            </div>
          </div>

          <div className="location-box">
            <div>
              <strong>📍 GPS Location</strong>
              <p>{gpsStatus || "Add the exact location of this heritage site."}</p>
            </div>

            <div className="location-box-actions">
              <button type="button" className="location-btn" onClick={onCaptureLocation}>
                📍 Use My Location
              </button>
              <button type="button" className="location-btn" onClick={onOpenLocationPicker}>
                🗺️ Select Custom Location
              </button>
            </div>
          </div>

          <div className="submit-row">
            {editingId && (
              <button
                type="button"
                className="cancel-edit-btn"
                onClick={onCancelEdit}
                disabled={submitting}
              >
                ✕ Cancel edit
              </button>
            )}
            <button
              type="button"
              className="submit-heritage-btn"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" /> Saving…
                </>
              ) : editingId ? (
                "Update Heritage Record →"
              ) : (
                "Submit Heritage Record →"
              )}
            </button>
          </div>
        </div>
      </div>

      {showLocationPicker && (
        <LocationPickerModal
          latitude={heritageForm.latitude}
          longitude={heritageForm.longitude}
          onPick={onManualLocationSelect}
          onClose={onCloseLocationPicker}
        />
      )}
    </section>
  );
}

AddHeritageForm.propTypes = {
  heritageForm: PropTypes.shape({
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    story: PropTypes.string.isRequired,
    knownElders: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    youngPractitioners: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    practiceFrequency: PropTypes.string.isRequired,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }).isRequired,
  editingId: PropTypes.string,
  photoFiles: PropTypes.arrayOf(PropTypes.object),
  photoPreviews: PropTypes.arrayOf(PropTypes.string),
  videoFiles: PropTypes.arrayOf(PropTypes.object),
  videoPreviews: PropTypes.arrayOf(PropTypes.string),
  audioFiles: PropTypes.arrayOf(PropTypes.object),
  audioPreviews: PropTypes.arrayOf(PropTypes.string),
  existingPhotoUrls: PropTypes.arrayOf(PropTypes.string),
  existingVideoUrls: PropTypes.arrayOf(PropTypes.string),
  existingAudioUrls: PropTypes.arrayOf(PropTypes.string),
  submitting: PropTypes.bool.isRequired,
  gpsStatus: PropTypes.string,
  showLocationPicker: PropTypes.bool,
  onFormChange: PropTypes.func.isRequired,
  onPhotoChange: PropTypes.func.isRequired,
  onVideoChange: PropTypes.func.isRequired,
  onAudioChange: PropTypes.func.isRequired,
  onRemovePhotoFile: PropTypes.func.isRequired,
  onRemoveVideoFile: PropTypes.func.isRequired,
  onRemoveAudioFile: PropTypes.func.isRequired,
  onRemoveExistingPhoto: PropTypes.func.isRequired,
  onRemoveExistingVideo: PropTypes.func.isRequired,
  onRemoveExistingAudio: PropTypes.func.isRequired,
  onCaptureLocation: PropTypes.func.isRequired,
  onOpenLocationPicker: PropTypes.func.isRequired,
  onCloseLocationPicker: PropTypes.func.isRequired,
  onManualLocationSelect: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

AddHeritageForm.defaultProps = {
  editingId: null,
  photoFiles: [],
  photoPreviews: [],
  videoFiles: [],
  videoPreviews: [],
  audioFiles: [],
  audioPreviews: [],
  existingPhotoUrls: [],
  existingVideoUrls: [],
  existingAudioUrls: [],
  gpsStatus: "",
  showLocationPicker: false,
};

export default AddHeritageForm;

import { useState, useEffect } from "react";
import { Api, mapRecord } from "../api";

const EMPTY_FORM = {
  name: "",
  category: "",
  location: "",
  story: "",
  knownElders: 0,
  youngPractitioners: 0,
  practiceFrequency: "unknown",
  latitude: null,
  longitude: null,
};

const AUDIO_EXTENSION_PATTERN = /\.(mp3|wav|m4a|ogg)$/i;
const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov)$/i;

/** Splits a record's flat media_urls list into photo/video/audio buckets. */
function classifyMediaUrls(urls) {
  const photos = [];
  const videos = [];
  const audios = [];
  for (const url of urls || []) {
    if (AUDIO_EXTENSION_PATTERN.test(url)) audios.push(url);
    else if (VIDEO_EXTENSION_PATTERN.test(url)) videos.push(url);
    else photos.push(url);
  }
  return { photos, videos, audios };
}

/**
 * Manages the Add Heritage form: field state, file selections, GPS capture,
 * and the full submit flow (create record -> upload media -> transcribe
 * audio -> re-fetch the final record).
 *
 * @param {(record: object, isUpdate: boolean) => void} onSaved - called with
 *   the newly created/updated (and fully-populated) record after a
 *   successful submit; `isUpdate` is true when an existing record was
 *   edited rather than a new one created.
 */
export function useHeritageForm(onSaved) {
  const [heritageForm, setHeritageForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [audioPreviews, setAudioPreviews] = useState([]);
  // Already-uploaded media on the record being edited (empty when creating).
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([]);
  const [existingVideoUrls, setExistingVideoUrls] = useState([]);
  const [existingAudioUrls, setExistingAudioUrls] = useState([]);
  // Existing media the user removed in this edit session — not deleted on
  // the backend until Submit, so "Cancel edit" can discard the change.
  const [pendingMediaRemovals, setPendingMediaRemovals] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setHeritageForm((prev) => ({ ...prev, [name]: value }));
  };

  // Each of these *adds* to the current selection rather than replacing it,
  // so picking a photo, then picking another, keeps both — the input is
  // cleared after so re-selecting the same file again still fires onChange.
  const handlePhotoChange = (event) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;
    if (newFiles.some((file) => !file.type.startsWith("image/"))) {
      alert("Please choose image files only.");
      event.target.value = "";
      return;
    }
    setPhotoFiles((prev) => [...prev, ...newFiles]);
    event.target.value = "";
  };

  const handleVideoChange = (event) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;
    setVideoFiles((prev) => [...prev, ...newFiles]);
    event.target.value = "";
  };

  const handleAudioChange = (event) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;
    setAudioFiles((prev) => [...prev, ...newFiles]);
    event.target.value = "";
  };

  const removePhotoFile = (index) => setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  const removeVideoFile = (index) => setVideoFiles((prev) => prev.filter((_, i) => i !== index));
  const removeAudioFile = (index) => setAudioFiles((prev) => prev.filter((_, i) => i !== index));

  // Existing (already-uploaded) media: hide it immediately and queue the
  // actual deletion for submit time.
  const removeExistingPhoto = (url) => {
    setExistingPhotoUrls((prev) => prev.filter((u) => u !== url));
    setPendingMediaRemovals((prev) => [...prev, url]);
  };
  const removeExistingVideo = (url) => {
    setExistingVideoUrls((prev) => prev.filter((u) => u !== url));
    setPendingMediaRemovals((prev) => [...prev, url]);
  };
  const removeExistingAudio = (url) => {
    setExistingAudioUrls((prev) => prev.filter((u) => u !== url));
    setPendingMediaRemovals((prev) => [...prev, url]);
  };

  // Object URLs let <img>/<video>/<audio> preview each selected file without
  // reading it fully into memory.
  useEffect(() => {
    if (photoFiles.length === 0) {
      setPhotoPreviews([]);
      return undefined;
    }
    const urls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photoFiles]);

  useEffect(() => {
    if (videoFiles.length === 0) {
      setVideoPreviews([]);
      return undefined;
    }
    const urls = videoFiles.map((file) => URL.createObjectURL(file));
    setVideoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [videoFiles]);

  useEffect(() => {
    if (audioFiles.length === 0) {
      setAudioPreviews([]);
      return undefined;
    }
    const urls = audioFiles.map((file) => URL.createObjectURL(file));
    setAudioPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [audioFiles]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Your browser does not support location.");
      return;
    }
    setGpsStatus("Locating…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setHeritageForm((prev) => ({ ...prev, latitude, longitude }));
        setGpsStatus(`Location captured: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (error) => {
        setGpsStatus("Unable to get your location. Please allow location access.");
        console.error(error);
      }
    );
  };

  const openLocationPicker = () => setShowLocationPicker(true);
  const closeLocationPicker = () => setShowLocationPicker(false);

  const handleManualLocation = (latitude, longitude) => {
    setHeritageForm((prev) => ({ ...prev, latitude, longitude }));
    setGpsStatus(`Location selected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    setShowLocationPicker(false);
  };

  const resetForm = () => {
    setHeritageForm(EMPTY_FORM);
    setEditingId(null);
    setPhotoFiles([]);
    setVideoFiles([]);
    setAudioFiles([]);
    setExistingPhotoUrls([]);
    setExistingVideoUrls([]);
    setExistingAudioUrls([]);
    setPendingMediaRemovals([]);
    setGpsStatus("");
    setShowLocationPicker(false);
  };

  // Loads an existing record's fields (and its already-uploaded media) into
  // the form so submitting updates it instead of creating a new one.
  const startEdit = (place) => {
    setEditingId(place.id);
    setHeritageForm({
      name: place.name || "",
      category: place.category || "",
      location: place.location || "",
      story: place.story || "",
      knownElders: place.knownElders ?? 0,
      youngPractitioners: place.youngPractitioners ?? 0,
      practiceFrequency: place.practiceFrequency || "unknown",
      latitude: place.lat ?? null,
      longitude: place.lng ?? null,
    });
    setPhotoFiles([]);
    setVideoFiles([]);
    setAudioFiles([]);
    setPendingMediaRemovals([]);
    const { photos, videos, audios } = classifyMediaUrls(place.mediaUrls);
    setExistingPhotoUrls(photos);
    setExistingVideoUrls(videos);
    setExistingAudioUrls(audios);
    setGpsStatus(
      place.lat != null && place.lng != null
        ? `Current location: ${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`
        : ""
    );
  };

  const cancelEdit = () => resetForm();

  const isFormValid = () =>
    Boolean(
      heritageForm.name.trim() &&
        heritageForm.category &&
        heritageForm.location.trim() &&
        heritageForm.story.trim()
    );

  const handleSubmitHeritage = async () => {
    if (!isFormValid()) {
      alert("Please fill all heritage details.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: heritageForm.name.trim(),
        category: heritageForm.category,
        description: heritageForm.story.trim(),
        location_name: heritageForm.location.trim(),
        latitude: heritageForm.latitude,
        longitude: heritageForm.longitude,
        known_elders: Number(heritageForm.knownElders) || 0,
        young_practitioners: Number(heritageForm.youngPractitioners) || 0,
        practice_frequency: heritageForm.practiceFrequency || "unknown",
      };

      const isUpdate = Boolean(editingId);
      let recordId = editingId;
      if (isUpdate) {
        await Api.updateHeritage(editingId, payload);
      } else {
        const created = await Api.createHeritage(payload);
        recordId = created.id;
      }

      // Also sequential: same media_urls-append race as the uploads below.
      for (const url of pendingMediaRemovals) {
        await Api.removeMedia(recordId, url);
      }

      // Uploaded one at a time (not Promise.all): the backend appends each
      // file's URL to the same media_urls list, so concurrent uploads for
      // one record could race and drop an entry.
      for (const file of photoFiles) {
        await Api.uploadMedia(recordId, file);
      }
      for (const file of videoFiles) {
        await Api.uploadMedia(recordId, file);
      }
      // Transcription is a nice-to-have enrichment, not core to saving the
      // record — one file failing (e.g. a missing ffmpeg install on the
      // server) shouldn't lose an otherwise-successful submit.
      const transcriptionErrors = [];
      for (const file of audioFiles) {
        try {
          await Api.transcribe(recordId, file);
        } catch (err) {
          transcriptionErrors.push(err.message);
        }
      }

      // Re-fetch so the result reflects any uploaded media/transcript.
      const finalRecord = await Api.getHeritage(recordId);
      const mapped = mapRecord(finalRecord);

      onSaved?.(mapped, isUpdate);
      resetForm();

      if (transcriptionErrors.length > 0) {
        alert(
          `Heritage record saved, but audio transcription failed: ${transcriptionErrors[0]}`
        );
      }
    } catch (err) {
      alert(`Could not save heritage record: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    heritageForm,
    editingId,
    startEdit,
    cancelEdit,
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
    handleFormChange,
    handlePhotoChange,
    handleVideoChange,
    handleAudioChange,
    removePhotoFile,
    removeVideoFile,
    removeAudioFile,
    removeExistingPhoto,
    removeExistingVideo,
    removeExistingAudio,
    getCurrentLocation,
    openLocationPicker,
    closeLocationPicker,
    handleManualLocation,
    handleSubmitHeritage,
  };
}

import { useState } from "react";
import "./App.css";

import { useHeritageRecords } from "./hooks/useHeritageRecords";
import { useHeritageProfile } from "./hooks/useHeritageProfile";
import { useHeritageForm } from "./hooks/useHeritageForm";
import { useAuth } from "./hooks/useAuth";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import DiscoverSection from "./components/DiscoverSection";
import HeritageProfile from "./components/HeritageProfile";
import AddHeritageForm from "./components/AddHeritageForm";
import SubmittedHeritage from "./components/SubmittedHeritage";
import FeaturesSection from "./components/FeaturesSection";
import DifferenceSection from "./components/DifferenceSection";
import Footer from "./components/Footer";
import AuthPage from "./components/AuthPage";
import Toast from "./components/Toast";

/**
 * Top-level app: owns the pieces of state that are shared across sections
 * (the records list, the open profile, the add-heritage form) via small
 * custom hooks, and renders each page section as its own component.
 */
function App() {
  const { places, setPlaces, loading, error, refresh, deletePlace } = useHeritageRecords();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [submittedHeritage, setSubmittedHeritage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { currentUser, authBusy, register, login, logout } = useAuth();
  const [authView, setAuthView] = useState(null); // null | "login" | "register"

  const { selectedPlaceId, profileDetail, profileLoading, verifying, openProfile, closeProfile, verify } =
    useHeritageProfile(refresh);

  const formState = useHeritageForm((record, isUpdate) => {
    setPlaces((prev) =>
      isUpdate ? prev.map((p) => (p.id === record.id ? record : p)) : [...prev, record]
    );
    setSubmittedHeritage(record);
    setSuccessMessage(isUpdate ? "Record updated successfully!" : "Record submitted successfully!");
  });

  const handleDeletePlace = async (place) => {
    if (!window.confirm(`Delete "${place.name}"? This cannot be undone.`)) return;
    try {
      await deletePlace(place.id);
      if (selectedPlaceId === place.id) closeProfile();
      if (formState.editingId === place.id) formState.cancelEdit();
    } catch (err) {
      alert(`Could not delete: ${err.message}`);
    }
  };

  const navbar = (
    <Navbar
      currentUser={currentUser}
      onGoHome={() => setAuthView(null)}
      onOpenLogin={() => setAuthView("login")}
      onOpenRegister={() => setAuthView("register")}
      onLogout={logout}
    />
  );

  // Register/Login render as their own page — replacing the home page's
  // sections rather than floating over them as a popup — with the Navbar
  // staying mounted above as the one shared header.
  if (authView) {
    return (
      <div className="app">
        {navbar}
        <AuthPage
          mode={authView}
          busy={authBusy}
          onSwitchMode={setAuthView}
          onBackHome={() => setAuthView(null)}
          onRegister={register}
          onLogin={login}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {navbar}

      <Hero showAddHeritageLink />

      <DiscoverSection
        places={places}
        loading={loading}
        error={error}
        selectedCategory={selectedCategory}
        currentUserId={currentUser?.id}
        onSelectCategory={setSelectedCategory}
        onSelectPlace={openProfile}
        onEditPlace={formState.startEdit}
        onDeletePlace={handleDeletePlace}
      />

      <HeritageProfile
        placeId={selectedPlaceId}
        detail={profileDetail}
        loading={profileLoading}
        verifying={verifying}
        onClose={closeProfile}
        onVerify={verify}
      />

      {currentUser ? (
        <AddHeritageForm
          heritageForm={formState.heritageForm}
          editingId={formState.editingId}
          onCancelEdit={formState.cancelEdit}
          photoFiles={formState.photoFiles}
          photoPreviews={formState.photoPreviews}
          videoFiles={formState.videoFiles}
          videoPreviews={formState.videoPreviews}
          audioFiles={formState.audioFiles}
          audioPreviews={formState.audioPreviews}
          existingPhotoUrls={formState.existingPhotoUrls}
          existingVideoUrls={formState.existingVideoUrls}
          existingAudioUrls={formState.existingAudioUrls}
          submitting={formState.submitting}
          gpsStatus={formState.gpsStatus}
          showLocationPicker={formState.showLocationPicker}
          onFormChange={formState.handleFormChange}
          onPhotoChange={formState.handlePhotoChange}
          onVideoChange={formState.handleVideoChange}
          onAudioChange={formState.handleAudioChange}
          onRemovePhotoFile={formState.removePhotoFile}
          onRemoveVideoFile={formState.removeVideoFile}
          onRemoveAudioFile={formState.removeAudioFile}
          onRemoveExistingPhoto={formState.removeExistingPhoto}
          onRemoveExistingVideo={formState.removeExistingVideo}
          onRemoveExistingAudio={formState.removeExistingAudio}
          onCaptureLocation={formState.getCurrentLocation}
          onOpenLocationPicker={formState.openLocationPicker}
          onCloseLocationPicker={formState.closeLocationPicker}
          onManualLocationSelect={formState.handleManualLocation}
          onSubmit={formState.handleSubmitHeritage}
        />
      ) : (
        <section className="add-heritage-section" id="add-heritage">
          <div className="add-heritage-container">
            <div className="add-heritage-heading">
              <p>DOCUMENT YOUR HERITAGE</p>
              <h2>Add a Heritage Record</h2>
              <span>Log in to help preserve a place, story or tradition by adding it to Meri Virasat.</span>
            </div>
            <div className="login-prompt-card">
              <button
                type="button"
                className="submit-heritage-btn"
                onClick={() => setAuthView("login")}
              >
                Login to add a record →
              </button>
            </div>
          </div>
        </section>
      )}

      <SubmittedHeritage record={submittedHeritage} />

      <FeaturesSection />
      <DifferenceSection />
      <Footer />

      {successMessage && (
        <Toast message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
    </div>
  );
}

export default App;

import PropTypes from "prop-types";
import { MapContainer, TileLayer, LayersControl, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_OPTIONS } from "../api";
import FieldIcon from "./FieldIcon";

const DEFAULT_CENTER = [25.59, 85.14];

const CATEGORY_ICONS = {
  temple: "🛕",
  ritual: "🎭",
  sacred_tree: "🌳",
  song: "🎙️",
  craft: "🧑‍🎨",
};

function riskColor(risk) {
  if (risk >= 80) return "#b83333";
  if (risk >= 60) return "#d2872f";
  return "#3d7c4a";
}

/**
 * The Khoj / Discover section: category filter bar, the Leaflet map, and the
 * matching sidebar list. All data and selection state is owned by App and
 * passed in as props, so this component is just presentation + map wiring.
 */
function DiscoverSection({
  places,
  loading,
  error,
  selectedCategory,
  currentUserId,
  onSelectCategory,
  onSelectPlace,
  onEditPlace,
  onDeletePlace,
}) {
  const filteredPlaces =
    selectedCategory === "All"
      ? places
      : places.filter((place) => place.category === selectedCategory);

  return (
    <section className="discover-section" id="discover">
      <div className="discover-header">
        <div>
          <p className="discover-label">KHOJ</p>
          <h2>Discover India's hidden heritage</h2>
          <p>Explore places and living traditions documented by local communities.</p>
        </div>

        <div className="place-count">
          <strong>{filteredPlaces.length}</strong>
          <span>Heritage Records</span>
        </div>
      </div>

      {error && (
        <p className="status-text status-error">
          {error} — is the backend running at the configured API URL?
        </p>
      )}

      <div className="category-filters">
        <button
          onClick={() => onSelectCategory("All")}
          className={selectedCategory === "All" ? "filter-btn active" : "filter-btn"}
        >
          All
        </button>
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onSelectCategory(cat.value)}
            className={selectedCategory === cat.value ? "filter-btn active" : "filter-btn"}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="status-text">Loading heritage places…</p>
      ) : (
        <div className="map-layout">
          <div className="map-container">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={11}
              scrollWheelZoom={true}
              className="heritage-map"
              style={{ height: "100%", width: "100%" }}
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Street">
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS community"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              {filteredPlaces
                .filter((place) => place.lat != null && place.lng != null)
                .map((place) => (
                  <CircleMarker
                    key={place.id}
                    center={[place.lat, place.lng]}
                    radius={10}
                    eventHandlers={{ click: () => onSelectPlace(place.id) }}
                    pathOptions={{
                      fillColor: riskColor(place.risk),
                      color: "#ffffff",
                      weight: 3,
                      fillOpacity: 0.9,
                    }}
                  >
                    <Popup>
                      <div className="popup-content">
                        <span className="popup-category">{place.categoryLabel}</span>
                        <h3>{place.name}</h3>
                        <p>📍 {place.location}</p>
                        <p>{place.story}</p>
                        <div className="popup-risk">
                          Risk Score: <strong>{place.risk}/100</strong>
                        </div>
                        <div className="popup-status">
                          {place.verified ? "✓ Community Verified" : "○ Verification Pending"}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
            </MapContainer>
          </div>

          <div className="map-sidebar">
            <div className="sidebar-heading">
              <span>LIVE DATA</span>
              <h3>Heritage Records</h3>
            </div>

            {filteredPlaces.length === 0 && (
              <p className="status-text">No records in this category yet.</p>
            )}

            {filteredPlaces.map((place) => (
              <div
                className="place-card"
                key={place.id}
                onClick={() => onSelectPlace(place.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="place-top">
                  <div className="place-icon">{CATEGORY_ICONS[place.category] || "🏚️"}</div>
                  <div className="place-title">
                    <h4>{place.name}</h4>
                    <p>
                      <FieldIcon name="pin" /> {place.location || "Location not set"}
                    </p>
                    <p className="place-owner">
                      <FieldIcon name="user" /> {place.ownerName || "Unknown contributor"}
                    </p>
                  </div>
                  {currentUserId && place.ownerId === currentUserId && (
                    <div className="place-actions">
                      <button
                        type="button"
                        className="place-edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPlace(place);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="place-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePlace(place);
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="place-bottom">
                  <span>Risk {place.risk}/100</span>
                  <span>{place.verified ? "✓ Verified" : "Pending"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const placeShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  ownerId: PropTypes.string,
  ownerName: PropTypes.string,
  name: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  categoryLabel: PropTypes.string.isRequired,
  location: PropTypes.string,
  story: PropTypes.string,
  lat: PropTypes.number,
  lng: PropTypes.number,
  risk: PropTypes.number.isRequired,
  verified: PropTypes.bool,
  knownElders: PropTypes.number,
  youngPractitioners: PropTypes.number,
  practiceFrequency: PropTypes.string,
});

DiscoverSection.propTypes = {
  places: PropTypes.arrayOf(placeShape).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  selectedCategory: PropTypes.string.isRequired,
  currentUserId: PropTypes.string,
  onSelectCategory: PropTypes.func.isRequired,
  onSelectPlace: PropTypes.func.isRequired,
  onEditPlace: PropTypes.func.isRequired,
  onDeletePlace: PropTypes.func.isRequired,
};

DiscoverSection.defaultProps = {
  error: "",
  currentUserId: null,
};

export default DiscoverSection;

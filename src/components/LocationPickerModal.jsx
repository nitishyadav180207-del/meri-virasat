import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer, LayersControl, CircleMarker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Api } from "../api";

const DEFAULT_CENTER = [25.59, 85.14];
const SEARCH_DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;

/** Invisible helper that reports map clicks back up via `onPick`. */
function ClickCapture({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Modal map picker: lets the user either search for a place by name or
 * click anywhere on the map to set a heritage record's coordinates
 * manually, as an alternative to GPS capture.
 */
function LocationPickerModal({ latitude, longitude, onPick, onClose }) {
  const center = latitude != null && longitude != null ? [latitude, longitude] : DEFAULT_CENTER;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Debounced place search, proxied through our backend (see
  // backend/routers/geocode.py for why it isn't called directly).
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearchError("");
      return undefined;
    }

    setSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const data = await Api.searchLocation(trimmed);
        setResults(data);
        setSearchError(data.length === 0 ? "No places found." : "");
      } catch {
        setResults([]);
        setSearchError("Could not search right now. Try again.");
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleResultClick = (result) => {
    onPick(result.lat, result.lon);
  };

  return (
    <div className="media-lightbox" onClick={onClose}>
      <button type="button" className="media-lightbox-close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className="location-picker-content" onClick={(e) => e.stopPropagation()}>
        <div className="location-picker-search">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a place, village, or landmark…"
          />
          {(results.length > 0 || searching || searchError) && (
            <div className="location-picker-results">
              {searching && <div className="location-picker-result-status">Searching…</div>}
              {!searching && searchError && (
                <div className="location-picker-result-status">{searchError}</div>
              )}
              {!searching &&
                results.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    className="location-picker-result"
                    onClick={() => handleResultClick(result)}
                  >
                    📍 {result.display_name}
                  </button>
                ))}
            </div>
          )}
        </div>

        <p className="location-picker-hint">Or click anywhere on the map to set this location.</p>
        <MapContainer center={center} zoom={11} className="location-picker-map">
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
          <ClickCapture onPick={onPick} />
          {latitude != null && longitude != null && (
            <CircleMarker
              center={[latitude, longitude]}
              radius={10}
              pathOptions={{ fillColor: "#a25228", color: "#ffffff", weight: 3, fillOpacity: 0.9 }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

LocationPickerModal.propTypes = {
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  onPick: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

LocationPickerModal.defaultProps = {
  latitude: null,
  longitude: null,
};

export default LocationPickerModal;

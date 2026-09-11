import { useCallback, useEffect, useState } from "react";
import { Api, mapRecord } from "../api";

/**
 * Loads the full heritage records list from the backend and exposes a
 * `refresh` function so other parts of the app (e.g. after creating or
 * verifying a record) can trigger a re-fetch.
 *
 * @returns {{
 *   places: object[],
 *   loading: boolean,
 *   error: string,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useHeritageRecords() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const records = await Api.listHeritage();
      setPlaces(records.map(mapRecord));
    } catch (err) {
      setError(err.message || "Could not load heritage records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Standard "fetch on mount" pattern: `refresh` is memoized via useCallback
    // with an empty dependency array, so this runs exactly once per mount and
    // won't cascade into repeated renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const deletePlace = useCallback(async (id) => {
    await Api.deleteHeritage(id);
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { places, setPlaces, loading, error, setError, refresh, deletePlace };
}

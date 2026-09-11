import { useCallback, useState } from "react";
import { Api, mapRecord } from "../api";

/**
 * Manages the currently-open Heritage Profile: which record is selected,
 * its full detail (fetched separately from the list, since the list doesn't
 * include transcript/evidence/media), and the "verify this record" action.
 *
 * @param {() => Promise<void>} onVerified - called after a successful verify,
 *   so the caller can refresh the list (e.g. to update risk badges/counts).
 */
export function useHeritageProfile(onVerified) {
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [profileDetail, setProfileDetail] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const openProfile = useCallback(async (id) => {
    setSelectedPlaceId(id);
    setProfileLoading(true);
    setProfileError("");
    try {
      const record = await Api.getHeritage(id);
      setProfileDetail(mapRecord(record));
    } catch (err) {
      setProfileDetail(null);
      setProfileError(err.message || "Could not load this heritage profile.");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const closeProfile = useCallback(() => {
    setSelectedPlaceId(null);
    setProfileDetail(null);
  }, []);

  const verify = useCallback(
    async (note) => {
      if (!profileDetail) return;
      setVerifying(true);
      try {
        await Api.verify(profileDetail.id, note);
        await openProfile(profileDetail.id);
        await onVerified?.();
      } catch (err) {
        alert(`Could not verify: ${err.message}`);
      } finally {
        setVerifying(false);
      }
    },
    [profileDetail, openProfile, onVerified]
  );

  return {
    selectedPlaceId,
    profileDetail,
    profileLoading,
    profileError,
    verifying,
    openProfile,
    closeProfile,
    verify,
  };
}

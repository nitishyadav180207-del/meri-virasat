"""
Location search: proxies OpenStreetMap's Nominatim geocoder.

Called from the "Select Custom Location" map picker so users can search for
a place by name. Proxied through the backend rather than called directly
from the browser because Nominatim doesn't send CORS headers for browser
use, and its usage policy requires a proper User-Agent identifying the
calling application — something browser JS can't set on an outgoing fetch.
"""
import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/geocode", tags=["geocode"])

NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "MeriVirasat/1.0 (hackathon demo; heritage documentation app)"


@router.get("/search")
def search_locations(q: str = Query(..., min_length=3)) -> list[dict]:
    """Search for a place by name and return a short list of matches."""
    try:
        response = requests.get(
            NOMINATIM_SEARCH_URL,
            params={"format": "json", "limit": 6, "q": q},
            headers={"User-Agent": USER_AGENT},
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Location search failed: {exc}")

    return [
        {
            "place_id": item["place_id"],
            "display_name": item["display_name"],
            "lat": float(item["lat"]),
            "lon": float(item["lon"]),
        }
        for item in response.json()
    ]

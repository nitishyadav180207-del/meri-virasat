"""
Heritage Risk Score calculation.

Mirrors the pitch deck's example:
  Known elders: 3, Young practitioners: 0, Practice frequency: declining
  -> Preservation Risk: 92/100 (red)

The formula is intentionally simple and explainable for a hackathon demo —
judges can see exactly why a score came out the way it did. Weights live in
config.py so they can be tuned without touching this logic.
"""
from typing import Tuple

from config import (
    PRACTICE_FREQUENCY_RISK_WEIGHTS,
    RISK_BAND_RED_THRESHOLD,
    RISK_BAND_YELLOW_THRESHOLD,
    RISK_WEIGHT_ELDERS,
    RISK_WEIGHT_FREQUENCY,
    RISK_WEIGHT_YOUTH,
)

MAX_ELDERS_CONSIDERED = 10
MAX_YOUNG_PRACTITIONERS_CONSIDERED = 10


def _elder_risk_weight(known_elders: int) -> float:
    """Fewer elders means higher risk; 0 elders is the worst case."""
    if known_elders <= 0:
        return 100.0
    return max(0.0, 100.0 - min(known_elders, MAX_ELDERS_CONSIDERED) * 10)


def _youth_risk_weight(young_practitioners: int) -> float:
    """No young practitioners at all means the knowledge may die with the elders."""
    if young_practitioners <= 0:
        return 100.0
    return max(0.0, 100.0 - min(young_practitioners, MAX_YOUNG_PRACTITIONERS_CONSIDERED) * 10)


def calculate_risk_score(
    known_elders: int, young_practitioners: int, practice_frequency: str
) -> Tuple[float, str, str]:
    """
    Compute a 0-100 preservation risk score.

    Returns:
        (score, band, explanation) where band is one of "green"/"yellow"/"red".
        Higher score means higher risk of the heritage/tradition disappearing.
    """
    normalized_frequency = (practice_frequency or "unknown").lower()
    freq_weight = PRACTICE_FREQUENCY_RISK_WEIGHTS.get(normalized_frequency, 40)

    elder_weight = _elder_risk_weight(known_elders)
    youth_weight = _youth_risk_weight(young_practitioners)

    score = (
        freq_weight * RISK_WEIGHT_FREQUENCY
        + youth_weight * RISK_WEIGHT_YOUTH
        + elder_weight * RISK_WEIGHT_ELDERS
    )
    score = round(min(100.0, max(0.0, score)), 1)

    if score >= RISK_BAND_RED_THRESHOLD:
        band = "red"
    elif score >= RISK_BAND_YELLOW_THRESHOLD:
        band = "yellow"
    else:
        band = "green"

    explanation = (
        f"Practice frequency '{normalized_frequency}' contributes {freq_weight} risk points, "
        f"{young_practitioners} young practitioner(s) contributes {youth_weight} risk points, "
        f"{known_elders} known elder(s) contributes {elder_weight} risk points. "
        f"Weighted result: {score}/100 ({band})."
    )

    return score, band, explanation

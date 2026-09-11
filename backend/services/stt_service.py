"""
Speech-to-text service, using OpenAI's open-source Whisper model, run locally.

The model is loaded lazily (on first use) and cached in-process, so importing
this module never fails even if `openai-whisper` / `torch` aren't installed yet —
the error only surfaces when transcription is actually attempted, with a
clear message telling the developer what to install.

For a hackathon demo, use the "tiny" or "base" model — much faster on CPU,
with a small accuracy trade-off. The model size is configurable via the
WHISPER_MODEL_SIZE environment variable (see config.py).
"""
from config import WHISPER_MODEL_SIZE

_model = None


def _get_model():
    global _model
    if _model is None:
        try:
            import whisper
        except ImportError as exc:
            raise RuntimeError(
                "openai-whisper is not installed. Run: "
                "pip install openai-whisper --break-system-packages "
                "(also requires ffmpeg on the system PATH)."
            ) from exc
        _model = whisper.load_model(WHISPER_MODEL_SIZE)
    return _model


def preload_model() -> None:
    """Load the Whisper model into memory now instead of on the first
    transcription request — called on app startup so a user's first submit
    isn't the one paying for the multi-second model load."""
    try:
        _get_model()
    except RuntimeError:
        pass


def transcribe_audio(file_path: str) -> str:
    """
    Transcribes an audio/video file at `file_path` and returns the text.
    Supports the formats ffmpeg supports (mp3, wav, m4a, mp4, etc.).
    """
    model = _get_model()
    result = model.transcribe(file_path)
    return result.get("text", "").strip()

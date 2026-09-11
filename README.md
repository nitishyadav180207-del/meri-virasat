# Meri Virasat

**Discover • Document • Preserve — India's hidden & living heritage.**

Meri Virasat lets communities document local heritage — temples, stepwells, sacred
sites, folk songs, traditions, crafts, recipes — that risks being lost. Anyone with an
account can add a record with photos, video and an oral history recording
(auto-transcribed), pin it on a map, and the community can verify records they know to
be real. Each record gets an automatically computed **Heritage Risk Score** based on
how many elders still remember it, how many young people practice it, and how often
it's still practiced — surfacing the heritage most in danger of disappearing first.

React + Vite + react-leaflet on the frontend, FastAPI + SQLite on the backend.

## Features

- **Accounts** — register with your name, contact details and a profile picture, then
  log in with email + password. A JWT session persists across page reloads.
- **Ownership** — every heritage record belongs to the account that created it. Anyone
  (logged in or not) can browse and read every record, but only its owner sees the
  Edit/Delete actions on it, and the backend rejects a modification attempt from
  anyone else with a 403 — not just a hidden button.
- **Discover map** — every heritage record plotted on a Leaflet map with a matching
  sidebar list, filterable by category, with a **Street/Satellite view toggle** (free
  Esri World Imagery tiles, no API key needed).
- **Heritage profile** — full record view: story, transcript, evidence notes, media
  gallery (grouped by photo/video/audio), risk score, and community verification.
- **Add Heritage form** — visible once logged in; create a record with:
  - multiple photos, videos and audio recordings (add one at a time, remove any of
    them individually before submitting — nothing is replaced when you pick more files)
  - GPS capture ("Use My Location") or a **map picker with place search** ("Select
    Custom Location") to set coordinates manually
  - the risk-scoring inputs (known elders, young practitioners, practice frequency)
- **Edit & delete** — every record you own can be edited (loads its existing data and
  media back into the form, including letting you remove previously uploaded media) or
  deleted, both with confirmation before anything destructive happens.
- **AI transcription** — uploaded audio is transcribed automatically with a local
  Whisper model and saved as playable media on the record.
- **Automatic risk scoring** — computed server-side from known elders, young
  practitioners and practice frequency; recomputed whenever those fields change.
- **Community verification** — a running confirmation count and evidence notes;
  status flips to "verified" once enough confirmations come in.
- **Media lightbox** — click any photo/video/audio thumbnail to open it full-size in a
  popup with playback controls; closing it always stops playback.
- **At-risk dashboard endpoint** — every record sorted by risk score, for surfacing
  what needs urgent documentation first.

## Project structure

```
meri-virasat/
├── src/
│   ├── App.jsx                      # thin orchestrator: wires hooks to components
│   ├── App.css                      # all styling
│   ├── api.js                       # backend integration layer + shared constants
│   ├── hooks/
│   │   ├── useAuth.js               # session state + register/login/logout
│   │   ├── useHeritageRecords.js    # list + refresh + delete
│   │   ├── useHeritageProfile.js    # selected record + verify
│   │   └── useHeritageForm.js       # add/edit-heritage form + submit flow
│   ├── components/
│   │   ├── Navbar.jsx, Hero.jsx, Footer.jsx
│   │   ├── AuthPage.jsx             # Register/Login, as a full page (not a popup)
│   │   ├── DiscoverSection.jsx      # map (street/satellite) + sidebar + filters
│   │   ├── HeritageProfile.jsx      # profile view + media lightbox
│   │   ├── AddHeritageForm.jsx      # add/edit form + multi-file uploads
│   │   ├── LocationPickerModal.jsx  # map-click + search location picker
│   │   ├── SubmittedHeritage.jsx
│   │   ├── FeaturesSection.jsx, DifferenceSection.jsx
│   ├── index.css, main.jsx, assets/
├── public/
├── index.html
├── package.json, vite.config.js
├── .env.example                     # VITE_API_BASE_URL
└── backend/                         # FastAPI + SQLite
    ├── main.py
    ├── config.py                    # centralized settings (DB URL, upload dir, CORS, risk weights, JWT secret...)
    ├── auth.py                      # password hashing + JWT create/verify + get_current_user dependency
    ├── database.py, models.py, schemas.py
    ├── routers/
    │   ├── auth.py                  # register, login, "who am I"
    │   ├── heritage.py              # CRUD + media upload/removal — write endpoints require login + ownership
    │   ├── ai.py                    # transcription + risk-score preview
    │   ├── verification.py          # community verification
    │   ├── dashboard.py             # at-risk listing
    │   └── geocode.py               # place-name search (proxies Nominatim)
    ├── services/ (risk_service.py, stt_service.py)
    ├── seed_demo_data.py
    └── requirements.txt
```

## Running Locally

This app is **two separate servers** that both need to be running at the same time:
the FastAPI backend (port 8000) and the Vite frontend (port 5173). Starting only one
of them is the most common cause of things looking broken — see Troubleshooting below.

Quick start (two terminals):

```bash
# Terminal 1 — backend
cd backend
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — frontend
npm run dev
```

Full first-time setup (creating the venv, installing dependencies) is in
[Run the backend](#1-run-the-backend) and [Run the frontend](#2-run-the-frontend) below.

### Troubleshooting

- **Login/Register shows "Failed to fetch".** The frontend can't reach the backend —
  almost always because the backend isn't running (e.g. after a restart or a closed
  terminal). Check with `curl http://localhost:8000` (or open
  http://localhost:8000/docs in a browser) — if that doesn't respond, start the backend
  as shown above. The backend does **not** start automatically; it has to be running in
  its own terminal the whole time you're using the app.
- **`No Python at 'C:\Users\<someone-else>\...\python.exe'` when activating/running the
  venv.** A Python virtual environment (`backend/venv/`) hardcodes the absolute path to
  the Python install that created it (see `backend/venv/pyvenv.cfg`). If you copied the
  project folder to a different machine or a different Windows user account, that path
  no longer exists and the venv breaks. Fix: delete `backend/venv/` and recreate it
  fresh on the new machine:
  ```bash
  cd backend
  rmdir /s /q venv          # macOS/Linux: rm -rf venv
  python -m venv venv
  venv\Scripts\activate      # macOS/Linux: source venv/bin/activate
  pip install -r requirements.txt
  ```
- **Records/accounts you created seem to have disappeared.** They haven't — everything
  lives in `backend/heritage.db` (SQLite), which persists across restarts. If data
  looks missing, you're likely pointed at a different copy of the project folder (or a
  different `DATABASE_URL`) than the one you used before.

## 1. Run the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
# openai-whisper also needs ffmpeg on your system PATH:
#   macOS:   brew install ffmpeg
#   Ubuntu:  sudo apt install ffmpeg
#   Windows: https://ffmpeg.org/download.html  (or `winget install Gyan.FFmpeg`)
#            open a NEW terminal afterwards — PATH changes don't reach
#            terminals that were already open when you installed it.

python3 seed_demo_data.py       # optional: loads a few demo records (Bihar)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit **http://localhost:8000/docs** for interactive API docs.

You don't need `openai-whisper` installed (or `ffmpeg` on PATH) to use the rest of the
app — every other endpoint works without it. The transcribe endpoint returns a clear
503 error if either is missing, instead of crashing (see `[WinError 2] The system
cannot find the file specified` — that's `ffmpeg` missing from PATH, install it as
above and open a fresh terminal). The Whisper model is preloaded at startup (so the
first real transcription request isn't slowed down by loading it) and defaults to the
`tiny` model for fast CPU inference — set `WHISPER_MODEL_SIZE=small` (or `medium`) in
your environment for better accuracy if you have a GPU.

`seed_demo_data.py`'s records predate accounts and have no owner, so they're
browsable but not editable/deletable by anyone — register your own account to add
records you can edit.

## 2. Run the frontend

```bash
npm install
cp .env.example .env      # defaults to http://localhost:8000 — edit if your backend runs elsewhere
npm run dev
```

Visit the URL Vite prints (usually **http://localhost:5173**).

## API summary

🔒 = requires `Authorization: Bearer <token>`. 🔒👤 = also requires the token's user to
own that specific record (403 otherwise).

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create an account (multipart form — includes an optional profile picture file) |
| POST | `/auth/login` | Exchange email + password for a JWT access token |
| GET | `/auth/me` | 🔒 Current user — used to restore a session from a stored token |
| GET | `/heritage` | List all records — powers the Discover map + sidebar |
| POST | `/heritage` | 🔒 Create a record (owned by the caller) — risk score computed automatically |
| GET | `/heritage/{id}` | Full record — powers the Profile section |
| PATCH | `/heritage/{id}` | 🔒👤 Update a record — risk score recomputed if relevant fields change |
| DELETE | `/heritage/{id}` | 🔒👤 Delete a record |
| POST | `/heritage/{id}/media` | 🔒👤 Upload a photo/video (or audio without transcription) |
| DELETE | `/heritage/{id}/media?url=...` | 🔒👤 Remove one media file from a record |
| POST | `/ai/transcribe/{id}` | 🔒👤 Upload audio, transcribe with Whisper, save both the audio and transcript |
| POST | `/ai/risk-score` | Preview a risk score without creating/modifying a record |
| POST | `/heritage/{id}/verify` | Add a community confirmation (open to any visitor, not owner-gated) |
| GET | `/dashboard/at-risk` | All records sorted by risk score, highest first |
| GET | `/geocode/search?q=...` | Search for a place by name (used by the map location picker) |

## Configuration

Backend settings (`backend/config.py`), all overridable via environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./heritage.db` | Database connection string |
| `UPLOAD_DIR` | `backend/uploads/` | Where uploaded media is stored |
| `CORS_ALLOW_ORIGINS` | `*` | Comma-separated allowed frontend origins |
| `WHISPER_MODEL_SIZE` | `tiny` | Whisper model size for transcription |
| `VERIFICATION_THRESHOLD` | `3` | Confirmations needed before a record is marked "verified" |
| `SECRET_KEY` | a dev-only placeholder | JWT signing key — **set a real secret before deploying anywhere real** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | How long a login session stays valid |

Frontend: `VITE_API_BASE_URL` in `.env` (see `.env.example`), defaults to
`http://localhost:8000`.

## Things worth enhancing next

1. **Auth hardening.** Registration/login exist, but there's no password reset, email
   verification, or refresh-token rotation yet — worth adding before any real
   deployment, along with rate-limiting `/auth/login` against brute-force attempts.
2. **PostgreSQL + PostGIS.** SQLite is fine for a demo but won't hold up under
   concurrent writes or serve geo-queries (e.g. "heritage within 5km of me")
   efficiently at scale.
3. **Real object storage for media.** Uploaded photos/video/audio (and profile
   pictures) currently save to a local `backend/uploads/` folder. That's fine for a
   demo but won't survive a redeploy — swap in S3, GCS, or similar before going
   further.
4. **Duplicate/near-duplicate detection.** Worth adding once there's enough real data
   to test against.
5. **Map clustering.** With more than a few dozen records, the current one-marker-per-
   record map will get cluttered — `react-leaflet-cluster` or similar would help.
6. **Multilingual support.** Whisper supports many Indian languages already, but the
   UI itself is English-only; consider at least Hindi as a second UI language given
   the target audience.
7. **Offline-friendly submission.** Villages with poor connectivity are exactly this
   app's target use case, but the current Add Heritage form requires a live connection
   to submit. A local-first queue (e.g. IndexedDB + background sync) would matter a
   lot here in practice.
8. **Concurrent media uploads.** Uploads and media removals are currently sequential
   (one request at a time per record) to avoid a race on the backend's
   read-append-write `media_urls` list. Worth revisiting with a proper atomic append
   (e.g. a separate media table) if upload volume grows.
9. **Alembic migrations.** `owner_id` was added to an already-shipped table via a
   hand-written startup `ALTER TABLE` in `database.py` since there was no migration
   tool in place yet — fine for one column on SQLite, but the next schema change
   should introduce Alembic rather than repeating that pattern.

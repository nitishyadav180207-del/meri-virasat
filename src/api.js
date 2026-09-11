// src/api.js
// Central place for all backend calls. Change API_BASE via .env
// (VITE_API_BASE_URL) if the backend runs somewhere other than localhost:8000.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const AUTH_TOKEN_KEY = "meriVirasat.token";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      detail = errJson.detail || detail;
    } catch {
      /* response wasn't JSON, keep statusText */
    }
    throw new Error(detail);
  }

  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

export const Api = {
  register: (formData) => request("/auth/register", { method: "POST", body: formData }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  me: () => request("/auth/me"),

  listHeritage: () => request("/heritage"),
  getHeritage: (id) => request(`/heritage/${id}`),

  createHeritage: (data) =>
    request("/heritage", { method: "POST", body: JSON.stringify(data) }),

  updateHeritage: (id, data) =>
    request(`/heritage/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteHeritage: (id) => request(`/heritage/${id}`, { method: "DELETE" }),

  uploadMedia: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return request(`/heritage/${id}/media`, { method: "POST", body: form });
  },

  removeMedia: (id, url) =>
    request(`/heritage/${id}/media?url=${encodeURIComponent(url)}`, { method: "DELETE" }),

  transcribe: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return request(`/ai/transcribe/${id}`, { method: "POST", body: form });
  },

  verify: (id, note) =>
    request(`/heritage/${id}/verify`, {
      method: "POST",
      body: JSON.stringify({ note: note || null }),
    }),

  dashboardAtRisk: () => request("/dashboard/at-risk"),

  searchLocation: (query) => request(`/geocode/search?q=${encodeURIComponent(query)}`),

  mediaUrl: (path) => `${API_BASE}${path}`,
};

// Category options shared between the Add Heritage form and the Discover
// filter bar. `value` is what the backend stores; `label` is what the
// pitch-deck-style UI shows.
export const CATEGORY_OPTIONS = [
  { value: "temple", label: "Temple" },
  { value: "haveli", label: "Structure" },
  { value: "baoli", label: "Baoli / Stepwell" },
  { value: "sacred_tree", label: "Sacred Site" },
  { value: "song", label: "Folk Song" },
  { value: "ritual", label: "Tradition" },
  { value: "game", label: "Traditional Game" },
  { value: "recipe", label: "Recipe" },
  { value: "craft", label: "Craft" },
  { value: "other", label: "Other" },
];

export function categoryLabel(value) {
  const found = CATEGORY_OPTIONS.find((c) => c.value === value);
  return found ? found.label : value;
}

export const PRACTICE_FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "rare", label: "Rarely" },
  { value: "declining", label: "Declining" },
  { value: "none", label: "Not anymore" },
];

// Maps a backend UserOut to the flat shape the UI components use.
export function mapUser(u) {
  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    mobile: u.mobile || "",
    address: u.address || "",
    state: u.state || "",
    district: u.district || "",
    profilePictureUrl: u.profile_picture_url || null,
  };
}

// Maps a backend HeritageRecord to the flat shape the UI components use
// (keeps components close to the original prototype's field names).
export function mapRecord(r) {
  return {
    id: r.id,
    ownerId: r.owner_id || null,
    ownerName: r.owner_name || null,
    name: r.title,
    category: r.category,
    categoryLabel: categoryLabel(r.category),
    location: r.location_name || "",
    story: r.description || "",
    lat: r.latitude,
    lng: r.longitude,
    risk: Math.round(r.risk_score || 0),
    riskBand: r.risk_band || "unknown",
    verified: r.status === "verified",
    status: r.status,
    verificationCount: r.verification_count || 0,
    evidenceNotes: r.evidence_notes || [],
    mediaUrls: r.media_urls || [],
    transcript: r.transcript || "",
    knownElders: r.known_elders,
    youngPractitioners: r.young_practitioners,
    practiceFrequency: r.practice_frequency,
  };
}

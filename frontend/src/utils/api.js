/**
 * api.js — HTTP wrapper for Para PH backend.
 * Uses Vite proxy in dev, direct URL in production.
 *
 * Exports:
 *   getApiBaseUrl() → "" in dev, "https://api.para-commute.org" in prod
 *   apiGet(path)    → fetch wrapper
 *   apiPost(path, body)
 *   apiPut(path, body)
 *   apiDelete(path)
 */

const PRODUCTION_URL = "https://api.para-commute.org";

/**
 * Returns empty string in dev mode (Vite proxy handles /api, /chat, /admin, /auth).
 * Returns production URL only when built and deployed.
 */
export function getApiBaseUrl() {
  if (import.meta.env.PROD) {
    return PRODUCTION_URL;
  }
  return "";
}

async function request(method, path, body = null) {
  const base = getApiBaseUrl();
  const url = `${base}${path}`;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

export function apiGet(path) {
  return request("GET", path);
}

export function apiPost(path, body) {
  return request("POST", path, body);
}

export function apiPut(path, body) {
  return request("PUT", path, body);
}

export function apiDelete(path) {
  return request("DELETE", path);
}

import { supabase } from "./supabase";

const API_URL = "/api";

class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function getAccessToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const { body, ...rest } = options;

  const headers = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...options.headers,
  };

  const token = await getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    credentials: "include",
    headers,
    ...rest,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let response = await fetch(`${API_URL}${path}`, config);

  // If unauthorized, Supabase handles token refreshes automatically in the background
  // via the getSession() call above, so we don't need a manual retry loop here anymore.

  if (!response.ok) {
    let data = {};
    let message = `Request failed: ${response.status}`;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json().catch(() => ({}));
      message = data.detail || message;
    } else {
      const text = await response.text().catch(() => "");
      if (text) message = text;
    }
    throw new ApiError(response.status, message, data);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export { ApiError };

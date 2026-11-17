import { supabase } from "./supabase";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const basePath = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = options.body ? "POST" : "GET", body } = options;

  const token = await getAuthToken();

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${basePath}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  // Guard against the /api proxy falling through to the SPA: when the Netlify
  // redirect to the backend is missing or misconfigured, /api/* returns the
  // app's index.html with status 200. Parsing that as JSON used to yield null,
  // which crashed the workspace loader with a misleading boot error.
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(
      502,
      `The API returned ${contentType || "an unknown content type"} instead of JSON. ` +
        "The /api proxy is not connected — set API_URL on Netlify to the backend URL and redeploy.",
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (payload === null || typeof payload !== "object") {
    throw new ApiError(
      502,
      "The API returned a malformed JSON response.",
    );
  }

  if (!response.ok) {
    const message =
      "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with status ${response.status}.`;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

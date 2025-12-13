import { getCsrfHeaders, clearCsrfToken } from "./csrf";

export type GraphQLRequestOptions = {
  query: string;
  variables?: Record<string, unknown>;
  signal?: AbortSignal;
};

export async function graphqlRequest<T>({
  query,
  variables,
  signal,
}: GraphQLRequestOptions): Promise<T> {
  const envEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
  const base =
    envEndpoint || `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/graphql`;
  const endpoint = base.replace(/\/$/, "");

  const isDev = process.env.NODE_ENV !== "production";
  const opMatch = /\b(query|mutation|subscription)\s+([A-Za-z0-9_]+)/.exec(
    query,
  );
  const opType = opMatch?.[1] || "op";
  const opName = opMatch?.[2] || "anonymous";
  const started = Date.now();

  // Note: GraphQL endpoint is currently exempt from CSRF protection
  // but we include headers for consistency and future-proofing
  const isMutation = opType === "mutation";
  const csrfHeaders = isMutation ? await getCsrfHeaders() : {};

  // Enhanced logging for debugging
  console.log(`[GQL] Starting ${opType} ${opName}`, {
    endpoint,
    envEndpoint,
    base,
    query: query.substring(0, 200) + (query.length > 200 ? "..." : ""),
    variables,
    hasCsrfToken: isMutation && Object.keys(csrfHeaders).length > 0,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...csrfHeaders,
    },
  });

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...csrfHeaders,
      },
      body: JSON.stringify({ query, variables }),
      signal,
    });
  } catch (fetchError) {
    console.error(`[GQL] Fetch error for ${opName}:`, {
      error: fetchError,
      endpoint,
      message: fetchError.message,
      stack: fetchError.stack,
    });
    throw fetchError;
  }

  const duration = Date.now() - started;
  console.log(
    `[GQL] ${opType} ${opName} -> ${endpoint} status=${res.status} time=${duration}ms`,
    {
      ok: res.ok,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
    },
  );

  if (!res.ok) {
    let text = "";
    try {
      text =
        typeof res.text === "function" ? await res.text() : "";
    } catch {
      // Ignore errors reading response text
    }

    // Handle CSRF errors for mutations (in case CSRF is enabled for GraphQL in future)
    if (res.status === 403 && isMutation) {
      if (text.includes("CSRF") || text.includes("Invalid CSRF token")) {
        console.warn("[CSRF] Token invalid, clearing cache");
        clearCsrfToken();
      }
    }

    console.error(`[GQL] HTTP error ${res.status} for ${opName}`, {
      status: res.status,
      statusText: res.statusText,
      responseText: text?.slice(0, 1000),
      endpoint,
      headers: Object.fromEntries(res.headers.entries()),
    });
    throw new Error(`GraphQL HTTP error: ${res.status} - ${res.statusText}`);
  }

  let json;
  try {
    json = await res.json();
  } catch (parseError) {
    console.error(`[GQL] JSON parse error for ${opName}:`, {
      error: parseError,
      status: res.status,
      endpoint,
    });
    throw new Error(`GraphQL JSON parse error: ${parseError.message}`);
  }

  console.log(`[GQL] Response for ${opName}:`, {
    hasData: !!json.data,
    hasErrors: !!json.errors?.length,
    dataKeys: json.data ? Object.keys(json.data) : [],
    errors: json.errors,
    fullResponse: json,
  });

  if (json.errors?.length) {
    const msg = json.errors.map((e: { message: string }) => e.message).join("; ");
    console.error(`[GQL] GraphQL error for ${opName}:`, {
      errors: json.errors,
      message: msg,
      data: json.data,
    });
    throw new Error(msg || "GraphQL error");
  }
  return json.data as T;
}

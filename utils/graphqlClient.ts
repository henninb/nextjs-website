export type GraphQLRequestOptions = {
  query: string;
  variables?: Record<string, any>;
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

  // Enhanced logging for debugging
  console.log(`[GQL] Starting ${opType} ${opName}`, {
    endpoint,
    envEndpoint,
    base,
    query: query.substring(0, 200) + (query.length > 200 ? "..." : ""),
    variables,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
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
    const text = await res.text().catch(() => "");
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
    const msg = json.errors.map((e: any) => e.message).join("; ");
    console.error(`[GQL] GraphQL error for ${opName}:`, {
      errors: json.errors,
      message: msg,
      data: json.data,
    });
    throw new Error(msg || "GraphQL error");
  }
  return json.data as T;
}

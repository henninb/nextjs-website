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

  const res = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  const duration = Date.now() - started;
  if (isDev) {
    console.log(
      `[GQL] ${opType} ${opName} -> ${endpoint} status=${res.status} time=${duration}ms`,
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (isDev) {
      console.error(
        `[GQL] HTTP error ${res.status} for ${opName}`,
        text?.slice(0, 500),
      );
    }
    throw new Error(`GraphQL HTTP error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    const msg = json.errors.map((e: any) => e.message).join("; ");
    if (isDev) {
      console.error(`[GQL] GraphQL error for ${opName}:`, msg);
    }
    throw new Error(msg || "GraphQL error");
  }
  return json.data as T;
}

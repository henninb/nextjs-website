export type GraphQLRequestOptions = {
  query: string;
  variables?: Record<string, any>;
  signal?: AbortSignal;
};

export async function graphqlRequest<T>({ query, variables, signal }: GraphQLRequestOptions): Promise<T> {
  const base = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/graphql`;
  const endpoint = base.replace(/\/$/, '');

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

  if (!res.ok) {
    throw new Error(`GraphQL HTTP error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    const msg = json.errors.map((e: any) => e.message).join("; ");
    throw new Error(msg || "GraphQL error");
  }
  return json.data as T;
}


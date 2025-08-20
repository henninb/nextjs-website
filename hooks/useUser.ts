import { useQuery } from "@tanstack/react-query";

async function fetchUser(): Promise<any | null> {
  const res = await fetch("/api/me", { credentials: "include" });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export function useUser() {
  const { data, error, isLoading } = useQuery<any | null, Error>({
    queryKey: ["me"],
    queryFn: fetchUser,
  });

  return {
    user: data,
    isLoading,
    isError: error,
  };
}

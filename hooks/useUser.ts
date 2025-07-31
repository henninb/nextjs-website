import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  });

export function useUser() {
  const { data, error } = useSWR(
    "https://finance.bhenning.com/api/me",
    fetcher,
  );
  return {
    user: data,
    isLoading: !error && !data,
    isError: error,
  };
}

import { useEffect } from "react";

export function useSpinnerEffect(
  setShowSpinner: (v: boolean) => void,
  isFetching: boolean,
  isSuccess: boolean,
  loading: boolean,
  isAuthenticated: boolean,
) {
  useEffect(() => {
    if (isFetching || loading || (!loading && !isAuthenticated)) {
      setShowSpinner(true);
      return;
    }
    if (isSuccess) setShowSpinner(false);
  }, [isFetching, isSuccess, loading, isAuthenticated, setShowSpinner]);
}

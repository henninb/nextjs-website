"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { getErrorMessage } from "../types";

type SnackbarSeverity = "error" | "warning" | "info" | "success";

export function useFinancePageState(cacheEnabledKey?: string) {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<SnackbarSeverity>("info");
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });
  const [cacheEnabled, setCacheEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined" || !cacheEnabledKey) return false;
    return localStorage.getItem(cacheEnabledKey) === "true";
  });

  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  const handleSnackbarClose = () => setShowSnackbar(false);

  const handleError = (
    error: unknown,
    moduleName: string,
    throwIt: boolean,
  ) => {
    const msg = getErrorMessage(error);
    const errorMessage = msg
      ? `${moduleName}: ${msg}`
      : `${moduleName}: Failure`;
    setMessage(errorMessage);
    setSnackbarSeverity("error");
    setShowSnackbar(true);
    console.error(errorMessage);
    if (throwIt) throw error;
  };

  const handleSuccess = (successMessage: string) => {
    setMessage(successMessage);
    setSnackbarSeverity("success");
    setShowSnackbar(true);
  };

  return {
    message,
    setMessage,
    showSnackbar,
    setShowSnackbar,
    snackbarSeverity,
    setSnackbarSeverity,
    showSpinner,
    setShowSpinner,
    showModalAdd,
    setShowModalAdd,
    showModalDelete,
    setShowModalDelete,
    paginationModel,
    setPaginationModel,
    cacheEnabled,
    setCacheEnabled,
    isAuthenticated,
    loading,
    handleError,
    handleSuccess,
    handleSnackbarClose,
  };
}

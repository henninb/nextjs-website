import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Spinner from "../../components/Spinner";
import useFetchPaymentRequired from "../../hooks/usePaymentRequiredFetch";
import { Link } from "@mui/material";
import FinanceLayout from "../../layouts/FinanceLayout";
import { useAuth } from "../../components/AuthProvider";

export default function paymentrequired() {
  const [showSpinner, setShowSpinner] = useState(true);
  const {
    data: fetchedPaymentsRequired,
    isSuccess: isSuccessPaymentsRequired,
    isFetching: isFetchingPaymentsRequired,
  } = useFetchPaymentRequired();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if(loading) {
      setShowSpinner(true);
    }
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Update spinner state based on fetch status
  useEffect(() => {
    if (isFetchingPaymentsRequired) {
      setShowSpinner(true);
    } else if (isSuccessPaymentsRequired) {
      setShowSpinner(false);
    } else {
      // In case of an error or no data, stop showing the spinner
      setShowSpinner(false);
    }
  }, [isFetchingPaymentsRequired, isSuccessPaymentsRequired]);

  const columns: GridColDef[] = [
    {
      field: "accountNameOwner",
      headerName: "Account",
      width: 180,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${params.row.accountNameOwner}`}>
            {params.value}
          </Link>
        );
      },
      cellClassName: "nowrap",
    },
    {
      field: "accountType",
      headerName: "Account Type",
      width: 150,
    },
    {
      field: "moniker",
      headerName: "Moniker",
      width: 150,
    },
    {
      field: "future",
      headerName: "Future",
      width: 150,
      type: "number",
      editable: false,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
      cellClassName: "nowrap",
    },
    {
      field: "outstanding",
      headerName: "Outstanding",
      width: 150,
      type: "number",
      editable: false,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
      cellClassName: "nowrap",
    },
    {
      field: "cleared",
      headerName: "Cleared",
      width: 150,
      type: "number",
      editable: false,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
      cellClassName: "nowrap",
    },
    {
      field: "validationDate",
      headerName: "Validation Date",
      width: 250,
      type: "date",
      renderCell: (params) => {
        return params.value
          ? new Date(params.value).toLocaleString("en-US")
          : "";
      },
      valueGetter: (params) => new Date(params),
    },
  ];

  return (
    <div>
      <FinanceLayout>
        <h2>Payment Required Details</h2>
        {showSpinner ? (
          <Spinner />
        ) : (
          <div data-testid="payment-required-table">
            <DataGrid
              columns={columns}
              rows={fetchedPaymentsRequired?.filter((row) => row != null) || []}
              paginationModel={{
                pageSize: fetchedPaymentsRequired?.length,
                page: 0,
              }}
              hideFooterPagination={true}
              checkboxSelection={false}
              rowSelection={false}
              getRowId={(row) => row.accountNameOwner}
            />
          </div>
        )}
      </FinanceLayout>
    </div>
  );
}

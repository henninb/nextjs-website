import React from "react";
import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Spinner from "../../components/Spinner";
import useFetchPaymentRequired from "../../hooks/usePaymentRequiredFetch";
import { Link } from "@mui/material";
import FinanceLayout from "../../layouts/FinanceLayout";

export default function paymentrequired() {
  const [showSpinner, setShowSpinner] = useState(true);
  const {
    data: fetchedPaymentsRequired,
    isSuccess: isSuccessPaymentsRequired,
    isFetching: isFetchingPaymentsRequired,
  } = useFetchPaymentRequired();

  useEffect(() => {
    if (isFetchingPaymentsRequired) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessPaymentsRequired) {
      setShowSpinner(false);
    }
  }, [isSuccessPaymentsRequired, isFetchingPaymentsRequired]);

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

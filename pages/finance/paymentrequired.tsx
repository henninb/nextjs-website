import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import Spinner from "../../components/Spinner";
import useFetchPaymentRequired from "../../hooks/usePaymentRequiredFetch";

export default function paymentrequired() {
  const [showSpinner, setShowSpinner] = useState(true);
  const router = useRouter();

  const { data, isSuccess, isLoading } = useFetchPaymentRequired();

  useEffect(() => {
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess]);

  const handleButtonClickLink = (accountNameOwner: string) => {
    router.push(`/finance/transactions/${accountNameOwner}`);
  };

  const columns: GridColDef[] = [
    {
      field: "accountNameOwner",
      headerName: "Account Name Owner",
      width: 180,
      renderCell: (params) => (
        <Button
          style={{ fontSize: ".6rem" }}
          onClick={() => handleButtonClickLink(params.row.accountNameOwner)}
        >
          {params.row.accountNameOwner}
        </Button>
      ),
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
      width: 150,
      type: "date",
      renderCell: (params) => {
        return params?.value?.toLocaleDateString("en-US");
      },
    },
  ];

  return (
    <div>
      <h2>Payment Required Details</h2>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div data-testid="payment-required-table">
          <DataGrid
            columns={columns}
            rows={data?.filter((row) => row != null) || []}
            paginationModel={{ pageSize: data?.length, page: 0 }}
            hideFooterPagination={true}
            checkboxSelection={false}
            rowSelection={false}
            getRowId={(row) => row.accountNameOwner}
          />
        </div>
      )}
    </div>
  );
}

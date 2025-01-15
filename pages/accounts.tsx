import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Button, IconButton, Modal, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../components/Spinner";
import SnackbarBaseline from "../components/SnackbarBaseline";
// import useFetchAccount from "@/queries/useFetchAccount";
import useFetchAccount from "../hooks/useFetchAccount";
import useAccountInsert from "../hooks/useAccountInsert";
// import useAccountInsert from "@/queries/useAccountInsert";
// import useAccountDelete from "@/queries/useAccountDelete";
// import useFetchTotals from "@/queries/useFetchTotals";
import Account from "../model/Account";

export default function AccountTable() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [accountData, setAccountData] = useState<Account | null>(null);
  const router = useRouter();

   const { data, isSuccess, isLoading } = useFetchAccount();
//   const { data: totals, isSuccess: isSuccessTotals } = useFetchTotals();
   const { mutate: insertAccount } = useAccountInsert();
//   const { mutate: deleteAccount } = useAccountDelete();

//   useEffect(() => {
//     if (isSuccess && isSuccessTotals) {
//       setShowSpinner(false);
//     }
//   }, [isSuccess, isSuccessTotals]);

useEffect(() => {
    if ( isSuccess) {
      setShowSpinner(false)
    }
})

  const handleButtonClickLink = (accountNameOwner: string) => {
    router.push(`/transactions/${accountNameOwner}`);
  };

//   const handleDeleteRow = async (account: Account) => {
//     try {
//       await deleteAccount({ oldRow: account });
//     } catch (error) {
//       handleError(error, "Delete Account", false);
//     }
//   };

  const handleSnackbarClose = () => {
    setOpen(false);
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage =
      error.response
        ? `${moduleName}: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setOpen(true);
    if (throwIt) throw error;
  };

  const addRow = async (newData: Account) => {
    try {
      await insertAccount({ payload: newData });
      setOpenForm(false);
    } catch (error) {
      handleError(error, "Add Account", false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "accountNameOwner",
      headerName: "Account Name Owner",
      width: 200,
      renderCell: (params) => (
        <Button onClick={() => handleButtonClickLink(params.row.accountNameOwner)}>
          {params.row.accountNameOwner}
        </Button>
      ),
    },
    { field: "accountType", headerName: "Account Type", width: 150 },
    { field: "moniker", headerName: "Moniker", width: 150 },
    {
      field: "future",
      headerName: "Future",
      width: 150,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", { style: "currency", currency: "USD" }),
    },
    {
      field: "outstanding",
      headerName: "Outstanding",
      width: 150,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", { style: "currency", currency: "USD" }),
    },
    {
      field: "cleared",
      headerName: "Cleared",
      width: 150,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", { style: "currency", currency: "USD" }),
    },
    {
      field: "actions",
      headerName: "",
      width: 100,
      renderCell: (params) => (
        <IconButton onClick={() => {
            //handleDeleteRow(params.row)
            }}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <div>
      <h2>Account Details</h2>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div>
          <IconButton onClick={() => setOpenForm(true)}>
            <AddIcon />
          </IconButton>
          <h2>
            totals
            {/* [${totals?.totals}] [${totals?.totalsCleared}] [${totals?.totalsOutstanding}] [
            ${totals?.totalsFuture}] */}
          </h2>
          <DataGrid
            rows={data}
            columns={columns}
            getRowId={(row) => row.accountId || 0}
            paginationModel={{ pageSize: data?.length, page: 0 }}
            hideFooterPagination={true}
          />
          <div>
            <SnackbarBaseline
              message={message}
              state={open}
              handleSnackbarClose={handleSnackbarClose}
            />
          </div>
        </div>
      )}

      <Modal open={openForm} onClose={() => setOpenForm(false)}>
        <Box sx={{ width: 400, padding: 4, backgroundColor: "white", margin: "auto" }}>
          <h3>{accountData ? "Edit Account" : "Add New Account"}</h3>
          <TextField
            label="Account Name Owner"
            fullWidth
            margin="normal"
            value={accountData?.accountNameOwner || ""}
            onChange={(e) =>
              setAccountData((prev) => ({ ...prev, accountNameOwner: e.target.value }))
            }
          />
          <TextField
            label="Account Type"
            fullWidth
            margin="normal"
            value={accountData?.accountType || ""}
            onChange={(e) =>
              setAccountData((prev: any) => ({ ...prev, accountType: e.target.value }))
            }
          />
          <TextField
            label="Moniker"
            fullWidth
            margin="normal"
            value={accountData?.moniker || ""}
            onChange={(e) =>
              setAccountData((prev: any) => ({ ...prev, moniker: e.target.value }))
            }
          />
          <Button
            variant="contained"
            onClick={() => accountData && addRow(accountData)}
          >
            {accountData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

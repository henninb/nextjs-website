import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Modal,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import useAccountFetch from "../../hooks/useAccountFetch";
import useAccountInsert from "../../hooks/useAccountInsert";
import useAccountDelete from "../../hooks/useAccountDelete";
import useTotalsFetch from "../../hooks/useTotalsFetch";
import Account from "../../model/Account";
import useAccountUpdate from "../../hooks/useAccountUpdate";
import { currencyFormat, noNaN, formatDate } from "../../components/Common";

export default function AccountTable() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModelAdd, setShowModelAdd] = useState(false);
  const [showModelDelete, setShowModelDelete] = useState(false);
  const [showModelEdit, setShowModelEdit] = useState(false);
  const [accountData, setAccountData] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editedAccountName, setEditedAccountName] = useState("");
  const [accountBeingEdited, setAccountBeingEdited] = useState<Account | null>(
    null,
  );

  const router = useRouter();

  const { data, isSuccess, isLoading } = useAccountFetch();
  const { data: totals, isSuccess: isSuccessTotals } = useTotalsFetch();
  const { mutate: insertAccount } = useAccountInsert();
  const { mutate: updateAccount } = useAccountUpdate();
  const { mutate: deleteAccount } = useAccountDelete();

  const handleEditAccount = (account: Account) => {
    setAccountBeingEdited(account);
    setEditedAccountName(account.accountNameOwner);
    setShowModelEdit(true);
  };

  const handleRenameAccount = () => {
    if (accountBeingEdited) {
      const updatedAccount = {
        ...accountBeingEdited,
        accountNameOwner: editedAccountName,
      };
      console.log("updatedAccount: " + JSON.stringify(updatedAccount));
      console.log("accountBeingEdited: " + JSON.stringify(accountBeingEdited));
      updateAccount(
        {
          oldRow: accountBeingEdited,
          newRow: updatedAccount,
        },
        {
          onSuccess: () => {
            setMessage("Account name updated successfully.");
            setShowModelEdit(false);
          },
          onError: (error) => {
            handleError(error, "Rename Account", false);
          },
        },
      );
    }
  };

  useEffect(() => {
    if (isSuccess && isSuccessTotals) {
      setShowSpinner(false);
    }
  }, [isSuccess, isSuccessTotals]);

  const handleButtonClickLink = (accountNameOwner: string) => {
    router.push(`/finance/transactions/${accountNameOwner}`);
  };

  const handleDeleteRow = () => {
    if (selectedAccount) {
      try {
        deleteAccount({ oldRow: selectedAccount });
        setMessage("Account deleted successfully.");
      } catch (error) {
        handleError(error, "Delete Account", false);
      } finally {
        setShowModelDelete(false);
        setSelectedAccount(null);
      }
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error.response
      ? `${moduleName}: ${error.response.status} - ${JSON.stringify(
          error.response.data,
        )}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setShowSnackbar(true);
    if (throwIt) throw error;
  };

  const addRow = (newData: Account) => {
    try {
      insertAccount({ payload: newData });
      setShowModelAdd(false);
    } catch (error) {
      handleError(error, "Add Account", false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "accountNameOwner",
      headerName: "Account",
      width: 250,
      renderCell: (params) => (
        <div>
          <Button
            onClick={() => handleButtonClickLink(params.row.accountNameOwner)}
          >
            {params.row.accountNameOwner}
          </Button>

          {/* <IconButton
            onClick={() => {
              handleEditAccount(params.row);
            }}
          >
            <EditIcon />
          </IconButton> */}
        </div>
      ),
    },
    { field: "accountType", headerName: "Type", width: 150, editable: true },
    { field: "moniker", headerName: "Moniker", width: 150, editable: true },
    {
      field: "future",
      headerName: "Future",
      width: 150,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
    },
    {
      field: "outstanding",
      headerName: "Outstanding",
      width: 150,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
    },
    {
      field: "cleared",
      headerName: "Cleared",
      width: 150,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
    },
    {
      field: "activeStatus",
      headerName: "Active",
      width: 75,
      editable: true,
    },
    {
      field: "validationDate",
      headerName: "Validation Date",
      width: 150,
      type: "date",
      valueGetter: (params) => new Date(params),
      renderCell: (params) => {
        return params?.value?.toLocaleDateString("en-US");
      },
    },
    {
      field: "",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => {
              handleEditAccount(params.row);
            }}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            onClick={() => {
              setSelectedAccount(params.row);
              setShowModelDelete(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
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
          <IconButton onClick={() => setShowModelAdd(true)}>
            <AddIcon />
          </IconButton>
          {/* <h3>
            [${totals?.totals}] [${totals?.totalsCleared}] [$
            {totals?.totalsOutstanding}] [ ${totals?.totalsFuture}]
          </h3> */}

          <h3>
            [ ${currencyFormat(noNaN(totals["totals"]))} ] [ $
            {currencyFormat(noNaN(totals["totalsCleared"]))} ] [ $
            {currencyFormat(noNaN(totals["totalsOutstanding"]))} ] [ $
            {currencyFormat(noNaN(totals["totalsFuture"]))} ]
          </h3>
          <DataGrid
            rows={data?.filter((row) => row != null) || []}
            columns={columns}
            getRowId={(row) => row.accountId || 0}
            paginationModel={{ pageSize: data?.length, page: 0 }}
            hideFooterPagination={true}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={(newRow: Account, oldRow: Account) => {
              // Handle row update here
              console.log("Row updating:", newRow);
              updateAccount({ newRow: newRow, oldRow: oldRow });
              console.log("Row updated:", newRow);
              return newRow; // Return the updated row
            }}
          />
          <div>
            <SnackbarBaseline
              message={message}
              state={showSnackbar}
              handleSnackbarClose={handleSnackbarClose}
            />
          </div>
        </div>
      )}

      <Modal open={showModelEdit} onClose={() => setShowModelEdit(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
          <Typography variant="h6">Edit Account Name</Typography>
          <TextField
            label="Account Name Owner"
            fullWidth
            margin="normal"
            value={editedAccountName}
            onChange={(e) => setEditedAccountName(e.target.value)}
          />
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button
              variant="contained"
              color="primary"
              onClick={handleRenameAccount}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowModelEdit(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Confirmation Deleting Modal */}
      <Modal open={showModelDelete} onClose={() => setShowModelDelete(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
          <Typography variant="h6">Confirm Deletion</Typography>
          <Typography>
            Are you sure you want to delete the account "
            {selectedAccount?.accountNameOwner}"?
          </Typography>
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button
              variant="contained"
              color="primary"
              onClick={handleDeleteRow}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowModelDelete(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Adding Modal */}
      <Modal open={showModelAdd} onClose={() => setShowModelAdd(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
          <h3>{accountData ? "Edit Account" : "Add New Account"}</h3>
          <TextField
            label="Account"
            fullWidth
            margin="normal"
            value={accountData?.accountNameOwner || ""}
            onChange={(e) =>
              setAccountData((prev) => ({
                ...prev,
                accountNameOwner: e.target.value,
              }))
            }
          />


<Autocomplete
  options={["debit", "credit"]}
  value={accountData?.accountType || ""}
  onChange={(event, newValue) =>
    setAccountData((prev: any) => ({
      ...prev,
      accountType: newValue || "",
    }))
  }
  renderInput={(params) => (
    <TextField {...params} label="Account Type" fullWidth margin="normal" />
  )}
/>


          {/* <TextField
            label="Account Type"
            fullWidth
            margin="normal"
            value={accountData?.accountType || ""}
            onChange={(e) =>
              setAccountData((prev: any) => ({
                ...prev,
                accountType: e.target.value,
              }))
            }
          /> */}

          <TextField
            label="Moniker"
            fullWidth
            margin="normal"
            value={accountData?.moniker || ""}
            onChange={(e) =>
              setAccountData((prev: any) => ({
                ...prev,
                moniker: e.target.value,
              }))
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
}

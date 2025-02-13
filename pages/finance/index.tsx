import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Modal,
  TextField,
  Typography,
  Autocomplete,
  Tooltip,
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
import Totals from "../../model/Totals";
import useAccountUpdate from "../../hooks/useAccountUpdate";
import { currencyFormat, noNaN } from "../../components/Common";
import Link from "next/link";

export default function Accounts() {
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

  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    error: errorAccounts,
  } = useAccountFetch();
  const {
    data: fetchedTotals,
    isSuccess: isSuccessTotals,
    error: errorTotals,
  } = useTotalsFetch();

  const { mutateAsync: insertAccount } = useAccountInsert();
  const { mutateAsync: updateAccount } = useAccountUpdate();
  const { mutateAsync: deleteAccount } = useAccountDelete();

  const handleEditAccount = (account: Account) => {
    setAccountBeingEdited(account);
    setEditedAccountName(account.accountNameOwner);
    setShowModelEdit(true);
  };

  useEffect(() => {
    if (isSuccessAccounts && isSuccessTotals) {
      setShowSpinner(false);
    }
  }, [isSuccessAccounts, isSuccessTotals]);

  const handleDeleteRow = async () => {
    if (selectedAccount) {
      try {
        await deleteAccount({ oldRow: selectedAccount });
        setMessage("Account deleted successfully.");
        setShowSnackbar(true);
      } catch (error) {
        handleError(error, `Delete Account error: ${error.message}`, false);
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

  const handleRenameAccount = async () => {
    if (accountBeingEdited) {
      const updatedAccount = {
        ...accountBeingEdited,
        accountNameOwner: editedAccountName,
      };
      try {
        await updateAccount({
          oldRow: accountBeingEdited,
          newRow: updatedAccount,
        });
        setMessage("Account updated successfully.");
        setShowSnackbar(true);
      } catch (error) {
        handleError(error, `Rename Account error: ${error.message}`, false);
      }
    }
  };

  const handleAddRow = async (newData: Account) => {
    try {
      await insertAccount({ payload: newData });
      setShowModelAdd(false);
      setMessage("Account inserted successfully.");
      setShowSnackbar(true);
    } catch (error) {
      handleError(error, `Add Account ${error.message}`, false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "accountNameOwner",
      headerName: "Account",
      width: 250,
      editable: true,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${params.row.accountNameOwner}`}>
            {params.value}
          </Link>
        );
      },
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
          <Tooltip title="edit the account name">
            <IconButton
              onClick={() => {
                handleEditAccount(params.row);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="delete this row">
            <IconButton
              onClick={() => {
                setSelectedAccount(params.row);
                setShowModelDelete(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
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

          <h4>{`[ ${currencyFormat(
            noNaN(fetchedTotals?.totals ?? 0),
          )} ] [ ${currencyFormat(
            noNaN(fetchedTotals?.totalsCleared ?? 0),
          )} ]  [ ${currencyFormat(
            noNaN(fetchedTotals?.totalsOutstanding ?? 0),
          )} ] [ ${currencyFormat(noNaN(fetchedTotals?.totalsFuture ?? 0))} ]`}</h4>
          {/* <h3>
            [ ${currencyFormat(noNaN(fetchedTotals.totals))} ] [ $
            {currencyFormat(noNaN(fetchedTotals.totalsCleared))} ] [ $
            {currencyFormat(noNaN(fetchedTotals.totalsOutstanding))} ] [ $
            {currencyFormat(noNaN(fetchedTotals.totalsFuture))} ]
          </h3> */}
          <DataGrid
            rows={fetchedAccounts?.filter((row) => row != null) || []}
            columns={columns}
            getRowId={(row) => row.accountId || 0}
            paginationModel={{ pageSize: fetchedAccounts?.length, page: 0 }}
            hideFooterPagination={true}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={async (
              newRow: Account,
              oldRow: Account,
            ): Promise<Account> => {
              try {
                await updateAccount({ newRow: newRow, oldRow: oldRow });
                setMessage("Account updated successfully.");
                setShowSnackbar(true);
                return newRow;
              } catch (error) {
                handleError(error, `Update Account ${error.message}`, false);
                return error;
              }
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
              <TextField
                {...params}
                label="Account Type"
                fullWidth
                margin="normal"
              />
            )}
          />
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
            onClick={() => accountData && handleAddRow(accountData)}
          >
            {accountData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

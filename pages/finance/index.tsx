import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
//import { Box, Button, IconButton, Modal, TextField } from "@mui/material";
import {
  Box,
  Button,
  IconButton,
  Modal,
  TextField,
  Typography,
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
import useAccountRename from "../../hooks/useAccountRename";

export default function AccountTable() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [accountData, setAccountData] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
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
  const { mutate: renameAccount } = useAccountRename();

  const handleEditAccount = (account: Account) => {
    setAccountBeingEdited(account);
    setEditedAccountName(account.accountNameOwner);
    setEditModalOpen(true);
  };

  const handleRenameAccount = () => {
    if (accountBeingEdited) {
      renameAccount(
        {
          oldAccountName: accountBeingEdited.accountNameOwner,
          newAccountName: editedAccountName,
        },
        {
          onSuccess: () => {
            setMessage("Account name updated successfully.");
            setEditModalOpen(false);
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

  const handleDeleteRow = async () => {
    if (selectedAccount) {
      try {
        await deleteAccount({ oldRow: selectedAccount });
        setMessage("Account deleted successfully.");
      } catch (error) {
        handleError(error, "Delete Account", false);
      } finally {
        setConfirmDelete(false);
        setSelectedAccount(null);
      }
    }
  };

  const handleSnackbarClose = () => {
    setOpen(false);
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error.response
      ? `${moduleName}: ${error.response.status} - ${JSON.stringify(
          error.response.data,
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
      headerName: "Account",
      width: 250,
      renderCell: (params) => (
        <div>
          <Button
            onClick={() => handleButtonClickLink(params.row.accountNameOwner)}
          >
            {params.row.accountNameOwner}
          </Button>

          <IconButton
            onClick={() => {
              handleEditAccount(params.row);
            }}
          >
            <EditIcon />
          </IconButton>
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
        <IconButton
          onClick={() => {
            setSelectedAccount(params.row);
            setConfirmDelete(true);
          }}
        >
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
          <h3>
            [${totals?.totals}] [${totals?.totalsCleared}] [$
            {totals?.totalsOutstanding}] [ ${totals?.totalsFuture}]
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
              state={open}
              handleSnackbarClose={handleSnackbarClose}
            />
          </div>
        </div>
      )}

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
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
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Confirmation Deleting Modal */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
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
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Adding Modal */}
      <Modal open={openForm} onClose={() => setOpenForm(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
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
          <TextField
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
            onClick={() => accountData && addRow(accountData)}
          >
            {accountData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

import { useRouter } from 'next/router';
import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import TextField from "@mui/material/TextField";
import { Box, Button, Modal, IconButton } from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from '@mui/material/MenuItem';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Spinner from '../../../components/Spinner';
//import { useNavigate, useMatch, PathMatch } from "react-router-dom";
//import { currencyFormat, epochToDate } from "./Common";
import SnackbarBaseline from '../../../components/SnackbarBaseline';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { v4 as uuidv4 } from 'uuid';
import useTotalsFetch from '../../../hooks/useTotalsFetch';
import useTransactionByAccountFetch from '../../../hooks/useTransactionByAccountFetch';
import useTransactionUpdate from '../../../hooks/useTransactionUdate';
import useTransactionStateUpdate from '../../../hooks/useTransactionStateUpdate';
import useTransactionInsert from '../../../hooks/useTransactionInsert';
import useTransactionDelete from '../../../hooks/useTransactionDelete';
import useTotalsPerAccountFetch from '../../../hooks/useTotalsPerAccountFetch';
import useValidationAmountFetch from '../../../hooks/useValidationAmountFetch';
import useValidationAmountInsert from '../../../hooks/useValidationAmountInsert';
import { AccountType } from '../../../model/AccountType';
import Transaction from '../../../model/Transaction';
import { TransactionState } from '../../../model/TransactionState';
import { TransactionType } from '../../../model/TransactionType';
import { ReoccurringType } from '../../../model/ReoccurringType';
import ValidationAmount from '../../../model/ValidationAmount';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import EditIcon from '@mui/icons-material/CreateRounded';
import AddIcon from '@mui/icons-material/AddRounded';
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded'
import { epochToDate,currencyFormat,noNaN } from './Common';

export default function TransactionTable() {
  const [showSpinner, setShowSpinner] = useState(true);
  const [message, setMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openForm, setOpenForm] = useState<boolean>(false); 

  const router = useRouter();
  const { accountNameOwner } : any = router.query;

  const [transactionData, setTransactionData] = useState({
    transactionDate: new Date(), // Default to today's date
    accountNameOwner: accountNameOwner,
    reoccurringType: "onetime" as ReoccurringType,  // Default to "onetime"
    amount: 0.0,                 // Default to 0.0
    transactionState: "outstanding" as TransactionState, // Default to "outstanding"
    transactionType: "undefined" as TransactionType,
    guid: uuidv4(),
    description: "",
    category: "",
    accountType: "undefined" as AccountType,
    activeStatus: true,
    notes: "",
  });

  //const routeMatch: PathMatch<string> | null = useMatch("/transactions/:account");
  //const accountNameOwner = routeMatch?.params?.account || "default";

  const { data, isSuccess } = useTransactionByAccountFetch(accountNameOwner);
  const { data: totals, isSuccess: isSuccessTotals } = useTotalsPerAccountFetch(accountNameOwner);
  const { data: validationData, isSuccess: isSuccessValidationTotals } = useValidationAmountFetch(accountNameOwner);

  const { mutate: updateTransactionState } = useTransactionStateUpdate(accountNameOwner);
  const { mutate: updateTransaction } = useTransactionUpdate();
  const { mutate: deleteTransaction } = useTransactionDelete();
  const { mutate: insertTransaction } = useTransactionInsert(accountNameOwner);
  const { mutate: insertValidationAmount } = useValidationAmountInsert();

  const transactionStates = ['outstanding', 'future', 'cleared'];

  useEffect(() => {
    if (isSuccess && isSuccessTotals && isSuccessValidationTotals) {
      setShowSpinner(false);
    }
  }, [isSuccess, isSuccessTotals, isSuccessValidationTotals]);

  const handleSnackbarClose = () => setOpenSnackbar(false);

  const handleError = (error, moduleName) => {
    const errorMsg = error.response
      ? `${moduleName}: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : `${moduleName}: Failure`;
    setMessage(errorMsg);
    setOpenSnackbar(true);
    console.error(errorMsg);
  };

  const handlerToUpdateTransactionState = async(guid: string, transactionState: TransactionState) => {
    await updateTransactionState({
      guid: guid,
      transactionState: transactionState,
    });
  }

  const handleInsertNewValidationData = async (
    accountNameOwner: string,
    transactionState: TransactionState,
  ) => {
    console.log(accountNameOwner);

    const payload: ValidationAmount = {
      validationId: Math.random(),
      activeStatus: true,
      amount: totals.totalsCleared,
      transactionState: transactionState,
      validationDate: new Date(),
    };

    await insertValidationAmount({
      accountNameOwner: accountNameOwner,
      payload: payload,
    });
  };

  const handleDeleteRow = async (transaction: Transaction) => {
    await deleteTransaction({ oldRow: transaction });
  };

  const handleAddRow = async () => {
    const newRow = {
      transactionDate: new Date(),
      accountNameOwner,
      reoccurringType: "onetime" as ReoccurringType,
      amount: 0.0,
      transactionState: "outstanding" as TransactionState,
      transactionType: "undefined" as TransactionType,
      guid: uuidv4(),
      description: "",
      category: "",
      accountType: "undefined" as AccountType,
      activeStatus: true,
      notes: "",
    };
    try {
      await insertTransaction({ accountNameOwner, newRow, isFutureTransaction: false });
    } catch (error) {
      handleError(error, "handleAddRow");
    }
  };

  const addRow = async (newData: Transaction): Promise<string> => {
    try {
      await insertTransaction({
        accountNameOwner: newData.accountNameOwner,
        newRow: newData,
        isFutureTransaction: false,
      });

      return "success";
    } catch (error) {
      handleError(error, "addRow");
      throw error;
    }
  };

  const updateRow = (newData: any, oldData: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          updateTransaction({ newRow: newData, oldRow: oldData });
          resolve("success");
        } catch (error) {
          handleError(error, "updateRow");
          reject();
        }
      }, 1000);
    });
  };

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Transaction Date",
      type: "date",
      width: 100,
      renderCell: (params) => {
        return params.value.toLocaleDateString("en-US");
      },
      valueGetter: (params: string) => {
        //console.log("date-in:" + params)
        const utcDate = new Date(params);
        const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
        //console.log("localDate: " + localDate);
        return localDate;
      },
      editable: true,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 180,
      editable: true,
      renderCell: (params) => (
        <div>
          {params.value}
        </div>
      ),
      // renderEditCell: (params: any) => (
      //   <TextField
      //     value={params.value || ''}
      //     onChange={(e: any) => params.api.getCellEditorInstances().forEach((editor: any) => editor.setValue(e.target.value))}
      //   />
      // ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      editable: true,
    },
    {
      field: "amount",
      headerName: "Amount",
      type: "number",
      width: 90,
      renderCell: (params: any) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
      editable: true,
      cellClassName: "nowrap",
    },
    {
      field: 'transactionState',
      headerName: 'transactionState',
      width: 275,
      editable: true,
      renderCell: (params: any) => {
        const handleStateChange = (newState: TransactionState) => {
          const transactionGuid = params.row.guid; 
          console.log("parms: " + params.row.guid );
          handlerToUpdateTransactionState(transactionGuid, newState)
          // Optionally update the backend or DataGrid API here
          console.log(`State changed to: ${newState}`);
        };
    
        return (
          <Box>
            {transactionStates.map((option: any) => (
              <Button
                key={option}
                variant={params.value === option ? 'contained' : 'outlined'}
                onClick={() => handleStateChange(option)}
                size="small"
                sx={{ 
                  marginRight: 1,
                  color: params.value === option ? 'white' : 'primary.main',
                  backgroundColor: params.value === option ? 'primary.main' : 'transparent',
                  borderColor: params.value === option ? 'transparent' : 'primary.main', // Border color matches text
              '&:hover': {
                backgroundColor: params.value === option ? 'primary.dark' : 'primary.light',
                color: params.value === option ? 'white' : 'primary.main',
              },
                }}
              >
                {option}
              </Button>
            ))}
          </Box>
        );
      },
    },
    {
      field: 'transactionType',
      headerName: 'Type',
      width: 180,
      renderCell: (params: any) => params.value || 'undefined',
      // renderEditCell: (params) => (
      //   <SelectTransactionType
      //     currentValue={params.value || 'undefined'}
      //     //onChange={(newValue: any) => params.api.getCellEditorInstances().forEach((editor : any) => editor.setValue(newValue))}
      //   />
      // ),
    },
    {
      field: 'reoccurringType',
      headerName: 'Reoccur',
      width: 150,
      renderCell: (params: any) => params.value || 'undefined',
    },
    {
      field: 'notes',
      headerName: 'Notes',
      width: 180,
      editable: true,
    },
    // {
    //   field: 'receiptImage',
    //   headerName: 'Image',
    //   editable: false,
    //   //filtering: false,
    //   width: 150,
    //   renderCell: (params) => (
    //     <div>
    //       {params.value ? (
    //         <img src={params.value.thumbnail} alt="receipt" style={{ width: '50px', height: '50px' }} />
    //       ) : (
    //         <Button onClick={() => {/* Handle image upload or view */}}>Upload Image</Button>
    //       )}
    //     </div>
    //   ),
    // },
    {
      field: "",
      headerName: "Actions",
      sortable: false,
      width: 120,
      renderCell: (params) => {
        const { id } = params.row;
      
        return (
          <div>
            <IconButton
                onClick={() => {
                  setOpenForm(true);
                }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => {
                handleDeleteRow(params.row);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        );
      }
    },
  ];

  return (
    <Box>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div>

<h2>{`[ ${currencyFormat(
  noNaN(totals?.["totals"] ?? 0),
)} ] [ ${currencyFormat(
  noNaN(totals?.["totalsCleared"] ?? 0),
)} ]  [ ${currencyFormat(
  noNaN(totals?.["totalsOutstanding"] ?? 0),
)} ] [ ${currencyFormat(noNaN(totals?.["totalsFuture"] ?? 0))} ]`}</h2>
          <IconButton 
              onClick={() => {
                setOpenForm(true)
                return handleAddRow
                }
              } 
              style={{ marginLeft: 8 }}>
              <AddIcon />
          </IconButton>

          <Button
            onClick={() => {
              console.log('insertNewValidationData(accountNameOwner, "cleared")')
              handleInsertNewValidationData(accountNameOwner, "cleared")
              }
            }
          >
            {validationData?.amount
              ? validationData?.amount.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })
              : "$0.00"}{" "}
            {" - "}{" "}
            {validationData?.validationDate
              ? epochToDate(
                  validationData?.validationDate,
                ).toLocaleString()
              : "1970-01-01T00:00:00:000Z"}
          </Button>


        <DataGrid 
         rows={data || []} 
         columns={columns}
         getRowId={(row) => row.transactionId || 0}
         checkboxSelection={false}
         rowSelection={false}
        />
        </div>
      )}

      <SnackbarBaseline
        open={openSnackbar}
        onClose={handleSnackbarClose}
        message={message}
      />

{/* Form Overlay for Adding/Editing Transaction */}
<Modal
  open={openForm}
  onClose={() => setOpenForm(false)}
  aria-labelledby="transaction-form-modal"
  aria-describedby="transaction-form-modal-description"
>
  <Box
    sx={{
      width: 400,
      padding: 4,
      backgroundColor: "white",
      margin: "auto",
      top: "20%",
    }}
  >
    <h3>{transactionData ? "Edit Transaction" : "Add New Transaction"}</h3>

    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        label="Transaction Date"
        onChange={(newValue) => setTransactionData((prev: any) => ({ ...prev, transactionDate: newValue }))}
      />
    </LocalizationProvider>

    {/* <TextField
      label="GUID"
      //value={transactionData?.guid || ""}
      value={uuidv4()}
      onChange={(e) =>
        setTransactionData((prev: any) => ({
          ...prev,
          guid: e.target.value,
        }))
      }
      fullWidth
      margin="normal"
    /> */}

    <TextField
      label="Description"
      value={transactionData?.description || ""}
      onChange={(e) =>
        setTransactionData((prev: any) => ({
          ...prev,
          description: e.target.value,
        }))
      }
      fullWidth
      margin="normal"
    />

    <TextField
      label="Category"
      value={transactionData?.category || ""}
      onChange={(e) =>
        setTransactionData((prev: any) => ({
          ...prev,
          category: e.target.value,
        }))
      }
      fullWidth
      margin="normal"
    />

    {/* <Select
      label="Category"
      value={transactionData?.category || ""}
      onChange={(e: any) =>
        setTransactionData((prev: any) => ({
          ...prev,
          category: e.target.value,
        }))
      }
      fullWidth
      //margin="normal"
    >
      {categories.map((category) => (
        <MenuItem key={category} value={category}>
          {category}
        </MenuItem>
      ))}
    </Select> */}

    <TextField
      label="Amount"
      //value={transactionData?.amount || ""}
      value={transactionData?.amount ?? ""}
      onChange={(e) =>
        setTransactionData((prev: any) => ({
          ...prev,
          amount: parseFloat(e.target.value) || 0,
        }))
      }
      fullWidth
      margin="normal"
      type="number"
      slotProps={{
        htmlInput: {
          step: "0.01", // Allow decimal inputs
        },
      }}
    />

    <Select
      label="Transaction State"
      value={transactionData?.transactionState || ""}
      onChange={(e) =>
        setTransactionData((prev: any) => ({
          ...prev,
          transactionState: e.target.value,
        }))
      }
      fullWidth
    >
      {transactionStates.map((state) => (
        <MenuItem key={state} value={state}>
          {state}
        </MenuItem>
      ))}
    </Select>

    {/* <TextField
      label="Transaction Type"
      value={transactionData?.transactionType || ""}
      onChange={(e) =>
        setTransactionData((prev: any) => ({
          ...prev,
          transactionType: e.target.value,
        }))
      }
      fullWidth
    /> */}

    <Select
      label="Reoccurring Type"
      value={transactionData?.reoccurringType || "onetime"}
      onChange={(e) =>
        setTransactionData((prev: any) => ({
          ...prev,
          reoccurringType: e.target.value,
        }))
      }
      fullWidth
    >
      <MenuItem value="onetime">One-Time</MenuItem>
      <MenuItem value="weekly">Weekly</MenuItem>
      <MenuItem value="monthly">Monthly</MenuItem>
    </Select>

    <TextField
      label="Notes"
      value={transactionData?.notes || ""}
      onChange={(e) =>
        setTransactionData((prev: any) => ({
          ...prev,
          notes: e.target.value,
        }))
      }
      fullWidth
      margin="normal"
      multiline
      rows={3}
    />

    <div>
      <Button
        variant="contained"
        color="primary"
        onClick={() => transactionData && addRow(transactionData)}
        style={{ marginTop: 16 }}
      >
        {transactionData ? "Update" : "Add"}
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => setOpenForm(false)}
        style={{ marginTop: 16, marginLeft: 8 }}
      >
        Cancel
      </Button>
    </div>
  </Box>
</Modal>

    </Box>
  );
}
// import { useRouter } from 'next/router';

// export default function TransactionDetails() {

//   const router = useRouter();
//   const { accountNameOwner } = router.query;

//   return (
//     <div>
//       <h1>Transaction Details</h1>
//       <p>Displaying transactions for: {accountNameOwner}</p>
//     </div>
//   );
// };
import { useRouter } from 'next/router';
import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import TextField from "@mui/material/TextField";
import { Box, Button, Modal, IconButton } from "@mui/material";
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
import { TransactionState } from '../../../model/TransactionState';
import { TransactionType } from '../../../model/TransactionType';
import { ReoccurringType } from '../../../model/ReoccurringType';

export default function TransactionTable() {
  const [showSpinner, setShowSpinner] = useState(true);
  const [message, setMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const router = useRouter();
  const { accountNameOwner } : any = router.query;
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

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Transaction Date",
      type: "date",
      width: 150,
      editable: true,
      valueGetter: ({ value }) => new Date(value),
      renderCell: ({ value }) => value.toLocaleDateString("en-US"),
    },
    {
      field: "description",
      headerName: "Description",
      width: 200,
      editable: true,
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      editable: true,
    },
    {
      field: "amount",
      headerName: "Amount",
      type: "number",
      width: 120,
      editable: true,
      //renderCell: ({ value }) => currencyFormat(value),
    },
    {
      field: "transactionState",
      headerName: "State",
      width: 200,
      editable: true,
      renderCell: ({ row, value }) => (
        <Box>
          {["outstanding", "future", "cleared"].map((state) => (
            <Button
              key={state}
              variant={value === state ? "contained" : "outlined"}
              //onClick={() => updateTransactionState({ guid: row.guid, transactionState: state })}
              size="small"
              sx={{ marginRight: 1 }}
            >
              {state}
            </Button>
          ))}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {showSpinner ? (
        <Spinner />
      ) : (
        <DataGrid 
         rows={data || []} 
         columns={columns}
         getRowId={(row) => row.transactionId || 0}
        />
      )}

      <SnackbarBaseline
        open={openSnackbar}
        onClose={handleSnackbarClose}
        message={message}
      />

      <Button
        //startIcon={<AddIcon />}
        onClick={handleAddRow}
        variant="contained"
        sx={{ marginTop: 2 }}
      >
        Add Transaction
      </Button>
    </Box>
  );
}
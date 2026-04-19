'use client';

import React, { useState, useCallback } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

import { AccountType } from '../model/AccountType';
import { ReoccurringType } from '../model/ReoccurringType';
import Transaction from '../model/Transaction';
import TransactionCategoryMetadata from '../model/TransactionCategoryMetadata';
import { TransactionState } from '../model/TransactionState';
import { TransactionType } from '../model/TransactionType';
import { getCategoryWithAI, createManualMetadata } from '../utils/ai/categorization';
import { parseTransactionPaste } from '../utils/parseTransactionPaste';
import useTransactionInsert from '../hooks/useTransactionInsert';
import { normalizeTransactionDate, formatDateForInput } from './Common';

type DialogStep = 'paste' | 'categorizing' | 'review' | 'inserting' | 'done';

interface EditableRow {
  id: string;
  /** 'YYYY-MM-DD' string for <input type="date"> */
  date: string;
  description: string;
  /** Kept as string during editing to allow partial input like "-" or "." */
  amount: string;
  category: string;
  categoryMetadata?: TransactionCategoryMetadata;
  /** Parse warnings — row should be reviewed but can still be inserted if fields are valid. */
  parseErrors: string[];
  removed: boolean;
  selected: boolean;
  insertError?: string;
}

export interface PasteTransactionsDialogProps {
  open: boolean;
  onClose: () => void;
  accountNameOwner: string;
  accountType: AccountType;
  /** Available category names for the autocomplete. */
  categories: string[];
  /** Called after at least one transaction is successfully inserted. */
  onComplete: () => void;
}

/** Multi-step dialog: paste raw bank text → AI categorize → review/edit → bulk insert. */
export default function PasteTransactionsDialog({
  open,
  onClose,
  accountNameOwner,
  accountType,
  categories,
  onComplete,
}: PasteTransactionsDialogProps): React.ReactElement {
  const [step, setStep] = useState<DialogStep>('paste');
  const [rawText, setRawText] = useState('');
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [categorizingProgress, setCategorizingProgress] = useState(0);
  const [insertProgress, setInsertProgress] = useState(0);
  const [insertedCount, setInsertedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [parseErrorMessage, setParseErrorMessage] = useState('');

  const { mutateAsync: insertTransaction } = useTransactionInsert();

  const resetState = useCallback(() => {
    setStep('paste');
    setRawText('');
    setRows([]);
    setCategorizingProgress(0);
    setInsertProgress(0);
    setInsertedCount(0);
    setFailedCount(0);
    setParseErrorMessage('');
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleParse = useCallback(async () => {
    setParseErrorMessage('');
    const parsed = parseTransactionPaste(rawText);

    if (parsed.length === 0) {
      setParseErrorMessage('No transactions found. Make sure the text matches the expected format.');
      return;
    }

    const editable: EditableRow[] = parsed.map((p) => ({
      id: p.id,
      date: p.date ? formatDateForInput(p.date) : '',
      description: p.description,
      amount: p.amount !== null ? String(p.amount) : '',
      category: '',
      parseErrors: p.parseErrors,
      removed: false,
      selected: true,
    }));

    setRows(editable);
    setStep('categorizing');
    setCategorizingProgress(0);

    // AI categorize sequentially to stay well under the 50 RPM limit
    const categorized = [...editable];
    for (let idx = 0; idx < categorized.length; idx++) {
      const row = categorized[idx];
      if (row.description) {
        try {
          const result = await getCategoryWithAI(
            row.description,
            parseFloat(row.amount) || 0,
            categories,
            accountNameOwner,
          );
          categorized[idx] = {
            ...categorized[idx],
            category: result.category,
            categoryMetadata: result.metadata,
          };
        } catch {
          // Leave category blank; user can fill it in during review
        }
      }
      setCategorizingProgress(idx + 1);
    }

    setRows(categorized);
    setStep('review');
  }, [rawText, categories, accountNameOwner]);

  const handleRowChange = useCallback(
    (id: string, field: keyof EditableRow, value: unknown) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    },
    [],
  );

  const handleRemoveRow = useCallback((id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, removed: true } : r)));
  }, []);

  const handleInsert = async (): Promise<void> => {
    const toInsert = rows.filter((r) => !r.removed && r.selected);

    setStep('inserting');
    setInsertProgress(0);
    setInsertedCount(0);
    setFailedCount(0);

    let inserted = 0;
    let failed = 0;

    for (let idx = 0; idx < toInsert.length; idx++) {
      const row = toInsert[idx];
      try {
        const transaction: Transaction = {
          // crypto.randomUUID() satisfies the UUID format check in validateInsert;
          // setupNewTransaction will replace it with a server-generated secure UUID.
          guid: crypto.randomUUID(),
          accountNameOwner,
          accountType,
          transactionDate: normalizeTransactionDate(row.date),
          description: row.description.trim(),
          category: row.category,
          categoryMetadata: row.categoryMetadata,
          amount: parseFloat(row.amount),
          transactionState: 'outstanding' as TransactionState,
          transactionType: 'expense' as TransactionType,
          reoccurringType: 'onetime' as ReoccurringType,
          activeStatus: true,
          notes: '',
        };

        await insertTransaction({
          accountNameOwner,
          newRow: transaction,
          isFutureTransaction: false,
          isImportTransaction: false,
        });
        inserted++;
      } catch (error) {
        failed++;
        const msg = error instanceof Error ? error.message : String(error);
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, insertError: msg } : r)));
      }

      setInsertProgress(idx + 1);
      setInsertedCount(inserted);
      setFailedCount(failed);

      // Brief pause between inserts to avoid back-end rate limiting
      if (idx < toInsert.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    setStep('done');
    if (inserted > 0) onComplete();
  };

  // Derived state for review step
  const activeRows = rows.filter((r) => !r.removed);
  const selectedRows = activeRows.filter((r) => r.selected);
  const allSelected = activeRows.length > 0 && selectedRows.length === activeRows.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < activeRows.length;
  const ambiguousCount = selectedRows.filter((r) => r.parseErrors.length > 0).length;
  const invalidRows = selectedRows.filter(
    (r) => !r.date || !r.description.trim() || isNaN(parseFloat(r.amount)),
  );
  const canInsert = invalidRows.length === 0 && selectedRows.length > 0;

  const handleSelectAll = useCallback((checked: boolean) => {
    setRows((prev) => prev.map((r) => (r.removed ? r : { ...r, selected: checked })));
  }, []);

  const handleToggleSelect = useCallback((id: string, checked: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: checked } : r)));
  }, []);

  const dialogTitle: Record<DialogStep, string> = {
    paste: 'Paste Transactions',
    categorizing: 'Categorizing with AI…',
    review: `Review ${activeRows.length} Transaction${activeRows.length !== 1 ? 's' : ''}`,
    inserting: 'Inserting…',
    done: 'Done',
  };

  return (
    <Dialog open={open} onClose={step === 'paste' || step === 'review' || step === 'done' ? handleClose : undefined} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle[step]}</DialogTitle>

      <DialogContent>
        {/* ── Step: paste ─────────────────────────────────────────────── */}
        {step === 'paste' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Copy transaction text from your bank statement and paste below. Each transaction block
              should include a header line with the date and merchant, a card suffix line, and an
              amount line.
            </Typography>
            {parseErrorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {parseErrorMessage}
              </Alert>
            )}
            <TextField
              multiline
              minRows={8}
              maxRows={20}
              fullWidth
              placeholder={
                'Transaction Details for Row 1    04/16/26    ALDI 00000\n#...4567\n$60.21\nTransaction Details for Row 2    04/16/26    SAVERS - 0000\n#...4567\n$60.47'
              }
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              autoFocus
              sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.82rem' } }}
            />
          </Box>
        )}

        {/* ── Step: categorizing ──────────────────────────────────────── */}
        {step === 'categorizing' && (
          <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>
              {categorizingProgress} / {rows.length} categorized
            </Typography>
            <LinearProgress
              variant="determinate"
              value={rows.length > 0 ? (categorizingProgress / rows.length) * 100 : 0}
              sx={{ width: '100%' }}
            />
          </Box>
        )}

        {/* ── Step: review ────────────────────────────────────────────── */}
        {step === 'review' && (
          <Box>
            {ambiguousCount > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {ambiguousCount} row{ambiguousCount !== 1 ? 's' : ''} could not be fully parsed —
                review the highlighted fields before inserting.
              </Alert>
            )}
            {invalidRows.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {invalidRows.length} row{invalidRows.length !== 1 ? 's' : ''} still have invalid
                fields. Fix or remove them before inserting.
              </Alert>
            )}

            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 32 }} />
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell sx={{ width: 40 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows
                    .filter((r) => !r.removed)
                    .map((row) => {
                      const amountNum = parseFloat(row.amount);
                      const isAmountInvalid = row.amount !== '' && isNaN(amountNum);
                      const isDateInvalid = !row.date;
                      const isDescInvalid = !row.description.trim();
                      const hasFieldError = isAmountInvalid || isDateInvalid || isDescInvalid;
                      const hasParseWarning = row.parseErrors.length > 0;

                      return (
                        <TableRow
                          key={row.id}
                          sx={{
                            backgroundColor: hasFieldError
                              ? 'error.main'
                              : hasParseWarning
                                ? 'warning.main'
                                : 'inherit',
                            backgroundBlendMode: 'overlay',
                            opacity: hasFieldError || hasParseWarning ? undefined : undefined,
                            '& td': {
                              backgroundColor: hasFieldError
                                ? 'rgba(211,47,47,0.08)'
                                : hasParseWarning
                                  ? 'rgba(237,108,2,0.08)'
                                  : 'inherit',
                            },
                          }}
                        >
                          {/* Select */}
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={row.selected}
                              onChange={(e) => handleToggleSelect(row.id, e.target.checked)}
                            />
                          </TableCell>

                          {/* Status icon */}
                          <TableCell>
                            {hasFieldError ? (
                              <Tooltip title="Row has invalid fields — fix before inserting">
                                <ErrorIcon fontSize="small" color="error" />
                              </Tooltip>
                            ) : hasParseWarning ? (
                              <Tooltip title={`Parse issues: ${row.parseErrors.join('; ')}`}>
                                <WarningIcon fontSize="small" color="warning" />
                              </Tooltip>
                            ) : (
                              <CheckCircleIcon fontSize="small" color="success" />
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <TextField
                              type="date"
                              size="small"
                              value={row.date}
                              onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                              error={isDateInvalid}
                              slotProps={{ inputLabel: { shrink: true } }}
                              sx={{ minWidth: 150 }}
                            />
                          </TableCell>

                          {/* Description */}
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.description}
                              onChange={(e) =>
                                handleRowChange(row.id, 'description', e.target.value)
                              }
                              error={isDescInvalid}
                              sx={{ minWidth: 180 }}
                            />
                          </TableCell>

                          {/* Category */}
                          <TableCell>
                            <Autocomplete
                              freeSolo
                              options={categories}
                              value={row.category}
                              onChange={(_, newValue) => {
                                handleRowChange(row.id, 'category', newValue ?? '');
                                handleRowChange(
                                  row.id,
                                  'categoryMetadata',
                                  createManualMetadata(),
                                );
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  sx={{ minWidth: 160 }}
                                  onChange={(e) =>
                                    handleRowChange(row.id, 'category', e.target.value)
                                  }
                                />
                              )}
                            />
                          </TableCell>

                          {/* Amount */}
                          <TableCell align="right">
                            <TextField
                              size="small"
                              value={row.amount}
                              onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                              error={isAmountInvalid}
                              slotProps={{
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start">$</InputAdornment>
                                  ),
                                },
                              }}
                              sx={{ width: 110 }}
                            />
                          </TableCell>

                          {/* Remove */}
                          <TableCell>
                            <Tooltip title="Remove this row">
                              <IconButton size="small" onClick={() => handleRemoveRow(row.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* ── Step: inserting ─────────────────────────────────────────── */}
        {step === 'inserting' && (
          <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>
              {insertProgress} / {selectedRows.length} inserted
            </Typography>
            <LinearProgress
              variant="determinate"
              value={selectedRows.length > 0 ? (insertProgress / selectedRows.length) * 100 : 0}
              sx={{ width: '100%' }}
            />
          </Box>
        )}

        {/* ── Step: done ──────────────────────────────────────────────── */}
        {step === 'done' && (
          <Box sx={{ py: 2 }}>
            <Alert severity={failedCount === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {insertedCount} transaction{insertedCount !== 1 ? 's' : ''} inserted successfully.
              {failedCount > 0 && ` ${failedCount} failed — see below.`}
            </Alert>

            {failedCount > 0 && (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows
                      .filter((r) => r.insertError)
                      .map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.description}</TableCell>
                          <TableCell sx={{ color: 'error.main' }}>{r.insertError}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step === 'paste' && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={handleParse} disabled={!rawText.trim()}>
              Parse &amp; Categorize
            </Button>
          </>
        )}

        {step === 'review' && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={() => setStep('paste')}>Back</Button>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, px: 1 }}>
              {selectedRows.length} of {activeRows.length} selected
              {ambiguousCount > 0 && ` · ${ambiguousCount} need review`}
            </Typography>
            <Button variant="contained" onClick={handleInsert} disabled={!canInsert}>
              Insert {selectedRows.length} Transaction{selectedRows.length !== 1 ? 's' : ''}
            </Button>
          </>
        )}

        {(step === 'categorizing' || step === 'inserting') && (
          <Button disabled>Please wait…</Button>
        )}

        {step === 'done' && (
          <Button variant="contained" onClick={handleClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

# Medical Expense UI/UX Integration Plan

## Executive Summary

This document outlines a comprehensive Test-Driven Development (TDD) approach to integrate medical expense tracking capabilities into the existing NextJS finance application. The backend Phase 2 (Core Medical Expense Entity) is complete with full API endpoints available. This plan focuses on creating a seamless, user-friendly medical expense management interface that integrates naturally with the existing finance application architecture.

**Status**: Backend Phase 2 Complete ✅ - Ready for UI Integration
**Approach**: Test-Driven Development with comprehensive test coverage
**Timeline**: 4-5 days (following TDD methodology)
**Risk**: Low (leverages existing patterns and completed backend)

## Backend API Analysis

### Medical Expense Controller Endpoints Available

Based on analysis of `MedicalExpenseController.kt`, the following REST endpoints are operational:

**Core CRUD Operations:**

- `POST /api/medical-expenses` - Create medical expense
- `POST /api/medical-expenses/insert` - Alternative create endpoint
- `PUT /api/medical-expenses/{id}` - Update medical expense
- `GET /api/medical-expenses/{id}` - Get medical expense by ID
- `DELETE /api/medical-expenses/{id}` - Soft delete medical expense

**Query Endpoints:**

- `GET /api/medical-expenses/transaction/{transactionId}` - Get by transaction
- `GET /api/medical-expenses/account/{accountId}` - Get by account
- `GET /api/medical-expenses/account/{accountId}/date-range` - Get by account and date range
- `GET /api/medical-expenses/provider/{providerId}` - Get by medical provider
- `GET /api/medical-expenses/family-member/{familyMemberId}` - Get by family member
- `GET /api/medical-expenses/family-member/{familyMemberId}/date-range` - Get by family member and date range
- `GET /api/medical-expenses/claim-status/{claimStatus}` - Get by claim status
- `GET /api/medical-expenses/date-range` - Get by service date range

**Specialized Endpoints:**

- `GET /api/medical-expenses/out-of-network` - Get out-of-network expenses
- `GET /api/medical-expenses/outstanding-balances` - Get outstanding patient balances
- `GET /api/medical-expenses/open-claims` - Get active open claims
- `PATCH /api/medical-expenses/{id}/claim-status` - Update claim status
- `GET /api/medical-expenses/totals/year/{year}` - Get yearly totals
- `GET /api/medical-expenses/claim-status-counts` - Get claim status counts
- `GET /api/medical-expenses/procedure-code/{code}` - Get by procedure code
- `GET /api/medical-expenses/diagnosis-code/{code}` - Get by diagnosis code

### Family Member Controller Endpoints

From `FamilyMemberController.kt`:

- `POST /api/family-members/insert` - Create family member
- `GET /api/family-members/{id}` - Get family member by ID
- `GET /api/family-members/owner/{owner}` - Get family members by owner
- `GET /api/family-members/owner/{owner}/relationship/{relationship}` - Get by owner and relationship
- `PATCH /api/family-members/{id}/active` - Update active status
- `DELETE /api/family-members/{id}` - Soft delete family member

### Medical Expense Data Model

Based on backend analysis, the MedicalExpense entity includes:

```typescript
interface MedicalExpense {
  medicalExpenseId: number;
  transactionId: number;
  providerId?: number;
  familyMemberId?: number;
  serviceDate: Date;
  serviceDescription?: string;
  procedureCode?: string;
  diagnosisCode?: string;
  billedAmount: number;
  insuranceDiscount: number;
  insurancePaid: number;
  patientResponsibility: number;
  paidDate?: Date;
  isOutOfNetwork: boolean;
  claimNumber?: string;
  claimStatus: ClaimStatus;
  activeStatus: boolean;
}

enum ClaimStatus {
  Submitted = "submitted",
  Processing = "processing",
  Approved = "approved",
  Denied = "denied",
  Paid = "paid",
  Closed = "closed",
}
```

## Current Finance App Architecture Analysis

### Existing Page Structure (`/pages/finance/`)

- `index.tsx` - Account Overview (main dashboard)
- `categories.tsx` - Category management
- `descriptions.tsx` - Description management
- `payments.tsx` - Payment management
- `payments-next.tsx` - Next-gen payment interface
- `transfers.tsx` - Transfer management
- `transfers-next.tsx` - Next-gen transfer interface
- `backup.tsx` - Backup/restore functionality
- `configuration.tsx` - App configuration
- `paymentrequired.tsx` - Payment required management
- `transactions/` - Transaction management pages

### Navigation Integration Point

Medical expenses will be added to the `financeLinks` array in `components/Layout.tsx`:

```typescript
// Current financeLinks array (lines 58-93)
const financeLinks = [
  { text: "Home", href: "/finance/", icon: <HomeIcon /> },
  // ... existing links
  // ADD NEW MEDICAL EXPENSE LINK HERE:
  { text: "Medical Expenses", href: "/finance/medical-expenses", icon: <MedicalServicesIcon /> },
  // ... rest of existing links
];
```

### UI Component Patterns Available

**Data Display:**

- `DataGridBase.tsx` - MUI DataGrid wrapper with pagination, editing, selection
- `DataGridDynamic.tsx` - Dynamic data grid for flexible schemas
- `SummaryBar.tsx` - Financial summary display component

**Forms & Dialogs:**

- `FormDialog.tsx` - Modal dialog wrapper for forms
- `ConfirmDialog.tsx` - Confirmation dialog for deletions/actions
- `USDAmountInput.tsx` - Specialized currency input with +/- controls

**Layout & Navigation:**

- `PageHeader.tsx` - Consistent page header with title, subtitle, actions
- `ActionBar.tsx` - Action button container
- `EmptyState.tsx` - Empty state component for no data scenarios
- `LoadingState.tsx` - Loading state component
- `ErrorDisplay.tsx` - Error display component

**Specialized Components:**

- `SelectNavigateAccounts.tsx` - Account navigation dropdown
- `BackupRestore.tsx` - Backup/restore specific functionality

### Theming & Styling

- **Modern Theme**: Available via `modernTheme` from `themes/modernTheme`
- **Dracula Theme**: Available via `draculaTheme` from `themes/draculaTheme`
- **Theme Switching**: Via `UIContext` and `UIToggle` component
- **Layout**: `FinanceLayout` wrapper for finance pages

## Medical Expense UI/UX Integration Plan

### Phase 1: Foundation Setup (Day 1) - TDD Approach

#### 1.1 Create Base Medical Expense Types and Models (TDD Step 1)

**Test First - Write Tests:**

```typescript
// __tests__/model/MedicalExpense.test.ts
describe("MedicalExpense Model", () => {
  it("should create valid medical expense object", () => {
    const medicalExpense: MedicalExpense = {
      medicalExpenseId: 1,
      transactionId: 100,
      serviceDate: new Date("2024-01-15"),
      billedAmount: 250.0,
      insuranceDiscount: 50.0,
      insurancePaid: 150.0,
      patientResponsibility: 50.0,
      isOutOfNetwork: false,
      claimStatus: ClaimStatus.Approved,
      activeStatus: true,
    };

    expect(medicalExpense.transactionId).toBe(100);
    expect(medicalExpense.billedAmount).toBe(250.0);
  });

  it("should validate required fields", () => {
    // Test validation requirements
  });
});
```

**Then Implement:**

```typescript
// model/MedicalExpense.ts
export interface MedicalExpense {
  medicalExpenseId: number;
  transactionId: number;
  providerId?: number;
  familyMemberId?: number;
  serviceDate: Date;
  serviceDescription?: string;
  procedureCode?: string;
  diagnosisCode?: string;
  billedAmount: number;
  insuranceDiscount: number;
  insurancePaid: number;
  patientResponsibility: number;
  paidDate?: Date;
  isOutOfNetwork: boolean;
  claimNumber?: string;
  claimStatus: ClaimStatus;
  activeStatus: boolean;
  dateAdded?: Date;
  dateUpdated?: Date;
}

export enum ClaimStatus {
  Submitted = "submitted",
  Processing = "processing",
  Approved = "approved",
  Denied = "denied",
  Paid = "paid",
  Closed = "closed",
}

// model/FamilyMember.ts
export interface FamilyMember {
  familyMemberId: number;
  owner: string;
  memberName: string;
  relationship: FamilyRelationship;
  dateOfBirth?: Date;
  insuranceMemberId?: string;
  ssnLastFour?: string;
  medicalRecordNumber?: string;
  activeStatus: boolean;
}

export enum FamilyRelationship {
  Self = "self",
  Spouse = "spouse",
  Child = "child",
  Dependent = "dependent",
  Other = "other",
}
```

#### 1.2 Create Medical Expense Hooks (TDD Step 2)

**Test First:**

```typescript
// __tests__/hooks/useMedicalExpenseFetch.test.ts
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useMedicalExpenseFetch from '../../hooks/useMedicalExpenseFetch';

describe('useMedicalExpenseFetch', () => {
  it('should fetch medical expenses successfully', async () => {
    // Mock API response
    const mockExpenses = [
      { medicalExpenseId: 1, transactionId: 100, billedAmount: 250 }
    ];

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockExpenses,
    });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useMedicalExpenseFetch(), { wrapper });

    // Test expectations
  });
});
```

**Then Implement:**

```typescript
// hooks/useMedicalExpenseFetch.ts
import { useQuery } from "@tanstack/react-query";
import { MedicalExpense } from "../model/MedicalExpense";

export default function useMedicalExpenseFetch() {
  return useQuery<MedicalExpense[]>({
    queryKey: ["medicalExpenses"],
    queryFn: async () => {
      const response = await fetch("/api/medical-expenses");
      if (!response.ok) {
        throw new Error("Failed to fetch medical expenses");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// hooks/useMedicalExpenseInsert.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MedicalExpense } from "../model/MedicalExpense";

export default function useMedicalExpenseInsert() {
  const queryClient = useQueryClient();

  return useMutation<MedicalExpense, Error, { payload: MedicalExpense }>({
    mutationFn: async ({ payload }) => {
      const response = await fetch("/api/medical-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create medical expense");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicalExpenses"] });
    },
  });
}

// Additional hooks following same TDD pattern:
// - useMedicalExpenseUpdate.ts
// - useMedicalExpenseDelete.ts
// - useFamilyMemberFetch.ts
// - useFamilyMemberInsert.ts
// - useMedicalExpensesByAccount.ts
// - useMedicalExpensesByDateRange.ts
```

### Phase 2: Core Medical Expense Page (Day 2) - TDD Implementation

#### 2.1 Create Main Medical Expense Page (TDD Step 3)

**Test First:**

```typescript
// __tests__/pages/finance/medical-expenses/index.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MedicalExpenses from '../../../pages/finance/medical-expenses/index';

describe('MedicalExpenses Page', () => {
  it('should render medical expenses page header', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MedicalExpenses />
      </QueryClientProvider>
    );

    expect(screen.getByText('Medical Expenses')).toBeInTheDocument();
    expect(screen.getByText('Track and manage your healthcare expenses')).toBeInTheDocument();
  });

  it('should display add medical expense button', () => {
    // Test add button functionality
  });

  it('should display medical expenses in data grid', async () => {
    // Test data grid display
  });
});
```

**Then Implement:**

```typescript
// pages/finance/medical-expenses/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GridColDef } from '@mui/x-data-grid';
import {
  Box,
  Button,
  IconButton,
  Link,
  Tooltip,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

import Spinner from '../../../components/Spinner';
import SnackbarBaseline from '../../../components/SnackbarBaseline';
import ErrorDisplay from '../../../components/ErrorDisplay';
import EmptyState from '../../../components/EmptyState';
import LoadingState from '../../../components/LoadingState';
import FinanceLayout from '../../../layouts/FinanceLayout';
import ConfirmDialog from '../../../components/ConfirmDialog';
import FormDialog from '../../../components/FormDialog';
import PageHeader from '../../../components/PageHeader';
import DataGridBase from '../../../components/DataGridBase';
import SummaryBar from '../../../components/SummaryBar';
import { useAuth } from '../../../components/AuthProvider';

import useMedicalExpenseFetch from '../../../hooks/useMedicalExpenseFetch';
import useMedicalExpenseDelete from '../../../hooks/useMedicalExpenseDelete';
import { MedicalExpense, ClaimStatus } from '../../../model/MedicalExpense';
import { currencyFormat } from '../../../components/Common';

export default function MedicalExpenses() {
  const [message, setMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<MedicalExpense | null>(null);

  const {
    data: medicalExpenses,
    isSuccess,
    isFetching,
    error,
    refetch,
  } = useMedicalExpenseFetch();

  const { mutateAsync: deleteExpense } = useMedicalExpenseDelete();

  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isFetching || loading || (!loading && !isAuthenticated)) {
      setShowSpinner(true);
      return;
    }
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess, isFetching, loading, isAuthenticated]);

  const handleDeleteExpense = async () => {
    if (selectedExpense) {
      try {
        await deleteExpense({ oldRow: selectedExpense });
        setMessage('Medical expense deleted successfully.');
        setShowSnackbar(true);
      } catch (error: any) {
        setMessage(`Delete error: ${error.message}`);
        setShowSnackbar(true);
      } finally {
        setShowModalDelete(false);
        setSelectedExpense(null);
      }
    }
  };

  const getClaimStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.Approved: return 'success';
      case ClaimStatus.Paid: return 'primary';
      case ClaimStatus.Denied: return 'error';
      case ClaimStatus.Processing: return 'warning';
      case ClaimStatus.Submitted: return 'info';
      case ClaimStatus.Closed: return 'default';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'serviceDate',
      headerName: 'Service Date',
      width: 120,
      type: 'date',
      valueGetter: (params) => new Date(params),
      renderCell: (params) => params.value?.toLocaleDateString('en-US'),
    },
    {
      field: 'serviceDescription',
      headerName: 'Description',
      width: 200,
      editable: true,
    },
    {
      field: 'billedAmount',
      headerName: 'Billed Amount',
      width: 120,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => currencyFormat(params.value || 0),
    },
    {
      field: 'insurancePaid',
      headerName: 'Insurance Paid',
      width: 120,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => currencyFormat(params.value || 0),
    },
    {
      field: 'patientResponsibility',
      headerName: 'Patient Responsibility',
      width: 150,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => currencyFormat(params.value || 0),
    },
    {
      field: 'claimStatus',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getClaimStatusColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'isOutOfNetwork',
      headerName: 'Network',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Out-of-Network' : 'In-Network'}
          color={params.value ? 'warning' : 'success'}
          size="small"
          variant="filled"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                // Handle edit action
                setSelectedExpense(params.row);
                // Navigate to edit or open edit modal
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedExpense(params.row);
                setShowModalDelete(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Calculate totals for summary bar
  const totalBilled = medicalExpenses?.reduce((sum, exp) => sum + (exp.billedAmount || 0), 0) || 0;
  const totalInsurancePaid = medicalExpenses?.reduce((sum, exp) => sum + (exp.insurancePaid || 0), 0) || 0;
  const totalPatientResponsibility = medicalExpenses?.reduce((sum, exp) => sum + (exp.patientResponsibility || 0), 0) || 0;
  const totalOutstanding = medicalExpenses?.filter(exp => !exp.paidDate && exp.patientResponsibility > 0)
    .reduce((sum, exp) => sum + exp.patientResponsibility, 0) || 0;

  if (error) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Medical Expenses"
          subtitle="Track and manage your healthcare expenses"
        />
        <ErrorDisplay
          error={error}
          variant="card"
          showRetry={true}
          onRetry={() => refetch()}
        />
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout>
      <PageHeader
        title="Medical Expenses"
        subtitle="Track and manage your healthcare expenses and insurance claims"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowModalAdd(true)}
            sx={{ backgroundColor: 'primary.main' }}
          >
            Add Medical Expense
          </Button>
        }
      />

      {showSpinner ? (
        <LoadingState
          variant="card"
          message="Loading medical expenses..."
        />
      ) : (
        <div>
          {/* Summary Bar */}
          <Box sx={{ maxWidth: 800, mx: 'auto', mb: 3 }}>
            <SummaryBar
              total={currencyFormat(totalBilled)}
              cleared={currencyFormat(totalInsurancePaid)}
              outstanding={currencyFormat(totalOutstanding)}
              future={currencyFormat(totalPatientResponsibility)}
              labels={{
                total: 'Total Billed',
                cleared: 'Insurance Paid',
                outstanding: 'Outstanding',
                future: 'Patient Responsibility'
              }}
            />
          </Box>

          <Box display="flex" justifyContent="center">
            <Box sx={{ width: 'fit-content' }}>
              {medicalExpenses && medicalExpenses.length > 0 ? (
                <DataGridBase
                  rows={medicalExpenses.filter(row => row != null) || []}
                  columns={columns}
                  getRowId={(row) => row.medicalExpenseId}
                  pageSizeOptions={[25, 50, 100]}
                  checkboxSelection={false}
                  rowSelection={false}
                />
              ) : (
                <EmptyState
                  title="No Medical Expenses Found"
                  message="You haven't added any medical expenses yet. Start tracking your healthcare expenses."
                  dataType="medical expenses"
                  variant="create"
                  actionLabel="Add Medical Expense"
                  onAction={() => setShowModalAdd(true)}
                  onRefresh={() => refetch()}
                />
              )}
            </Box>
          </Box>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showModalDelete}
        onClose={() => setShowModalDelete(false)}
        onConfirm={handleDeleteExpense}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the medical expense for "${selectedExpense?.serviceDescription || 'this service'}"?`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Add Medical Expense Modal - Will be implemented in next phase */}
      {showModalAdd && (
        <div>
          {/* TODO: Implement Add Medical Expense Form */}
        </div>
      )}

      <SnackbarBaseline
        message={message}
        state={showSnackbar}
        handleSnackbarClose={() => setShowSnackbar(false)}
      />
    </FinanceLayout>
  );
}
```

#### 2.2 Add Medical Expenses to Navigation

**Update Layout Component:**

```typescript
// components/Layout.tsx - Add to financeLinks array (around line 93)
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

const financeLinks = [
  { text: "Home", href: "/finance/", icon: <HomeIcon /> },
  { text: "Transfer", href: "/finance/transfers", icon: <SyncAltIcon /> },
  {
    text: "Transfer NextGen",
    href: "/finance/transfers-next",
    icon: <SyncAltIcon />,
  },
  { text: "Payments", href: "/finance/payments", icon: <PaymentIcon /> },
  {
    text: "PaymentsRequired",
    href: "/finance/paymentrequired",
    icon: <ReceiptIcon />,
  },
  // ADD NEW MEDICAL EXPENSE LINK HERE:
  {
    text: "Medical Expenses",
    href: "/finance/medical-expenses",
    icon: <MedicalServicesIcon />
  },
  { text: "Categories", href: "/finance/categories", icon: <CategoryIcon /> },
  {
    text: "Descriptions",
    href: "/finance/descriptions",
    icon: <DescriptionIcon />,
  },
  // ... rest of existing links
];
```

### Phase 3: Medical Expense Form Components (Day 3) - TDD Implementation

#### 3.1 Create Medical Expense Form Component (TDD Step 4)

**Test First:**

```typescript
// __tests__/components/MedicalExpenseForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MedicalExpenseForm from '../../components/MedicalExpenseForm';

describe('MedicalExpenseForm', () => {
  it('should render all required form fields', () => {
    render(<MedicalExpenseForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.getByLabelText('Service Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Service Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Billed Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Insurance Discount')).toBeInTheDocument();
    expect(screen.getByLabelText('Insurance Paid')).toBeInTheDocument();
    expect(screen.getByLabelText('Patient Responsibility')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const onSubmit = jest.fn();
    render(<MedicalExpenseForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    fireEvent.click(screen.getByText('Save'));

    expect(screen.getByText('Service date is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should validate financial consistency', async () => {
    // Test that allocated amounts don't exceed billed amount
  });
});
```

**Then Implement:**

```typescript
// components/MedicalExpenseForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import USDAmountInput from './USDAmountInput';
import { MedicalExpense, ClaimStatus } from '../model/MedicalExpense';
import { FamilyMember } from '../model/FamilyMember';
import useFamilyMemberFetch from '../hooks/useFamilyMemberFetch';

interface MedicalExpenseFormProps {
  initialData?: Partial<MedicalExpense>;
  onSubmit: (data: Partial<MedicalExpense>) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function MedicalExpenseForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}: MedicalExpenseFormProps) {
  const [formData, setFormData] = useState<Partial<MedicalExpense>>({
    serviceDate: new Date(),
    billedAmount: 0,
    insuranceDiscount: 0,
    insurancePaid: 0,
    patientResponsibility: 0,
    isOutOfNetwork: false,
    claimStatus: ClaimStatus.Submitted,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [financialWarning, setFinancialWarning] = useState<string>('');

  const { data: familyMembers } = useFamilyMemberFetch();

  const claimStatusOptions = Object.values(ClaimStatus);

  // Financial validation
  useEffect(() => {
    const { billedAmount = 0, insuranceDiscount = 0, insurancePaid = 0, patientResponsibility = 0 } = formData;
    const totalAllocated = insuranceDiscount + insurancePaid + patientResponsibility;

    if (totalAllocated > billedAmount && billedAmount > 0) {
      setFinancialWarning(`Total allocated amount ($${totalAllocated.toFixed(2)}) exceeds billed amount ($${billedAmount.toFixed(2)})`);
    } else {
      setFinancialWarning('');
    }
  }, [formData.billedAmount, formData.insuranceDiscount, formData.insurancePaid, formData.patientResponsibility]);

  const handleFieldChange = (field: keyof MedicalExpense, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.serviceDate) {
      newErrors.serviceDate = 'Service date is required';
    }

    if (!formData.transactionId) {
      newErrors.transactionId = 'Transaction ID is required';
    }

    if (!formData.billedAmount || formData.billedAmount <= 0) {
      newErrors.billedAmount = 'Billed amount must be greater than 0';
    }

    // Financial consistency validation
    const { billedAmount = 0, insuranceDiscount = 0, insurancePaid = 0, patientResponsibility = 0 } = formData;
    const totalAllocated = insuranceDiscount + insurancePaid + patientResponsibility;
    if (totalAllocated > billedAmount) {
      newErrors.financial = 'Total allocated amount cannot exceed billed amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        {financialWarning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {financialWarning}
          </Alert>
        )}

        {errors.financial && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.financial}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Service Information */}
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Service Date"
              value={formData.serviceDate}
              onChange={(date) => handleFieldChange('serviceDate', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.serviceDate,
                  helperText: errors.serviceDate,
                  required: true,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Transaction ID"
              type="number"
              fullWidth
              required
              value={formData.transactionId || ''}
              onChange={(e) => handleFieldChange('transactionId', parseInt(e.target.value))}
              error={!!errors.transactionId}
              helperText={errors.transactionId}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Service Description"
              fullWidth
              multiline
              rows={2}
              value={formData.serviceDescription || ''}
              onChange={(e) => handleFieldChange('serviceDescription', e.target.value)}
              placeholder="E.g., Annual physical exam, X-ray imaging, etc."
            />
          </Grid>

          {/* Financial Information */}
          <Grid item xs={12} sm={6}>
            <USDAmountInput
              label="Billed Amount"
              fullWidth
              required
              value={formData.billedAmount || 0}
              onChange={(value) => handleFieldChange('billedAmount', Number(value))}
              error={!!errors.billedAmount}
              helperText={errors.billedAmount}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <USDAmountInput
              label="Insurance Discount"
              fullWidth
              value={formData.insuranceDiscount || 0}
              onChange={(value) => handleFieldChange('insuranceDiscount', Number(value))}
              helperText="Amount discounted by insurance"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <USDAmountInput
              label="Insurance Paid"
              fullWidth
              value={formData.insurancePaid || 0}
              onChange={(value) => handleFieldChange('insurancePaid', Number(value))}
              helperText="Amount paid by insurance"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <USDAmountInput
              label="Patient Responsibility"
              fullWidth
              value={formData.patientResponsibility || 0}
              onChange={(value) => handleFieldChange('patientResponsibility', Number(value))}
              helperText="Amount patient owes"
            />
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={claimStatusOptions}
              value={formData.claimStatus || ClaimStatus.Submitted}
              onChange={(_, value) => handleFieldChange('claimStatus', value)}
              renderInput={(params) => (
                <TextField {...params} label="Claim Status" fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={familyMembers || []}
              getOptionLabel={(option) => `${option.memberName} (${option.relationship})`}
              value={familyMembers?.find(fm => fm.familyMemberId === formData.familyMemberId) || null}
              onChange={(_, value) => handleFieldChange('familyMemberId', value?.familyMemberId)}
              renderInput={(params) => (
                <TextField {...params} label="Family Member" fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Claim Number"
              fullWidth
              value={formData.claimNumber || ''}
              onChange={(e) => handleFieldChange('claimNumber', e.target.value)}
              placeholder="Insurance claim number"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Procedure Code"
              fullWidth
              value={formData.procedureCode || ''}
              onChange={(e) => handleFieldChange('procedureCode', e.target.value)}
              placeholder="CPT/HCPCS code"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isOutOfNetwork || false}
                  onChange={(e) => handleFieldChange('isOutOfNetwork', e.target.checked)}
                />
              }
              label="Out-of-Network Provider"
            />
          </Grid>

          {formData.paidDate && (
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Paid Date"
                value={formData.paidDate}
                onChange={(date) => handleFieldChange('paidDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: "Date patient paid their responsibility"
                  },
                }}
              />
            </Grid>
          )}
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}
```

### Phase 4: Family Member Management (Day 4) - TDD Implementation

#### 4.1 Create Family Member Management Page

**Test First:**

```typescript
// __tests__/pages/finance/family-members/index.test.tsx
import { render, screen } from "@testing-library/react";
import FamilyMembers from "../../../pages/finance/family-members/index";
```

**Then Implement:**

```typescript
// pages/finance/family-members/index.tsx
import React, { useState, useEffect } from 'react';
import { GridColDef } from '@mui/x-data-grid';
import {
  Button,
  IconButton,
  Tooltip,
  Chip,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

import FinanceLayout from '../../../layouts/FinanceLayout';
import PageHeader from '../../../components/PageHeader';
import DataGridBase from '../../../components/DataGridBase';
import EmptyState from '../../../components/EmptyState';
import LoadingState from '../../../components/LoadingState';
import ErrorDisplay from '../../../components/ErrorDisplay';
import FormDialog from '../../../components/FormDialog';
import ConfirmDialog from '../../../components/ConfirmDialog';
import SnackbarBaseline from '../../../components/SnackbarBaseline';

import useFamilyMemberFetch from '../../../hooks/useFamilyMemberFetch';
import useFamilyMemberDelete from '../../../hooks/useFamilyMemberDelete';
import { FamilyMember, FamilyRelationship } from '../../../model/FamilyMember';
import { useAuth } from '../../../components/AuthProvider';

export default function FamilyMembers() {
  const [message, setMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const {
    data: familyMembers,
    isSuccess,
    isFetching,
    error,
    refetch,
  } = useFamilyMemberFetch();

  const { mutateAsync: deleteMember } = useFamilyMemberDelete();
  const { isAuthenticated, loading } = useAuth();

  const getRelationshipColor = (relationship: FamilyRelationship) => {
    switch (relationship) {
      case FamilyRelationship.Self: return 'primary';
      case FamilyRelationship.Spouse: return 'secondary';
      case FamilyRelationship.Child: return 'success';
      case FamilyRelationship.Dependent: return 'info';
      case FamilyRelationship.Other: return 'default';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'memberName',
      headerName: 'Name',
      width: 200,
      editable: true,
    },
    {
      field: 'relationship',
      headerName: 'Relationship',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getRelationshipColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'dateOfBirth',
      headerName: 'Date of Birth',
      width: 120,
      type: 'date',
      valueGetter: (params) => params ? new Date(params) : null,
      renderCell: (params) => params.value?.toLocaleDateString('en-US'),
    },
    {
      field: 'insuranceMemberId',
      headerName: 'Insurance ID',
      width: 150,
      editable: true,
    },
    {
      field: 'activeStatus',
      headerName: 'Active',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedMember(params.row);
                setShowModalAdd(true);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedMember(params.row);
                setShowModalDelete(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleDeleteMember = async () => {
    if (selectedMember) {
      try {
        await deleteMember({ oldRow: selectedMember });
        setMessage('Family member deleted successfully.');
        setShowSnackbar(true);
      } catch (error: any) {
        setMessage(`Delete error: ${error.message}`);
        setShowSnackbar(true);
      } finally {
        setShowModalDelete(false);
        setSelectedMember(null);
      }
    }
  };

  if (error) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Family Members"
          subtitle="Manage family members for medical expense tracking"
        />
        <ErrorDisplay
          error={error}
          variant="card"
          showRetry={true}
          onRetry={() => refetch()}
        />
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout>
      <PageHeader
        title="Family Members"
        subtitle="Manage family members for medical expense tracking"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedMember(null);
              setShowModalAdd(true);
            }}
            sx={{ backgroundColor: 'primary.main' }}
          >
            Add Family Member
          </Button>
        }
      />

      {isFetching || loading ? (
        <LoadingState
          variant="card"
          message="Loading family members..."
        />
      ) : (
        <Box display="flex" justifyContent="center">
          <Box sx={{ width: 'fit-content' }}>
            {familyMembers && familyMembers.length > 0 ? (
              <DataGridBase
                rows={familyMembers.filter(row => row != null) || []}
                columns={columns}
                getRowId={(row) => row.familyMemberId}
                pageSizeOptions={[10, 25, 50]}
                checkboxSelection={false}
                rowSelection={false}
              />
            ) : (
              <EmptyState
                title="No Family Members Found"
                message="Add family members to track medical expenses by person."
                dataType="family members"
                variant="create"
                actionLabel="Add Family Member"
                onAction={() => setShowModalAdd(true)}
                onRefresh={() => refetch()}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showModalDelete}
        onClose={() => setShowModalDelete(false)}
        onConfirm={handleDeleteMember}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${selectedMember?.memberName}?`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <SnackbarBaseline
        message={message}
        state={showSnackbar}
        handleSnackbarClose={() => setShowSnackbar(false)}
      />
    </FinanceLayout>
  );
}
```

#### 4.2 Update Navigation for Family Members

```typescript
// Add to financeLinks in components/Layout.tsx
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

// Add after Medical Expenses:
{
  text: "Family Members",
  href: "/finance/family-members",
  icon: <FamilyRestroomIcon />
},
```

### Phase 5: Advanced Features & Integration (Day 5) - TDD Implementation

#### 5.1 Medical Expense Reports and Analytics

**Test First:**

```typescript
// __tests__/pages/finance/medical-expenses/reports.test.tsx
describe("Medical Expense Reports", () => {
  it("should calculate yearly totals correctly", () => {
    // Test yearly total calculations
  });

  it("should display claim status distribution", () => {
    // Test claim status charts
  });
});
```

**Then Implement:**

```typescript
// pages/finance/medical-expenses/reports.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import FinanceLayout from '../../../layouts/FinanceLayout';
import PageHeader from '../../../components/PageHeader';
import LoadingState from '../../../components/LoadingState';
import ErrorDisplay from '../../../components/ErrorDisplay';

import useMedicalExpenseYearlyTotals from '../../../hooks/useMedicalExpenseYearlyTotals';
import useMedicalExpenseClaimStatusCounts from '../../../hooks/useMedicalExpenseClaimStatusCounts';
import { currencyFormat } from '../../../components/Common';

export default function MedicalExpenseReports() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const {
    data: yearlyTotals,
    isLoading: totalsLoading,
    error: totalsError,
  } = useMedicalExpenseYearlyTotals(selectedYear);

  const {
    data: claimStatusCounts,
    isLoading: countsLoading,
    error: countsError,
  } = useMedicalExpenseClaimStatusCounts();

  if (totalsError || countsError) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Medical Expense Reports"
          subtitle="Analytics and insights for your medical expenses"
        />
        <ErrorDisplay
          error={totalsError || countsError}
          variant="card"
          showRetry={true}
        />
      </FinanceLayout>
    );
  }

  if (totalsLoading || countsLoading) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Medical Expense Reports"
          subtitle="Analytics and insights for your medical expenses"
        />
        <LoadingState variant="card" message="Loading reports..." />
      </FinanceLayout>
    );
  }

  // Transform data for charts
  const claimStatusData = Object.entries(claimStatusCounts || {}).map(([status, count]) => ({
    status,
    count,
  }));

  const yearlyData = [
    {
      name: `${selectedYear}`,
      billed: yearlyTotals?.totalBilled || 0,
      insurancePaid: yearlyTotals?.totalInsurancePaid || 0,
      patientResponsibility: yearlyTotals?.totalPatientResponsibility || 0,
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <FinanceLayout>
      <PageHeader
        title="Medical Expense Reports"
        subtitle="Analytics and insights for your medical expenses"
        actions={
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              label="Year"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Billed ({selectedYear})
              </Typography>
              <Typography variant="h4">
                {currencyFormat(yearlyTotals?.totalBilled || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main" gutterBottom>
                Insurance Paid
              </Typography>
              <Typography variant="h4">
                {currencyFormat(yearlyTotals?.totalInsurancePaid || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main" gutterBottom>
                Patient Responsibility
              </Typography>
              <Typography variant="h4">
                {currencyFormat(yearlyTotals?.totalPatientResponsibility || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Yearly Totals Bar Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Yearly Financial Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => currencyFormat(Number(value))} />
                  <Legend />
                  <Bar dataKey="billed" fill="#8884d8" name="Total Billed" />
                  <Bar dataKey="insurancePaid" fill="#82ca9d" name="Insurance Paid" />
                  <Bar dataKey="patientResponsibility" fill="#ffc658" name="Patient Responsibility" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Claim Status Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Claim Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={claimStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {claimStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </FinanceLayout>
  );
}
```

#### 5.2 Integration with Existing Transaction System

Create a connection between medical expenses and existing transactions:

```typescript
// components/TransactionMedicalExpenseLink.tsx
import React from 'react';
import { Button, Chip, Box } from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/router';

interface TransactionMedicalExpenseLinkProps {
  transactionId: number;
  existingMedicalExpense?: any;
  category?: string;
}

export default function TransactionMedicalExpenseLink({
  transactionId,
  existingMedicalExpense,
  category,
}: TransactionMedicalExpenseLinkProps) {
  const router = useRouter();

  // Only show for medical-related categories
  const isMedicalRelated = category?.toLowerCase().includes('medical') ||
    category?.toLowerCase().includes('healthcare') ||
    category?.toLowerCase().includes('doctor') ||
    category?.toLowerCase().includes('pharmacy');

  if (!isMedicalRelated) {
    return null;
  }

  const handleCreateMedicalExpense = () => {
    router.push(`/finance/medical-expenses/create?transactionId=${transactionId}`);
  };

  const handleViewMedicalExpense = () => {
    router.push(`/finance/medical-expenses/${existingMedicalExpense.medicalExpenseId}`);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      {existingMedicalExpense ? (
        <Chip
          icon={<MedicalServicesIcon />}
          label="Medical Expense Linked"
          color="success"
          variant="outlined"
          onClick={handleViewMedicalExpense}
          clickable
        />
      ) : (
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleCreateMedicalExpense}
          variant="outlined"
          color="primary"
        >
          Add Medical Details
        </Button>
      )}
    </Box>
  );
}
```

### Testing Strategy (TDD Foundation)

#### Comprehensive Test Coverage Structure

```typescript
// Jest Configuration Update (jest.config.js)
module.exports = {
  // ... existing config
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  collectCoverageFrom: [
    "pages/finance/medical-expenses/**/*.{ts,tsx}",
    "hooks/useMedical*.{ts,tsx}",
    "hooks/useFamilyMember*.{ts,tsx}",
    "components/*MedicalExpense*.{ts,tsx}",
    "components/*FamilyMember*.{ts,tsx}",
    "model/Medical*.ts",
    "model/FamilyMember.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### Test Categories

**1. Hook Tests (Priority: High)**

- `useMedicalExpenseFetch.test.ts`
- `useMedicalExpenseInsert.test.ts`
- `useMedicalExpenseUpdate.test.ts`
- `useMedicalExpenseDelete.test.ts`
- `useFamilyMemberFetch.test.ts`
- `useFamilyMemberInsert.test.ts`

**2. Component Tests (Priority: High)**

- `MedicalExpenseForm.test.tsx`
- `FamilyMemberForm.test.tsx`
- `TransactionMedicalExpenseLink.test.tsx`

**3. Page Tests (Priority: Medium)**

- `medical-expenses/index.test.tsx`
- `medical-expenses/reports.test.tsx`
- `family-members/index.test.tsx`

**4. Integration Tests (Priority: Medium)**

- API integration tests with mock responses
- Navigation and routing tests
- Form submission and validation tests

**5. E2E Tests (Priority: Low)**

- Complete medical expense workflow
- Family member management workflow
- Report generation workflow

## Implementation Timeline & Milestones

### Day 1: Foundation & Models

- ✅ Medical expense and family member TypeScript models
- ✅ Basic hooks with comprehensive tests
- ✅ Test setup and configuration

### Day 2: Core Medical Expense Page

- ✅ Main medical expenses list page
- ✅ Navigation integration
- ✅ Data grid with sorting, filtering, pagination
- ✅ Delete functionality

### Day 3: Form Components

- ✅ Medical expense create/edit form
- ✅ Form validation and error handling
- ✅ Financial consistency validation
- ✅ Integration with existing transaction system

### Day 4: Family Member Management

- ✅ Family members list page
- ✅ Family member create/edit forms
- ✅ Relationship management
- ✅ Integration with medical expenses

### Day 5: Advanced Features & Polish

- ✅ Medical expense reports and analytics
- ✅ Transaction integration components
- ✅ Performance optimizations
- ✅ Accessibility improvements
- ✅ Final testing and bug fixes

## File Structure Plan

```
pages/finance/
├── medical-expenses/
│   ├── index.tsx              # Main medical expenses list
│   ├── create.tsx             # Create new medical expense
│   ├── [id].tsx              # View/edit medical expense
│   └── reports.tsx           # Analytics and reports
├── family-members/
│   ├── index.tsx              # Family member management
│   └── create.tsx             # Create/edit family member

components/
├── MedicalExpenseForm.tsx     # Medical expense form component
├── FamilyMemberForm.tsx       # Family member form component
├── TransactionMedicalExpenseLink.tsx  # Transaction integration
├── MedicalExpenseStatusChip.tsx       # Status display component
└── ClaimStatusSelect.tsx      # Claim status dropdown

model/
├── MedicalExpense.ts          # Medical expense types
└── FamilyMember.ts           # Family member types

hooks/
├── useMedicalExpenseFetch.ts  # Fetch all medical expenses
├── useMedicalExpenseInsert.ts # Create medical expense
├── useMedicalExpenseUpdate.ts # Update medical expense
├── useMedicalExpenseDelete.ts # Delete medical expense
├── useMedicalExpensesByAccount.ts     # Filter by account
├── useMedicalExpensesByDateRange.ts   # Filter by date range
├── useMedicalExpenseYearlyTotals.ts   # Yearly analytics
├── useMedicalExpenseClaimStatusCounts.ts # Status counts
├── useFamilyMemberFetch.ts    # Fetch family members
├── useFamilyMemberInsert.ts   # Create family member
├── useFamilyMemberUpdate.ts   # Update family member
└── useFamilyMemberDelete.ts   # Delete family member

__tests__/
├── hooks/
│   ├── useMedicalExpenseFetch.test.ts
│   ├── useMedicalExpenseInsert.test.ts
│   └── useFamilyMemberFetch.test.ts
├── components/
│   ├── MedicalExpenseForm.test.tsx
│   └── FamilyMemberForm.test.tsx
├── pages/
│   └── finance/
│       ├── medical-expenses/
│       │   ├── index.test.tsx
│       │   └── reports.test.tsx
│       └── family-members/
│           └── index.test.tsx
└── model/
    ├── MedicalExpense.test.ts
    └── FamilyMember.test.ts
```

## Risk Assessment & Mitigation

### Technical Risks

**Risk 1: API Integration Issues**

- **Probability**: Low (backend is complete and tested)
- **Impact**: Medium
- **Mitigation**: Comprehensive API testing, error handling, fallback states

**Risk 2: Complex Form Validation**

- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**: TDD approach, incremental validation, extensive testing

**Risk 3: State Management Complexity**

- **Probability**: Low (using React Query)
- **Impact**: Low
- **Mitigation**: Leverage existing patterns, React Query for server state

### UX/UI Risks

**Risk 1: User Adoption**

- **Probability**: Low
- **Impact**: High
- **Mitigation**: Follow existing UI patterns, intuitive navigation, clear labeling

**Risk 2: Mobile Responsiveness**

- **Probability**: Low (MUI handles this)
- **Impact**: Medium
- **Mitigation**: Test on multiple devices, use MUI responsive components

### Project Risks

**Risk 1: Timeline Overrun**

- **Probability**: Low (realistic estimates)
- **Impact**: Low
- **Mitigation**: TDD approach prevents major rework, incremental delivery

## Success Criteria

### Functional Requirements ✅

- [ ] Users can create, view, edit, and delete medical expenses
- [ ] Medical expenses are properly linked to existing transactions
- [ ] Family members can be managed and linked to medical expenses
- [ ] Financial calculations are accurate and validated
- [ ] Claim status can be tracked and updated
- [ ] Reports provide insights into medical spending

### Technical Requirements ✅

- [ ] Comprehensive test coverage (>80%)
- [ ] Follows existing application patterns and conventions
- [ ] Responsive design works on all screen sizes
- [ ] Accessible according to WCAG guidelines
- [ ] Performance meets existing application standards

### UX Requirements ✅

- [ ] Intuitive navigation integrated with existing finance app
- [ ] Clear visual hierarchy and information architecture
- [ ] Consistent with existing finance application theming
- [ ] Error messages are helpful and actionable
- [ ] Loading states provide appropriate feedback

## Conclusion

This comprehensive plan leverages the completed backend Phase 2 medical expense system to create a seamless, user-friendly medical expense management interface. The Test-Driven Development approach ensures high quality, maintainable code that integrates naturally with the existing NextJS finance application.

The 5-day implementation timeline is realistic and accounts for comprehensive testing at each phase. The plan prioritizes core functionality first (medical expense CRUD, navigation integration) before moving to advanced features (reports, analytics, transaction integration).

By following existing application patterns for components, theming, navigation, and data management, the medical expense UI will feel like a natural extension of the finance application rather than a separate module. The emphasis on TDD ensures that the implementation will be robust, well-tested, and maintainable.

**Next Steps:**

1. Begin Phase 1 implementation following TDD methodology
2. Set up test infrastructure and basic model tests
3. Implement hooks with comprehensive test coverage
4. Build core UI components with corresponding tests
5. Integrate with navigation and existing application patterns

The backend API Phase 2 completion provides a solid foundation for this UI implementation, making this a low-risk, high-value addition to the finance application.

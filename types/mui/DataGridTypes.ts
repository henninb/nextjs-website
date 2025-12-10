/**
 * MUI DataGrid Type Wrappers
 *
 * This module provides properly typed wrappers for MUI DataGrid components
 * to replace 'any' types in DataGrid column definitions and callbacks.
 */

import {
  GridRenderCellParams,
  GridValidRowModel,
  GridColDef as MuiGridColDef,
  GridRowId,
  GridCallbackDetails,
  GridRowSelectionModel,
  GridPaginationModel,
} from '@mui/x-data-grid';
import * as React from 'react';

/**
 * Typed render cell params for DataGrid columns
 * Use this instead of 'params: any' in renderCell callbacks
 *
 * @example
 * ```typescript
 * {
 *   field: 'amount',
 *   renderCell: (params: TypedRenderCellParams<Transaction>) =>
 *     currencyFormat(params.value)
 * }
 * ```
 */
export type TypedRenderCellParams<T extends GridValidRowModel> =
  GridRenderCellParams<T>;

/**
 * Extended column definition with proper typing
 * Use this instead of 'columns: any[]' in DataGrid components
 *
 * @example
 * ```typescript
 * const columns: TypedGridColDef<Transaction>[] = [
 *   {
 *     field: 'amount',
 *     headerName: 'Amount',
 *     renderCell: (params) => currencyFormat(params.value)
 *   }
 * ];
 * ```
 */
export type TypedGridColDef<T extends GridValidRowModel> = Omit<
  MuiGridColDef,
  'renderCell'
> & {
  renderCell?: (params: TypedRenderCellParams<T>) => React.ReactNode;
};

/**
 * Re-export commonly used MUI DataGrid types for convenience
 */
export type {
  GridRowId,
  GridCallbackDetails,
  GridRowSelectionModel,
  GridPaginationModel,
  GridValidRowModel,
};

/**
 * Type for row selection change callback
 */
export type RowSelectionChangeHandler = (
  model: GridRowSelectionModel,
  details?: GridCallbackDetails
) => void;

/**
 * Type for pagination change callback
 */
export type PaginationChangeHandler = (model: GridPaginationModel) => void;

/**
 * Type for row update callback
 */
export type ProcessRowUpdateHandler<T extends GridValidRowModel> = (
  newRow: T,
  oldRow: T
) => Promise<T> | T;

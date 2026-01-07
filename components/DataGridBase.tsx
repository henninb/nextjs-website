import * as React from "react";
import {
  DataGrid,
  GridPaginationModel,
  GridValidRowModel,
  GridRowSelectionModel as V8GridRowSelectionModel,
  GridRowId,
  GridColDef,
  GridCallbackDetails,
} from "@mui/x-data-grid";
import { SxProps, Theme } from "@mui/material";

type DataGridBaseProps<R extends GridValidRowModel> = {
  rows: R[];
  columns: GridColDef[];
  getRowId?: (row: R) => string | number;
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  pageSizeOptions?: number[];
  autoHeight?: boolean;
  checkboxSelection?: boolean;
  rowSelection?: boolean;
  rowSelectionModel?: Array<string | number>;
  onRowSelectionModelChange?: (
    model: Array<string | number>,
    details?: GridCallbackDetails,
  ) => void;
  keepNonExistentRowsSelected?: boolean;
  processRowUpdate?: (newRow: R, oldRow: R) => Promise<R> | R;
  disableColumnResize?: boolean;
  disableRowSelectionOnClick?: boolean;
  sx?: SxProps<Theme>;
  // Additional MUI DataGrid props
  hideFooter?: boolean;
  disableColumnFilter?: boolean;
  disableColumnMenu?: boolean;
  disableVirtualization?: boolean;
  paginationMode?: "client" | "server";
  rowCount?: number;
};

export default function DataGridBase<R extends GridValidRowModel>({
  rows,
  columns,
  getRowId,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions = [25, 50, 100],
  autoHeight = true,
  checkboxSelection = false,
  rowSelection = false,
  rowSelectionModel,
  onRowSelectionModelChange,
  keepNonExistentRowsSelected = false,
  processRowUpdate,
  disableColumnResize,
  disableRowSelectionOnClick,
  sx,
  ...rest
}: DataGridBaseProps<R>) {
  const defaultModel: GridPaginationModel = paginationModel ?? {
    page: 0,
    pageSize: 50,
  };

  // Normalize legacy array-based selection model to the v8 object shape
  const normalizedRowSelectionModel: V8GridRowSelectionModel | undefined =
    rowSelectionModel && rowSelectionModel.length > 0
      ? {
          type: "include",
          ids: new Set(rowSelectionModel as GridRowId[]),
        }
      : rowSelectionModel
        ? { type: "include", ids: new Set<GridRowId>() }
        : undefined;

  // Wrap change handler to present legacy array to consumers while accepting v8 object from DataGrid
  const handleRowSelectionModelChange = (
    model: V8GridRowSelectionModel,
    details?: GridCallbackDetails,
  ) => {
    const idsArray = Array.from(model.ids) as Array<string | number>;
    onRowSelectionModelChange?.(idsArray, details);
  };
  return (
    <DataGrid
      rows={rows}
      columns={columns}
      getRowId={getRowId}
      checkboxSelection={checkboxSelection}
      rowSelection={rowSelection}
      rowSelectionModel={normalizedRowSelectionModel}
      onRowSelectionModelChange={handleRowSelectionModelChange}
      keepNonExistentRowsSelected={keepNonExistentRowsSelected}
      pagination
      paginationModel={defaultModel}
      onPaginationModelChange={onPaginationModelChange}
      pageSizeOptions={pageSizeOptions}
      autoHeight={autoHeight}
      disableColumnResize={disableColumnResize}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      density="compact"
      processRowUpdate={processRowUpdate as any}
      sx={sx}
      {...rest}
    />
  );
}

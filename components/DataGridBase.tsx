import * as React from "react";
import {
  DataGrid,
  GridPaginationModel,
  GridValidRowModel,
} from "@mui/x-data-grid";

type DataGridBaseProps<R extends GridValidRowModel> = {
  rows: R[];
  columns: any[];
  getRowId?: (row: R) => string | number;
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  pageSizeOptions?: number[];
  autoHeight?: boolean;
  checkboxSelection?: boolean;
  rowSelection?: boolean;
  rowSelectionModel?: Array<string | number>;
  onRowSelectionModelChange?: (model: any, details?: any) => void;
  keepNonExistentRowsSelected?: boolean;
  processRowUpdate?: (newRow: R, oldRow: R) => Promise<R> | R;
  disableColumnResize?: boolean;
  disableRowSelectionOnClick?: boolean;
  sx?: any;
  // Allow passing any additional MUI DataGrid props used by callers
  [key: string]: any;
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
  return (
    <DataGrid
      rows={rows}
      columns={columns}
      getRowId={getRowId}
      checkboxSelection={checkboxSelection}
      rowSelection={rowSelection}
      rowSelectionModel={rowSelectionModel}
      onRowSelectionModelChange={onRowSelectionModelChange}
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

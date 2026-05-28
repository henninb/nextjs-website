import React from "react";
import { GridColDef, GridRenderCellParams, GridValidRowModel } from "@mui/x-data-grid";
import { IconButton, Link, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export function createAccountLinkColumn(
  field: string,
  headerName: string,
  flex = 2,
  minWidth = 200,
): GridColDef {
  return {
    field,
    headerName,
    flex,
    minWidth,
    renderCell: (params) => (
      <Link href={`/finance/transactions/${params.value}`}>
        {params.value}
      </Link>
    ),
  };
}

export function createDeleteColumn<T extends GridValidRowModel>(
  onDelete: (row: T) => void,
): GridColDef {
  return {
    field: "",
    headerName: "Actions",
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<T>) => (
      <Tooltip title="Delete this row">
        <IconButton
          aria-label="Delete this row"
          onClick={() => onDelete(params.row as T)}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    ),
  };
}

import React, { useState } from "react";

export function useRowSelection<T>(
  rows: T[] | undefined,
  getRowId: (row: T) => string | number,
) {
  const [rowSelection, setRowSelection] = useState<Array<string | number>>([]);

  const isRowSelected = (rowId: string | number) =>
    rowSelection.includes(rowId);

  const handleRowToggle = (rowId: string | number) => {
    setRowSelection((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId],
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setRowSelection(rows?.map((row) => getRowId(row)) || []);
    } else {
      setRowSelection([]);
    }
  };

  const clearSelection = () => setRowSelection([]);

  const isAllSelected =
    (rows?.length || 0) > 0 && rowSelection.length === (rows?.length || 0);

  const isIndeterminate =
    rowSelection.length > 0 && rowSelection.length < (rows?.length || 0);

  const selectedIds = rowSelection;

  return {
    rowSelection,
    isRowSelected,
    handleRowToggle,
    handleSelectAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
    selectedIds,
  };
}

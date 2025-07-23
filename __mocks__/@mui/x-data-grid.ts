import React from 'react';

export const DataGrid = ({ children, rows, columns, ...otherProps }: any) => {
  // Only pass through safe DOM props
  const domProps = { 'data-testid': 'data-grid' };
  return React.createElement('div', domProps, children);
};

export const GridColDef = {};
export const GridRowSelectionModel = {};
export const GridRowId = {};
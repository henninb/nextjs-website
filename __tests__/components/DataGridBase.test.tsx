import React from "react";
import { render } from "@testing-library/react";

// Capture props passed to the mocked DataGrid
let lastDataGridProps: any = null;

// Mock @mui/x-data-grid specifically for this test to simulate v8 API
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: (props: any) => {
    lastDataGridProps = props;
    // Simulate DataGrid emitting a v8-style selection model change
    if (props.onRowSelectionModelChange) {
      props.onRowSelectionModelChange({
        type: "include",
        ids: new Set(["id-1", "id-2"]),
      });
    }
    return <div data-testid="mock-grid" />;
  },
}));

describe("DataGridBase selection model compat", () => {
  it("normalizes v8 selection model to legacy array and passes normalized model into DataGrid", async () => {
    const onChange = jest.fn();

    // Import after the mock is set up
    const DataGridBase = (await import("../../components/DataGridBase"))
      .default as any;

    const rows = [
      { id: "id-1", name: "Row 1" },
      { id: "id-2", name: "Row 2" },
    ];
    const columns = [{ field: "name", headerName: "Name" }];

    render(
      <DataGridBase
        rows={rows}
        columns={columns}
        checkboxSelection={true}
        rowSelection={true}
        rowSelectionModel={["id-1"]}
        onRowSelectionModelChange={onChange}
      />,
    );

    // Assert our consumer callback received a legacy array
    expect(onChange).toHaveBeenCalledWith(["id-1", "id-2"], undefined);

    // Assert the DataGrid received a v8-shaped selection model object
    expect(lastDataGridProps.rowSelectionModel).toEqual({
      type: "include",
      ids: new Set(["id-1"]),
    });
  });
});

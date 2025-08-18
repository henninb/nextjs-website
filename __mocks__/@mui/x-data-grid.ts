import React from "react";

export const DataGrid = ({ children, rows, columns, ...otherProps }: any) => {
  // Only pass through safe DOM props
  const domProps = { "data-testid": "data-grid" };

  // Render the rows data for testing purposes
  const renderedRows =
    rows?.map((row: any, index: number) => {
      return React.createElement(
        "div",
        { key: index, "data-testid": `data-grid-row-${index}` },
        [
          // Add checkbox for row selection (for tests that expect checkboxes)
          React.createElement("input", {
            key: "checkbox",
            type: "checkbox",
            role: "checkbox",
            "data-testid": `row-checkbox-${index}`,
          }),

          // Render key fields that tests might look for
          row.accountNameOwner &&
            React.createElement(
              // Only render as link if it's not a transaction row (transactions don't need account links in this context)
              row.transactionId ? "span" : "a",
              row.transactionId
                ? { key: "accountNameOwner" }
                : {
                    key: "accountNameOwner",
                    href: `/finance/transactions/${row.accountNameOwner}`,
                    role: "link",
                  },
              row.accountNameOwner,
            ),
          row.transactionDate &&
            React.createElement(
              "span",
              { key: "transactionDate" },
              row.transactionDate instanceof Date
                ? row.transactionDate.toLocaleDateString("en-US")
                : new Date(row.transactionDate).toLocaleDateString("en-US"),
            ),
          row.categoryName &&
            React.createElement(
              "span",
              { key: "categoryName" },
              row.categoryName,
            ),
          row.description &&
            React.createElement(
              "span",
              { key: "description" },
              row.description,
            ),
          row.amount !== undefined &&
            React.createElement(
              "span",
              { key: "amount" },
              typeof row.amount === "number"
                ? `${row.amount < 0 ? "-" : ""}$${Math.abs(row.amount).toFixed(2)}`
                : row.amount,
            ),
          row.accountType &&
            React.createElement(
              "span",
              { key: "accountType" },
              row.accountType,
            ),
          row.moniker &&
            React.createElement("span", { key: "moniker" }, row.moniker),
          row.future !== undefined &&
            React.createElement(
              "span",
              { key: "future" },
              `$${(row.future || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ),
          row.outstanding !== undefined &&
            React.createElement(
              "span",
              { key: "outstanding" },
              `$${(row.outstanding || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ),
          row.cleared !== undefined &&
            React.createElement(
              "span",
              { key: "cleared" },
              `$${(row.cleared || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ),
          row.validationDate &&
            React.createElement(
              "span",
              { key: "validationDate" },
              new Date(row.validationDate).toLocaleString("en-US"),
            ),
          row.transactionType &&
            React.createElement(
              "span",
              { key: "transactionType" },
              row.transactionType,
            ),
          row.reoccurringType &&
            React.createElement(
              "span",
              { key: "reoccurringType" },
              row.reoccurringType,
            ),
          row.notes && React.createElement("span", { key: "notes" }, row.notes),

          // Add action buttons for transaction rows (tests expect these icons)
          row.transactionId && [
            React.createElement("div", {
              key: "ContentCopyIcon",
              "data-testid": "ContentCopyIcon",
              role: "button",
            }),
            React.createElement("div", {
              key: "SwapVertIcon",
              "data-testid": "SwapVertIcon",
              role: "button",
            }),
            React.createElement("div", {
              key: "DeleteRoundedIcon",
              "data-testid": "DeleteRoundedIcon",
              role: "button",
            }),
            React.createElement("div", {
              key: "CheckCircleIcon",
              "data-testid": "CheckCircleIcon",
              role: "button",
            }),
          ],

          // Add delete button for other types of rows (categories, payments, transfers)
          !row.transactionId &&
            (row.categoryId || row.paymentId || row.transferId) &&
            React.createElement("div", {
              key: "DeleteIcon",
              "data-testid": "DeleteIcon",
              role: "button",
              "aria-label": "delete",
            }),

          // Add check and delete buttons for pending transactions (import rows)
          row.notes === "imported" && [
            React.createElement("div", {
              key: "CheckIcon",
              "data-testid": "CheckIcon",
              role: "button",
            }),
            React.createElement("div", {
              key: "DeleteIcon",
              "data-testid": "DeleteIcon",
              role: "button",
            }),
          ],

          // Add more fields as needed for testing
        ]
          .flat()
          .filter(Boolean),
      );
    }) || [];

  return React.createElement(
    "div",
    domProps,
    [children, ...renderedRows].filter(Boolean),
  );
};

export const GridColDef = {};
export const GridRowSelectionModel = {};
export const GridRowId = {};

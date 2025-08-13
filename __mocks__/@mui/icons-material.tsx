import React from "react";

// Mock all MUI icons as simple div elements with data-testid
const createMockIcon = (name: string) => {
  return React.forwardRef<HTMLDivElement, any>((props, ref) =>
    React.createElement("div", {
      ...props,
      ref,
      "data-testid": name,
      role: "button",
    }),
  );
};

export const AddRoundedIcon = createMockIcon("AddRoundedIcon");
export const CheckCircleIcon = createMockIcon("CheckCircleIcon");
export const PendingIcon = createMockIcon("PendingIcon");
export const ScheduleIcon = createMockIcon("ScheduleIcon");
export const ContentCopyIcon = createMockIcon("ContentCopyIcon");
export const SwapVertIcon = createMockIcon("SwapVertIcon");
export const DeleteRoundedIcon = createMockIcon("DeleteRoundedIcon");
export const DeleteIcon = createMockIcon("DeleteIcon");
export const CheckIcon = createMockIcon("CheckIcon");
export const EditIcon = createMockIcon("EditIcon");
export const SaveIcon = createMockIcon("SaveIcon");
export const CancelIcon = createMockIcon("CancelIcon");
export const ErrorOutline = createMockIcon("ErrorOutline");
export const Refresh = createMockIcon("Refresh");

// Default export for any icon not explicitly mocked
export default createMockIcon("DefaultIcon");

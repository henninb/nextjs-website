export type ModalEntity =
  | "transfer"
  | "payment"
  | "transaction"
  | "parameter"
  | "category"
  | "description"
  | "account";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const modalTitles = {
  // Keep titles concise and consistent; details go in bodies
  confirmDeletion: "Confirm Deletion",
  confirmClone: "Confirm Clone",
  confirmMove: "Confirm Move",
  addNew: (entity: ModalEntity) => `Add New ${capitalize(entity)}`,
};

export const modalBodies = {
  // Human-friendly, action-focused messaging explaining consequences
  confirmDeletion: (entity: ModalEntity, display: string | number) =>
    `This will permanently delete the ${entity} "${display}". This action cannot be undone. Do you want to proceed?`,
  confirmClone: (entity: ModalEntity, display: string | number) =>
    `A new copy of the ${entity} "${display}" will be created. You can review and edit it after it is created. Continue?`,
  confirmMove: (entity: ModalEntity, display: string | number) =>
    `Move the ${entity} "${display}" to a different account. Select the destination and click Save to update its account and totals.`,
};

export const modalButtons = {
  primary: {
    delete: "Delete",
    clone: "Clone",
    save: "Save",
    add: "Add",
  },
  secondary: {
    cancel: "Cancel",
  },
};

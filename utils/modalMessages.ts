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
  confirmDeletion: "Confirm Deletion",
  confirmClone: "Confirm Clone",
  confirmMove: "Confirm Move",
  addNew: (entity: ModalEntity) => `Add New ${capitalize(entity)}`,
};

export const modalBodies = {
  confirmDeletion: (entity: ModalEntity, display: string | number) =>
    `Are you sure you want to delete the ${entity} "${display}"?`,
  confirmClone: (entity: ModalEntity, display: string | number) =>
    `Are you sure you want to clone the ${entity} "${display}"?`,
  confirmMove: (entity: ModalEntity, display: string | number) =>
    `Are you sure you want to move the ${entity} "${display}"?`,
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

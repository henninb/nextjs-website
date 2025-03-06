import ValidationAmount from "../model/ValidationAmount";

  export const dummyValidationAmount: ValidationAmount = {
    validationId: Math.random(),
    validationDate: new Date(),
    accountId: 1,
    amount: 0.0,
    transactionState: "undefined",
    activeStatus: false,
  }
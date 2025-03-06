// Parameters (normalized)
import Parameter from "../model/Parameter";

export const dummyParameters: Parameter[] = [
  {
    parameterId: Math.random(),
    parameterName: "payment_account",
    parameterValue: "chase_brian",
    activeStatus: true,
  },
  {
    parameterId: Math.random(),
    parameterName: "default_currency",
    parameterValue: "USD",
    activeStatus: true,
  },
];
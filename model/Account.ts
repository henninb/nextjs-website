import { AccountType } from "./AccountType";

export default interface Account {
  accountId?: number;
  owner?: string;
  accountNameOwner: string;
  accountType: AccountType;
  activeStatus: boolean;
  moniker: string;
  outstanding: number;
  future: number;
  cleared: number;
  dateClosed?: Date;
  validationDate?: Date;
  dateAdded?: Date;
  dateUpdated?: Date;
  billingStatementCloseDay?: number;
  billingGracePeriodDays?: number;
  billingDueDaySameMonth?: number;
  billingDueDayNextMonth?: number;
  billingCycleWeekendShift?: string;
}

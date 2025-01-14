import { AccountType } from "./AccountType";

export default interface Account {
  accountId?: number;
  accountNameOwner: string;
  accountType: AccountType;
  activeStatus: boolean;
  moniker: string;
  outstanding: number;
  future: number;
  cleared: number;
  dateClosed?: Date;
  dateAdded?: Date;
  dateUpdated?: Date;
}

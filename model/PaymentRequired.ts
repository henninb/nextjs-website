export default interface PaymentRequired {
    accountNameOwner: string;
    accountType: string;
    moniker: string;
    future: number;
    outstanding: number;
    cleared: number;
  }
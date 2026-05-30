export default interface BonusProgress {
  accountNameOwner: string;
  spent: number;
  spentPending: number;
  target: number;
  remaining: number;
  percentComplete: number;
  bonusAmount: number;
  bonusEarned: boolean;
  windowStartDate: string;
  windowEndDate: string;
  daysRemaining: number;
}

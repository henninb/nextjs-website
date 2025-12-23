// Transaction category metadata for tracking categorization source and confidence
export type CategorizationSource = "ai" | "rule-based" | "manual";

export default interface TransactionCategoryMetadata {
  source: CategorizationSource;
  confidence?: number; // 0-1, only for AI
  aiModel?: string; // e.g., "sonar-pro"
  timestamp: Date;
  fallbackReason?: string; // Why AI failed (if applicable)
  similarTransactionsUsed?: number; // How many examples provided to AI
}

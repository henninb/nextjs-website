// AI-powered transaction categorization with intelligent fallback
import TransactionCategoryMetadata from "../../model/TransactionCategoryMetadata";
import Transaction from "../../model/Transaction";
import { getCategoryFromDescription } from "../categoryMapping";
import { createHookLogger } from "../logger";

const log = createHookLogger("AI Categorization");

const TIMEOUT_MS = 5000;
const SIMILAR_TRANSACTIONS_LIMIT = 5;

export interface CategorizationResult {
  category: string;
  metadata: TransactionCategoryMetadata;
}

export interface SimilarTransaction {
  description: string;
  amount: number;
  category: string;
}

/**
 * Main entry point for AI-powered categorization with fallback
 */
export async function getCategoryWithAI(
  description: string,
  amount: number,
  availableCategories: string[],
  accountNameOwner: string,
): Promise<CategorizationResult> {
  try {
    // Fetch similar transactions for context
    const similarTransactions = await fetchSimilarTransactions(
      description,
      accountNameOwner,
    );

    // Call our API endpoint for categorization
    const response = await fetch("/api/categorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description,
        amount,
        availableCategories,
        accountNameOwner,
        similarTransactions,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.metadata) {
      log.info("Categorization successful", {
        description,
        category: result.category,
        source: result.metadata.source,
      });

      return {
        category: result.category,
        metadata: result.metadata,
      };
    } else {
      throw new Error(result.error || "API returned unsuccessful result");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.warn("AI categorization failed, falling back to rule-based", {
      error: errorMessage,
    });
    return fallbackToRuleBased(description, errorMessage);
  }
}

/**
 * Fetch similar transactions for context
 * Note: This is a client-side implementation. In production, you'd call an API endpoint
 */
async function fetchSimilarTransactions(
  description: string,
  accountNameOwner: string,
): Promise<SimilarTransaction[]> {
  try {
    // For now, return empty array - this will be implemented when integrated
    // In production, this would call an API endpoint that searches transactions
    // GET /api/transactions/${accountNameOwner}?search=${description}&limit=${SIMILAR_TRANSACTIONS_LIMIT}
    return [];
  } catch (error) {
    log.warn("Failed to fetch similar transactions", { error });
    return [];
  }
}


/**
 * Build the AI prompt for categorization
 */
function buildPrompt(
  description: string,
  amount: number,
  categories: string[],
  examples: SimilarTransaction[],
): string {
  const categoriesStr = categories.join(", ");
  const amountStr = Math.abs(amount).toFixed(2);

  let prompt = `You are a financial transaction categorization expert. Based on the transaction description and amount, suggest the most appropriate category.

Available Categories: ${categoriesStr}

Transaction:
- Description: "${description}"
- Amount: $${amountStr}
`;

  if (examples.length > 0) {
    prompt += `\nSimilar Past Transactions (for context):\n`;
    examples.forEach((ex, i) => {
      prompt += `${i + 1}. "${ex.description}" ($${Math.abs(ex.amount).toFixed(2)}) → ${ex.category}\n`;
    });
  }

  prompt += `\nINSTRUCTIONS:
1. Analyze the transaction description carefully
2. Consider the amount and similar past categorizations
3. Respond with EXACTLY ONE category name from the available list
4. If completely uncertain, respond with "imported"
5. DO NOT include explanations, just the category name

CATEGORY:`;

  return prompt;
}

/**
 * Parse AI response to extract category
 */
export function parseAIResponse(response: string): string {
  // Clean up the response - remove whitespace, quotes, etc.
  let category = response.trim().toLowerCase();

  // Remove common response artifacts
  category = category.replace(/^["']|["']$/g, ""); // Remove quotes
  category = category.replace(/\.$/, ""); // Remove trailing period
  category = category.split("\n")[0]; // Take first line only
  category = category.split(" ")[0]; // Take first word if multiple words

  return category;
}

/**
 * Validate that the category is in the available list
 */
export function validateCategory(
  category: string,
  availableCategories: string[],
): boolean {
  const normalizedCategory = category.toLowerCase().trim();
  const normalizedAvailable = availableCategories.map((c) =>
    c.toLowerCase().trim(),
  );

  return normalizedAvailable.includes(normalizedCategory);
}

/**
 * Fallback to rule-based categorization
 */
function fallbackToRuleBased(
  description: string,
  fallbackReason: string,
): CategorizationResult {
  const category = getCategoryFromDescription(description);

  log.info("Using rule-based categorization", {
    description,
    category,
    fallbackReason,
  });

  return {
    category,
    metadata: {
      source: "rule-based",
      timestamp: new Date(),
      fallbackReason,
    },
  };
}

/**
 * Helper to create manual categorization metadata
 */
export function createManualMetadata(): TransactionCategoryMetadata {
  return {
    source: "manual",
    timestamp: new Date(),
  };
}

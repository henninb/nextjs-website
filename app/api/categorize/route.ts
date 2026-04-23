// Server-side transaction categorization API endpoint
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  parseAIResponse,
  validateCategory,
} from "../../../utils/ai/categorization";
import { getCategoryFromDescription } from "../../../utils/categoryMapping";
import TransactionCategoryMetadata from "../../../model/TransactionCategoryMetadata";
import { isSessionValid } from "../../../utils/security/edgeAuth";

// nodejs runtime keeps the Map alive across warm invocations on the same instance.
// For multi-region or multi-instance deployments, replace ipCounters with a
// distributed store (e.g. @upstash/ratelimit + Redis) to enforce limits globally.
export const runtime = "nodejs";

// Inbound rate limiter: 20 requests per IP per 60-second window
const ipCounters = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounters.get(ip);
  if (!entry || now > entry.resetAt) {
    ipCounters.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Resolve the real client IP. On Cloudflare, cf-connecting-ip is set by
// infrastructure and cannot be spoofed by clients. x-forwarded-for is the
// next best option but is user-controllable behind untrusted proxies — only
// the first (leftmost) address is taken to avoid IP appending attacks.
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

// Request validation schema
const CategorizationRequestSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number(),
  availableCategories: z.array(z.string()).min(1),
  accountNameOwner: z.string().optional(),
  similarTransactions: z
    .array(
      z.object({
        description: z.string(),
        amount: z.number(),
        category: z.string(),
      }),
    )
    .optional(),
});

interface CategorizationResponse {
  category: string;
  metadata: TransactionCategoryMetadata;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isSessionValid(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = CategorizationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { description, amount, availableCategories, similarTransactions } =
      validationResult.data;

    // Check if Perplexity API key is configured
    const apiKey = process.env.PERPLEXITY_API_KEY;
    const isApiConfigured = apiKey && apiKey !== "your-perplexity-api-key-here";

    console.log("[AI Categorization] API key check:", {
      hasKey: !!apiKey,
      isConfigured: isApiConfigured,
    });

    if (isApiConfigured) {
      try {
        // Build the prompt
        const prompt = buildPrompt(
          description,
          amount,
          availableCategories,
          similarTransactions || [],
        );

        // Retry logic with exponential backoff for rate limiting
        let attempt = 0;
        const maxRetries = 3;
        let lastError: string | null = null;

        while (attempt < maxRetries) {
          try {
            // Call Perplexity API
            const response = await fetch(
              "https://api.perplexity.ai/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "sonar-pro",
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are a financial categorization expert. Respond with only the category name.",
                    },
                    {
                      role: "user",
                      content: prompt,
                    },
                  ],
                  temperature: 0.2,
                  max_tokens: 50,
                }),
              },
            );

            // Handle rate limiting (429)
            if (response.status === 429) {
              attempt++;
              if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.warn(
                  `[AI Categorization] Rate limited (429), retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`,
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
              } else {
                console.error(
                  "[AI Categorization] Rate limited after max retries, falling back to rule-based",
                );
                break;
              }
            }

            if (response.ok) {
              const data = await response.json();
              const aiCategory = parseAIResponse(
                data.choices[0]?.message?.content || "",
              );

              if (validateCategory(aiCategory, availableCategories)) {
                const result: CategorizationResponse = {
                  category: aiCategory,
                  metadata: {
                    source: "ai",
                    aiModel: "sonar-pro",
                    timestamp: new Date(),
                    similarTransactionsUsed: similarTransactions?.length || 0,
                  },
                  success: true,
                };

                console.log("[AI Categorization] Success:", {
                  description,
                  category: aiCategory,
                });
                return NextResponse.json(result, { status: 200 });
              } else {
                console.warn(
                  "[AI Categorization] Invalid category returned:",
                  aiCategory,
                );
                break;
              }
            } else {
              const errorText = await response.text();
              console.error("[AI Categorization] API error:", {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: errorText.substring(0, 500),
              });
              lastError = `API error: ${response.status}`;
              break;
            }
          } catch (fetchError) {
            lastError =
              fetchError instanceof Error
                ? fetchError.message
                : String(fetchError);
            console.error("[AI Categorization] Fetch exception:", fetchError);
            break;
          }
        }
      } catch (error) {
        console.error("[AI Categorization] Exception:", error);
        // Fall through to rule-based categorization
      }
    } else {
      console.log(
        "[AI Categorization] Perplexity API key not configured, using rule-based categorization",
      );
    }

    // Fallback to rule-based categorization
    const category = getCategoryFromDescription(description);

    const fallbackReason = !isApiConfigured
      ? "Perplexity API key not configured - using rule-based system"
      : "AI categorization failed or returned invalid category - using rule-based fallback";

    const result: CategorizationResponse = {
      category,
      metadata: {
        source: "rule-based",
        timestamp: new Date(),
        fallbackReason,
      },
      success: true,
    };

    console.log("[AI Categorization] Using fallback:", {
      description,
      category,
      reason: fallbackReason,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Categorization error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

// Helper function to build prompt (imported from utils but redefined here for edge runtime compatibility)
function buildPrompt(
  description: string,
  amount: number,
  categories: string[],
  examples: Array<{ description: string; amount: number; category: string }>,
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

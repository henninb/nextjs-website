# LLM Finance Database Integration Plan

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   Next.js       │     │   Spring Boot        │     │  PostgreSQL │
│   Chat UI       │────▶│   (Kotlin)           │────▶│  Finance DB │
│                 │     │                      │     │             │
│ - User question │     │ - AuthZ              │     │ - llm_ro    │
│ - Auth context  │     │ - Tool selection     │     │ - Views     │
│                 │     │ - Function execution │     │ - RLS       │
└─────────────────┘     └──────────────────────┘     └─────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │  Perplexity API  │
                        │  (Tool Selection │
                        │   & Responses)   │
                        └──────────────────┘
```

## 1. PostgreSQL Security Layer

### 1.1 Create Read-Only Role

```sql
-- Create the read-only role for LLM access
CREATE ROLE llm_ro WITH LOGIN PASSWORD 'secure_password' NOINHERIT;

-- Revoke all by default
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM llm_ro;
REVOKE ALL ON SCHEMA public FROM llm_ro;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO llm_ro;
```

### 1.2 Create Views (Not Direct Table Access)

The LLM should never access tables directly. Create views that expose only necessary data:

```sql
-- Transaction view with joined data
CREATE VIEW v_transactions AS
SELECT
    t.transaction_id,
    t.transaction_date,
    t.description,
    t.amount,
    a.account_name,
    c.category_name
FROM transaction t
JOIN account a ON t.account_id = a.account_id
JOIN category c ON t.category_id = c.category_id;

-- Monthly aggregation view
CREATE VIEW v_monthly_summary AS
SELECT
    DATE_TRUNC('month', transaction_date) AS month,
    category_name,
    SUM(amount) AS total,
    COUNT(*) AS transaction_count
FROM v_transactions
GROUP BY 1, 2;

-- Account balances view
CREATE VIEW v_account_balances AS
SELECT
    account_name,
    account_type,
    SUM(amount) AS balance
FROM v_transactions
GROUP BY 1, 2;

-- Category spending view
CREATE VIEW v_category_spending AS
SELECT
    category_name,
    DATE_TRUNC('month', transaction_date) AS month,
    SUM(amount) AS total_spent,
    AVG(amount) AS avg_transaction,
    COUNT(*) AS transaction_count
FROM v_transactions
GROUP BY 1, 2;

-- Grant SELECT only on views
GRANT SELECT ON v_transactions TO llm_ro;
GRANT SELECT ON v_monthly_summary TO llm_ro;
GRANT SELECT ON v_account_balances TO llm_ro;
GRANT SELECT ON v_category_spending TO llm_ro;
```

### 1.3 Row-Level Security (Multi-Tenant)

For multi-user scenarios where each user should only see their own data:

```sql
-- Ensure tables have owner_id column
ALTER TABLE transaction ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE account ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Enable RLS on base tables
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE account ENABLE ROW LEVEL SECURITY;

-- Create isolation policies
CREATE POLICY tenant_isolation_transaction ON transaction
    FOR SELECT
    USING (owner_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY tenant_isolation_account ON account
    FOR SELECT
    USING (owner_id = current_setting('app.current_user_id')::UUID);

-- Force RLS even for table owners (important!)
ALTER TABLE transaction FORCE ROW LEVEL SECURITY;
ALTER TABLE account FORCE ROW LEVEL SECURITY;
```

## 2. Spring Boot (Kotlin) Backend

### 2.1 Tool Definitions

Define a sealed class of allowed operations:

```kotlin
package com.example.finance.llm

import java.time.LocalDate

sealed class FinanceTool {
    data class GetTransactions(
        val startDate: LocalDate? = null,
        val endDate: LocalDate? = null,
        val category: String? = null,
        val accountName: String? = null,
        val limit: Int = 100
    ) : FinanceTool()

    data class GetMonthlySummary(
        val months: Int = 12,
        val category: String? = null
    ) : FinanceTool()

    data class GetAccountBalances(
        val accountType: String? = null
    ) : FinanceTool()

    data class GetCategorySpending(
        val months: Int = 12
    ) : FinanceTool()

    data class SearchTransactions(
        val searchTerm: String,
        val limit: Int = 50
    ) : FinanceTool()
}
```

### 2.2 Tool Executor Service

```kotlin
package com.example.finance.llm

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class FinanceToolExecutor(
    private val jdbcTemplate: JdbcTemplate,
    private val transactionRepository: TransactionRepository,
    private val summaryRepository: SummaryRepository,
    private val accountRepository: AccountRepository
) {

    fun executeTool(tool: FinanceTool, userId: UUID): ToolResult {
        // Set RLS context for this user
        setUserContext(userId)

        return when (tool) {
            is FinanceTool.GetTransactions -> executeGetTransactions(tool)
            is FinanceTool.GetMonthlySummary -> executeGetMonthlySummary(tool)
            is FinanceTool.GetAccountBalances -> executeGetAccountBalances(tool)
            is FinanceTool.GetCategorySpending -> executeGetCategorySpending(tool)
            is FinanceTool.SearchTransactions -> executeSearchTransactions(tool)
        }
    }

    private fun setUserContext(userId: UUID) {
        jdbcTemplate.execute("SET app.current_user_id = '$userId'")
    }

    private fun executeGetTransactions(tool: FinanceTool.GetTransactions): ToolResult {
        val transactions = transactionRepository.findFiltered(
            startDate = tool.startDate,
            endDate = tool.endDate,
            category = tool.category,
            accountName = tool.accountName,
            limit = tool.limit.coerceAtMost(500) // Enforce maximum
        )
        return ToolResult.Success(transactions)
    }

    private fun executeGetMonthlySummary(tool: FinanceTool.GetMonthlySummary): ToolResult {
        val summary = summaryRepository.getMonthlySummary(
            months = tool.months.coerceAtMost(24),
            category = tool.category
        )
        return ToolResult.Success(summary)
    }

    private fun executeGetAccountBalances(tool: FinanceTool.GetAccountBalances): ToolResult {
        val balances = accountRepository.getBalances(tool.accountType)
        return ToolResult.Success(balances)
    }

    private fun executeGetCategorySpending(tool: FinanceTool.GetCategorySpending): ToolResult {
        val spending = summaryRepository.getCategorySpending(
            months = tool.months.coerceAtMost(24)
        )
        return ToolResult.Success(spending)
    }

    private fun executeSearchTransactions(tool: FinanceTool.SearchTransactions): ToolResult {
        // Sanitize search term
        val sanitized = tool.searchTerm.replace(Regex("[^a-zA-Z0-9\\s]"), "")
        val transactions = transactionRepository.searchByDescription(
            searchTerm = sanitized,
            limit = tool.limit.coerceAtMost(100)
        )
        return ToolResult.Success(transactions)
    }
}

sealed class ToolResult {
    data class Success(val data: Any) : ToolResult()
    data class Error(val message: String) : ToolResult()
}
```

### 2.3 LLM Service with Perplexity

```kotlin
package com.example.finance.llm

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class LLMFinanceService(
    private val perplexityClient: PerplexityClient,
    private val toolExecutor: FinanceToolExecutor,
    private val objectMapper: ObjectMapper
) {

    private val systemPrompt = """
        You are a finance assistant. Given a user question about their finances,
        respond with JSON indicating which tool to call.

        Available tools:
        - get_transactions: Query transactions
          params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), category, accountName, limit
        - get_monthly_summary: Get monthly spending summary
          params: months (default 12), category
        - get_account_balances: Get current account balances
          params: accountType (optional)
        - get_category_spending: Get spending breakdown by category
          params: months (default 12)
        - search_transactions: Search transactions by description
          params: searchTerm, limit

        Respond with JSON only:
        {"tool": "tool_name", "params": {...}}
    """.trimIndent()

    suspend fun handleQuestion(question: String, userId: UUID): String {
        // Step 1: Use Perplexity to select the appropriate tool
        val toolSelection = perplexityClient.ask(
            messages = listOf(
                Message(role = "system", content = systemPrompt),
                Message(role = "user", content = question)
            )
        )

        // Step 2: Parse the tool selection
        val tool = parseToolFromResponse(toolSelection)
            ?: return "I couldn't understand your question. Could you rephrase it?"

        // Step 3: Execute the tool with user context
        val result = toolExecutor.executeTool(tool, userId)

        // Step 4: Generate human-readable response
        return when (result) {
            is ToolResult.Success -> generateResponse(question, result.data)
            is ToolResult.Error -> "Sorry, I encountered an error: ${result.message}"
        }
    }

    private fun parseToolFromResponse(response: String): FinanceTool? {
        return try {
            val json = objectMapper.readTree(response)
            val toolName = json.get("tool").asText()
            val params = json.get("params")

            when (toolName) {
                "get_transactions" -> FinanceTool.GetTransactions(
                    startDate = params.get("startDate")?.asText()?.let { LocalDate.parse(it) },
                    endDate = params.get("endDate")?.asText()?.let { LocalDate.parse(it) },
                    category = params.get("category")?.asText(),
                    accountName = params.get("accountName")?.asText(),
                    limit = params.get("limit")?.asInt() ?: 100
                )
                "get_monthly_summary" -> FinanceTool.GetMonthlySummary(
                    months = params.get("months")?.asInt() ?: 12,
                    category = params.get("category")?.asText()
                )
                "get_account_balances" -> FinanceTool.GetAccountBalances(
                    accountType = params.get("accountType")?.asText()
                )
                "get_category_spending" -> FinanceTool.GetCategorySpending(
                    months = params.get("months")?.asInt() ?: 12
                )
                "search_transactions" -> FinanceTool.SearchTransactions(
                    searchTerm = params.get("searchTerm").asText(),
                    limit = params.get("limit")?.asInt() ?: 50
                )
                else -> null
            }
        } catch (e: Exception) {
            null
        }
    }

    private suspend fun generateResponse(question: String, data: Any): String {
        val dataJson = objectMapper.writeValueAsString(data)

        return perplexityClient.ask(
            messages = listOf(
                Message(
                    role = "system",
                    content = """
                        You are a helpful finance assistant. Answer the user's question
                        based on the provided data. Be concise and helpful.
                        Format currency values nicely. If the data shows concerning
                        spending patterns, gently mention it.
                    """.trimIndent()
                ),
                Message(
                    role = "user",
                    content = "Question: $question\n\nData: $dataJson"
                )
            )
        )
    }
}
```

### 2.4 Perplexity Client

```kotlin
package com.example.finance.llm

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.awaitBody

data class Message(val role: String, val content: String)

@Component
class PerplexityClient(
    @Value("\${perplexity.api.key}") private val apiKey: String
) {
    private val webClient = WebClient.builder()
        .baseUrl("https://api.perplexity.ai")
        .defaultHeader("Authorization", "Bearer $apiKey")
        .defaultHeader("Content-Type", "application/json")
        .build()

    suspend fun ask(messages: List<Message>): String {
        val request = mapOf(
            "model" to "sonar-pro",
            "messages" to messages.map { mapOf("role" to it.role, "content" to it.content) }
        )

        val response = webClient.post()
            .uri("/chat/completions")
            .bodyValue(request)
            .retrieve()
            .awaitBody<Map<String, Any>>()

        val choices = response["choices"] as List<Map<String, Any>>
        val message = choices[0]["message"] as Map<String, Any>
        return message["content"] as String
    }
}
```

## 3. Next.js Chat UI

### 3.1 API Route

```typescript
// pages/api/finance-chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch(`${process.env.KOTLIN_API_URL}/api/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Finance chat error:', error);
    return res.status(500).json({ error: 'Failed to process question' });
  }
}
```

### 3.2 Chat Component

```tsx
// components/FinanceChat.tsx
import { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FinanceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/finance-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper sx={{ height: 400, overflow: 'auto', p: 2, mb: 2 }}>
        {messages.map((msg, i) => (
          <Box key={i} sx={{ mb: 2, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <Paper
              sx={{
                display: 'inline-block',
                p: 1,
                bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100'
              }}
            >
              <Typography>{msg.content}</Typography>
            </Paper>
          </Box>
        ))}
        {loading && <CircularProgress size={24} />}
      </Paper>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={loading}
          />
          <Button type="submit" variant="contained" disabled={loading}>
            Send
          </Button>
        </Box>
      </form>
    </Box>
  );
}
```

## 4. Security Checklist

| Layer | Protection | Status |
|-------|------------|--------|
| PostgreSQL | Read-only role (`llm_ro`) | [ ] |
| PostgreSQL | Views only (no direct table access) | [ ] |
| PostgreSQL | Row-Level Security for multi-tenant | [ ] |
| Kotlin | Parameterized queries only | [ ] |
| Kotlin | Tool whitelist (sealed class) | [ ] |
| Kotlin | Result limits enforced | [ ] |
| Kotlin | Input sanitization | [ ] |
| Kotlin | User authentication required | [ ] |
| LLM | No direct SQL execution | [ ] |
| LLM | Structured tool responses only | [ ] |
| API | Rate limiting | [ ] |
| API | Audit logging | [ ] |

## 5. Example Questions the LLM Can Answer

- "How much did I spend on groceries last month?"
- "What are my account balances?"
- "Show me my largest transactions this year"
- "What categories am I spending the most on?"
- "Find all transactions from Amazon"
- "What's my average monthly spending?"

## 6. Implementation Phases

### Phase 1: Database Setup
- [ ] Create `llm_ro` role
- [ ] Create views for transactions, summaries, balances
- [ ] Test read-only access

### Phase 2: Kotlin Backend
- [ ] Define tool sealed class
- [ ] Implement tool executor
- [ ] Set up Perplexity client
- [ ] Create REST endpoint

### Phase 3: RLS (If Multi-Tenant)
- [ ] Add owner_id columns
- [ ] Enable RLS policies
- [ ] Test tenant isolation

### Phase 4: Next.js Integration
- [ ] Create API route
- [ ] Build chat UI component
- [ ] Connect to Kotlin backend

### Phase 5: Testing & Hardening
- [ ] Test all tool functions
- [ ] Verify RLS isolation
- [ ] Add rate limiting
- [ ] Set up audit logging

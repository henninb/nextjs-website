# Cashback Calculation — Backend Migration Plan

Move rewards/cashback calculation from the Next.js frontend to the Spring Boot backend, replacing the `t_parameter` naming-convention approach with a dedicated `t_reward` table.

---

## Motivation

- Rewards config is stored as free-text rows in `t_parameter` with a string naming convention (`rewards_3x_categories_amex_brian`). There is no FK to `t_account`, no type safety, and comma-separated category lists require client-side parsing.
- Calculating cashback on the frontend means every client re-derives the same result, and any reward tier change requires a frontend deploy.

---

## Industry Best Practices Applied

- **Single Responsibility**: `RewardsService` only calculates — transaction fetching stays in `TransactionService`
- **Owner-scoped queries**: every repository method includes `owner` to enforce data isolation
- **No business logic in controllers or entities**: calculation lives exclusively in the service layer
- **Null safety**: Kotlin's type system enforces nullable `cashback: BigDecimal?` at compile time
- **`@Transient` for derived data**: cashback is computed, never persisted
- **Flyway for all schema changes**: no ad-hoc DDL
- **SmartBuilder pattern**: test data creation via builders, not hardcoded strings
- **Spock Given/When/Then**: all tests follow the established project structure
- **Test isolation**: each test seeds its own data scoped to `testOwner`

---

## Phase 1 — Database

### 1.1 Flyway migration: `V{next}__create_t_reward.sql`

```sql
CREATE TABLE t_reward (
    reward_id     BIGSERIAL PRIMARY KEY,
    account_id    BIGINT NOT NULL REFERENCES t_account(account_id),
    owner         TEXT NOT NULL,
    multiplier    NUMERIC(4,1) NOT NULL,
    category      TEXT NOT NULL,
    cpp           NUMERIC(6,4) NOT NULL DEFAULT 0.01,
    active_status BOOLEAN NOT NULL DEFAULT TRUE,
    date_added    TIMESTAMP NOT NULL DEFAULT now(),
    date_updated  TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_reward_account_multiplier_category UNIQUE (account_id, multiplier, category)
);

CREATE INDEX idx_reward_owner_account ON t_reward (owner, account_id);
```

`BIGSERIAL` matches every other table in the project and allows the backup script to restore explicit `reward_id` values. `GENERATED ALWAYS AS IDENTITY` blocks explicit insertion and must not be used here.

One row per account+category. Adding a new tier is an INSERT — no schema change needed.

### 1.2 Seed migration: `V{next+1}__seed_t_reward_from_parameters.sql`

```sql
INSERT INTO t_reward (account_id, owner, multiplier, category, cpp)
SELECT a.account_id, a.owner, 6.0,
       unnest(string_to_array(p.parameter_value, ',')),
       COALESCE((
           SELECT parameter_value::NUMERIC FROM t_parameter
           WHERE owner = a.owner AND parameter_name = 'rewards_cpp_' || a.account_name_owner
       ), 0.01)
FROM t_account a
JOIN t_parameter p ON p.owner = a.owner
    AND p.parameter_name = 'rewards_6x_categories_' || a.account_name_owner;

INSERT INTO t_reward (account_id, owner, multiplier, category, cpp)
SELECT a.account_id, a.owner, 3.0,
       unnest(string_to_array(p.parameter_value, ',')),
       COALESCE((
           SELECT parameter_value::NUMERIC FROM t_parameter
           WHERE owner = a.owner AND parameter_name = 'rewards_cpp_' || a.account_name_owner
       ), 0.01)
FROM t_account a
JOIN t_parameter p ON p.owner = a.owner
    AND p.parameter_name = 'rewards_3x_categories_' || a.account_name_owner;

INSERT INTO t_reward (account_id, owner, multiplier, category, cpp)
SELECT a.account_id, a.owner, 2.0,
       unnest(string_to_array(p.parameter_value, ',')),
       COALESCE((
           SELECT parameter_value::NUMERIC FROM t_parameter
           WHERE owner = a.owner AND parameter_name = 'rewards_cpp_' || a.account_name_owner
       ), 0.01)
FROM t_account a
JOIN t_parameter p ON p.owner = a.owner
    AND p.parameter_name = 'rewards_2x_categories_' || a.account_name_owner;
```

### 1.3 `finance_db-create.sql` — add `t_reward` to canonical schema

The `finance_db-create.sql` in `raspi-finance-database` is the source of truth used to rebuild `finance_fresh_db`. Add the table definition there so restores work correctly:

```sql
CREATE TABLE IF NOT EXISTS public.t_reward (
    reward_id     BIGSERIAL PRIMARY KEY,
    account_id    BIGINT NOT NULL REFERENCES public.t_account(account_id),
    owner         TEXT NOT NULL,
    multiplier    NUMERIC(4,1) NOT NULL,
    category      TEXT NOT NULL,
    cpp           NUMERIC(6,4) NOT NULL DEFAULT 0.01,
    active_status BOOLEAN NOT NULL DEFAULT TRUE,
    date_added    TIMESTAMP NOT NULL DEFAULT now(),
    date_updated  TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_reward_account_multiplier_category UNIQUE (account_id, multiplier, category)
);

CREATE INDEX IF NOT EXISTS idx_reward_owner_account ON public.t_reward (owner, account_id);

SELECT setval('public.t_reward_reward_id_seq', COALESCE((SELECT MAX(reward_id) FROM public.t_reward), 1));
```

Also add `t_reward` to `finance_test_db-create-func.sql` and `finance_test_db-create-int.sql` — these define the schema for the functional and integration test databases respectively. Without it every test that touches `t_reward` will fail with a missing table error.

### 1.4 `run-backup.py` — add `t_reward` to `STANDARD_TABLES`

`STANDARD_TABLES` drives which tables are exported as CSV during backup and imported into `finance_fresh_db` during restore. Add `t_reward` after `t_parameter`:

```python
(
    "t_reward",
    "reward_id, account_id, owner, multiplier, category, cpp, active_status, date_updated, date_added",
    "reward_id",
),
```

Run a backup after the migration to confirm `t_reward.csv` is included in the archive:

```bash
cd ~/projects/github.com/henninb/raspi-finance-database
python3 run-backup.py
```

### 1.5 Cleanup migration (run after backend verified): `V{next+2}__remove_rewards_parameters.sql`

```sql
DELETE FROM t_parameter WHERE parameter_name LIKE 'rewards_%';
```

---

## Phase 2 — Backend (`raspi-finance-endpoint`)

### 2.1 `Reward.kt` — new entity

```kotlin
@Entity
@Table(
    name = "t_reward",
    uniqueConstraints = [UniqueConstraint(
        columnNames = ["account_id", "multiplier", "category"],
        name = "uk_reward_account_multiplier_category"
    )]
)
@JsonIgnoreProperties(ignoreUnknown = true)
class Reward(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reward_id")
    var rewardId: Long = 0L,

    @Column(name = "account_id", nullable = false)
    var accountId: Long = 0L,

    @Column(name = "owner", nullable = false)
    @Convert(converter = LowerCaseConverter::class)
    var owner: String = "",

    @Column(name = "multiplier", nullable = false, precision = 4, scale = 1)
    var multiplier: BigDecimal = BigDecimal.ONE,

    @Column(name = "category", nullable = false)
    @Convert(converter = LowerCaseConverter::class)
    var category: String = "",

    @Column(name = "cpp", nullable = false, precision = 6, scale = 4)
    var cpp: BigDecimal = BigDecimal("0.01"),

    @Column(name = "active_status", nullable = false)
    var activeStatus: Boolean = true,
) {
    @JsonIgnore
    @Column(name = "date_added", nullable = false)
    var dateAdded: Timestamp = Timestamp(Calendar.getInstance().time.time)

    @JsonIgnore
    @Column(name = "date_updated", nullable = false)
    var dateUpdated: Timestamp = Timestamp(Calendar.getInstance().time.time)
}
```

### 2.2 `RewardRepository.kt`

```kotlin
interface RewardRepository : JpaRepository<Reward, Long> {
    fun findByOwnerAndAccountIdAndActiveStatusIsTrue(owner: String, accountId: Long): List<Reward>
    fun findByOwnerAndActiveStatusIsTrue(owner: String): List<Reward>
}
```

The second method is used for cross-account queries (date range fetches).

### 2.3 `dto/RewardInputDto.kt` — input DTO

```kotlin
data class RewardInputDto(
    val rewardId: Long?,
    @field:NotNull val accountId: Long,
    @field:DecimalMin("1.0") val multiplier: BigDecimal,
    @field:NotBlank @field:Size(min = 1, max = 50) val category: String,
    @field:DecimalMin("0.0001") val cpp: BigDecimal,
    val activeStatus: Boolean?,
)
```

Keeps validation rules separate from the domain entity, consistent with existing DTO pattern.

### 2.4 `RewardsService.kt` — split into CRUD and calculation

Split into two concerns following SRP:

**`RewardService.kt`** — CRUD, extends `CrudBaseService<Reward, Long>` (mirrors `ParameterService`):

```kotlin
@Service
class RewardService(
    private val rewardRepository: RewardRepository,
    meterService: MeterService,
    validator: Validator,
    resilienceComponents: ResilienceComponents,
) : CrudBaseService<Reward, Long>(meterService, validator, resilienceComponents) {

    override fun getEntityName() = "Reward"

    override fun findAllActive(): ServiceResult<List<Reward>> =
        handleServiceOperation("findAllActive", null) {
            rewardRepository.findByOwnerAndActiveStatusIsTrue(TenantContext.getCurrentOwner())
        }

    fun findByAccountId(accountId: Long): ServiceResult<List<Reward>> =
        handleServiceOperation("findByAccountId", accountId) {
            rewardRepository.findByOwnerAndAccountIdAndActiveStatusIsTrue(
                TenantContext.getCurrentOwner(), accountId
            )
        }

    fun loadAllTiersGrouped(): Map<Long, List<Reward>> =
        findAllActive().data?.groupBy { it.accountId } ?: emptyMap()
}
```

**`RewardsCalculationService.kt`** — pure calculation, no DB access:

```kotlin
@Service
class RewardsCalculationService {

    private val excludedTypes = setOf(TransactionType.Income, TransactionType.Transfer)
    private val excludedCategories = setOf("payment", "returns", "bill_pay")

    fun calculateCashback(transaction: Transaction, tiers: List<Reward>): BigDecimal? {
        if (tiers.isEmpty()) return null
        if (transaction.transactionType in excludedTypes) return null
        if (transaction.category.lowercase() in excludedCategories) return null

        val category = transaction.category.lowercase()
        val matched = tiers
            .filter { category == it.category || category.contains(it.category) }
            .maxByOrNull { it.multiplier }
            ?: return transaction.amount.abs()
                .multiply(tiers.first().cpp)
                .setScale(2, RoundingMode.HALF_UP)

        return transaction.amount.abs()
            .multiply(matched.multiplier)
            .multiply(matched.cpp)
            .setScale(2, RoundingMode.HALF_UP)
    }
}
```

### 2.5 `RewardController.kt` — CRUD endpoint

Extends `StandardRestController<Reward, Long>` (mirrors `ParameterController`):

```kotlin
@RestController
@RequestMapping("/api/reward")
class RewardController(private val rewardService: RewardService) :
    StandardRestController<Reward, Long>(rewardService) {

    @GetMapping("/active")
    fun findAllActive(): ResponseEntity<List<Reward>> { ... }

    @GetMapping("/{rewardId}")
    fun findById(@PathVariable rewardId: Long): ResponseEntity<Reward> { ... }

    @PostMapping
    fun insert(@RequestBody @Valid rewardInputDto: RewardInputDto): ResponseEntity<Reward> { ... }

    @PutMapping
    fun update(@RequestBody @Valid rewardInputDto: RewardInputDto): ResponseEntity<Reward> { ... }

    @DeleteMapping("/{rewardId}")
    fun deleteById(@PathVariable rewardId: Long): ResponseEntity<Reward> { ... }
}
```

### 2.6 `Transaction.kt` — add transient field

```kotlin
@Transient
@JsonProperty
var cashback: BigDecimal? = null
```

### 2.7 `schema.graphqls` — add `cashback` to Transaction type

```graphql
type Transaction {
    # ... existing fields ...
    cashback: Float
}
```

Without this, the GraphQL endpoint silently omits `cashback` even though the REST endpoint returns it. The frontend uses REST, but this keeps both transports consistent.

### 2.8 `TransactionService.kt` — enrich after page fetch

**Single-account fetch** (`findByAccountNameOwnerOrderByTransactionDateStandardized`):

`accountId` is not in scope — resolve it explicitly before enrichment:

```kotlin
val account = accountService.account(accountNameOwner).orThrowNotFound(...)
val tiers = rewardService.findByAccountId(account.accountId).data ?: emptyList()
page.content.forEach { it.cashback = rewardsCalculationService.calculateCashback(it, tiers) }
```

**Cross-account date range fetch** (`findTransactionsByDateRangeStandardized`):

Transactions span multiple accounts, so load all reward tiers grouped by `accountId` once per request — not once per transaction:

```kotlin
val tiersByAccount: Map<Long, List<Reward>> = rewardService.loadAllTiersGrouped()
page.content.forEach { transaction ->
    val tiers = tiersByAccount[transaction.accountId] ?: emptyList()
    transaction.cashback = rewardsCalculationService.calculateCashback(transaction, tiers)
}
```

Load the map **once per request** regardless of page size.

---

## Phase 2 — Tests (`raspi-finance-endpoint`)

### Unit tests

**`src/test/unit/groovy/finance/services/RewardsCalculationServiceSpec.groovy`**

Pure unit test — no database, no Spring context, no mocks needed. `RewardsCalculationService` has zero dependencies.

```groovy
class RewardsCalculationServiceSpec extends Specification {

    RewardsCalculationService service = new RewardsCalculationService()

    void 'calculateCashback returns null when no tiers configured'() {
        given:
        def transaction = buildTransaction(amount: -50.00, category: 'groceries')

        expect:
        service.calculateCashback(transaction, []) == null
    }

    void 'calculateCashback applies 6x multiplier for groceries'() {
        given:
        def tiers = [buildTier(multiplier: 6.0, category: 'groceries', cpp: 0.01)]
        def transaction = buildTransaction(amount: -100.00, category: 'groceries')

        expect:
        service.calculateCashback(transaction, tiers) == new BigDecimal('6.00')
    }

    void 'calculateCashback returns null for income transaction type'() { ... }
    void 'calculateCashback returns null for transfer transaction type'() { ... }
    void 'calculateCashback returns null for payment category'() { ... }
    void 'calculateCashback returns null for returns category'() { ... }
    void 'calculateCashback returns null for bill_pay category'() { ... }
    void 'calculateCashback uses substring matching for category'() { ... }
    void 'calculateCashback selects highest multiplier when multiple tiers match'() { ... }
    void 'calculateCashback rounds to 2 decimal places with HALF_UP'() { ... }
    void 'calculateCashback uses abs(amount) so sign does not affect result'() { ... }
}
```

**`src/test/unit/groovy/finance/controllers/dto/RewardInputDtoSpec.groovy`**

Validates Jakarta constraints on the input DTO (mirrors `ParameterInputDtoSpec` pattern).

```groovy
class RewardInputDtoSpec extends BaseDomainSpec {

    void 'RewardInputDto validation passes for valid data'() { ... }

    @Unroll
    void 'RewardInputDto validation fails for multiplier below minimum: #multiplier'() { ... }

    @Unroll
    void 'RewardInputDto validation fails for blank category: #category'() { ... }

    void 'RewardInputDto validation fails for null accountId'() { ... }
}
```

### Integration tests

**`src/test/integration/groovy/finance/helpers/SmartRewardBuilder.groovy`**
**`src/test/functional/groovy/finance/helpers/SmartRewardBuilder.groovy`**

Both directories require a copy — `SmartParameterBuilder` and every other Smart builder exists in both. Follows the same pattern: auto-generates valid, unique test data scoped to `testOwner`.

```groovy
class SmartRewardBuilder {
    private static final AtomicInteger COUNTER = new AtomicInteger(0)

    static SmartRewardBuilder builderForOwner(String testOwner) { ... }

    SmartRewardBuilder withMultiplier(BigDecimal multiplier) { ... }
    SmartRewardBuilder withCategory(String category) { ... }
    SmartRewardBuilder withCpp(BigDecimal cpp) { ... }
    SmartRewardBuilder asGroceryTier() { ... }      // 6x, groceries, 0.01
    SmartRewardBuilder asTransportTier() { ... }    // 3x, transportation, 0.01
    SmartRewardBuilder asInactive() { ... }

    Reward buildAndValidate() { ... }
}
```

**`src/test/integration/groovy/finance/repositories/RewardRepositoryIntSpec.groovy`**

```groovy
class RewardRepositoryIntSpec extends BaseIntegrationSpec {

    void 'findByOwnerAndAccountIdAndActiveStatusIsTrue returns only active tiers'() { ... }
    void 'unique constraint prevents duplicate account+multiplier+category'() { ... }
    void 'find returns empty list for account with no rewards configured'() { ... }
    void 'inactive tiers are excluded from results'() { ... }
}
```

**`src/test/integration/groovy/finance/services/RewardServiceIntSpec.groovy`**

```groovy
class RewardServiceIntSpec extends BaseIntegrationSpec {

    void 'findByAccountId returns configured tiers for account'() { ... }
    void 'findByAccountId returns empty list for account with no rewards'() { ... }
    void 'loadAllTiersGrouped returns map keyed by accountId'() { ... }
    void 'inactive tiers are excluded from all lookups'() { ... }
}
```

**`src/test/integration/groovy/finance/services/TransactionServiceRewardsIntSpec.groovy`**

Verifies `cashback` is populated on transactions returned from both paginated fetch methods.

```groovy
void 'single-account fetch populates cashback for matching categories'() {
    given: 'an account with grocery 6x tier and a groceries transaction'

    when:
    def page = transactionService.findByAccountNameOwnerOrderByTransactionDateStandardized(accountNameOwner, pageable)

    then:
    page.data.content.find { it.category == 'groceries' }?.cashback == new BigDecimal('6.00')
}

void 'single-account fetch leaves cashback null when account has no rewards'() { ... }

void 'date-range fetch populates cashback across multiple accounts in one request'() { ... }

void 'payment transactions have null cashback even when account has rewards'() { ... }

void 'income transactions have null cashback even when account has rewards'() { ... }
```

### Functional tests

**`src/test/functional/groovy/finance/controllers/RewardControllerFunctionalSpec.groovy`**

Full HTTP tests for CRUD on the `/api/reward` endpoint (following `ParameterControllerFunctionalSpec` pattern).

```groovy
void 'GET /api/reward/active returns list of reward tiers'() { ... }
void 'POST /api/reward creates new reward tier'() { ... }
void 'PUT /api/reward/{id} updates reward tier'() { ... }
void 'DELETE /api/reward/{id} deactivates reward tier'() { ... }
void 'duplicate account+multiplier+category combination is rejected with 409'() { ... }
void 'POST /api/reward without CSRF token is rejected with 403'() { ... }
void 'transaction fetch via REST includes cashback field when rewards configured'() { ... }
void 'transaction fetch via GraphQL includes cashback field when rewards configured'() { ... }
```

**`src/test/functional/groovy/finance/controllers/SecurityAuditFunctionalSpec.groovy`** — update to include `/api/reward` in the list of audited endpoints. This spec verifies authentication and authorisation behaviour across all controllers; a new controller must be added explicitly.

---

## Phase 3 — Frontend (`nextjs-website`)

### 3.1 `model/Transaction.ts` — add field

```ts
cashback?: number;
```

### 3.2 `app/finance/transactions/[accountNameOwner]/page.tsx`

| Remove | Replace with |
|---|---|
| `rewardsConfig` useMemo (parameter parsing, tier lists, cpp) | `const hasRewards = useMemo(() => filteredTransactions.some(t => t.cashback != null), [filteredTransactions])` |
| `totalPoints` reduce with multiplier/cpp logic | `filteredTransactions.reduce((sum, t) => sum + (t.cashback ?? 0), 0)` |
| `cycleRewards` reduce with multiplier/cpp logic | `cycleTransactionPage.content.reduce((sum, t) => sum + (t.cashback ?? 0), 0)` |
| Column `renderCell` tier-matching and multiplier logic | Display `row.cashback` directly; show `—` if `null` or `undefined` |
| Column visibility guard `rewardsConfig ?` | `hasRewards ?` |

The `fetchedParameters` hook is **not removed** — it is still used for bonus tracking.

### 3.3 Frontend tests

**Update `__tests__/hooks/useTransactionFetch.test.ts`** — extend MSW mock responses to include `cashback` field on transaction fixtures.

**Update `__tests__/pages/transactions.test.tsx`** — assert that the rewards column renders the `cashback` value from the API response rather than computing it locally.

**Add `__tests__/pages/transactions-rewards.test.tsx`** — dedicated tests for rewards column behaviour:
- Column hidden when all transactions have `cashback: null`
- Column visible when at least one transaction has `cashback` set
- Correct dollar value displayed per row
- `—` rendered for excluded categories and transaction types

---

## Execution Order

1. Add `t_reward` to `finance_db-create.sql`, `finance_test_db-create-func.sql`, and `finance_test_db-create-int.sql` (all in `raspi-finance-database`)
2. Add `t_reward` entry to `STANDARD_TABLES` in `run-backup.py`
3. Write Flyway migration (`V{next}__create_t_reward.sql`)
4. Implement `Reward.kt`, `RewardRepository.kt`
5. Implement `SmartRewardBuilder.groovy` in both integration and functional helpers directories
6. Write `RewardRepositoryIntSpec.groovy` — confirm table, FK, and unique constraint
7. Implement `RewardsCalculationService.kt` with unit tests (`RewardsCalculationServiceSpec.groovy`)
8. Implement `RewardService.kt` (CRUD, extends `CrudBaseService`) with `RewardServiceIntSpec.groovy`
9. Write `RewardInputDto.kt` with `RewardInputDtoSpec.groovy`
10. Add `RewardController.kt` with `RewardControllerFunctionalSpec.groovy`
11. Update `SecurityAuditFunctionalSpec.groovy` to include `/api/reward`
12. Add `@Transient cashback` to `Transaction.kt`
13. Add `cashback: Float` to `schema.graphqls` Transaction type
14. Enrich in `TransactionService.kt` — single-account and cross-account paths
15. Write `TransactionServiceRewardsIntSpec.groovy`
16. Write seed Flyway migration (`V{next+1}__seed_t_reward_from_parameters.sql`)
17. Deploy backend; verify `cashback` in REST and GraphQL transaction responses
18. Run `python3 run-backup.py` — confirm `t_reward.csv` is present in the generated archive
19. Add `cashback?: number` to `model/Transaction.ts`
20. Simplify `page.tsx` — remove all three client-side calculation sites
21. Update and add frontend Jest tests
22. Deploy frontend
23. After verification: run cleanup migration (`V{next+2}__remove_rewards_parameters.sql`)
24. Run `python3 run-backup.py` again — confirm `rewards_*` rows are gone from `t_parameter.csv` in the new archive

---

## What This Replaces

| Before | After |
|---|---|
| `t_parameter` rows with string naming convention | `t_reward` table with FK to `t_account` |
| Comma-separated category strings | One row per category |
| Client-side tier parsing and multiplication | Backend-calculated `cashback` on `Transaction` |
| No referential integrity | `account_id` FK enforced by DB |
| Frontend deploy required for tier changes | Insert/update rows in `t_reward` |
| No tests for rewards logic | Unit, integration, and functional test coverage |

---

## Currently Configured Accounts

| Account | Tiers |
|---|---|
| `amex_brian` | 6x groceries, 3x transportation/airfare/fuel/hotel |
| `wfargo-autograph_brian` | 3x restaurant/fuel/transportation/hotel/parking |

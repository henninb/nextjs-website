/** Represents one transaction row extracted from raw pasted bank statement text. */
export interface ParsedTransactionRow {
  /** Stable client-side identifier for React keys and editable state. */
  id: string;
  /** Parsed date, or null if the date field could not be read. */
  date: Date | null;
  /** Merchant / description text from the header line. */
  description: string;
  /** Dollar amount (negative for refunds/credits), or null if unparseable. */
  amount: number | null;
  /** Non-empty means the row needs manual review before inserting. */
  parseErrors: string[];
}

// ─── Format patterns ──────────────────────────────────────────────────────────
//
// Format A — labeled row header (credit card detail view):
//   Transaction Details for Row N    MM/DD/YY    DESCRIPTION
//   #...1193
//   $60.21
//
// Format B — plain date header (checking/debit statement view):
//   MM/DD/YY    MM/DD/YY    DESCRIPTION
//   #2444500FP8PT1TKK2
//   $50.00    $16,896.48    ← first amount = charge, second = running balance
//
// Both formats:
//   • Reference lines (starting with #) are ignored.
//   • Only the FIRST dollar amount on the amount line is used.
//   • Negative amounts (refunds) are preserved.
// ─────────────────────────────────────────────────────────────────────────────

const FORMAT_A = /^Transaction Details for Row \d+/i;
const FORMAT_B = /^\d{1,2}\/\d{1,2}\/\d{2,4}[\s\t]+\d{1,2}\/\d{1,2}\/\d{2,4}[\s\t]+\S/;

/** Returns true if the line is the start of a new transaction block in either format. */
function isTransactionHeader(line: string): boolean {
  return FORMAT_A.test(line) || FORMAT_B.test(line);
}

/** Parse MM/DD/YY or MM/DD/YYYY, push to errors and return null on failure. */
function parseDateStr(dateStr: string, errors: string[]): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    errors.push(`Cannot parse date: "${dateStr}"`);
    return null;
  }
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000; // 26 → 2026
  const candidate = new Date(year, parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
  if (!isNaN(candidate.getTime())) return candidate;
  errors.push(`Cannot parse date: "${dateStr}"`);
  return null;
}

/**
 * Extract the FIRST dollar amount from a line that may contain multiple values.
 *
 * Examples:
 *   "$60.21"              → 60.21
 *   "-$60.21"             → -60.21
 *   "$-60.21"             → -60.21
 *   "$50.00    $16,896.48"→ 50.00  (running balance ignored)
 *   "60.21"               → 60.21
 */
function parseFirstAmount(line: string): number | null {
  const trimmed = line.trim();

  // Match the first occurrence of an optional sign + $ + optional sign + digits
  const match = trimmed.match(/(-?\$-?|-?\$|^-?)([\d,]+\.?\d*)/);
  if (!match) return null;

  const signPart = match[1]; // e.g. "-$", "$-", "-", ""
  const digits = match[2].replace(/,/g, '');
  const num = parseFloat(digits);
  if (isNaN(num)) return null;

  const isNegative = signPart.includes('-');
  return isNegative ? -Math.abs(num) : num;
}

/**
 * Parse raw bank statement text into transaction rows.
 * Supports both Format A (labeled row header) and Format B (plain date header).
 * Blocks may be separated by blank lines; unknown lines between blocks are ignored.
 * A row with parseErrors.length > 0 is flagged for manual review before inserting.
 */
export function parseTransactionPaste(raw: string): ParsedTransactionRow[] {
  const lines = raw.split('\n').map((l) => l.trim());
  const rows: ParsedTransactionRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line || !isTransactionHeader(line)) {
      i++;
      continue;
    }

    const errors: string[] = [];
    let date: Date | null = null;
    let description = '';

    if (FORMAT_A.test(line)) {
      // "Transaction Details for Row N    MM/DD/YY    DESCRIPTION"
      const m = line.match(
        /^Transaction Details for Row \d+[\s\t]+(\d{1,2}\/\d{1,2}\/\d{2,4})[\s\t]+(.*?)$/i,
      );
      if (m) {
        date = parseDateStr(m[1], errors);
        description = m[2].trim();
        if (!description) errors.push('Description is empty');
      } else {
        errors.push('Header did not match expected format');
      }
    } else {
      // "MM/DD/YY    MM/DD/YY    DESCRIPTION" — use first (posted) date
      const m = line.match(
        /^(\d{1,2}\/\d{1,2}\/\d{2,4})[\s\t]+\d{1,2}\/\d{1,2}\/\d{2,4}[\s\t]+(.*?)$/,
      );
      if (m) {
        date = parseDateStr(m[1], errors);
        description = m[2].trim();
        if (!description) errors.push('Description is empty');
      } else {
        errors.push('Header did not match expected format');
      }
    }

    // Advance and scan for the first amount, stopping at the next block header
    i++;
    let amount: number | null = null;

    while (i < lines.length && !isTransactionHeader(lines[i])) {
      const next = lines[i].trim();
      i++;

      if (!next) continue;
      if (/^#/.test(next)) continue; // reference / card-suffix line — skip

      const parsed = parseFirstAmount(next);
      if (parsed !== null) {
        amount = parsed;
        break;
      }
    }

    if (amount === null) errors.push('No amount found');

    rows.push({
      id: crypto.randomUUID(),
      date,
      description,
      amount,
      parseErrors: errors,
    });
  }

  return rows;
}

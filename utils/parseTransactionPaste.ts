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

/**
 * Parse raw bank statement text (copied from a web banking UI) into transaction rows.
 *
 * Expected block format per transaction:
 *   Transaction Details for Row N    MM/DD/YY    DESCRIPTION
 *   #...XXXX        ← card suffix line, ignored
 *   $60.21          ← amount; negative amounts (-$12.00) are preserved
 *
 * Blocks are separated only by newlines; blank lines are tolerated.
 * A row is marked ambiguous (parseErrors.length > 0) when any field fails to parse.
 */
export function parseTransactionPaste(raw: string): ParsedTransactionRow[] {
  const lines = raw.split('\n').map((l) => l.trim());
  const rows: ParsedTransactionRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line || !/^Transaction Details for Row \d+/i.test(line)) {
      i++;
      continue;
    }

    const errors: string[] = [];

    // Header pattern: "Transaction Details for Row N<whitespace>MM/DD/YY<whitespace>DESCRIPTION"
    const headerMatch = line.match(
      /^Transaction Details for Row \d+[\s\t]+(\d{1,2}\/\d{1,2}\/\d{2,4})[\s\t]+(.*?)$/i,
    );

    let date: Date | null = null;
    let description = '';

    if (headerMatch) {
      const [, dateStr, rawDesc] = headerMatch;
      description = rawDesc.trim();

      const parts = dateStr.split('/');
      let year = parseInt(parts[2], 10);
      // 2-digit years: 26 → 2026
      if (year < 100) year += 2000;
      const candidate = new Date(year, parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
      if (!isNaN(candidate.getTime())) {
        date = candidate;
      } else {
        errors.push(`Cannot parse date: "${dateStr}"`);
      }

      if (!description) errors.push('Description is empty');
    } else {
      errors.push('Header did not match expected format');
    }

    // Advance past the header line and scan for the amount
    i++;
    let amount: number | null = null;

    while (i < lines.length && !/^Transaction Details for Row \d+/i.test(lines[i])) {
      const next = lines[i].trim();
      i++;

      if (!next) continue;
      if (/^#\.\.\./.test(next)) continue; // card suffix like "#...1193" — skip

      // Amount line: $60.21 | -$60.21 | $-60.21 | 60.21 | -60.21
      if (/^-?\$/.test(next) || /^\$-/.test(next) || /^-?\d/.test(next)) {
        const stripped = next.replace(/[$,\s]/g, '');
        const parsed = parseFloat(stripped);
        if (!isNaN(parsed)) {
          amount = parsed;
          break;
        }
        errors.push(`Cannot parse amount: "${next}"`);
      }
    }

    if (amount === null && !errors.some((e) => e.includes('amount'))) {
      errors.push('No amount found');
    }

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

/** Represents one transaction row extracted from raw pasted bank statement text. */
export interface ParsedTransactionRow {
  /** Stable client-side identifier for React keys and editable state. */
  id: string;
  /** Parsed date, or null if the date field could not be read. */
  date: Date | null;
  /** Merchant / description text from the header line. "ONLINE TRANSFER" descriptions are trimmed to those two words. */
  description: string;
  /** Remainder of an "ONLINE TRANSFER" description, or empty string. */
  notes: string;
  /** Dollar amount (negative for refunds/credits), or null if unparseable. */
  amount: number | null;
  /** Non-empty means the row needs manual review before inserting. */
  parseErrors: string[];
}

// ─── Supported formats ────────────────────────────────────────────────────────
//
// Format A — labeled row header (credit card detail view):
//   Transaction Details for Row N    MM/DD/YY    DESCRIPTION
//   #...1193
//   $60.21
//
// Format F — labeled row header with inline amount (debit account detail view):
//   Transaction Details for Row N    MM/DD/YY    DESCRIPTION    $26.78
//   (amount is on the same header line, separated by 2+ spaces — no follow-on lines)
//   Detected as Format A by header regex; handler checks for inline amount.
//
// Format B — plain double-date header (checking/debit statement):
//   MM/DD/YY    MM/DD/YY    DESCRIPTION
//   #2444500FP8PT1TKK2
//   $50.00    $16,896.48    ← first = charge, second = running balance (ignored)
//
// Format G — single-date single-line debit:
//   MM/DD/YY    DESCRIPTION    $AMOUNT    [optional trailing text]
//   Everything is on one line; amount is the first $XX.XX preceded by 2+ spaces.
//
// Format C — mobile/app card view (month-name date, description on its own line):
//   Apr 16
//   Pending              ← optional status line
//   ALDI
//
//   MH                   ← cardholder initials — exactly 2 uppercase letters
//   $1.89
//
//   Show Transaction     ← block footer
//
// Format D — tabular single-line export (MM-DD-YYYY date, all fields on one data line):
//   03-10-2026
//
//   TARGET 1144 COON RAPIDS MN    Sale    **3370    $23.69
//   03-09-2026
//
//   TARGET.COM 800-591- CREDIT    Return        -$2.25
//   ↑ description                 ↑ type  ↑card  ↑ amount (first $ field)
//
// Format H — Target pending transaction (date embedded in parens, all fields on one line):
//   Pending (04-27-2026)     TGT.COM 912003433044748    Sale        $54.97
//   ↑ status  ↑ date           ↑ description             ↑ type     ↑ amount
//
// Format E — Citi-style card view (MMM DD, YYYY date, cardholder on own line):
//   Apr 12, 2026
//   KARI HENNING               ← cardholder name — skip
//   COSTCO WHSE #0372 COON RAPIDS MN
//   Eligible for Citi® Flex Pay  ← optional promo text — skip
//   $122.84                    ← transaction amount
//   $1,110.74                  ← running balance — ignore (only first $ taken)
//
// Rules shared by all formats:
//   • Reference / suffix lines starting with '#' are ignored.
//   • Only the FIRST dollar amount on an amount line is captured.
//   • Negative amounts (refunds) are preserved.
// ─────────────────────────────────────────────────────────────────────────────

const FORMAT_A = /^Transaction Details for Row \d+/i;
const FORMAT_B = /^\d{1,2}\/\d{1,2}\/\d{2,4}[\s\t]+\d{1,2}\/\d{1,2}\/\d{2,4}[\s\t]+\S/;
/** Single-date single-line debit: "MM/DD/YY    DESCRIPTION    $AMOUNT". Must come after FORMAT_B. */
const FORMAT_G = /^\d{1,2}\/\d{1,2}\/\d{2,4}[\s\t]+(?!\d{1,2}\/\d{1,2}\/\d)\S/;
const FORMAT_C = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}$/i;
/** MM-DD-YYYY with dashes and a 4-digit year — distinct from Formats A/B/C. */
const FORMAT_D = /^\d{2}-\d{2}-\d{4}$/;
/** "Pending (MM-DD-YYYY)" pending transaction — Target card statement. */
const FORMAT_H = /^Pending\s*\(\d{2}-\d{2}-\d{4}\)/i;
/** "MMM DD, YYYY" — comma + full year distinguishes it from Format C's "MMM DD". */
const FORMAT_E = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s*\d{4}$/i;

const MONTH_IDX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Returns true when a line begins a new transaction block in any format. */
function isTransactionHeader(line: string): boolean {
  return (
    FORMAT_A.test(line) ||
    FORMAT_B.test(line) ||
    FORMAT_G.test(line) || // single-date debit — must come after FORMAT_B (two-date)
    FORMAT_E.test(line) || // must precede FORMAT_C — both start with month abbreviation
    FORMAT_C.test(line) ||
    FORMAT_D.test(line) ||
    FORMAT_H.test(line)
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Parse MM/DD/YY or MM/DD/YYYY into a Date; appends to errors on failure. */
function parseDateStr(dateStr: string, errors: string[]): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    errors.push(`Cannot parse date: "${dateStr}"`);
    return null;
  }
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000; // 26 → 2026
  const d = new Date(year, parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
  if (!isNaN(d.getTime())) return d;
  errors.push(`Cannot parse date: "${dateStr}"`);
  return null;
}

/**
 * Parse a "MMM DD" date (e.g. "Apr 16") and infer the year.
 * Uses the current year unless the resulting date is more than 30 days in the
 * future, in which case it falls back to the previous year (handles Dec→Jan
 * paste sessions).
 */
function parseMonthDay(line: string, errors: string[]): Date | null {
  const m = line.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})$/i);
  if (!m) {
    errors.push(`Cannot parse date: "${line}"`);
    return null;
  }
  const month = MONTH_IDX[m[1].toLowerCase()];
  const day = parseInt(m[2], 10);
  const now = new Date();
  const year = new Date(now.getFullYear(), month, day) >
    new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    ? now.getFullYear() - 1
    : now.getFullYear();
  return new Date(year, month, day);
}

/** Parse "MMM DD, YYYY" (e.g. "Apr 12, 2026") into a Date; appends to errors on failure. */
function parseDateMonthDayYear(line: string, errors: string[]): Date | null {
  const m = line.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s*(\d{4})$/i,
  );
  if (!m) {
    errors.push(`Cannot parse date: "${line}"`);
    return null;
  }
  const d = new Date(parseInt(m[3], 10), MONTH_IDX[m[1].toLowerCase()], parseInt(m[2], 10));
  if (!isNaN(d.getTime())) return d;
  errors.push(`Cannot parse date: "${line}"`);
  return null;
}

/** Parse MM-DD-YYYY (dashes, 4-digit year) into a Date; appends to errors on failure. */
function parseDateDashed(dateStr: string, errors: string[]): Date | null {
  const m = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) {
    errors.push(`Cannot parse date: "${dateStr}"`);
    return null;
  }
  const d = new Date(parseInt(m[3], 10), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
  if (!isNaN(d.getTime())) return d;
  errors.push(`Cannot parse date: "${dateStr}"`);
  return null;
}

// ─── Amount helper ────────────────────────────────────────────────────────────

/**
 * Extract the FIRST dollar amount from a line that may contain multiple values.
 *
 *   "$60.21"               → 60.21
 *   "-$60.21"              → -60.21
 *   "$-60.21"              → -60.21
 *   "$50.00    $16,896.48" → 50   (running balance ignored)
 *   "60.21"                → 60.21
 */
function parseFirstAmount(line: string): number | null {
  const trimmed = line.trim();
  const match = trimmed.match(/(-?\$-?|-?\$|^-?)([\d,]+\.?\d*)/);
  if (!match) return null;
  const digits = match[2].replace(/,/g, '');
  const num = parseFloat(digits);
  if (isNaN(num)) return null;
  return match[1].includes('-') ? -Math.abs(num) : num;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse raw bank statement text into transaction rows.
 *
 * Supports Format A, Format B, and Format C — all three may appear in a single
 * paste. Blocks may be separated by blank lines; unrecognised lines are ignored.
 * Rows with parseErrors.length > 0 are flagged for manual review before inserting.
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

    // ── Format A / Format F ──────────────────────────────────────────────────
    // Format A: amount on a follow-on line.  Format F: amount on the header line.
    if (FORMAT_A.test(line)) {
      const m = line.match(
        /^Transaction Details for Row \d+[\s\t]+(\d{1,2}\/\d{1,2}\/\d{2,4})[\s\t]+(.*?)$/i,
      );
      let date: Date | null = null;
      let description = '';
      // undefined = not detected (scan follow-on lines); null/number = inline amount
      let inlineAmount: number | null | undefined = undefined;

      if (m) {
        date = parseDateStr(m[1], errors);
        const descTail = m[2].trim();
        // Format F: "DESCRIPTION\t$26.78" or "DESCRIPTION    $26.78" — amount on same line
        const inlineAmtMatch = descTail.match(/^(.*?)\s+(-?\$[\d,]+\.?\d*)\s*$/);
        if (inlineAmtMatch) {
          description = inlineAmtMatch[1].trim();
          inlineAmount = parseFirstAmount(inlineAmtMatch[2]);
          if (inlineAmount === null) errors.push('No amount found');
        } else {
          description = descTail;
        }
        if (!description) errors.push('Description is empty');
      } else {
        errors.push('Header did not match expected format');
      }

      i++;
      if (inlineAmount !== undefined) {
        rows.push({ id: crypto.randomUUID(), date, description, notes: '', amount: inlineAmount, parseErrors: errors });
      } else {
        const amount = scanForAmount(lines, i, errors, (next) => {
          if (/^#/.test(next)) return 'skip'; // card-suffix line
          return 'try';
        });
        i = amount.nextIndex;
        rows.push({ id: crypto.randomUUID(), date, description, notes: '', amount: amount.value, parseErrors: errors });
      }

    // ── Format B ────────────────────────────────────────────────────────────
    } else if (FORMAT_B.test(line)) {
      const m = line.match(
        /^(\d{1,2}\/\d{1,2}\/\d{2,4})[\s\t]+\d{1,2}\/\d{1,2}\/\d{2,4}[\s\t]+(.*?)$/,
      );
      let date: Date | null = null;
      let description = '';
      if (m) {
        date = parseDateStr(m[1], errors);
        description = m[2].trim();
        if (!description) errors.push('Description is empty');
      } else {
        errors.push('Header did not match expected format');
      }

      i++;
      const amount = scanForAmount(lines, i, errors, (next) => {
        if (/^#/.test(next)) return 'skip'; // reference line
        return 'try';
      });
      i = amount.nextIndex;

      rows.push({ id: crypto.randomUUID(), date, description, notes: '', amount: amount.value, parseErrors: errors });

    // ── Format G ────────────────────────────────────────────────────────────
    } else if (FORMAT_G.test(line)) {
      // "MM/DD/YY    DESCRIPTION    $AMOUNT    [optional trailing text]"
      const m = line.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})[\s\t]+(.*)/);
      let date: Date | null = null;
      let description = '';
      let amount: number | null = null;

      if (m) {
        date = parseDateStr(m[1], errors);
        const rest = m[2];
        // Description is everything before the first 2+-space-delimited $AMOUNT
        const amtMatch = rest.match(/^(.*?)\s+(-?\$[\d,]+\.?\d*)/);
        if (amtMatch) {
          description = amtMatch[1].trim();
          amount = parseFirstAmount(amtMatch[2]);
        } else {
          description = rest.trim();
          errors.push('No amount found');
        }
        if (!description) errors.push('Description is empty');
      } else {
        errors.push('Header did not match expected format');
      }

      i++;
      rows.push({ id: crypto.randomUUID(), date, description, notes: '', amount, parseErrors: errors });

    // ── Format D ────────────────────────────────────────────────────────────
    } else if (FORMAT_D.test(line)) {
      const date = parseDateDashed(line, errors);
      i++;

      // Skip the blank/space separator line, then read the single data line
      let description = '';
      let amount: number | null = null;

      while (i < lines.length && !isTransactionHeader(lines[i])) {
        const next = lines[i].trim();
        i++;
        if (!next) continue; // blank separator — skip

        // Data line: "DESCRIPTION    Sale/Return    **XXXX    $AMOUNT"
        // Description = everything before the first 2+-space separator
        const firstField = next.match(/^(.+?)\s{2,}/);
        description = firstField ? firstField[1].trim() : next.trim();

        // Amount = first dollar-sign value anywhere on the line
        amount = parseFirstAmount(next);
        break; // entire block is on this one line
      }

      if (!description) errors.push('Description is empty');
      if (amount === null) errors.push('No amount found');

      rows.push({ id: crypto.randomUUID(), date, description, notes: '', amount, parseErrors: errors });

    // ── Format E ────────────────────────────────────────────────────────────
    } else if (FORMAT_E.test(line)) {
      const date = parseDateMonthDayYear(line, errors);
      i++;

      // Skip cardholder name — always the first non-empty line after the date
      while (i < lines.length && !isTransactionHeader(lines[i])) {
        const next = lines[i].trim();
        i++;
        if (!next) continue;
        break; // consumed
      }

      // Read description — next non-empty line
      let description = '';
      while (i < lines.length && !isTransactionHeader(lines[i])) {
        const next = lines[i].trim();
        i++;
        if (!next) continue;
        description = next;
        break;
      }
      if (!description) errors.push('Description is empty');

      // Scan for first line that starts with $ or -$ (skips promo text and stops after amount)
      const amount = scanForAmount(lines, i, errors, (next) =>
        /^-?\$/.test(next) ? 'try' : 'skip',
      );
      i = amount.nextIndex;

      rows.push({ id: crypto.randomUUID(), date, description, notes: '', amount: amount.value, parseErrors: errors });

    // ── Format H ────────────────────────────────────────────────────────────
    } else if (FORMAT_H.test(line)) {
      // "Pending (MM-DD-YYYY)     DESCRIPTION    TYPE    [CARD]    $AMOUNT"
      const dateMatch = line.match(/\((\d{2}-\d{2}-\d{4})\)/);
      const date = dateMatch ? parseDateDashed(dateMatch[1], errors) : null;
      if (!dateMatch) errors.push('No date found');

      // Everything after the closing paren is the data portion
      const rest = line.replace(/^Pending\s*\(\d{2}-\d{2}-\d{4}\)\s*/i, '');
      let description = '';
      let amount: number | null = null;

      if (rest) {
        const firstField = rest.match(/^(.+?)\s{2,}/);
        description = firstField ? firstField[1].trim() : rest.trim();
        amount = parseFirstAmount(rest);
      }

      if (!description) errors.push('Description is empty');
      if (amount === null) errors.push('No amount found');

      i++;
      rows.push({ id: crypto.randomUUID(), date, description, notes: '', amount, parseErrors: errors });

    // ── Format C ────────────────────────────────────────────────────────────
    } else {
      const date = parseMonthDay(line, errors);
      i++;

      // Skip optional status line ("Pending", "Posted", etc.)
      if (i < lines.length && /^(Pending|Posted)\s*$/i.test(lines[i])) {
        i++;
      }

      // Read description: first non-empty, non-footer line
      let description = '';
      while (i < lines.length && !isTransactionHeader(lines[i])) {
        const next = lines[i].trim();
        i++;
        if (!next || /^Show Transaction$/i.test(next)) continue;
        description = next;
        break;
      }
      if (!description) errors.push('Description is empty');

      // Scan for amount: skip cardholder initials (exactly 2 uppercase) and "Show Transaction"
      const amount = scanForAmount(lines, i, errors, (next) => {
        if (/^Show Transaction$/i.test(next)) return 'stop';
        if (/^[A-Z]{2}$/.test(next)) return 'skip'; // MH, LH, etc.
        return 'try';
      });
      i = amount.nextIndex;

      rows.push({ id: crypto.randomUUID(), date, description, notes: '', amount: amount.value, parseErrors: errors });
    }
  }

  const US_STATE_SUFFIX =
    /\s+(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)$/;

  // Trim "ONLINE TRANSFER" descriptions: keep those two words, move the rest to notes.
  // Strip trailing US state abbreviations from all descriptions.
  for (const row of rows) {
    if (/^ONLINE TRANSFER\b/i.test(row.description)) {
      row.notes = row.description.slice('ONLINE TRANSFER'.length).trim();
      row.description = 'ONLINE TRANSFER';
    }
    row.description = row.description.replace(US_STATE_SUFFIX, '');
  }

  return rows;
}

// ─── Internal scanner ─────────────────────────────────────────────────────────

type LineDecision = 'try' | 'skip' | 'stop';

/**
 * Advance through lines starting at index `start`, stopping at the next
 * transaction header or when the classifier returns 'stop'.
 * Returns the first parsed amount found (or null) and the new line index.
 */
function scanForAmount(
  lines: string[],
  start: number,
  errors: string[],
  classify: (line: string) => LineDecision,
): { value: number | null; nextIndex: number } {
  let i = start;
  while (i < lines.length && !isTransactionHeader(lines[i])) {
    const next = lines[i].trim();
    i++;
    if (!next) continue;

    const decision = classify(next);
    if (decision === 'stop') break;
    if (decision === 'skip') continue;

    const parsed = parseFirstAmount(next);
    if (parsed !== null) return { value: parsed, nextIndex: i };
  }
  errors.push('No amount found');
  return { value: null, nextIndex: i };
}

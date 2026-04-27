import { parseTransactionPaste } from '../../utils/parseTransactionPaste';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Builders ─────────────────────────────────────────────────────────────────

function blockA(n: number, date: string, desc: string, ref: string, amount: string): string {
  return `Transaction Details for Row ${n}    ${date}    ${desc}\n${ref}\n${amount}`;
}

function blockB(date: string, desc: string, ref: string, amount: string): string {
  return `${date}    ${date}    ${desc}\n${ref}\n${amount}`;
}

/**
 * Format D block: MM-DD-YYYY date, blank line, single data line.
 * type defaults to "Sale". Card suffix is optional.
 */
function blockD(
  date: string,
  desc: string,
  amount: string,
  type = 'Sale',
  cardSuffix = '**9999',
): string {
  const dataLine = cardSuffix
    ? `${desc}    ${type}    ${cardSuffix}    ${amount}`
    : `${desc}    ${type}        ${amount}`;
  return `${date}\n \n${dataLine}`;
}

/** Format C block with optional "Pending" status line and 2-letter initials. */
function blockC(
  date: string,
  desc: string,
  amount: string,
  initials = 'MH',
  pending = false,
): string {
  const statusLine = pending ? 'Pending' : '';
  return [date, statusLine, desc, '', initials, amount, '', 'Show Transaction']
    .filter((l) => l !== undefined)
    .join('\n');
}

/** Format F: Transaction Details header with amount on the same line. */
function blockF(n: number, date: string, desc: string, amount: string): string {
  return `Transaction Details for Row ${n}    ${date}    ${desc}    ${amount}`;
}

/** Format G: single-date single-line debit — "MM/DD/YY    DESCRIPTION    $AMOUNT". */
function blockG(date: string, desc: string, amount: string): string {
  return `${date}    ${desc}    ${amount}`;
}

/** Format H: Target pending — "Pending (MM-DD-YYYY)     DESCRIPTION    TYPE    [CARD]    $AMOUNT". */
function blockH(date: string, desc: string, amount: string, type = 'Sale', cardSuffix = ''): string {
  const card = cardSuffix ? `    ${cardSuffix}` : '       ';
  return `Pending (${date})     ${desc}    ${type}${card}    ${amount}`;
}

/**
 * Format E block: "MMM DD, YYYY" date, cardholder name, description,
 * optional promo line, transaction amount, running balance.
 */
function blockE(
  date: string,
  cardholder: string,
  desc: string,
  amount: string,
  runningBalance = '$999.00',
  promoLine?: string,
): string {
  const lines = [date, cardholder, desc];
  if (promoLine) lines.push(promoLine);
  lines.push(amount, runningBalance);
  return lines.join('\n');
}

/**
 * Mirror the year-inference logic used by the parser so test assertions stay
 * correct regardless of when the tests are run.
 */
function inferredYear(month: number, day: number): number {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), month, day);
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return candidate > thirtyDaysAhead ? now.getFullYear() - 1 : now.getFullYear();
}

// ─────────────────────────────────────────────────────────────────────────────

describe('parseTransactionPaste', () => {
  // ── Return value shape ────────────────────────────────────────────────────

  describe('return value shape', () => {
    it('should return an empty array for an empty string', () => {
      expect(parseTransactionPaste('')).toEqual([]);
    });

    it('should return an empty array when no transaction header is found', () => {
      expect(parseTransactionPaste('just some random\ntext with no blocks')).toEqual([]);
    });

    it('should assign a valid unique UUID to each row', () => {
      const raw = [blockA(1, '04/16/26', 'FOOD MART', '#...9999', '$60.21'),
                   blockA(2, '04/16/26', 'THRIFT WORLD', '#...9999', '$60.47')].join('\n');
      const rows = parseTransactionPaste(raw);

      expect(rows).toHaveLength(2);
      expect(rows[0].id).toMatch(UUID_REGEX);
      expect(rows[1].id).toMatch(UUID_REGEX);
      expect(rows[0].id).not.toBe(rows[1].id);
    });
  });

  // ── Format A ─────────────────────────────────────────────────────────────

  describe('Format A — labeled row header', () => {
    it('should parse a single transaction', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'FOOD MART 55555', '#...9999', '$60.21'));
      expect(row.description).toBe('FOOD MART 55555');
      expect(row.amount).toBe(60.21);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the date from a 2-digit year', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'FOOD MART', '#...9999', '$60.21'));
      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getMonth()).toBe(3); // April (0-indexed)
      expect(row.date!.getDate()).toBe(16);
    });

    it('should parse the date from a 4-digit year', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/2026', 'FOOD MART', '#...9999', '$60.21'));
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getDate()).toBe(16);
    });

    it('should parse multiple consecutive blocks', () => {
      const raw = [
        blockA(1, '04/16/26', 'FOOD MART 55555', '#...9999', '$60.21'),
        blockA(2, '04/16/26', 'THRIFT WORLD - 9876', '#...9999', '$60.47'),
        blockA(3, '04/16/26', 'BUDGET STORE', '#...9999', '$29.73'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows.map((r) => r.description)).toEqual(['FOOD MART 55555', 'THRIFT WORLD - 9876', 'BUDGET STORE']);
    });

    it('should ignore the card-suffix line (#...XXXX)', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'FOOD MART', '#...9999', '$60.21'));
      expect(row.description).not.toContain('#');
      expect(row.parseErrors).toHaveLength(0);
    });

    it("should preserve descriptions with special characters (apostrophe, numbers)", () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', "BURGER JOINT 'S F99999", '#...9999', '$1.07'));
      expect(row.description).toBe("BURGER JOINT 'S F99999");
    });
  });

  // ── Format B ─────────────────────────────────────────────────────────────

  describe('Format B — plain double-date header', () => {
    it('should parse a single transaction', () => {
      const [row] = parseTransactionPaste(
        blockB('04/13/26', 'WEBPAY*LAKEWOOD-DISTRICT 555-867-5309 XX', '#1234567FXXYYZZ001', '$50.00    $12,345.67'),
      );
      expect(row.description).toBe('WEBPAY*LAKEWOOD-DISTRICT 555-867-5309 XX');
      expect(row.amount).toBe(50);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should use the first (posted) date when two dates appear on the header', () => {
      const [row] = parseTransactionPaste('04/13/26    04/15/26    SOME MERCHANT\n#REF\n$25.00');
      expect(row.date!.getMonth()).toBe(3);
      expect(row.date!.getDate()).toBe(13);
    });

    it('should ignore the alphanumeric reference line', () => {
      const [row] = parseTransactionPaste(
        blockB('04/13/26', "JOHN'S DISCOUNT FOODS RIVERSIDE XX", '#9876543FAABBCC002', '$44.55    $12,295.67'),
      );
      expect(row.description).toBe("JOHN'S DISCOUNT FOODS RIVERSIDE XX");
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should extract only the first (charge) amount and ignore the running balance', () => {
      const [row] = parseTransactionPaste(
        blockB('04/13/26', 'BRAKES PLUS 112233 SPRINGFIELD XX', '#REF', '$41.03    $12,245.27'),
      );
      expect(row.amount).toBe(41.03);
      expect(row.amount).not.toBe(12245.27);
    });

    it('should parse multiple consecutive blocks', () => {
      const raw = [
        blockB('04/13/26', 'MERCHANT A', '#REF1', '$50.00    $100.00'),
        blockB('04/12/26', 'MERCHANT B', '#REF2', '$44.55    $50.00'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0].amount).toBe(50);
      expect(rows[1].amount).toBe(44.55);
    });
  });

  // ── Format C ─────────────────────────────────────────────────────────────

  describe('Format C — mobile/app card view', () => {
    it('should parse a pending transaction', () => {
      const raw = blockC('Apr 16', 'FOOD MART', '$1.89', 'MH', true);
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe('FOOD MART');
      expect(row.amount).toBe(1.89);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse a posted (non-pending) transaction', () => {
      const raw = blockC("Apr 13", "SAM'S CORNER MART #5 RIVERSIDE XX", '$44.45', 'MH', false);
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe("SAM'S CORNER MART #5 RIVERSIDE XX");
      expect(row.amount).toBe(44.45);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the month and day correctly', () => {
      const [row] = parseTransactionPaste(blockC('Apr 16', 'FOOD MART', '$1.89'));
      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getMonth()).toBe(3); // April
      expect(row.date!.getDate()).toBe(16);
    });

    it('should infer the current year for recent dates', () => {
      const [row] = parseTransactionPaste(blockC('Apr 16', 'FOOD MART', '$1.89'));
      expect(row.date!.getFullYear()).toBe(inferredYear(3, 16));
    });

    it('should infer the previous year when the date would be > 30 days in the future', () => {
      // Pick a date 60 days from now — should fall back to last year
      const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const monthAbbrevs = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const dateStr = `${monthAbbrevs[future.getMonth()]} ${future.getDate()}`;

      const [row] = parseTransactionPaste(blockC(dateStr, 'FUTURE MERCHANT', '$9.99'));
      expect(row.date!.getFullYear()).toBe(new Date().getFullYear() - 1);
    });

    it('should skip the "Pending" status line', () => {
      const raw = 'Apr 16\nPending\nFOOD MART\n\nMH\n$1.89\n\nShow Transaction';
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe('FOOD MART');
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should skip the cardholder initials line (MH)', () => {
      const [row] = parseTransactionPaste(blockC('Apr 16', 'FOOD MART', '$1.89', 'MH'));
      expect(row.amount).toBe(1.89);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should skip the cardholder initials line (LH)', () => {
      const [row] = parseTransactionPaste(blockC('Apr 12', 'GENERAL STORE 011445SPRINGFIELD XX', '$5.40', 'LH'));
      expect(row.amount).toBe(5.40);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should skip the "Show Transaction" footer', () => {
      // If Show Transaction were parsed as description or amount it would create errors
      const [row] = parseTransactionPaste(blockC('Apr 16', 'FOOD MART', '$1.89'));
      expect(row.description).toBe('FOOD MART');
      expect(row.amount).toBe(1.89);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse multiple consecutive blocks', () => {
      const raw = [
        blockC('Apr 16', 'FOOD MART', '$1.89', 'MH', true),
        blockC('Apr 16', 'GENERAL STORE T9999', '$17.28', 'MH', true),
        blockC('Apr 13', "SAM'S CORNER MART #5 RIVERSIDE XX", '$44.45', 'MH', false),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toMatchObject({ description: 'FOOD MART', amount: 1.89 });
      expect(rows[1]).toMatchObject({ description: 'GENERAL STORE T9999', amount: 17.28 });
      expect(rows[2]).toMatchObject({ description: "SAM'S CORNER MART #5 RIVERSIDE XX", amount: 44.45 });
    });

    it('should handle all months of the year', () => {
      const months = [
        ['Jan', 0], ['Feb', 1], ['Mar', 2], ['Apr', 3],
        ['May', 4], ['Jun', 5], ['Jul', 6], ['Aug', 7],
        ['Sep', 8], ['Oct', 9], ['Nov', 10], ['Dec', 11],
      ] as [string, number][];

      for (const [abbrev, monthIdx] of months) {
        const [row] = parseTransactionPaste(blockC(`${abbrev} 15`, 'MERCHANT', '$10.00'));
        expect(row.date!.getMonth()).toBe(monthIdx);
        expect(row.date!.getDate()).toBe(15);
        expect(row.parseErrors).toHaveLength(0);
      }
    });
  });

  // ── Format D ─────────────────────────────────────────────────────────────

  describe('Format D — tabular single-line export', () => {
    it('should parse a single Sale transaction', () => {
      const [row] = parseTransactionPaste(
        blockD('03-10-2026', 'GENERAL STORE 9999 SPRINGFIELD XX', '$23.69'),
      );
      expect(row.description).toBe('GENERAL STORE 9999 SPRINGFIELD XX');
      expect(row.amount).toBe(23.69);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the date from MM-DD-YYYY format', () => {
      const [row] = parseTransactionPaste(
        blockD('03-10-2026', 'GENERAL STORE 9999 SPRINGFIELD XX', '$23.69'),
      );
      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getMonth()).toBe(2); // March (0-indexed)
      expect(row.date!.getDate()).toBe(10);
    });

    it('should parse a Return (negative amount)', () => {
      const [row] = parseTransactionPaste(
        blockD('03-09-2026', 'GENERAL STORE.COM 800-555- CREDIT', '-$2.25', 'Return', ''),
      );
      expect(row.description).toBe('GENERAL STORE.COM 800-555- CREDIT');
      expect(row.amount).toBe(-2.25);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should ignore the card suffix (**XXXX) and transaction type field', () => {
      const [row] = parseTransactionPaste(
        blockD('03-10-2026', 'GENERAL STORE 9999 SPRINGFIELD XX', '$2.51', 'Sale', '**9999'),
      );
      expect(row.description).toBe('GENERAL STORE 9999 SPRINGFIELD XX');
      expect(row.description).not.toContain('**');
      expect(row.description).not.toContain('Sale');
    });

    it('should extract the description as the first field before the 2+-space separator', () => {
      const raw = '03-10-2026\n \nGENERAL STORE 9999 SPRINGFIELD XX    Sale    **9999    $23.69';
      const [row] = parseTransactionPaste(raw);
      expect(row.description).toBe('GENERAL STORE 9999 SPRINGFIELD XX');
    });

    it('should tolerate the blank/space separator line between date and data line', () => {
      // Space-only separator (as seen in the real paste)
      const raw = '03-10-2026\n \nGENERAL STORE 9999 SPRINGFIELD XX    Sale    **9999    $23.69';
      expect(parseTransactionPaste(raw)[0].parseErrors).toHaveLength(0);

      // Blank separator
      const raw2 = '03-10-2026\n\nGENERAL STORE 9999 SPRINGFIELD XX    Sale    **9999    $23.69';
      expect(parseTransactionPaste(raw2)[0].parseErrors).toHaveLength(0);
    });

    it('should parse multiple consecutive Format D blocks', () => {
      const raw = [
        blockD('03-10-2026', 'GENERAL STORE 9999 SPRINGFIELD XX', '$23.69'),
        blockD('03-10-2026', 'GENERAL STORE 9999 SPRINGFIELD XX', '$2.51'),
        blockD('03-09-2026', 'GENERAL STORE.COM 800-555- CREDIT', '-$2.25', 'Return', ''),
        blockD('03-09-2026', 'GENERAL STORE 9999 SPRINGFIELD XX', '$18.17'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(4);
      expect(rows[0]).toMatchObject({ description: 'GENERAL STORE 9999 SPRINGFIELD XX', amount: 23.69 });
      expect(rows[1]).toMatchObject({ description: 'GENERAL STORE 9999 SPRINGFIELD XX', amount: 2.51 });
      expect(rows[2]).toMatchObject({ description: 'GENERAL STORE.COM 800-555- CREDIT', amount: -2.25 });
      expect(rows[3]).toMatchObject({ description: 'GENERAL STORE 9999 SPRINGFIELD XX', amount: 18.17 });
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });

    it('should flag a row when the data line is missing', () => {
      const raw = '03-10-2026\n \n03-11-2026'; // second date immediately follows
      const [row] = parseTransactionPaste(raw);
      expect(row.amount).toBeNull();
      expect(row.parseErrors.some((e) => e.toLowerCase().includes('amount'))).toBe(true);
    });

    it('should parse the real-world 4-row Format D sample', () => {
      const raw = `03-10-2026

GENERAL STORE 9999 SPRINGFIELD XX    Sale    **9999    $23.69
03-10-2026

GENERAL STORE 9999 SPRINGFIELD XX    Sale    **9999    $2.51
03-09-2026

GENERAL STORE.COM 800-555- CREDIT    Return        -$2.25
03-09-2026

GENERAL STORE 9999 SPRINGFIELD XX    Sale    **9999    $18.17    `;

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(4);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));

      expect(rows[0]).toMatchObject({ description: 'GENERAL STORE 9999 SPRINGFIELD XX', amount: 23.69 });
      expect(rows[1]).toMatchObject({ description: 'GENERAL STORE 9999 SPRINGFIELD XX', amount: 2.51 });
      expect(rows[2]).toMatchObject({ description: 'GENERAL STORE.COM 800-555- CREDIT', amount: -2.25 });
      expect(rows[3]).toMatchObject({ description: 'GENERAL STORE 9999 SPRINGFIELD XX', amount: 18.17 });

      // Dates
      expect(rows[0].date!.getMonth()).toBe(2); // March
      expect(rows[0].date!.getDate()).toBe(10);
      expect(rows[2].date!.getDate()).toBe(9);
    });
  });

  // ── Format E ─────────────────────────────────────────────────────────────

  describe('Format E — Citi-style card view (MMM DD, YYYY)', () => {
    it('should parse a transaction without a promo line', () => {
      const [row] = parseTransactionPaste(
        blockE('Apr 12, 2026', 'JANE DOE', 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', '$3.23'),
      );
      expect(row.description).toBe('WAREHOUSE CLUB #1234 SPRINGFIELD XX');
      expect(row.amount).toBe(3.23);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse a transaction with an optional promo line', () => {
      const [row] = parseTransactionPaste(
        blockE(
          'Apr 12, 2026',
          'JANE DOE',
          'WAREHOUSE CLUB #1234 SPRINGFIELD XX',
          '$122.84',
          '$5,678.90',
          'Eligible for Citi® Flex Pay',
        ),
      );
      expect(row.description).toBe('WAREHOUSE CLUB #1234 SPRINGFIELD XX');
      expect(row.amount).toBe(122.84);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the date from "MMM DD, YYYY" format', () => {
      const [row] = parseTransactionPaste(
        blockE('Apr 12, 2026', 'JANE DOE', 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', '$3.23'),
      );
      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getMonth()).toBe(3); // April (0-indexed)
      expect(row.date!.getDate()).toBe(12);
    });

    it('should parse single-digit days ("Apr 7, 2026")', () => {
      const [row] = parseTransactionPaste(
        blockE('Apr 07, 2026', 'JANE DOE', 'SOME MERCHANT', '$15.98'),
      );
      expect(row.date!.getDate()).toBe(7);
    });

    it('should skip the cardholder name line', () => {
      const [row] = parseTransactionPaste(
        blockE('Apr 12, 2026', 'JANE DOE', 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', '$3.23'),
      );
      expect(row.description).not.toContain('JANE');
      expect(row.description).toBe('WAREHOUSE CLUB #1234 SPRINGFIELD XX');
    });

    it('should skip optional promo text and still find the amount', () => {
      const raw = [
        'Apr 12, 2026',
        'JANE DOE',
        'WAREHOUSE CLUB #1234 SPRINGFIELD XX',
        'Eligible for Citi® Flex Pay',
        '$122.84',
        '$5,678.90',
      ].join('\n');
      const [row] = parseTransactionPaste(raw);
      expect(row.amount).toBe(122.84);
      expect(row.description).toBe('WAREHOUSE CLUB #1234 SPRINGFIELD XX');
    });

    it('should take the first dollar amount and ignore the running balance', () => {
      const [row] = parseTransactionPaste(
        blockE('Apr 12, 2026', 'JANE DOE', 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', '$122.84', '$5,678.90'),
      );
      expect(row.amount).toBe(122.84);
      expect(row.amount).not.toBe(5678.90);
    });

    it('should not be confused by a # in the description', () => {
      const [row] = parseTransactionPaste(
        blockE('Apr 12, 2026', 'JANE DOE', 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', '$3.23'),
      );
      expect(row.description).toContain('#1234');
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse multiple consecutive blocks', () => {
      const raw = [
        blockE('Apr 12, 2026', 'JANE DOE', 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', '$122.84', '$5,678.90', 'Eligible for Citi® Flex Pay'),
        blockE('Apr 12, 2026', 'JANE DOE', 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', '$3.23', '$5,555.06'),
        blockE('Apr 07, 2026', 'JANE DOE', '7890 PARKWAY AVE CENTERVILLE XX', '$15.98', '$5,551.83'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
      expect(rows[0]).toMatchObject({ description: 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', amount: 122.84 });
      expect(rows[1]).toMatchObject({ description: 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', amount: 3.23 });
      expect(rows[2]).toMatchObject({ description: '7890 PARKWAY AVE CENTERVILLE XX', amount: 15.98 });
    });

    it('should not confuse Format E ("Apr 12, 2026") with Format C ("Apr 16")', () => {
      const raw = [
        blockE('Apr 12, 2026', 'JANE DOE', 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', '$3.23'),
        blockC('Apr 16', 'FOOD MART', '$1.89', 'MH', false),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ description: 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', amount: 3.23 });
      expect(rows[0].date!.getFullYear()).toBe(2026);
      expect(rows[1]).toMatchObject({ description: 'FOOD MART', amount: 1.89 });
    });

    it('should parse the real-world 3-row Format E sample', () => {
      const raw = `Apr 12, 2026
JANE DOE
WAREHOUSE CLUB #1234 SPRINGFIELD XX
Eligible for Citi® Flex Pay
$122.84
$5,678.90
Apr 12, 2026
JANE DOE
WAREHOUSE CLUB #1234 SPRINGFIELD XX
$3.23
$5,555.06
Apr 07, 2026
JANE DOE
7890 PARKWAY AVE CENTERVILLE XX
$15.98
$5,551.83`;

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));

      expect(rows[0]).toMatchObject({ description: 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', amount: 122.84 });
      expect(rows[1]).toMatchObject({ description: 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', amount: 3.23 });
      expect(rows[2]).toMatchObject({ description: '7890 PARKWAY AVE CENTERVILLE XX', amount: 15.98 });

      expect(rows[0].date!.getFullYear()).toBe(2026);
      expect(rows[0].date!.getMonth()).toBe(3); // April
      expect(rows[0].date!.getDate()).toBe(12);
      expect(rows[2].date!.getDate()).toBe(7);
    });
  });

  // ── Format F ─────────────────────────────────────────────────────────────

  describe('Format F — labeled row header with inline amount', () => {
    it('should parse a single transaction with inline amount', () => {
      const [row] = parseTransactionPaste(
        blockF(2, '04/27/26', 'ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX', '$26.78'),
      );
      expect(row.description).toBe('ONLINE TRANSFER');
      expect(row.notes).toBe('FROM SAVINGS REF #XXXXXXXXXX');
      expect(row.amount).toBe(26.78);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the date correctly', () => {
      const [row] = parseTransactionPaste(
        blockF(2, '04/27/26', 'ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX', '$26.78'),
      );
      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getMonth()).toBe(3); // April
      expect(row.date!.getDate()).toBe(27);
    });

    it('should parse multiple consecutive Format F blocks', () => {
      const raw = [
        blockF(2, '04/27/26', 'ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX', '$26.78'),
        blockF(3, '04/27/26', 'ONLINE TRANSFER FROM CHECKING REF #YYYYYYYYYY', '$20.09'),
      ].join('\n');
      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM SAVINGS REF #XXXXXXXXXX', amount: 26.78 });
      expect(rows[1]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM CHECKING REF #YYYYYYYYYY', amount: 20.09 });
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });

    it('should parse inline amount when separated by a single tab', () => {
      const raw = `Transaction Details for Row 2\t04/27/26\tONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX\t$26.78`;
      const [row] = parseTransactionPaste(raw);
      expect(row.description).toBe('ONLINE TRANSFER');
      expect(row.notes).toBe('FROM SAVINGS REF #XXXXXXXXXX');
      expect(row.amount).toBe(26.78);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should not confuse Format F (inline $) with Format A (follow-on $ line)', () => {
      const raw = [
        blockF(1, '04/27/26', 'INLINE AMOUNT TRANSFER', '$26.78'),
        blockA(2, '04/27/26', 'FOLLOW ON AMOUNT', '#...9999', '$60.21'),
      ].join('\n');
      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ description: 'INLINE AMOUNT TRANSFER', amount: 26.78 });
      expect(rows[1]).toMatchObject({ description: 'FOLLOW ON AMOUNT', amount: 60.21 });
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });
  });

  // ── Format G ─────────────────────────────────────────────────────────────

  describe('Format G — single-date single-line debit', () => {
    it('should parse a single transaction', () => {
      const [row] = parseTransactionPaste(
        blockG('04/24/26', 'ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A', '$21.76'),
      );
      expect(row.description).toBe('ONLINE TRANSFER');
      expect(row.notes).toBe('FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A');
      expect(row.amount).toBe(21.76);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the date correctly', () => {
      const [row] = parseTransactionPaste(blockG('04/24/26', 'BANK REWARDS CREDIT', '$164.16'));
      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getMonth()).toBe(3); // April
      expect(row.date!.getDate()).toBe(24);
    });

    it('should parse multiple consecutive Format G blocks', () => {
      const raw = [
        blockG('04/24/26', 'ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A', '$21.76'),
        blockG('04/24/26', 'ONLINE TRANSFER FROM CHECKING REF #YYYYYYYYYY WAY2SAVE SAVINGS STORE B', '$10.88'),
        blockG('04/21/26', 'BANK REWARDS CREDIT', '$164.16'),
      ].join('\n');
      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A', amount: 21.76 });
      expect(rows[1]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM CHECKING REF #YYYYYYYYYY WAY2SAVE SAVINGS STORE B', amount: 10.88 });
      expect(rows[2]).toMatchObject({ description: 'BANK REWARDS CREDIT', amount: 164.16 });
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });

    it('should parse amount when separated by a single tab', () => {
      const raw = `04/24/26\tONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A\t$21.76`;
      const [row] = parseTransactionPaste(raw);
      expect(row.description).toBe('ONLINE TRANSFER');
      expect(row.notes).toBe('FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A');
      expect(row.amount).toBe(21.76);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should ignore trailing text after the amount', () => {
      const raw = '04/21/26    BANK REWARDS CREDIT    $164.16     here is some example text.';
      const [row] = parseTransactionPaste(raw);
      expect(row.description).toBe('BANK REWARDS CREDIT');
      expect(row.amount).toBe(164.16);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should ignore a "Posted Transactions" section header between blocks', () => {
      const raw = [
        'Posted Transactions',
        blockG('04/24/26', 'ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A', '$21.76'),
        blockG('04/21/26', 'BANK REWARDS CREDIT', '$164.16'),
      ].join('\n');
      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });

    it('should parse a debit account sample with inline-amount and single-line rows', () => {
      const raw = `Transaction Details for Row 2    04/27/26    ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX    $26.78
Transaction Details for Row 3    04/27/26    ONLINE TRANSFER FROM CHECKING REF #YYYYYYYYYY    $20.09
Posted Transactions
04/24/26    ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A    $21.76
04/24/26    ONLINE TRANSFER FROM CHECKING REF #YYYYYYYYYY WAY2SAVE SAVINGS STORE B    $10.88
04/21/26    BANK REWARDS CREDIT    $164.16`;
      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(5);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
      expect(rows[0]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM SAVINGS REF #XXXXXXXXXX', amount: 26.78 });
      expect(rows[1]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM CHECKING REF #YYYYYYYYYY', amount: 20.09 });
      expect(rows[2]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A', amount: 21.76 });
      expect(rows[3]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM CHECKING REF #YYYYYYYYYY WAY2SAVE SAVINGS STORE B', amount: 10.88 });
      expect(rows[4]).toMatchObject({ description: 'BANK REWARDS CREDIT', amount: 164.16 });
      expect(rows[0].date!.getMonth()).toBe(3); // April
      expect(rows[0].date!.getDate()).toBe(27);
      expect(rows[4].date!.getDate()).toBe(21);
    });

    it('should not confuse Format G with Format B (double-date)', () => {
      const raw = [
        blockG('04/24/26', 'SINGLE DATE MERCHANT', '$21.76'),
        blockB('04/13/26', 'DOUBLE DATE MERCHANT', '#REF', '$50.00    $12,345.67'),
      ].join('\n');
      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ description: 'SINGLE DATE MERCHANT', amount: 21.76 });
      expect(rows[1]).toMatchObject({ description: 'DOUBLE DATE MERCHANT', amount: 50 });
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });

    it('should flag a row when no amount is found', () => {
      const raw = '04/24/26    BANK REWARDS CREDIT';
      const [row] = parseTransactionPaste(raw);
      expect(row.amount).toBeNull();
      expect(row.parseErrors.some((e) => e.toLowerCase().includes('amount'))).toBe(true);
    });
  });

  // ── Format H ─────────────────────────────────────────────────────────────

  describe('Format H — Target pending transaction', () => {
    it('should parse a pending Sale transaction', () => {
      const [row] = parseTransactionPaste(blockH('04-27-2026', 'TGT.COM 912003433044748', '$54.97'));
      expect(row.description).toBe('TGT.COM 912003433044748');
      expect(row.amount).toBe(54.97);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the date from the parenthesised MM-DD-YYYY', () => {
      const [row] = parseTransactionPaste(blockH('04-27-2026', 'TGT.COM 912003433044748', '$54.97'));
      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getMonth()).toBe(3); // April (0-indexed)
      expect(row.date!.getDate()).toBe(27);
    });

    it('should parse a pending transaction without a card suffix', () => {
      const [row] = parseTransactionPaste(blockH('04-27-2026', 'TGT PLUS 912003433044749', '$86.67'));
      expect(row.description).toBe('TGT PLUS 912003433044749');
      expect(row.amount).toBe(86.67);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse multiple consecutive Format H blocks', () => {
      const raw = [
        blockH('04-27-2026', 'TGT.COM 912003433044748', '$54.97'),
        blockH('04-27-2026', 'TGT PLUS 912003433044749', '$86.67'),
      ].join('\n');
      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ description: 'TGT.COM 912003433044748', amount: 54.97 });
      expect(rows[1]).toMatchObject({ description: 'TGT PLUS 912003433044749', amount: 86.67 });
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });

    it('should parse Format H mixed with Format D in the same paste', () => {
      const raw = `Pending (04-27-2026)     TGT.COM 912003433044748    Sale        $54.97
Pending (04-27-2026)     TGT PLUS 912003433044749    Sale        $86.67
04-24-2026

E-PAYMENT - THANK YOU * MN    Payment        -$348.00
04-08-2026

TARGET 1144 COON RAPIDS MN    Sale    **3370    $59.83`;

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(4);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
      expect(rows[0]).toMatchObject({ description: 'TGT.COM 912003433044748', amount: 54.97 });
      expect(rows[1]).toMatchObject({ description: 'TGT PLUS 912003433044749', amount: 86.67 });
      expect(rows[2]).toMatchObject({ description: 'E-PAYMENT - THANK YOU *', amount: -348.00 });
      expect(rows[3]).toMatchObject({ description: 'TARGET 1144 COON RAPIDS', amount: 59.83 });
      expect(rows[0].date!.getDate()).toBe(27);
      expect(rows[2].date!.getDate()).toBe(24);
      expect(rows[3].date!.getDate()).toBe(8);
    });

    it('should ignore the table header line from Target.com', () => {
      const raw = `Date Sort    Description    Type Sort    Card    Amount Sort
Pending (04-27-2026)     TGT.COM 912003433044748    Sale        $54.97`;
      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(1);
      expect(rows[0].description).toBe('TGT.COM 912003433044748');
    });
  });

  // ── Mixed formats ─────────────────────────────────────────────────────────

  describe('mixed formats in one paste', () => {
    it('should parse Format A and Format C in the same paste', () => {
      const raw = [
        blockA(1, '04/16/26', 'FOOD MART 55555', '#...9999', '$60.21'),
        blockC('Apr 16', 'GENERAL STORE T9999', '$17.28', 'MH', true),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ description: 'FOOD MART 55555', amount: 60.21 });
      expect(rows[1]).toMatchObject({ description: 'GENERAL STORE T9999', amount: 17.28 });
    });

    it('should parse Format B and Format C in the same paste', () => {
      const raw = [
        blockB('04/13/26', 'WEBPAY*LAKEWOOD-DISTRICT 555-867-5309 XX', '#REF1', '$50.00    $12,345.67'),
        blockC('Apr 13', "SAM'S CORNER MART #5 RIVERSIDE XX", '$44.45', 'MH', false),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0].amount).toBe(50);
      expect(rows[1].amount).toBe(44.45);
    });

    it('should parse all three formats in the same paste', () => {
      const raw = [
        blockA(1, '04/16/26', 'FOOD MART 55555', '#...9999', '$60.21'),
        blockB('04/13/26', 'BRAKES PLUS SPRINGFIELD XX', '#REF', '$41.03    $200.00'),
        blockC('Apr 12', "SAM'S CORNER MART #5 RIVERSIDE XX", '$7.37', 'MH', false),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows[0].amount).toBe(60.21);
      expect(rows[1].amount).toBe(41.03);
      expect(rows[2].amount).toBe(7.37);
    });

    it('should parse all four formats in the same paste', () => {
      const raw = [
        blockA(1, '04/16/26', 'FOOD MART 55555', '#...9999', '$60.21'),
        blockB('04/13/26', 'BRAKES PLUS SPRINGFIELD XX', '#REF', '$41.03    $200.00'),
        blockC('Apr 12', "SAM'S CORNER MART #5 RIVERSIDE XX", '$7.37', 'MH', false),
        blockD('03-10-2026', 'GENERAL STORE 9999 SPRINGFIELD XX', '$23.69'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(4);
      expect(rows[0].amount).toBe(60.21);
      expect(rows[1].amount).toBe(41.03);
      expect(rows[2].amount).toBe(7.37);
      expect(rows[3].amount).toBe(23.69);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });

    it('should parse all five formats in the same paste', () => {
      const raw = [
        blockA(1, '04/16/26', 'FOOD MART 55555', '#...9999', '$60.21'),
        blockB('04/13/26', 'BRAKES PLUS SPRINGFIELD XX', '#REF', '$41.03    $200.00'),
        blockC('Apr 12', "SAM'S CORNER MART #5 RIVERSIDE XX", '$7.37', 'MH', false),
        blockD('03-10-2026', 'GENERAL STORE 9999 SPRINGFIELD XX', '$23.69'),
        blockE('Apr 12, 2026', 'JANE DOE', 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', '$3.23'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(5);
      expect(rows[0].amount).toBe(60.21);
      expect(rows[1].amount).toBe(41.03);
      expect(rows[2].amount).toBe(7.37);
      expect(rows[3].amount).toBe(23.69);
      expect(rows[4].amount).toBe(3.23);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });

    it('should parse all seven formats in the same paste', () => {
      const raw = [
        blockA(1, '04/16/26', 'FOOD MART 55555', '#...9999', '$60.21'),
        blockB('04/13/26', 'BRAKES PLUS SPRINGFIELD XX', '#REF', '$41.03    $200.00'),
        blockC('Apr 12', "SAM'S CORNER MART #5 RIVERSIDE XX", '$7.37', 'MH', false),
        blockD('03-10-2026', 'GENERAL STORE 9999 SPRINGFIELD XX', '$23.69'),
        blockE('Apr 12, 2026', 'JANE DOE', 'WAREHOUSE CLUB #1234 SPRINGFIELD XX', '$3.23'),
        blockF(2, '04/27/26', 'ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX', '$26.78'),
        blockG('04/24/26', 'ONLINE TRANSFER FROM CHECKING REF #YYYYYYYYYY WAY2SAVE SAVINGS', '$10.88'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(7);
      expect(rows[0].amount).toBe(60.21);
      expect(rows[1].amount).toBe(41.03);
      expect(rows[2].amount).toBe(7.37);
      expect(rows[3].amount).toBe(23.69);
      expect(rows[4].amount).toBe(3.23);
      expect(rows[5].amount).toBe(26.78);
      expect(rows[6].amount).toBe(10.88);

      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });
  });

  // ── State stripping ───────────────────────────────────────────────────────

  describe('trailing US state stripping', () => {
    it('should strip a trailing state abbreviation from the description', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'COSTCO WHSE #0372 COON RAPIDS MN', '#...9999', '$122.84'));
      expect(row.description).toBe('COSTCO WHSE #0372 COON RAPIDS');
    });

    it('should strip different state codes', () => {
      const states = ['MN', 'CA', 'TX', 'FL', 'NY', 'WA', 'CO'];
      for (const st of states) {
        const [row] = parseTransactionPaste(blockA(1, '04/16/26', `SOME MERCHANT ${st}`, '#...9999', '$10.00'));
        expect(row.description).toBe('SOME MERCHANT');
      }
    });

    it('should not strip a non-state two-letter suffix', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'MERCHANT XX', '#...9999', '$10.00'));
      expect(row.description).toBe('MERCHANT XX');
    });

    it('should not strip a state abbreviation that is part of the merchant name', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'PAYPAL *GLOBALPAYINC 800-555-1234 INTL', '#...9999', '$4.95'));
      expect(row.description).toBe('PAYPAL *GLOBALPAYINC 800-555-1234 INTL');
    });
  });

  // ── Amount parsing ────────────────────────────────────────────────────────

  describe('amount parsing', () => {
    it('should parse a positive dollar amount', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'FOOD MART', '#...9999', '$60.21'));
      expect(row.amount).toBe(60.21);
    });

    it('should parse a negative amount with leading minus before $', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'REFUND', '#...9999', '-$12.00'));
      expect(row.amount).toBe(-12);
    });

    it('should parse a negative amount with minus after $', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'REFUND', '#...9999', '$-12.00'));
      expect(row.amount).toBe(-12);
    });

    it('should parse amounts with comma thousands separators', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'BIG PURCHASE', '#...9999', '$1,234.56'));
      expect(row.amount).toBe(1234.56);
    });

    it('should parse a zero amount', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'FREE ITEM', '#...9999', '$0.00'));
      expect(row.amount).toBe(0);
    });

    it('should ignore running balance and capture only the first amount', () => {
      const [row] = parseTransactionPaste(blockB('04/12/26', 'BRAKES PLUS', '#REF', '$36.45    $12,204.24'));
      expect(row.amount).toBe(36.45);
      expect(row.amount).not.toBe(12204.24);
    });
  });

  // ── Error cases ───────────────────────────────────────────────────────────

  describe('error / ambiguous rows', () => {
    it('should flag a row when no amount line is found', () => {
      const raw = 'Transaction Details for Row 1    04/16/26    FOOD MART 55555\n#...9999';
      const [row] = parseTransactionPaste(raw);
      expect(row.amount).toBeNull();
      expect(row.parseErrors.some((e) => e.toLowerCase().includes('amount'))).toBe(true);
    });

    it('should flag a Format C row when amount is absent', () => {
      const raw = 'Apr 16\nPending\nFOOD MART\n\nMH\n\nShow Transaction';
      const [row] = parseTransactionPaste(raw);
      expect(row.amount).toBeNull();
      expect(row.parseErrors.some((e) => e.toLowerCase().includes('amount'))).toBe(true);
    });

    it('should not add errors for rows that parse cleanly', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'FOOD MART 55555', '#...9999', '$60.21'));
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should isolate errors to the problematic row without affecting neighbours', () => {
      const raw = [
        blockA(1, '04/16/26', 'FOOD MART 55555', '#...9999', '$60.21'),
        'Transaction Details for Row 2    04/16/26    BAD ROW\n#...9999',  // missing amount
        blockA(3, '04/16/26', 'BUDGET STORE', '#...9999', '$29.73'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows[0].parseErrors).toHaveLength(0);
      expect(rows[1].parseErrors.length).toBeGreaterThan(0);
      expect(rows[2].parseErrors).toHaveLength(0);
    });
  });

  // ── Whitespace tolerance ──────────────────────────────────────────────────

  describe('whitespace tolerance', () => {
    it('should tolerate blank lines between Format A blocks', () => {
      const raw = [blockA(1, '04/16/26', 'FOOD MART', '#...9999', '$60.21'), '', '',
                   blockA(2, '04/16/26', 'THRIFT WORLD', '#...9999', '$60.47')].join('\n');
      expect(parseTransactionPaste(raw)).toHaveLength(2);
    });

    it('should tolerate blank lines between Format C blocks', () => {
      const raw = [blockC('Apr 16', 'FOOD MART', '$1.89'), '', '',
                   blockC('Apr 15', 'FOOD MART', '$34.72')].join('\n');
      expect(parseTransactionPaste(raw)).toHaveLength(2);
    });

    it('should ignore unrelated lines before and between blocks', () => {
      const raw = [
        'Exported statement — April 2026',
        blockA(1, '04/16/26', 'FOOD MART', '#...9999', '$60.21'),
        'Page 1 of 3',
        blockA(2, '04/16/26', 'THRIFT WORLD', '#...9999', '$60.47'),
      ].join('\n');
      expect(parseTransactionPaste(raw)).toHaveLength(2);
    });
  });

  // ── Real-world samples ────────────────────────────────────────────────────

  describe('real-world sample data', () => {
    it('should parse the original 8-row Format A sample', () => {
      const raw = `Transaction Details for Row 1    04/16/26    FOOD MART 55555
#...9999
$60.21
Transaction Details for Row 2    04/16/26    THRIFT WORLD - 9876
#...9999
$60.47
Transaction Details for Row 3    04/16/26    MEDCARE CTR 200
#...9999
$290.55
Transaction Details for Row 4    04/16/26    BURGER JOINT 'S F99999
#...9999
$1.07
Transaction Details for Row 5    04/16/26    CITY PARKING CTR SM
#...9999
$7.00
Transaction Details for Row 6    04/16/26    REGIONAL HOSP CAFETERIA
#...9999
$2.57
Transaction Details for Row 7    04/16/26    REGIONAL HOSP CAFETERIA
#...9999
$23.49
Transaction Details for Row 8    04/16/26    BUDGET STORE
#...9999
$29.73`;

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(8);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
      expect(rows[0]).toMatchObject({ description: 'FOOD MART 55555', amount: 60.21 });
      expect(rows[3]).toMatchObject({ description: "BURGER JOINT 'S F99999", amount: 1.07 });
      expect(rows[7]).toMatchObject({ description: 'BUDGET STORE', amount: 29.73 });
    });

    it('should parse the 5-row Format B sample', () => {
      const raw = `04/13/26    04/13/26    WEBPAY*LAKEWOOD-DISTRICT 555-867-5309 XX
#1234567FXXYYZZ001
$50.00    $12,345.67
04/13/26    04/13/26    JOHN 'S DISCOUNT FOODS RIVERSIDE XX
#9876543FAABBCC002
$44.55    $12,295.67
04/13/26    04/13/26    PAYPAL *GLOBALPAYINC 800-555-1234 CA
#5544332FDDEEFF003
$4.95    $12,250.22
04/12/26    04/12/26    BRAKES PLUS 112233 SPRINGFIELD XX
#7788990FGGHHIJ004
$41.03    $12,245.27
04/12/26    04/12/26    BRAKES PLUS 112233 SPRINGFIELD XX
#6655441FKKLLMM005
$36.45    $12,204.24`;

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(5);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
      expect(rows[0]).toMatchObject({ description: 'WEBPAY*LAKEWOOD-DISTRICT 555-867-5309 XX', amount: 50 });
      expect(rows[1]).toMatchObject({ description: "JOHN 'S DISCOUNT FOODS RIVERSIDE XX", amount: 44.55 });
      expect(rows[4]).toMatchObject({ description: 'BRAKES PLUS 112233 SPRINGFIELD XX', amount: 36.45 });
    });

    it('should parse the 7-row Format C sample', () => {
      const raw = `Apr 16
Pending
FOOD MART

MH
$1.89

Show Transaction
Apr 16
Pending
GENERAL STORE T9999

MH
$17.28

Show Transaction
Apr 15
Pending
FOOD MART

MH
$34.72

Show Transaction
Apr 13
SAM'S CORNER MART #5 RIVERSIDE XX

MH
$44.45

Show Transaction
Apr 12
SAM'S CORNER MART #5 RIVERSIDE XX

MH
$7.37

Show Transaction
Apr 12
GENERAL STORE 011445SPRINGFIELD XX

LH
$5.40

Show Transaction
Apr 11
SAM'S CORNER MART #5 RIVERSIDE XX

MH
$0.49

Show Transaction`;

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(7);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));

      expect(rows[0]).toMatchObject({ description: 'FOOD MART', amount: 1.89 });
      expect(rows[1]).toMatchObject({ description: 'GENERAL STORE T9999', amount: 17.28 });
      expect(rows[2]).toMatchObject({ description: 'FOOD MART', amount: 34.72 });
      expect(rows[3]).toMatchObject({ description: "SAM'S CORNER MART #5 RIVERSIDE XX", amount: 44.45 });
      expect(rows[4]).toMatchObject({ description: "SAM'S CORNER MART #5 RIVERSIDE XX", amount: 7.37 });
      expect(rows[5]).toMatchObject({ description: 'GENERAL STORE 011445SPRINGFIELD XX', amount: 5.40 });
      expect(rows[6]).toMatchObject({ description: "SAM'S CORNER MART #5 RIVERSIDE XX", amount: 0.49 });

      // Verify months and days
      expect(rows[0].date!.getMonth()).toBe(3); // April
      expect(rows[0].date!.getDate()).toBe(16);
      expect(rows[6].date!.getDate()).toBe(11);
    });

    it('should parse a 7-row Format F + G debit sample (space-separated)', () => {
      const raw = `Transaction Details for Row 1    04/27/26    ONLINE TRANSFER FROM PREMIER CHECKING    $1,905.48
Transaction Details for Row 2    04/27/26    ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX    $26.78
Transaction Details for Row 3    04/27/26    ONLINE TRANSFER FROM CHECKING REF #YYYYYYYYYY    $20.09
Posted Transactions
04/24/26    ONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A    $21.76
04/24/26    ONLINE TRANSFER FROM CHECKING REF #YYYYYYYYYY WAY2SAVE SAVINGS STORE B    $10.88
04/21/26    BANK REWARDS CREDIT    $164.16
04/20/26    ONLINE TRANSFER REF #ZZZZZZZZZZ TO VISA CARD XXXXXXXXXXXX1111 ON 04/18/26        $169.00`;
      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(7);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
      expect(rows[0]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM PREMIER CHECKING', amount: 1905.48 });
      expect(rows[1]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM SAVINGS REF #XXXXXXXXXX', amount: 26.78 });
      expect(rows[2]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM CHECKING REF #YYYYYYYYYY', amount: 20.09 });
      expect(rows[3]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A', amount: 21.76 });
      expect(rows[4]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM CHECKING REF #YYYYYYYYYY WAY2SAVE SAVINGS STORE B', amount: 10.88 });
      expect(rows[5]).toMatchObject({ description: 'BANK REWARDS CREDIT', notes: '', amount: 164.16 });
      expect(rows[6]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'REF #ZZZZZZZZZZ TO VISA CARD XXXXXXXXXXXX1111 ON 04/18/26', amount: 169.00 });
      expect(rows[0].date!.getMonth()).toBe(3); // April
      expect(rows[0].date!.getDate()).toBe(27);
    });

    it('should parse a 7-row Format F + G debit sample (tab-separated)', () => {
      const raw = [
        'Transaction Details for Row 1\t04/27/26\tONLINE TRANSFER FROM PREMIER CHECKING\t$1,905.48',
        'Transaction Details for Row 2\t04/27/26\tONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX\t$26.78',
        'Transaction Details for Row 3\t04/27/26\tONLINE TRANSFER FROM CHECKING REF #YYYYYYYYYY\t$20.09',
        'Posted Transactions',
        '04/24/26\tONLINE TRANSFER FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A\t$21.76',
        '04/24/26\tONLINE TRANSFER FROM CHECKING REF #YYYYYYYYYY WAY2SAVE SAVINGS STORE B\t$10.88',
        '04/21/26\tBANK REWARDS CREDIT\t$164.16',
        '04/20/26\tONLINE TRANSFER REF #ZZZZZZZZZZ TO VISA CARD XXXXXXXXXXXX1111 ON 04/18/26\t$169.00',
      ].join('\n');
      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(7);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
      expect(rows[0]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM PREMIER CHECKING', amount: 1905.48 });
      expect(rows[1]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM SAVINGS REF #XXXXXXXXXX', amount: 26.78 });
      expect(rows[2]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM CHECKING REF #YYYYYYYYYY', amount: 20.09 });
      expect(rows[3]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM SAVINGS REF #XXXXXXXXXX PLATINUM SAVINGS STORE A', amount: 21.76 });
      expect(rows[4]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'FROM CHECKING REF #YYYYYYYYYY WAY2SAVE SAVINGS STORE B', amount: 10.88 });
      expect(rows[5]).toMatchObject({ description: 'BANK REWARDS CREDIT', notes: '', amount: 164.16 });
      expect(rows[6]).toMatchObject({ description: 'ONLINE TRANSFER', notes: 'REF #ZZZZZZZZZZ TO VISA CARD XXXXXXXXXXXX1111 ON 04/18/26', amount: 169.00 });
    });
  });
});

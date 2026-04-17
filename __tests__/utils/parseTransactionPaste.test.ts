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
  cardSuffix = '**3370',
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
      const raw = [blockA(1, '04/16/26', 'ALDI', '#...1193', '$60.21'),
                   blockA(2, '04/16/26', 'SAVERS', '#...1193', '$60.47')].join('\n');
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
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'));
      expect(row.description).toBe('ALDI 72086');
      expect(row.amount).toBe(60.21);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the date from a 2-digit year', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'ALDI', '#...1193', '$60.21'));
      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getMonth()).toBe(3); // April (0-indexed)
      expect(row.date!.getDate()).toBe(16);
    });

    it('should parse the date from a 4-digit year', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/2026', 'ALDI', '#...1193', '$60.21'));
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getDate()).toBe(16);
    });

    it('should parse multiple consecutive blocks', () => {
      const raw = [
        blockA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        blockA(2, '04/16/26', 'SAVERS - 1202', '#...1193', '$60.47'),
        blockA(3, '04/16/26', 'DOLLAR TREE', '#...1193', '$29.73'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows.map((r) => r.description)).toEqual(['ALDI 72086', 'SAVERS - 1202', 'DOLLAR TREE']);
    });

    it('should ignore the card-suffix line (#...XXXX)', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'ALDI', '#...1193', '$60.21'));
      expect(row.description).not.toContain('#');
      expect(row.parseErrors).toHaveLength(0);
    });

    it("should preserve descriptions with special characters (apostrophe, numbers)", () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', "MCDONALD 'S F10830", '#...1193', '$1.07'));
      expect(row.description).toBe("MCDONALD 'S F10830");
    });
  });

  // ── Format B ─────────────────────────────────────────────────────────────

  describe('Format B — plain double-date header', () => {
    it('should parse a single transaction', () => {
      const [row] = parseTransactionPaste(
        blockB('04/13/26', 'SCHLPAY*ANOKA-HENNEPIN 763-506-1000 MN', '#2444500FP8PT1TKK2', '$50.00    $16,896.48'),
      );
      expect(row.description).toBe('SCHLPAY*ANOKA-HENNEPIN 763-506-1000 MN');
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
        blockB('04/13/26', "MIKE'S DISCOUNT FOODS ANOKA MN", '#2405522FRLTXE2W5V', '$44.55    $16,846.48'),
      );
      expect(row.description).toBe("MIKE'S DISCOUNT FOODS ANOKA MN");
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should extract only the first (charge) amount and ignore the running balance', () => {
      const [row] = parseTransactionPaste(
        blockB('04/13/26', 'TIRES PLUS 244206 COON RAPIDS MN', '#REF', '$41.03    $16,796.98'),
      );
      expect(row.amount).toBe(41.03);
      expect(row.amount).not.toBe(16796.98);
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
      const raw = blockC('Apr 16', 'ALDI', '$1.89', 'MH', true);
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe('ALDI');
      expect(row.amount).toBe(1.89);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse a posted (non-pending) transaction', () => {
      const raw = blockC("Apr 13", "BILL'S SUPERETTE #8 RAMSEY MN", '$44.45', 'MH', false);
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe("BILL'S SUPERETTE #8 RAMSEY MN");
      expect(row.amount).toBe(44.45);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the month and day correctly', () => {
      const [row] = parseTransactionPaste(blockC('Apr 16', 'ALDI', '$1.89'));
      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getMonth()).toBe(3); // April
      expect(row.date!.getDate()).toBe(16);
    });

    it('should infer the current year for recent dates', () => {
      const [row] = parseTransactionPaste(blockC('Apr 16', 'ALDI', '$1.89'));
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
      const raw = 'Apr 16\nPending\nALDI\n\nMH\n$1.89\n\nShow Transaction';
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe('ALDI');
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should skip the cardholder initials line (MH)', () => {
      const [row] = parseTransactionPaste(blockC('Apr 16', 'ALDI', '$1.89', 'MH'));
      expect(row.amount).toBe(1.89);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should skip the cardholder initials line (LH)', () => {
      const [row] = parseTransactionPaste(blockC('Apr 12', 'TARGET 011445COON RAPIDS MN', '$5.40', 'LH'));
      expect(row.amount).toBe(5.40);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should skip the "Show Transaction" footer', () => {
      // If Show Transaction were parsed as description or amount it would create errors
      const [row] = parseTransactionPaste(blockC('Apr 16', 'ALDI', '$1.89'));
      expect(row.description).toBe('ALDI');
      expect(row.amount).toBe(1.89);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse multiple consecutive blocks', () => {
      const raw = [
        blockC('Apr 16', 'ALDI', '$1.89', 'MH', true),
        blockC('Apr 16', 'TARGET T1144', '$17.28', 'MH', true),
        blockC('Apr 13', "BILL'S SUPERETTE #8 RAMSEY MN", '$44.45', 'MH', false),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toMatchObject({ description: 'ALDI', amount: 1.89 });
      expect(rows[1]).toMatchObject({ description: 'TARGET T1144', amount: 17.28 });
      expect(rows[2]).toMatchObject({ description: "BILL'S SUPERETTE #8 RAMSEY MN", amount: 44.45 });
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
        blockD('03-10-2026', 'TARGET 1144 COON RAPIDS MN', '$23.69'),
      );
      expect(row.description).toBe('TARGET 1144 COON RAPIDS MN');
      expect(row.amount).toBe(23.69);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the date from MM-DD-YYYY format', () => {
      const [row] = parseTransactionPaste(
        blockD('03-10-2026', 'TARGET 1144 COON RAPIDS MN', '$23.69'),
      );
      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getMonth()).toBe(2); // March (0-indexed)
      expect(row.date!.getDate()).toBe(10);
    });

    it('should parse a Return (negative amount)', () => {
      const [row] = parseTransactionPaste(
        blockD('03-09-2026', 'TARGET.COM 800-591- CREDIT', '-$2.25', 'Return', ''),
      );
      expect(row.description).toBe('TARGET.COM 800-591- CREDIT');
      expect(row.amount).toBe(-2.25);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should ignore the card suffix (**XXXX) and transaction type field', () => {
      const [row] = parseTransactionPaste(
        blockD('03-10-2026', 'TARGET 1144 COON RAPIDS MN', '$2.51', 'Sale', '**3370'),
      );
      expect(row.description).toBe('TARGET 1144 COON RAPIDS MN');
      expect(row.description).not.toContain('**');
      expect(row.description).not.toContain('Sale');
    });

    it('should extract the description as the first field before the 2+-space separator', () => {
      const raw = '03-10-2026\n \nTARGET 1144 COON RAPIDS MN    Sale    **3370    $23.69';
      const [row] = parseTransactionPaste(raw);
      expect(row.description).toBe('TARGET 1144 COON RAPIDS MN');
    });

    it('should tolerate the blank/space separator line between date and data line', () => {
      // Space-only separator (as seen in the real paste)
      const raw = '03-10-2026\n \nTARGET 1144 COON RAPIDS MN    Sale    **3370    $23.69';
      expect(parseTransactionPaste(raw)[0].parseErrors).toHaveLength(0);

      // Blank separator
      const raw2 = '03-10-2026\n\nTARGET 1144 COON RAPIDS MN    Sale    **3370    $23.69';
      expect(parseTransactionPaste(raw2)[0].parseErrors).toHaveLength(0);
    });

    it('should parse multiple consecutive Format D blocks', () => {
      const raw = [
        blockD('03-10-2026', 'TARGET 1144 COON RAPIDS MN', '$23.69'),
        blockD('03-10-2026', 'TARGET 1144 COON RAPIDS MN', '$2.51'),
        blockD('03-09-2026', 'TARGET.COM 800-591- CREDIT', '-$2.25', 'Return', ''),
        blockD('03-09-2026', 'TARGET 1144 COON RAPIDS MN', '$18.17'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(4);
      expect(rows[0]).toMatchObject({ description: 'TARGET 1144 COON RAPIDS MN', amount: 23.69 });
      expect(rows[1]).toMatchObject({ description: 'TARGET 1144 COON RAPIDS MN', amount: 2.51 });
      expect(rows[2]).toMatchObject({ description: 'TARGET.COM 800-591- CREDIT', amount: -2.25 });
      expect(rows[3]).toMatchObject({ description: 'TARGET 1144 COON RAPIDS MN', amount: 18.17 });
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

TARGET 1144 COON RAPIDS MN    Sale    **3370    $23.69
03-10-2026

TARGET 1144 COON RAPIDS MN    Sale    **3370    $2.51
03-09-2026

TARGET.COM 800-591- CREDIT    Return        -$2.25
03-09-2026

TARGET 1144 COON RAPIDS MN    Sale    **3370    $18.17    `;

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(4);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));

      expect(rows[0]).toMatchObject({ description: 'TARGET 1144 COON RAPIDS MN', amount: 23.69 });
      expect(rows[1]).toMatchObject({ description: 'TARGET 1144 COON RAPIDS MN', amount: 2.51 });
      expect(rows[2]).toMatchObject({ description: 'TARGET.COM 800-591- CREDIT', amount: -2.25 });
      expect(rows[3]).toMatchObject({ description: 'TARGET 1144 COON RAPIDS MN', amount: 18.17 });

      // Dates
      expect(rows[0].date!.getMonth()).toBe(2); // March
      expect(rows[0].date!.getDate()).toBe(10);
      expect(rows[2].date!.getDate()).toBe(9);
    });
  });

  // ── Mixed formats ─────────────────────────────────────────────────────────

  describe('mixed formats in one paste', () => {
    it('should parse Format A and Format C in the same paste', () => {
      const raw = [
        blockA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        blockC('Apr 16', 'TARGET T1144', '$17.28', 'MH', true),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ description: 'ALDI 72086', amount: 60.21 });
      expect(rows[1]).toMatchObject({ description: 'TARGET T1144', amount: 17.28 });
    });

    it('should parse Format B and Format C in the same paste', () => {
      const raw = [
        blockB('04/13/26', 'SCHLPAY*ANOKA-HENNEPIN 763-506-1000 MN', '#REF1', '$50.00    $16,896.48'),
        blockC('Apr 13', "BILL'S SUPERETTE #8 RAMSEY MN", '$44.45', 'MH', false),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0].amount).toBe(50);
      expect(rows[1].amount).toBe(44.45);
    });

    it('should parse all three formats in the same paste', () => {
      const raw = [
        blockA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        blockB('04/13/26', 'TIRES PLUS COON RAPIDS MN', '#REF', '$41.03    $200.00'),
        blockC('Apr 12', "BILL'S SUPERETTE #8 RAMSEY MN", '$7.37', 'MH', false),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows[0].amount).toBe(60.21);
      expect(rows[1].amount).toBe(41.03);
      expect(rows[2].amount).toBe(7.37);
    });

    it('should parse all four formats in the same paste', () => {
      const raw = [
        blockA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        blockB('04/13/26', 'TIRES PLUS COON RAPIDS MN', '#REF', '$41.03    $200.00'),
        blockC('Apr 12', "BILL'S SUPERETTE #8 RAMSEY MN", '$7.37', 'MH', false),
        blockD('03-10-2026', 'TARGET 1144 COON RAPIDS MN', '$23.69'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(4);
      expect(rows[0].amount).toBe(60.21);
      expect(rows[1].amount).toBe(41.03);
      expect(rows[2].amount).toBe(7.37);
      expect(rows[3].amount).toBe(23.69);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
    });
  });

  // ── Amount parsing ────────────────────────────────────────────────────────

  describe('amount parsing', () => {
    it('should parse a positive dollar amount', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'ALDI', '#...1193', '$60.21'));
      expect(row.amount).toBe(60.21);
    });

    it('should parse a negative amount with leading minus before $', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'REFUND', '#...1193', '-$12.00'));
      expect(row.amount).toBe(-12);
    });

    it('should parse a negative amount with minus after $', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'REFUND', '#...1193', '$-12.00'));
      expect(row.amount).toBe(-12);
    });

    it('should parse amounts with comma thousands separators', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'BIG PURCHASE', '#...1193', '$1,234.56'));
      expect(row.amount).toBe(1234.56);
    });

    it('should parse a zero amount', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'FREE ITEM', '#...1193', '$0.00'));
      expect(row.amount).toBe(0);
    });

    it('should ignore running balance and capture only the first amount', () => {
      const [row] = parseTransactionPaste(blockB('04/12/26', 'TIRES PLUS', '#REF', '$36.45    $16,755.95'));
      expect(row.amount).toBe(36.45);
      expect(row.amount).not.toBe(16755.95);
    });
  });

  // ── Error cases ───────────────────────────────────────────────────────────

  describe('error / ambiguous rows', () => {
    it('should flag a row when no amount line is found', () => {
      const raw = 'Transaction Details for Row 1    04/16/26    ALDI 72086\n#...1193';
      const [row] = parseTransactionPaste(raw);
      expect(row.amount).toBeNull();
      expect(row.parseErrors.some((e) => e.toLowerCase().includes('amount'))).toBe(true);
    });

    it('should flag a Format C row when amount is absent', () => {
      const raw = 'Apr 16\nPending\nALDI\n\nMH\n\nShow Transaction';
      const [row] = parseTransactionPaste(raw);
      expect(row.amount).toBeNull();
      expect(row.parseErrors.some((e) => e.toLowerCase().includes('amount'))).toBe(true);
    });

    it('should not add errors for rows that parse cleanly', () => {
      const [row] = parseTransactionPaste(blockA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'));
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should isolate errors to the problematic row without affecting neighbours', () => {
      const raw = [
        blockA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        'Transaction Details for Row 2    04/16/26    BAD ROW\n#...1193',  // missing amount
        blockA(3, '04/16/26', 'DOLLAR TREE', '#...1193', '$29.73'),
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
      const raw = [blockA(1, '04/16/26', 'ALDI', '#...1193', '$60.21'), '', '',
                   blockA(2, '04/16/26', 'SAVERS', '#...1193', '$60.47')].join('\n');
      expect(parseTransactionPaste(raw)).toHaveLength(2);
    });

    it('should tolerate blank lines between Format C blocks', () => {
      const raw = [blockC('Apr 16', 'ALDI', '$1.89'), '', '',
                   blockC('Apr 15', 'ALDI', '$34.72')].join('\n');
      expect(parseTransactionPaste(raw)).toHaveLength(2);
    });

    it('should ignore unrelated lines before and between blocks', () => {
      const raw = [
        'Exported statement — April 2026',
        blockA(1, '04/16/26', 'ALDI', '#...1193', '$60.21'),
        'Page 1 of 3',
        blockA(2, '04/16/26', 'SAVERS', '#...1193', '$60.47'),
      ].join('\n');
      expect(parseTransactionPaste(raw)).toHaveLength(2);
    });
  });

  // ── Real-world samples ────────────────────────────────────────────────────

  describe('real-world sample data', () => {
    it('should parse the original 8-row Format A sample', () => {
      const raw = `Transaction Details for Row 1    04/16/26    ALDI 72086
#...1193
$60.21
Transaction Details for Row 2    04/16/26    SAVERS - 1202
#...1193
$60.47
Transaction Details for Row 3    04/16/26    iSPINE CRC 100
#...1193
$290.55
Transaction Details for Row 4    04/16/26    MCDONALD 'S F10830
#...1193
$1.07
Transaction Details for Row 5    04/16/26    ALLIED PARKING HPR SM
#...1193
$7.00
Transaction Details for Row 6    04/16/26    HCMC CAFETERIA
#...1193
$2.57
Transaction Details for Row 7    04/16/26    HCMC CAFETERIA
#...1193
$23.49
Transaction Details for Row 8    04/16/26    DOLLAR TREE
#...1193
$29.73`;

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(8);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
      expect(rows[0]).toMatchObject({ description: 'ALDI 72086', amount: 60.21 });
      expect(rows[3]).toMatchObject({ description: "MCDONALD 'S F10830", amount: 1.07 });
      expect(rows[7]).toMatchObject({ description: 'DOLLAR TREE', amount: 29.73 });
    });

    it('should parse the 5-row Format B sample', () => {
      const raw = `04/13/26    04/13/26    SCHLPAY*ANOKA-HENNEPIN 763-506-1000 MN
#2444500FP8PT1TKK2
$50.00    $16,896.48
04/13/26    04/13/26    MIKE 'S DISCOUNT FOODS ANOKA MN
#2405522FRLTXE2W5V
$44.55    $16,846.48
04/13/26    04/13/26    PAYPAL *ALIPAYUSINC 402-935-7733 CA
#2402762FR1YLMYP82
$4.95    $16,801.93
04/12/26    04/12/26    TIRES PLUS 244206 COON RAPIDS MN
#2469216FPBWM9BG8J
$41.03    $16,796.98
04/12/26    04/12/26    TIRES PLUS 244206 COON RAPIDS MN
#2469216FPBWM9BG8A
$36.45    $16,755.95`;

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(5);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));
      expect(rows[0]).toMatchObject({ description: 'SCHLPAY*ANOKA-HENNEPIN 763-506-1000 MN', amount: 50 });
      expect(rows[1]).toMatchObject({ description: "MIKE 'S DISCOUNT FOODS ANOKA MN", amount: 44.55 });
      expect(rows[4]).toMatchObject({ description: 'TIRES PLUS 244206 COON RAPIDS MN', amount: 36.45 });
    });

    it('should parse the 7-row Format C sample', () => {
      const raw = `Apr 16
Pending
ALDI

MH
$1.89

Show Transaction
Apr 16
Pending
TARGET T1144

MH
$17.28

Show Transaction
Apr 15
Pending
ALDI

MH
$34.72

Show Transaction
Apr 13
BILL'S SUPERETTE #8 RAMSEY MN

MH
$44.45

Show Transaction
Apr 12
BILL'S SUPERETTE #8 RAMSEY MN

MH
$7.37

Show Transaction
Apr 12
TARGET 011445COON RAPIDS MN

LH
$5.40

Show Transaction
Apr 11
BILL'S SUPERETTE #8 RAMSEY MN

MH
$0.49

Show Transaction`;

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(7);
      rows.forEach((r) => expect(r.parseErrors).toHaveLength(0));

      expect(rows[0]).toMatchObject({ description: 'ALDI', amount: 1.89 });
      expect(rows[1]).toMatchObject({ description: 'TARGET T1144', amount: 17.28 });
      expect(rows[2]).toMatchObject({ description: 'ALDI', amount: 34.72 });
      expect(rows[3]).toMatchObject({ description: "BILL'S SUPERETTE #8 RAMSEY MN", amount: 44.45 });
      expect(rows[4]).toMatchObject({ description: "BILL'S SUPERETTE #8 RAMSEY MN", amount: 7.37 });
      expect(rows[5]).toMatchObject({ description: 'TARGET 011445COON RAPIDS MN', amount: 5.40 });
      expect(rows[6]).toMatchObject({ description: "BILL'S SUPERETTE #8 RAMSEY MN", amount: 0.49 });

      // Verify months and days
      expect(rows[0].date!.getMonth()).toBe(3); // April
      expect(rows[0].date!.getDate()).toBe(16);
      expect(rows[6].date!.getDate()).toBe(11);
    });
  });
});

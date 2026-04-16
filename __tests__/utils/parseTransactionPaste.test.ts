import { parseTransactionPaste, ParsedTransactionRow } from '../../utils/parseTransactionPaste';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a Format A block (Transaction Details for Row...). */
function formatA(n: number, date: string, description: string, ref: string, amount: string): string {
  return `Transaction Details for Row ${n}    ${date}    ${description}\n${ref}\n${amount}`;
}

/** Build a Format B block (plain date header). */
function formatB(date: string, description: string, ref: string, amount: string): string {
  return `${date}    ${date}    ${description}\n${ref}\n${amount}`;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('parseTransactionPaste', () => {
  // ── Return value shape ────────────────────────────────────────────────────

  describe('return value shape', () => {
    it('should return an empty array when given an empty string', () => {
      expect(parseTransactionPaste('')).toEqual([]);
    });

    it('should return an empty array when no transaction headers are found', () => {
      expect(parseTransactionPaste('just some random\ntext with no blocks')).toEqual([]);
    });

    it('should assign a unique UUID to each row id', () => {
      const raw = [
        formatA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        formatA(2, '04/16/26', 'SAVERS - 1202', '#...1193', '$60.47'),
      ].join('\n');

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
      const raw = formatA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21');
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe('ALDI 72086');
      expect(row.amount).toBe(60.21);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should parse the date correctly from a 2-digit year', () => {
      const raw = formatA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21');
      const [row] = parseTransactionPaste(raw);

      expect(row.date).toBeInstanceOf(Date);
      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getMonth()).toBe(3); // April (0-indexed)
      expect(row.date!.getDate()).toBe(16);
    });

    it('should parse the date correctly from a 4-digit year', () => {
      const raw = formatA(1, '04/16/2026', 'ALDI 72086', '#...1193', '$60.21');
      const [row] = parseTransactionPaste(raw);

      expect(row.date!.getFullYear()).toBe(2026);
      expect(row.date!.getMonth()).toBe(3);
      expect(row.date!.getDate()).toBe(16);
    });

    it('should parse multiple consecutive transactions', () => {
      const raw = [
        formatA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        formatA(2, '04/16/26', 'SAVERS - 1202', '#...1193', '$60.47'),
        formatA(3, '04/16/26', 'DOLLAR TREE', '#...1193', '$29.73'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows[0].description).toBe('ALDI 72086');
      expect(rows[1].description).toBe('SAVERS - 1202');
      expect(rows[2].description).toBe('DOLLAR TREE');
    });

    it('should ignore the card-suffix line (#...XXXX)', () => {
      const raw = formatA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21');
      const [row] = parseTransactionPaste(raw);

      // Card suffix should not appear in description or cause errors
      expect(row.description).not.toContain('#');
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should preserve descriptions with special characters and spaces', () => {
      const raw = formatA(1, '04/16/26', "MCDONALD 'S F10830", '#...1193', '$1.07');
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe("MCDONALD 'S F10830");
    });
  });

  // ── Format B ─────────────────────────────────────────────────────────────

  describe('Format B — plain date header', () => {
    it('should parse a single transaction', () => {
      const raw = formatB(
        '04/13/26',
        'SCHLPAY*ANOKA-HENNEPIN 763-506-1000 MN',
        '#2444500FP8PT1TKK2',
        '$50.00    $16,896.48',
      );
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe('SCHLPAY*ANOKA-HENNEPIN 763-506-1000 MN');
      expect(row.amount).toBe(50);
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should use the first date (posted date) from the double-date header', () => {
      const raw = '04/13/26    04/15/26    SOME MERCHANT\n#REF123\n$25.00';
      const [row] = parseTransactionPaste(raw);

      expect(row.date!.getMonth()).toBe(3); // April
      expect(row.date!.getDate()).toBe(13);
    });

    it('should ignore the alphanumeric reference line (#REF...)', () => {
      const raw = formatB(
        '04/13/26',
        'MIKE\'S DISCOUNT FOODS ANOKA MN',
        '#2405522FRLTXE2W5V',
        '$44.55    $16,846.48',
      );
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe("MIKE'S DISCOUNT FOODS ANOKA MN");
      expect(row.parseErrors).toHaveLength(0);
    });

    it('should extract only the first (charge) amount and ignore the running balance', () => {
      const raw = formatB(
        '04/13/26',
        'TIRES PLUS 244206 COON RAPIDS MN',
        '#2469216FPBWM9BG8J',
        '$41.03    $16,796.98',
      );
      const [row] = parseTransactionPaste(raw);

      expect(row.amount).toBe(41.03);
      expect(row.amount).not.toBe(16796.98);
    });

    it('should parse multiple consecutive Format B transactions', () => {
      const raw = [
        formatB('04/13/26', 'SCHLPAY*ANOKA-HENNEPIN 763-506-1000 MN', '#REF1', '$50.00    $16,896.48'),
        formatB('04/13/26', "MIKE'S DISCOUNT FOODS ANOKA MN", '#REF2', '$44.55    $16,846.48'),
        formatB('04/12/26', 'TIRES PLUS 244206 COON RAPIDS MN', '#REF3', '$41.03    $16,796.98'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows[0].amount).toBe(50);
      expect(rows[1].amount).toBe(44.55);
      expect(rows[2].amount).toBe(41.03);
    });
  });

  // ── Mixed formats ─────────────────────────────────────────────────────────

  describe('mixed formats in one paste', () => {
    it('should parse Format A and Format B blocks that appear together', () => {
      const raw = [
        formatA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        formatB('04/13/26', 'SCHLPAY*ANOKA-HENNEPIN 763-506-1000 MN', '#REF1', '$50.00    $16,896.48'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
      expect(rows[0].amount).toBe(60.21);
      expect(rows[1].amount).toBe(50);
    });
  });

  // ── Amount parsing ────────────────────────────────────────────────────────

  describe('amount parsing', () => {
    it('should parse a plain positive dollar amount', () => {
      const raw = formatA(1, '04/16/26', 'ALDI', '#...1193', '$60.21');
      expect(parseTransactionPaste(raw)[0].amount).toBe(60.21);
    });

    it('should parse a negative amount with leading minus before $', () => {
      const raw = formatA(1, '04/16/26', 'REFUND', '#...1193', '-$12.00');
      expect(parseTransactionPaste(raw)[0].amount).toBe(-12);
    });

    it('should parse a negative amount with minus after $', () => {
      const raw = formatA(1, '04/16/26', 'REFUND', '#...1193', '$-12.00');
      expect(parseTransactionPaste(raw)[0].amount).toBe(-12);
    });

    it('should parse amounts with comma thousands separators', () => {
      const raw = formatA(1, '04/16/26', 'BIG PURCHASE', '#...1193', '$1,234.56');
      expect(parseTransactionPaste(raw)[0].amount).toBe(1234.56);
    });

    it('should parse zero-dollar amounts', () => {
      const raw = formatA(1, '04/16/26', 'FREE ITEM', '#...1193', '$0.00');
      expect(parseTransactionPaste(raw)[0].amount).toBe(0);
    });

    it('should parse whole-dollar amounts without cents', () => {
      const raw = formatA(1, '04/16/26', 'ALLIED PARKING', '#...1193', '$7.00');
      expect(parseTransactionPaste(raw)[0].amount).toBe(7);
    });

    it('should ignore running balance and take only first amount on line', () => {
      const raw = formatB('04/12/26', 'TIRES PLUS', '#REF', '$36.45    $16,755.95');
      expect(parseTransactionPaste(raw)[0].amount).toBe(36.45);
    });
  });

  // ── Error / ambiguous rows ────────────────────────────────────────────────

  describe('error cases — ambiguous rows', () => {
    it('should flag a row when no amount line is present', () => {
      // Block ends before any amount is encountered
      const raw =
        'Transaction Details for Row 1    04/16/26    ALDI 72086\n#...1193';
      const [row] = parseTransactionPaste(raw);

      expect(row.amount).toBeNull();
      expect(row.parseErrors.length).toBeGreaterThan(0);
      expect(row.parseErrors.some((e) => e.toLowerCase().includes('amount'))).toBe(true);
    });

    it('should flag a row with an unrecognised header and still attempt to recover amount', () => {
      // Only the header is bad; a subsequent valid amount line should still surface as ambiguous
      const raw = 'Transaction Details for Row 1\n#...1193\n$60.21';
      const [row] = parseTransactionPaste(raw);

      expect(row.parseErrors.length).toBeGreaterThan(0);
    });

    it('should not add errors for rows that parse cleanly', () => {
      const raw = formatA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21');
      const [row] = parseTransactionPaste(raw);

      expect(row.parseErrors).toHaveLength(0);
    });

    it('should mark the problematic row but still parse surrounding clean rows', () => {
      const raw = [
        formatA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        // Row 2: missing amount
        'Transaction Details for Row 2    04/16/26    BAD ROW\n#...1193',
        formatA(3, '04/16/26', 'DOLLAR TREE', '#...1193', '$29.73'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(3);
      expect(rows[0].parseErrors).toHaveLength(0);
      expect(rows[1].parseErrors.length).toBeGreaterThan(0);
      expect(rows[2].parseErrors).toHaveLength(0);
    });
  });

  // ── Whitespace and blank lines ────────────────────────────────────────────

  describe('whitespace tolerance', () => {
    it('should tolerate blank lines between transaction blocks', () => {
      const raw = [
        formatA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        '',
        '',
        formatA(2, '04/16/26', 'SAVERS - 1202', '#...1193', '$60.47'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
    });

    it('should trim leading and trailing whitespace from description', () => {
      // Extra spaces between the date and description in the header
      const raw = 'Transaction Details for Row 1    04/16/26      ALDI 72086   \n#...1193\n$60.21';
      const [row] = parseTransactionPaste(raw);

      expect(row.description).toBe('ALDI 72086');
    });

    it('should ignore unrelated lines between blocks', () => {
      const raw = [
        'This is some header text that should be skipped',
        formatA(1, '04/16/26', 'ALDI 72086', '#...1193', '$60.21'),
        'More unrelated text',
        formatA(2, '04/16/26', 'SAVERS - 1202', '#...1193', '$60.47'),
      ].join('\n');

      const rows = parseTransactionPaste(raw);
      expect(rows).toHaveLength(2);
    });
  });

  // ── Real-world sample data ────────────────────────────────────────────────

  describe('real-world sample data', () => {
    it('should parse the original 8-row Format A sample correctly', () => {
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
      rows.forEach((row) => expect(row.parseErrors).toHaveLength(0));

      expect(rows[0]).toMatchObject({ description: 'ALDI 72086', amount: 60.21 });
      expect(rows[1]).toMatchObject({ description: 'SAVERS - 1202', amount: 60.47 });
      expect(rows[2]).toMatchObject({ description: 'iSPINE CRC 100', amount: 290.55 });
      expect(rows[3]).toMatchObject({ description: "MCDONALD 'S F10830", amount: 1.07 });
      expect(rows[4]).toMatchObject({ description: 'ALLIED PARKING HPR SM', amount: 7 });
      expect(rows[5]).toMatchObject({ description: 'HCMC CAFETERIA', amount: 2.57 });
      expect(rows[6]).toMatchObject({ description: 'HCMC CAFETERIA', amount: 23.49 });
      expect(rows[7]).toMatchObject({ description: 'DOLLAR TREE', amount: 29.73 });
    });

    it('should parse the 5-row Format B sample correctly', () => {
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
      rows.forEach((row) => expect(row.parseErrors).toHaveLength(0));

      expect(rows[0]).toMatchObject({ description: 'SCHLPAY*ANOKA-HENNEPIN 763-506-1000 MN', amount: 50 });
      expect(rows[1]).toMatchObject({ description: "MIKE 'S DISCOUNT FOODS ANOKA MN", amount: 44.55 });
      expect(rows[2]).toMatchObject({ description: 'PAYPAL *ALIPAYUSINC 402-935-7733 CA', amount: 4.95 });
      expect(rows[3]).toMatchObject({ description: 'TIRES PLUS 244206 COON RAPIDS MN', amount: 41.03 });
      expect(rows[4]).toMatchObject({ description: 'TIRES PLUS 244206 COON RAPIDS MN', amount: 36.45 });

      // Confirm running balances were NOT captured
      expect(rows[0].amount).not.toBe(16896.48);
      expect(rows[4].amount).not.toBe(16755.95);
    });
  });
});

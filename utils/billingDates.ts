// Business-day helpers for credit card statement close dates.
// Some issuers (e.g. US Bank) close statements on the Nth business day of the
// month rather than a fixed calendar day. Business days are weekdays excluding
// US federal holidays, using the observed-date rule (Saturday → Friday,
// Sunday → Monday).

function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number,
): Date {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

function lastWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
): Date {
  const last = new Date(year, month + 1, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - offset);
}

function observed(d: Date): Date {
  const result = new Date(d);
  if (result.getDay() === 6) result.setDate(result.getDate() - 1);
  else if (result.getDay() === 0) result.setDate(result.getDate() + 1);
  return result;
}

function federalHolidays(year: number): Date[] {
  return [
    observed(new Date(year, 0, 1)), // New Year's Day
    nthWeekdayOfMonth(year, 0, 1, 3), // Martin Luther King Jr. Day
    nthWeekdayOfMonth(year, 1, 1, 3), // Presidents Day
    lastWeekdayOfMonth(year, 4, 1), // Memorial Day
    observed(new Date(year, 5, 19)), // Juneteenth
    observed(new Date(year, 6, 4)), // Independence Day
    nthWeekdayOfMonth(year, 8, 1, 1), // Labor Day
    nthWeekdayOfMonth(year, 9, 1, 2), // Columbus Day
    observed(new Date(year, 10, 11)), // Veterans Day
    nthWeekdayOfMonth(year, 10, 4, 4), // Thanksgiving
    observed(new Date(year, 11, 25)), // Christmas
  ];
}

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function isBusinessDay(d: Date): boolean {
  const day = d.getDay();
  if (day === 0 || day === 6) return false;
  // Next year's New Year's Day can be observed on Dec 31 of this year
  const holidays = [
    ...federalHolidays(d.getFullYear()),
    ...federalHolidays(d.getFullYear() + 1),
  ];
  const key = dateKey(d);
  return !holidays.some((h) => dateKey(h) === key);
}

// Returns the Nth business day of the given month (month is 0-based), or the
// month's last business day when the month has fewer than N.
export function nthBusinessDayOfMonth(
  year: number,
  month: number,
  n: number,
): Date {
  // Normalizes month overflow (e.g. month -1 → December of the prior year)
  const d = new Date(year, month, 1);
  const targetMonth = d.getMonth();
  let count = 0;
  let lastBusinessDay = new Date(d);
  while (d.getMonth() === targetMonth) {
    if (isBusinessDay(d)) {
      count += 1;
      lastBusinessDay = new Date(d);
      if (count === n) break;
    }
    d.setDate(d.getDate() + 1);
  }
  return lastBusinessDay;
}

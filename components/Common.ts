/**
 * Normalize transaction date handling across components
 *
 * Consistent approach for working with transaction dates to ensure uniform behavior
 * across all finance components. This function ensures dates are timezone agnostic
 * by setting the time to noon UTC on the specified date.
 *
 * @param date - Date object or string to normalize
 * @returns A properly formatted Date object with timezone issues eliminated
 */
export const normalizeTransactionDate = (date: Date | string): Date => {
  if (!date) return new Date();

  let dateObj: Date;

  if (date instanceof Date) {
    // If date is a Date object, extract its year, month, and day
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Create a new Date object with the time set to noon UTC
    dateObj = new Date(Date.UTC(year, month, day, 12, 0, 0));
  } else {
    // If date is a string (like "YYYY-MM-DD")
    if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse the date parts from the string
      const [year, month, day] = date.split("-").map(Number);

      // Create a new Date object with the time set to noon UTC
      // Note: month is 0-indexed in JavaScript Date
      dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } else {
      // For other string formats, use standard Date constructor but fix timezone issues
      const tempDate = new Date(date);
      dateObj = new Date(
        Date.UTC(
          tempDate.getFullYear(),
          tempDate.getMonth(),
          tempDate.getDate(),
          12,
          0,
          0,
        ),
      );
    }
  }

  return dateObj;
};

/**
 * Format a date consistently for form input fields (YYYY-MM-DD)
 *
 * @param date - Date object or string to format
 * @returns Date formatted as YYYY-MM-DD string
 */
export const formatDateForInput = (date: Date | string): string => {
  const dateObj = normalizeTransactionDate(date);

  // Use UTC methods to avoid timezone issues
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Format a date for display in UI components
 *
 * @param date - Date object or string to format
 * @returns Formatted date string (e.g., "MM/DD/YYYY")
 */
export const formatDateForDisplay = (date: Date | string): string => {
  if (!date) return "";
  const dateObj = normalizeTransactionDate(date);

  // Create options for consistent date formatting regardless of timezone
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  };

  return dateObj.toLocaleDateString("en-US", options);
};

// Legacy functions maintained for backward compatibility
export const convertUTCDateToLocalDate = (date: Date) => {
  console.warn(
    "convertUTCDateToLocalDate is deprecated, use normalizeTransactionDate instead",
  );
  return normalizeTransactionDate(date);
};

/** Deprecated: use formatDateForInput instead */
// Previously exported formatDate and fetchTimeZone helpers removed.

export const currencyFormat = (inputData: number | string): string => {
  if (inputData === undefined || inputData === null) {
    return "$0.00";
  }
  const amount =
    typeof inputData === "string" ? parseFloat(inputData) : inputData;
  return isNaN(amount)
    ? "$0.00"
    : amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
};

export const epochToDate = (epoch: number): Date => {
  return new Date(epoch); // The 0 there is the key, which sets the date to the epoch
};

// Removed legacy auth/endpoint helpers; configuration handled via Next runtime.

export const typeOf = (obj: any) => {
  return {}.toString.call(obj).split(" ")[1].slice(0, -1).toLowerCase();
};

export const noNaN = (n: any) => {
  return isNaN(n) ? 0.0 : n;
};

export const capitalizeFirstChar = (inString: string) => {
  return inString.charAt(0).toUpperCase() + inString.slice(1);
};

export function isFloat(n: number) {
  return Number(n) === n && n % 1 !== 0;
}

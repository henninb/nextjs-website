/**
 * Normalize transaction date handling across components
 *
 * Consistent approach for working with transaction dates to ensure uniform behavior
 * across all finance components.
 *
 * @param date - Date object or string to normalize
 * @returns A properly formatted Date object
 */
export const normalizeTransactionDate = (date: Date | string): Date => {
  if (!date) return new Date();

  // If date is already a Date object, clone it to avoid mutating the original
  const dateObj = date instanceof Date ? new Date(date) : new Date(date);

  // Return the normalized date (no timezone adjustment needed)
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

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

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
  return dateObj.toLocaleDateString("en-US");
};

// Legacy functions maintained for backward compatibility
export const convertUTCDateToLocalDate = (date: Date) => {
  console.warn(
    "convertUTCDateToLocalDate is deprecated, use normalizeTransactionDate instead",
  );
  return normalizeTransactionDate(date);
};

export const formatDate = (date: Date | string): string => {
  console.warn("formatDate is deprecated, use formatDateForInput instead");
  return formatDateForInput(date);
};

// export const fetchTimeZone = () => {
//   return process.env.REACT_APP_TIMEZONE;
// };

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

// export const basicAuth = () => {
//   const token = process.env.REACT_APP_API_KEY;
//   return "Basic " + token;
// };

// export const endpointUrl = () => {
//   let port = process.env.REACT_APP_ENDPOINT_PORT;
//   let server = process.env.REACT_APP_ENDPOINT_SERVER;
//   let httpEnabled = process.env.REACT_APP_ENDPOINT_SSL_ENABLED;
//
//   if (httpEnabled === "true") {
//     return "https://" + server + ":" + port;
//   }
//   return "http://" + server + ":" + port;
// };

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

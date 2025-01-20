export const convertUTCDateToLocalDate = (date: Date) => {
  return new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
};

export const formatDate = (date: Date): string => {
  //const isDate = date instanceof Date;
  if (date instanceof Date) {
    let month = "" + (date.getMonth() + 1);
    let day = "" + date.getDate();
    const year = date.getFullYear();

    month = ("0" + month).slice(-2);
    day = ("0" + day).slice(-2);

    return [year, month, day].join("-");
  } else {
    return formatDate(new Date(date));
  }
};

// export const fetchTimeZone = () => {
//   return process.env.REACT_APP_TIMEZONE;
// };

export const currencyFormat = (inputData: string): string => {
  inputData = parseFloat(inputData).toFixed(2);
  return inputData.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

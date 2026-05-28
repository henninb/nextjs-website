export function createProcessRowUpdate<T>(
  updateFn: (newRow: T, oldRow: T) => Promise<unknown>,
  successMsg: string,
  errorMsg: string,
  handleSuccess: (msg: string) => void,
  handleError: (e: unknown, msg: string, throwIt: boolean) => void,
): (newRow: T, oldRow: T) => Promise<T> {
  return async (newRow: T, oldRow: T): Promise<T> => {
    if (JSON.stringify(newRow) === JSON.stringify(oldRow)) return oldRow;
    try {
      await updateFn(newRow, oldRow);
      handleSuccess(successMsg);
      return { ...newRow };
    } catch (error) {
      handleError(error, errorMsg, false);
      return oldRow;
    }
  };
}

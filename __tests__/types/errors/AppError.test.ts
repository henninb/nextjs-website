import {
  AppError,
  getErrorMessage,
  hasMessage,
  isAppError,
  isError,
  toErrorResult,
} from "../../../types/errors/AppError";

describe("AppError utilities", () => {
  it("creates structured AppError instances", () => {
    const error = new AppError("Invalid input", "INVALID_INPUT", 400, "email");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe("AppError");
    expect(error.message).toBe("Invalid input");
    expect(error.code).toBe("INVALID_INPUT");
    expect(error.statusCode).toBe(400);
    expect(error.field).toBe("email");
    expect(typeof error.stack).toBe("string");
  });

  it("identifies AppError and Error instances", () => {
    const appError = new AppError("Boom", "BOOM");
    const standardError = new Error("Standard");

    expect(isAppError(appError)).toBe(true);
    expect(isAppError(standardError)).toBe(false);
    expect(isError(standardError)).toBe(true);
    expect(isError("not-an-error")).toBe(false);
  });

  it("detects values with message properties", () => {
    expect(hasMessage({ message: "present" })).toBe(true);
    expect(hasMessage({ message: 123 })).toBe(false);
    expect(hasMessage(null)).toBe(false);
    expect(hasMessage("plain string")).toBe(false);
  });

  it("converts supported error types into ErrorResult objects", () => {
    const appErrorResult = toErrorResult(
      new AppError("Denied", "DENIED", 403, "role"),
    );
    const standardErrorResult = toErrorResult(new Error("Failure"));
    const messageObjectResult = toErrorResult({ message: "Object failure" });
    const fallbackResult = toErrorResult(42);

    expect(appErrorResult).toEqual({
      message: "Denied",
      code: "DENIED",
      field: "role",
      statusCode: 403,
    });
    expect(standardErrorResult).toEqual({
      message: "Failure",
      code: "ERROR",
    });
    expect(messageObjectResult).toEqual({
      message: "Object failure",
      code: "UNKNOWN_ERROR",
    });
    expect(fallbackResult).toEqual({
      message: "42",
      code: "UNKNOWN_ERROR",
    });
  });

  it("extracts error messages from unknown values", () => {
    expect(getErrorMessage(new Error("Readable"))).toBe("Readable");
    expect(getErrorMessage("string failure")).toBe("string failure");
  });
});

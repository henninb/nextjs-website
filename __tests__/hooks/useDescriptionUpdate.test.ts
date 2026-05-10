import useDescriptionUpdate, { updateDescription } from "../../hooks/useDescriptionUpdate";
import Description from "../../model/Description";
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("../../utils/fetchUtils", () => ({
  fetchWithErrorHandling: jest.fn(),
  parseResponse: jest.fn(),
  FetchError: class FetchError extends Error {
    constructor(
      message: string,
      public status?: number,
    ) {
      super(message);
      this.name = "FetchError";
    }
  },
}));

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeDescription: jest.fn((value: string) => value),
  },
}));

jest.mock("../../utils/hookValidation", () => ({
  validateUpdate: jest.fn((data: unknown) => data),
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateDescription: jest.fn((data: unknown) => data),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    description: jest.fn(() => ["description"]),
  },
  updateInList: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

import { fetchWithErrorHandling, parseResponse } from "../../utils/fetchUtils";
import { InputSanitizer } from "../../utils/validation/sanitization";
import { validateUpdate } from "../../utils/hookValidation";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockParseResponse = parseResponse as jest.MockedFunction<
  typeof parseResponse
>;
const mockSanitizeDescription =
  InputSanitizer.sanitizeDescription as jest.MockedFunction<
    typeof InputSanitizer.sanitizeDescription
  >;
const mockValidateUpdate = validateUpdate as jest.MockedFunction<
  typeof validateUpdate
>;

const createTestDescription = (
  overrides: Partial<Description> = {},
): Description => ({
  descriptionId: 1,
  descriptionName: "test_description",
  activeStatus: true,
  ...overrides,
});

describe("useDescriptionUpdate - updateDescription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
    mockSanitizeDescription.mockImplementation((value: string) => value);
    mockValidateUpdate.mockImplementation((data: unknown) => data as Description);
  });

  describe("endpoint construction", () => {
    it("should use old description name in PUT endpoint URL", async () => {
      const oldDesc = createTestDescription({ descriptionName: "old_store" });
      const newDesc = createTestDescription({ descriptionName: "new_store" });
      mockParseResponse.mockResolvedValue(newDesc);

      await updateDescription(oldDesc, newDesc);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/description/old_store");
    });

    it("should sanitize old description name for URL", async () => {
      const oldDesc = createTestDescription({ descriptionName: "amazon" });
      const newDesc = createTestDescription({ descriptionName: "amazon_prime" });
      mockParseResponse.mockResolvedValue(newDesc);

      await updateDescription(oldDesc, newDesc);

      expect(mockSanitizeDescription).toHaveBeenCalledWith("amazon");
    });

    it("should use sanitized name in endpoint", async () => {
      mockSanitizeDescription.mockReturnValue("sanitized_old");
      const oldDesc = createTestDescription({ descriptionName: "raw_old" });
      const newDesc = createTestDescription({ descriptionName: "new_name" });
      mockParseResponse.mockResolvedValue(newDesc);

      await updateDescription(oldDesc, newDesc);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/description/sanitized_old");
    });

    it("should validate the new description with validateUpdate", async () => {
      const oldDesc = createTestDescription({ descriptionName: "old" });
      const newDesc = createTestDescription({ descriptionName: "new" });
      mockParseResponse.mockResolvedValue(newDesc);

      await updateDescription(oldDesc, newDesc);

      expect(mockValidateUpdate).toHaveBeenCalledWith(
        newDesc,
        expect.any(Function),
        "updateDescription",
      );
    });
  });

  describe("successful update", () => {
    it("should call fetchWithErrorHandling with PUT method", async () => {
      const oldDesc = createTestDescription({ descriptionName: "old" });
      const newDesc = createTestDescription({ descriptionName: "new" });
      mockParseResponse.mockResolvedValue(newDesc);

      await updateDescription(oldDesc, newDesc);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("should send the validated new description as JSON body", async () => {
      const oldDesc = createTestDescription({ descriptionName: "old_name" });
      const newDesc = createTestDescription({ descriptionName: "new_name" });
      mockValidateUpdate.mockReturnValue(newDesc);
      mockParseResponse.mockResolvedValue(newDesc);

      await updateDescription(oldDesc, newDesc);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.descriptionName).toBe("new_name");
    });

    it("should return the updated description", async () => {
      const oldDesc = createTestDescription();
      const newDesc = createTestDescription({
        descriptionName: "updated_desc",
        activeStatus: false,
      });
      mockParseResponse.mockResolvedValue(newDesc);

      const result = await updateDescription(oldDesc, newDesc);

      expect(result).toStrictEqual(newDesc);
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 200 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const oldDesc = createTestDescription();
      const newDesc = createTestDescription({ descriptionName: "updated" });
      mockParseResponse.mockResolvedValue(newDesc);

      await updateDescription(oldDesc, newDesc);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should update amazon to amazon_prime", async () => {
      const oldDesc = createTestDescription({ descriptionName: "amazon" });
      const newDesc = createTestDescription({ descriptionName: "amazon_prime" });
      mockParseResponse.mockResolvedValue(newDesc);

      const result = await updateDescription(oldDesc, newDesc);

      expect(result.descriptionName).toBe("amazon_prime");
      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/description/amazon",
        expect.any(Object),
      );
    });

    it("should update activeStatus field", async () => {
      const oldDesc = createTestDescription({ activeStatus: true });
      const newDesc = createTestDescription({ activeStatus: false });
      mockParseResponse.mockResolvedValue(newDesc);

      const result = await updateDescription(oldDesc, newDesc);

      expect(result.activeStatus).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should propagate 404 not found error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Description not found", 404),
      );
      const oldDesc = createTestDescription();
      const newDesc = createTestDescription({ descriptionName: "updated" });

      await expect(updateDescription(oldDesc, newDesc)).rejects.toThrow(
        "Description not found",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Description name already exists", 409),
      );
      const oldDesc = createTestDescription();
      const newDesc = createTestDescription({ descriptionName: "existing" });

      await expect(updateDescription(oldDesc, newDesc)).rejects.toThrow(
        "Description name already exists",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const oldDesc = createTestDescription();
      const newDesc = createTestDescription({ descriptionName: "updated" });

      await expect(updateDescription(oldDesc, newDesc)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate validation errors from validateUpdate", async () => {
      const { HookValidationError } = jest.requireMock(
        "../../utils/hookValidation",
      );
      mockValidateUpdate.mockImplementation(() => {
        throw new HookValidationError("descriptionName is required");
      });
      const oldDesc = createTestDescription();
      const newDesc = createTestDescription({ descriptionName: "" });

      await expect(updateDescription(oldDesc, newDesc)).rejects.toThrow(
        "descriptionName is required",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const oldDesc = createTestDescription();
      const newDesc = createTestDescription({ descriptionName: "updated" });

      await expect(updateDescription(oldDesc, newDesc)).rejects.toThrow(
        "Internal server error",
      );
    });
  });

  describe("request format", () => {
    it("should use PUT method", async () => {
      const oldDesc = createTestDescription();
      const newDesc = createTestDescription({ descriptionName: "updated" });
      mockParseResponse.mockResolvedValue(newDesc);

      await updateDescription(oldDesc, newDesc);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("PUT");
    });

    it("should include new description data in body", async () => {
      const oldDesc = createTestDescription({ descriptionName: "old" });
      const newDesc = createTestDescription({
        descriptionId: 1,
        descriptionName: "new_name",
        activeStatus: true,
      });
      mockValidateUpdate.mockReturnValue(newDesc);
      mockParseResponse.mockResolvedValue(newDesc);

      await updateDescription(oldDesc, newDesc);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeDefined();
      const body = JSON.parse(options?.body as string);
      expect(body.descriptionId).toBe(1);
      expect(body.descriptionName).toBe("new_name");
    });
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useDescriptionUpdate default export
// ---------------------------------------------------------------------------

const createDescUpdateHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createDescUpdateHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useDescriptionUpdate hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
    mockValidateUpdate.mockImplementation((data: unknown) => data as Description);
  });

  it("onSuccess calls updateInList with the updated description", async () => {
    const queryClient = createDescUpdateHookQueryClient();
    const oldDesc = createTestDescription({ descriptionName: "old_store" });
    const updatedDesc = createTestDescription({ descriptionId: 1, descriptionName: "new_store" });
    mockParseResponse.mockResolvedValue(updatedDesc);

    const { result } = renderHook(() => useDescriptionUpdate(), {
      wrapper: createDescUpdateHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldDescription: oldDesc, newDescription: updatedDesc });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { updateInList } = jest.requireMock("../../utils/cacheUtils");
    expect(updateInList).toHaveBeenCalledWith(
      expect.anything(),
      ["description"],
      updatedDesc,
      "descriptionId",
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createDescUpdateHookQueryClient();
    mockFetchWithErrorHandling.mockRejectedValue(new Error("Update failed"));

    const { result } = renderHook(() => useDescriptionUpdate(), {
      wrapper: createDescUpdateHookWrapper(queryClient),
    });

    const oldDesc = createTestDescription();
    const newDesc = createTestDescription({ descriptionName: "updated" });

    await act(async () => {
      try {
        await result.current.mutateAsync({ oldDescription: oldDesc, newDescription: newDesc });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

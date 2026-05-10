import { deleteFamilyMember } from "../../hooks/useFamilyMemberDelete";
import { FamilyMember, FamilyRelationship } from "../../model/FamilyMember";

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
    sanitizeNumericId: jest.fn((value: number) => value),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    familyMember: jest.fn(() => ["familyMember"]),
  },
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

import {
  fetchWithErrorHandling,
} from "../../utils/fetchUtils";
import { InputSanitizer } from "../../utils/validation/sanitization";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockSanitizeNumericId = InputSanitizer.sanitizeNumericId as jest.MockedFunction<
  typeof InputSanitizer.sanitizeNumericId
>;

const createTestFamilyMember = (
  overrides: Partial<FamilyMember> = {},
): FamilyMember => ({
  familyMemberId: 1,
  owner: "john",
  memberName: "Jane Doe",
  relationship: FamilyRelationship.Spouse,
  activeStatus: true,
  ...overrides,
});

describe("useFamilyMemberDelete - deleteFamilyMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
    mockSanitizeNumericId.mockImplementation((value: number) => value);
  });

  describe("successful deletion", () => {
    it("should call fetchWithErrorHandling with correct DELETE endpoint", async () => {
      const member = createTestFamilyMember({ familyMemberId: 42 });

      await deleteFamilyMember(member);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/family-members/42",
        { method: "DELETE" },
      );
    });

    it("should sanitize familyMemberId before constructing endpoint", async () => {
      const member = createTestFamilyMember({ familyMemberId: 99 });

      await deleteFamilyMember(member);

      expect(mockSanitizeNumericId).toHaveBeenCalledWith(99, "familyMemberId");
    });

    it("should return void (undefined) on success", async () => {
      const member = createTestFamilyMember();

      const result = await deleteFamilyMember(member);

      expect(result).toBeUndefined();
    });

    it("should use sanitized ID in the endpoint URL", async () => {
      mockSanitizeNumericId.mockReturnValue(7);
      const member = createTestFamilyMember({ familyMemberId: 7 });

      await deleteFamilyMember(member);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/family-members/7",
        expect.any(Object),
      );
    });

    it("should delete family member with spouse relationship", async () => {
      const member = createTestFamilyMember({
        familyMemberId: 10,
        relationship: FamilyRelationship.Spouse,
      });

      await deleteFamilyMember(member);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/family-members/10",
        expect.any(Object),
      );
    });

    it("should delete family member with child relationship", async () => {
      const member = createTestFamilyMember({
        familyMemberId: 20,
        relationship: FamilyRelationship.Child,
      });

      await deleteFamilyMember(member);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/family-members/20",
        expect.any(Object),
      );
    });

    it("should delete family member with self relationship", async () => {
      const member = createTestFamilyMember({
        familyMemberId: 1,
        relationship: FamilyRelationship.Self,
        memberName: "John Doe",
      });

      await deleteFamilyMember(member);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/family-members/1",
        expect.any(Object),
      );
    });

    it("should handle inactive family member deletion", async () => {
      const member = createTestFamilyMember({
        familyMemberId: 5,
        activeStatus: false,
      });

      await deleteFamilyMember(member);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/family-members/5",
        expect.any(Object),
      );
    });
  });

  describe("error handling", () => {
    it("should propagate FetchError from fetchWithErrorHandling", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Not found", 404),
      );
      const member = createTestFamilyMember();

      await expect(deleteFamilyMember(member)).rejects.toThrow("Not found");
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const member = createTestFamilyMember();

      await expect(deleteFamilyMember(member)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const member = createTestFamilyMember();

      await expect(deleteFamilyMember(member)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate 401 unauthorized error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Unauthorized", 401),
      );
      const member = createTestFamilyMember();

      await expect(deleteFamilyMember(member)).rejects.toThrow("Unauthorized");
    });

    it("should propagate 403 forbidden error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Forbidden", 403),
      );
      const member = createTestFamilyMember();

      await expect(deleteFamilyMember(member)).rejects.toThrow("Forbidden");
    });
  });

  describe("request format", () => {
    it("should use DELETE HTTP method", async () => {
      const member = createTestFamilyMember();

      await deleteFamilyMember(member);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("DELETE");
    });

    it("should not send a request body for DELETE", async () => {
      const member = createTestFamilyMember();

      await deleteFamilyMember(member);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeUndefined();
    });
  });

  describe("different IDs", () => {
    it.each([1, 10, 100, 999, 99999])(
      "should construct correct endpoint for ID %d",
      async (id) => {
        const member = createTestFamilyMember({ familyMemberId: id });

        await deleteFamilyMember(member);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          `/api/family-members/${id}`,
          expect.any(Object),
        );
      },
    );
  });
});

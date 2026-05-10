import { insertFamilyMember } from "../../hooks/useFamilyMemberInsert";
import {
  FamilyMember,
  FamilyMemberCreateRequest,
  FamilyRelationship,
} from "../../model/FamilyMember";

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

import { fetchWithErrorHandling, parseResponse } from "../../utils/fetchUtils";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockParseResponse = parseResponse as jest.MockedFunction<
  typeof parseResponse
>;

const createTestRequest = (
  overrides: Partial<FamilyMemberCreateRequest> = {},
): FamilyMemberCreateRequest => ({
  memberName: "Jane Doe",
  relationship: FamilyRelationship.Spouse,
  activeStatus: true,
  ...overrides,
});

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

describe("useFamilyMemberInsert - insertFamilyMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 201 } as Response);
    mockParseResponse.mockResolvedValue(createTestFamilyMember());
  });

  describe("successful insertion", () => {
    it("should call fetchWithErrorHandling with POST to /api/family-members", async () => {
      const request = createTestRequest();

      await insertFamilyMember(request);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/family-members",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should send the payload as JSON body", async () => {
      const request = createTestRequest({ memberName: "Bob Smith" });

      await insertFamilyMember(request);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBe(JSON.stringify(request));
    });

    it("should return the created family member", async () => {
      const expectedMember = createTestFamilyMember({ familyMemberId: 5 });
      mockParseResponse.mockResolvedValue(expectedMember);
      const request = createTestRequest();

      const result = await insertFamilyMember(request);

      expect(result).toStrictEqual(expectedMember);
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 201 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const request = createTestRequest();

      await insertFamilyMember(request);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should insert family member with child relationship", async () => {
      const request = createTestRequest({
        memberName: "Baby Doe",
        relationship: FamilyRelationship.Child,
      });
      const expectedMember = createTestFamilyMember({
        familyMemberId: 10,
        memberName: "Baby Doe",
        relationship: FamilyRelationship.Child,
      });
      mockParseResponse.mockResolvedValue(expectedMember);

      const result = await insertFamilyMember(request);

      expect(result.relationship).toBe(FamilyRelationship.Child);
    });

    it("should insert family member with dependent relationship", async () => {
      const request = createTestRequest({
        memberName: "Dep Member",
        relationship: FamilyRelationship.Dependent,
      });
      const expectedMember = createTestFamilyMember({
        familyMemberId: 11,
        memberName: "Dep Member",
        relationship: FamilyRelationship.Dependent,
      });
      mockParseResponse.mockResolvedValue(expectedMember);

      const result = await insertFamilyMember(request);

      expect(result.relationship).toBe(FamilyRelationship.Dependent);
    });

    it("should insert family member with optional fields", async () => {
      const request = createTestRequest({
        memberName: "Jane",
        relationship: FamilyRelationship.Spouse,
        dateOfBirth: new Date("1985-05-10"),
        insuranceMemberId: "INS-12345",
        ssnLastFour: "4567",
      });
      const expectedMember = createTestFamilyMember({ familyMemberId: 3 });
      mockParseResponse.mockResolvedValue(expectedMember);

      const result = await insertFamilyMember(request);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/family-members",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(request),
        }),
      );
      expect(result).toStrictEqual(expectedMember);
    });
  });

  describe("error handling", () => {
    it("should propagate FetchError on API failure", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Bad request", 400),
      );
      const request = createTestRequest();

      await expect(insertFamilyMember(request)).rejects.toThrow("Bad request");
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Family member already exists", 409),
      );
      const request = createTestRequest();

      await expect(insertFamilyMember(request)).rejects.toThrow(
        "Family member already exists",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const request = createTestRequest();

      await expect(insertFamilyMember(request)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const request = createTestRequest();

      await expect(insertFamilyMember(request)).rejects.toThrow(
        "Internal server error",
      );
    });
  });

  describe("request format", () => {
    it("should use POST method", async () => {
      const request = createTestRequest();

      await insertFamilyMember(request);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("POST");
    });

    it("should serialize payload to JSON string", async () => {
      const request: FamilyMemberCreateRequest = {
        memberName: "Test Member",
        relationship: FamilyRelationship.Other,
      };

      await insertFamilyMember(request);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBe(JSON.stringify(request));
    });

    it("should always post to /api/family-members endpoint", async () => {
      const request = createTestRequest();

      await insertFamilyMember(request);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/family-members");
    });
  });
});

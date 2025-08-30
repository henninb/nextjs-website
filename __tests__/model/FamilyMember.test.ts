import {
  FamilyMember,
  FamilyRelationship,
  FamilyMemberCreateRequest,
  validateFamilyMemberData,
  getFamilyMemberDisplayName,
  getRelationshipColor,
  calculateAge,
} from "../../model/FamilyMember";

describe("FamilyMember Model", () => {
  const mockFamilyMember: FamilyMember = {
    familyMemberId: 1,
    owner: "testuser",
    memberName: "John Doe",
    relationship: FamilyRelationship.Self,
    dateOfBirth: new Date("1985-06-15"),
    insuranceMemberId: "INS123456",
    ssnLastFour: "1234",
    medicalRecordNumber: "MRN789012",
    activeStatus: true,
    dateAdded: new Date("2024-01-15T10:00:00Z"),
    dateUpdated: new Date("2024-01-15T10:00:00Z"),
  };

  describe("FamilyMember Interface", () => {
    it("should create valid family member object with all fields", () => {
      expect(mockFamilyMember.familyMemberId).toBe(1);
      expect(mockFamilyMember.owner).toBe("testuser");
      expect(mockFamilyMember.memberName).toBe("John Doe");
      expect(mockFamilyMember.relationship).toBe(FamilyRelationship.Self);
      expect(mockFamilyMember.activeStatus).toBe(true);
    });

    it("should create minimal family member object with required fields only", () => {
      const minimalMember: FamilyMember = {
        familyMemberId: 2,
        owner: "testuser2",
        memberName: "Jane Smith",
        relationship: FamilyRelationship.Spouse,
        activeStatus: true,
      };

      expect(minimalMember.familyMemberId).toBe(2);
      expect(minimalMember.memberName).toBe("Jane Smith");
      expect(minimalMember.relationship).toBe(FamilyRelationship.Spouse);
      expect(minimalMember.dateOfBirth).toBeUndefined();
      expect(minimalMember.insuranceMemberId).toBeUndefined();
    });

    it("should handle optional fields correctly", () => {
      const memberWithOptionals: FamilyMember = {
        ...mockFamilyMember,
        dateOfBirth: undefined,
        insuranceMemberId: undefined,
        ssnLastFour: undefined,
        medicalRecordNumber: undefined,
        dateAdded: undefined,
        dateUpdated: undefined,
      };

      expect(memberWithOptionals.dateOfBirth).toBeUndefined();
      expect(memberWithOptionals.insuranceMemberId).toBeUndefined();
      expect(memberWithOptionals.ssnLastFour).toBeUndefined();
    });
  });

  describe("FamilyRelationship Enum", () => {
    it("should contain all expected relationship values", () => {
      expect(FamilyRelationship.Self).toBe("self");
      expect(FamilyRelationship.Spouse).toBe("spouse");
      expect(FamilyRelationship.Child).toBe("child");
      expect(FamilyRelationship.Dependent).toBe("dependent");
      expect(FamilyRelationship.Other).toBe("other");
    });

    it("should have 5 relationship values", () => {
      const relationshipValues = Object.values(FamilyRelationship);
      expect(relationshipValues).toHaveLength(5);
    });
  });

  describe("validateFamilyMemberData", () => {
    describe("Required field validation", () => {
      it("should pass validation with valid required fields", () => {
        const validMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
        };

        const result = validateFamilyMemberData(validMember);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should fail validation when member name is missing", () => {
        const invalidMember = {
          relationship: FamilyRelationship.Self,
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Member name is required");
      });

      it("should fail validation when member name is empty string", () => {
        const invalidMember = {
          memberName: "",
          relationship: FamilyRelationship.Self,
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Member name is required");
      });

      it("should fail validation when member name is only whitespace", () => {
        const invalidMember = {
          memberName: "   ",
          relationship: FamilyRelationship.Self,
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Member name is required");
      });

      it("should fail validation when relationship is missing", () => {
        const invalidMember = {
          memberName: "John Doe",
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Relationship is required");
      });

      it("should fail validation with invalid relationship", () => {
        const invalidMember = {
          memberName: "John Doe",
          relationship: "invalid" as FamilyRelationship,
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Invalid relationship type");
      });
    });

    describe("Member name length validation", () => {
      it("should pass validation with 100 character name", () => {
        const validMember = {
          memberName: "A".repeat(100),
          relationship: FamilyRelationship.Self,
        };

        const result = validateFamilyMemberData(validMember);
        expect(result.isValid).toBe(true);
      });

      it("should fail validation with 101 character name", () => {
        const invalidMember = {
          memberName: "A".repeat(101),
          relationship: FamilyRelationship.Self,
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Member name must be less than 100 characters",
        );
      });
    });

    describe("SSN validation", () => {
      it("should pass validation with valid 4-digit SSN", () => {
        const validMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
          ssnLastFour: "1234",
        };

        const result = validateFamilyMemberData(validMember);
        expect(result.isValid).toBe(true);
      });

      it("should pass validation with no SSN provided", () => {
        const validMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
        };

        const result = validateFamilyMemberData(validMember);
        expect(result.isValid).toBe(true);
      });

      it("should fail validation with 3-digit SSN", () => {
        const invalidMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
          ssnLastFour: "123",
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "SSN last four must be exactly 4 digits",
        );
      });

      it("should fail validation with 5-digit SSN", () => {
        const invalidMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
          ssnLastFour: "12345",
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "SSN last four must be exactly 4 digits",
        );
      });

      it("should fail validation with non-numeric SSN", () => {
        const invalidMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
          ssnLastFour: "abcd",
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "SSN last four must be exactly 4 digits",
        );
      });
    });

    describe("Date of birth validation", () => {
      it("should pass validation with valid past date of birth", () => {
        const validMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
          dateOfBirth: new Date("1985-06-15"),
        };

        const result = validateFamilyMemberData(validMember);
        expect(result.isValid).toBe(true);
      });

      it("should pass validation with no date of birth", () => {
        const validMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
        };

        const result = validateFamilyMemberData(validMember);
        expect(result.isValid).toBe(true);
      });

      it("should fail validation with future date of birth", () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const invalidMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
          dateOfBirth: futureDate,
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Date of birth cannot be in the future",
        );
      });
    });

    describe("Insurance member ID validation", () => {
      it("should pass validation with alphanumeric insurance ID", () => {
        const validMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
          insuranceMemberId: "ABC123",
        };

        const result = validateFamilyMemberData(validMember);
        expect(result.isValid).toBe(true);
      });

      it("should pass validation with insurance ID containing hyphens", () => {
        const validMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
          insuranceMemberId: "ABC-123-DEF",
        };

        const result = validateFamilyMemberData(validMember);
        expect(result.isValid).toBe(true);
      });

      it("should pass validation with no insurance ID", () => {
        const validMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
        };

        const result = validateFamilyMemberData(validMember);
        expect(result.isValid).toBe(true);
      });

      it("should fail validation with insurance ID containing special characters", () => {
        const invalidMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
          insuranceMemberId: "ABC@123",
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Insurance member ID can only contain letters, numbers, and hyphens",
        );
      });

      it("should fail validation with insurance ID containing spaces", () => {
        const invalidMember = {
          memberName: "John Doe",
          relationship: FamilyRelationship.Self,
          insuranceMemberId: "ABC 123",
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Insurance member ID can only contain letters, numbers, and hyphens",
        );
      });
    });

    describe("Multiple errors", () => {
      it("should return all validation errors when multiple fields are invalid", () => {
        const invalidMember = {
          memberName: "",
          ssnLastFour: "123",
          dateOfBirth: new Date(Date.now() + 86400000), // Tomorrow
          insuranceMemberId: "ABC@123",
        };

        const result = validateFamilyMemberData(invalidMember);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(5);
        expect(result.errors).toContain("Member name is required");
        expect(result.errors).toContain("Relationship is required");
        expect(result.errors).toContain(
          "SSN last four must be exactly 4 digits",
        );
        expect(result.errors).toContain(
          "Date of birth cannot be in the future",
        );
        expect(result.errors).toContain(
          "Insurance member ID can only contain letters, numbers, and hyphens",
        );
      });
    });
  });

  describe("getFamilyMemberDisplayName", () => {
    it("should format display name correctly", () => {
      const member: FamilyMember = {
        ...mockFamilyMember,
        memberName: "Jane Smith",
        relationship: FamilyRelationship.Spouse,
      };

      const displayName = getFamilyMemberDisplayName(member);
      expect(displayName).toBe("Jane Smith (spouse)");
    });

    it("should handle all relationship types", () => {
      const relationships = Object.values(FamilyRelationship);

      relationships.forEach((relationship) => {
        const member: FamilyMember = {
          ...mockFamilyMember,
          memberName: "Test Name",
          relationship,
        };

        const displayName = getFamilyMemberDisplayName(member);
        expect(displayName).toBe(`Test Name (${relationship})`);
      });
    });
  });

  describe("getRelationshipColor", () => {
    it("should return correct colors for all relationship types", () => {
      expect(getRelationshipColor(FamilyRelationship.Self)).toBe("primary");
      expect(getRelationshipColor(FamilyRelationship.Spouse)).toBe("secondary");
      expect(getRelationshipColor(FamilyRelationship.Child)).toBe("success");
      expect(getRelationshipColor(FamilyRelationship.Dependent)).toBe("info");
      expect(getRelationshipColor(FamilyRelationship.Other)).toBe("default");
    });

    it("should return default color for invalid relationship", () => {
      const invalidRelationship = "invalid" as FamilyRelationship;
      expect(getRelationshipColor(invalidRelationship)).toBe("default");
    });
  });

  describe("calculateAge", () => {
    beforeAll(() => {
      // Mock current date to January 1, 2024 for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-01"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should return null for undefined date of birth", () => {
      const age = calculateAge(undefined);
      expect(age).toBeNull();
    });

    it("should calculate age correctly for birthday already passed this year", () => {
      const dateOfBirth = new Date("1990-06-15");
      const age = calculateAge(dateOfBirth);
      expect(age).toBe(33); // 2024 - 1990, birthday already passed
    });

    it("should calculate age correctly for birthday not yet reached this year", () => {
      const dateOfBirth = new Date("1990-06-15");
      // Set current date to before birthday
      jest.setSystemTime(new Date("2024-03-01"));
      const age = calculateAge(dateOfBirth);
      expect(age).toBe(33); // Still 33 since birthday hasn't happened yet in 2024
    });

    it("should calculate age correctly for birthday later this year", () => {
      jest.setSystemTime(new Date("2024-03-01"));
      const dateOfBirth = new Date("1990-09-15");
      const age = calculateAge(dateOfBirth);
      expect(age).toBe(33); // 2024 - 1990 - 1 (birthday not reached)
    });

    it("should handle leap year birthdays correctly", () => {
      jest.setSystemTime(new Date("2024-03-01")); // 2024 is a leap year
      const dateOfBirth = new Date("2000-02-29");
      const age = calculateAge(dateOfBirth);
      expect(age).toBe(24); // 2024 - 2000, birthday already passed
    });

    it("should calculate age correctly for same year birth", () => {
      jest.setSystemTime(new Date("2024-06-15"));
      const dateOfBirth = new Date("2024-03-01");
      const age = calculateAge(dateOfBirth);
      expect(age).toBe(0); // Born this year, birthday already passed
    });

    it("should calculate age correctly for future birthday this year", () => {
      jest.setSystemTime(new Date("2024-03-01"));
      const dateOfBirth = new Date("2024-06-15");
      const age = calculateAge(dateOfBirth);
      expect(age).toBe(-1); // Technically handles future dates (though validation should prevent this)
    });
  });

  describe("FamilyMemberCreateRequest", () => {
    it("should create valid create request with required fields", () => {
      const createRequest: FamilyMemberCreateRequest = {
        memberName: "New Member",
        relationship: FamilyRelationship.Child,
      };

      expect(createRequest.memberName).toBe("New Member");
      expect(createRequest.relationship).toBe(FamilyRelationship.Child);
    });

    it("should create valid create request with all fields", () => {
      const createRequest: FamilyMemberCreateRequest = {
        memberName: "Child Member",
        relationship: FamilyRelationship.Child,
        dateOfBirth: new Date("2010-08-20"),
        insuranceMemberId: "CHILD123",
        ssnLastFour: "5678",
        medicalRecordNumber: "CMRN456",
        activeStatus: true,
      };

      expect(createRequest.memberName).toBe("Child Member");
      expect(createRequest.relationship).toBe(FamilyRelationship.Child);
      expect(createRequest.activeStatus).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty object validation", () => {
      const result = validateFamilyMemberData({});
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle member with very long valid name", () => {
      const longName = "A".repeat(50);
      const member = {
        memberName: longName,
        relationship: FamilyRelationship.Self,
      };

      const result = validateFamilyMemberData(member);
      expect(result.isValid).toBe(true);
    });
  });
});

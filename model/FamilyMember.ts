export interface FamilyMember {
  familyMemberId: number;
  owner: string;
  memberName: string;
  relationship: FamilyRelationship;
  dateOfBirth?: Date;
  insuranceMemberId?: string;
  ssnLastFour?: string;
  medicalRecordNumber?: string;
  activeStatus: boolean;
  dateAdded?: Date;
  dateUpdated?: Date;
}

export enum FamilyRelationship {
  Self = "self",
  Spouse = "spouse",
  Child = "child",
  Dependent = "dependent",
  Other = "other",
}

export interface FamilyMemberCreateRequest {
  memberName: string;
  relationship: FamilyRelationship;
  dateOfBirth?: Date;
  insuranceMemberId?: string;
  ssnLastFour?: string;
  medicalRecordNumber?: string;
  activeStatus?: boolean;
}

export interface FamilyMemberUpdateRequest
  extends Partial<FamilyMemberCreateRequest> {
  familyMemberId: number;
}

export const validateFamilyMemberData = (
  memberData: Partial<FamilyMember>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required field validation
  if (!memberData.memberName || memberData.memberName.trim() === "") {
    errors.push("Member name is required");
  } else if (memberData.memberName.length > 100) {
    errors.push("Member name must be less than 100 characters");
  }

  if (!memberData.relationship) {
    errors.push("Relationship is required");
  } else if (
    !Object.values(FamilyRelationship).includes(memberData.relationship)
  ) {
    errors.push("Invalid relationship type");
  }

  // SSN validation (if provided, must be 4 digits)
  if (memberData.ssnLastFour && !/^\d{4}$/.test(memberData.ssnLastFour)) {
    errors.push("SSN last four must be exactly 4 digits");
  }

  // Date of birth validation (cannot be in the future)
  if (memberData.dateOfBirth && memberData.dateOfBirth > new Date()) {
    errors.push("Date of birth cannot be in the future");
  }

  // Insurance member ID validation (if provided, must be alphanumeric)
  if (
    memberData.insuranceMemberId &&
    !/^[a-zA-Z0-9\-]+$/.test(memberData.insuranceMemberId)
  ) {
    errors.push(
      "Insurance member ID can only contain letters, numbers, and hyphens",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getFamilyMemberDisplayName = (member: FamilyMember): string => {
  return `${member.memberName} (${member.relationship})`;
};

export const getRelationshipColor = (
  relationship: FamilyRelationship,
): "primary" | "secondary" | "success" | "info" | "default" => {
  switch (relationship) {
    case FamilyRelationship.Self:
      return "primary";
    case FamilyRelationship.Spouse:
      return "secondary";
    case FamilyRelationship.Child:
      return "success";
    case FamilyRelationship.Dependent:
      return "info";
    case FamilyRelationship.Other:
    default:
      return "default";
  }
};

export const calculateAge = (dateOfBirth?: Date): number | null => {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

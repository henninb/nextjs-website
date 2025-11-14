import { useQueryClient } from "@tanstack/react-query";
import { FamilyMember, FamilyMemberCreateRequest } from "../model/FamilyMember";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useFamilyMemberInsert");

/**
 * Insert a new family member via API
 *
 * @param payload - Family member data to insert
 * @returns Newly created family member
 */
export const insertFamilyMember = async (
  payload: FamilyMemberCreateRequest,
): Promise<FamilyMember> => {
  log.debug("Inserting family member", {
    memberName: payload.memberName,
    relationship: payload.relationship,
  });

  const endpoint = "/api/family-members";
  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return parseResponse<FamilyMember>(response) as Promise<FamilyMember>;
};

/**
 * Hook for inserting a new family member
 * Automatically invalidates family members cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useFamilyMemberInsert();
 * mutate({ payload: newMember });
 * ```
 */
export default function useFamilyMemberInsert() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { payload: FamilyMemberCreateRequest }) =>
      insertFamilyMember(variables.payload),
    {
      mutationKey: ["insertFamilyMember"],
      onSuccess: (newMember) => {
        log.debug("Family member inserted successfully", {
          familyMemberId: newMember.familyMemberId,
          memberName: newMember.memberName,
        });

        // Invalidate family members queries to refresh the list
        queryClient.invalidateQueries({ queryKey: QueryKeys.familyMember() });
      },
      onError: (error) => {
        log.error("Insert failed", error);
      },
    },
  );
}

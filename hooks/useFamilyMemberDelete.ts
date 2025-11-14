import { useQueryClient } from "@tanstack/react-query";
import { FamilyMember } from "../model/FamilyMember";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling } from "../utils/fetchUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useFamilyMemberDelete");

/**
 * Delete a family member via API
 * Validates and sanitizes ID before sending
 *
 * @param oldRow - Family member to delete
 * @returns void
 */
export const deleteFamilyMember = async (
  oldRow: FamilyMember,
): Promise<void> => {
  // Sanitize family member ID
  const sanitizedId = InputSanitizer.sanitizeNumericId(
    oldRow.familyMemberId,
    "familyMemberId",
  );

  log.debug("Deleting family member", {
    familyMemberId: sanitizedId,
    memberName: oldRow.memberName,
  });

  const endpoint = `/api/family-members/${sanitizedId}`;
  await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });
};

/**
 * Hook for deleting a family member
 * Automatically invalidates family members cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useFamilyMemberDelete();
 * mutate({ oldRow: memberToDelete });
 * ```
 */
export default function useFamilyMemberDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { oldRow: FamilyMember }) =>
      deleteFamilyMember(variables.oldRow),
    {
      mutationKey: ["deleteFamilyMember"],
      onSuccess: (_response, variables) => {
        log.debug("Family member deleted successfully", {
          familyMemberId: variables.oldRow.familyMemberId,
        });

        // Invalidate family members queries to refresh the list
        queryClient.invalidateQueries({ queryKey: QueryKeys.familyMember() });
      },
      onError: (error) => {
        log.error("Delete failed", error);
      },
    },
  );
}

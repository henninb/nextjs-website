export function coerceActiveStatus(value: unknown): {
  coerced: boolean | undefined;
  error: string | undefined;
} {
  if (typeof value === "boolean") return { coerced: value, error: undefined };
  if (value === "true") return { coerced: true, error: undefined };
  if (value === "false") return { coerced: false, error: undefined };
  if (value === undefined || value === null)
    return { coerced: undefined, error: undefined };
  return { coerced: undefined, error: "Status must be true or false" };
}

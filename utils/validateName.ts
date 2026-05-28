export function validateName(name: string): string | undefined {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Name is required";
  if (trimmed.length > 255) return "Name too long";
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) return "Name contains invalid characters";
  return undefined;
}

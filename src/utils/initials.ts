export function getInitials(
  name: string | null | undefined,
  fallback = "?",
): string {
  if (!name) return fallback;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || fallback;
}

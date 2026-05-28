export const GENERIC_MASKED_EMAIL = "masked email";
export const GENERIC_MASKED_PHONE = "masked phone";

export function maskEmail(email: string | null | undefined) {
  if (email == null) {
    return null;
  }

  const trimmed = email.trim();
  const parts = trimmed.split("@");

  if (
    parts.length !== 2 ||
    !parts[0] ||
    !parts[1] ||
    /\s/.test(trimmed) ||
    !parts[1].includes(".")
  ) {
    return GENERIC_MASKED_EMAIL;
  }

  const firstCharacter = /^[a-z0-9]$/i.test(parts[0][0] ?? "")
    ? parts[0][0].toLowerCase()
    : "x";

  return `${firstCharacter}***@${parts[1].toLowerCase()}`;
}

export function maskPhone(phone: string | null | undefined) {
  if (phone == null) {
    return null;
  }

  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (!trimmed || /[a-z]/i.test(trimmed) || digits.length < 4) {
    return GENERIC_MASKED_PHONE;
  }

  return `***-***-${digits.slice(-4)}`;
}

export function formatCurrency(amountInMinorUnits: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amountInMinorUnits / 100,
  );
}

/**
 * Formats a rupee amount with the ₹ symbol using Indian digit grouping
 * (lakh/crore - e.g. ₹12,34,567 rather than ₹1,234,567). Implemented by
 * hand rather than `Intl.NumberFormat("en-IN", ...)` since React Native's
 * Hermes engine doesn't reliably ship "en-IN" locale data even when basic
 * Intl support is present, unlike browsers.
 */
export function formatInr(amount: number): string {
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const digits = Math.abs(rounded).toString();

  const lastThree = digits.substring(digits.length - 3);
  const otherDigits = digits.substring(0, digits.length - 3);
  const grouped =
    otherDigits !== ""
      ? `${otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThree}`
      : lastThree;

  return `${isNegative ? "-" : ""}₹${grouped}`;
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(isoDate));
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

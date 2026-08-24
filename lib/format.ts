/** Format an amount in kobo as a naira string, e.g. 450000 -> "₦4,500". */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  const hasDecimals = naira % 1 !== 0;
  return (
    "₦" +
    naira.toLocaleString("en-NG", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
}

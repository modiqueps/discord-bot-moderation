const UNITS = [
  { minimum: 1_000_000_000, suffix: "B" },
  { minimum: 1_000_000, suffix: "M" },
  { minimum: 1_000, suffix: "K" },
];

/**
 * Compact a number for display: 1234 → "1.2K", 5400000 → "5.4M".
 *
 * @param {number | string} value
 * @returns {string}
 */
export function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  const unit = UNITS.find(({ minimum }) => number >= minimum);

  if (!unit) {
    return String(Math.trunc(number));
  }

  return `${Number((number / unit.minimum).toFixed(1))}${unit.suffix}`;
}

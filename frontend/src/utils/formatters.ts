/**
 * Format a number to 2 decimal places with locale-aware formatting
 */
export function fmt(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num == null || isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Parse a formatted string back to number
 */
export function parseNum(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Standard month names in Spanish (short)
 */
export const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Secret Cost Code Generator for Mobile Shop Owners
 * Default 10-letter Cipher: P R O F I T A B L E
 * 1 -> P
 * 2 -> R
 * 3 -> O
 * 4 -> F
 * 5 -> I
 * 6 -> T
 * 7 -> A
 * 8 -> B
 * 9 -> L
 * 0 -> E
 */

const DIGIT_MAP: Record<string, string> = {
  '1': 'P',
  '2': 'R',
  '3': 'O',
  '4': 'F',
  '5': 'I',
  '6': 'T',
  '7': 'A',
  '8': 'B',
  '9': 'L',
  '0': 'E',
};

export function toCostCode(price: number): string {
  if (!price || isNaN(price) || price <= 0) return '---';
  const str = Math.round(price).toString();
  return str.split('').map(d => DIGIT_MAP[d] || d).join('');
}

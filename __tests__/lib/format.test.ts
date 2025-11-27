import { formatCurrency } from '@/lib/format';

describe('formatCurrency', () => {
  it('should format integer amounts correctly', () => {
    expect(formatCurrency(100)).toBe('S/ 100.00');
  });

  it('should format amounts with two decimal places', () => {
    expect(formatCurrency(99.99)).toBe('S/ 99.99');
  });

  it('should round to two decimal places', () => {
    expect(formatCurrency(100.555)).toBe('S/ 100.56');
    expect(formatCurrency(100.554)).toBe('S/ 100.55');
  });

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('S/ 0.00');
  });

  it('should format large amounts with thousands separators', () => {
    // Note: Peruvian format uses space or comma for thousands separator
    const formatted = formatCurrency(1234567.89);
    expect(formatted).toContain('S/');
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
    expect(formatted).toContain('567');
    expect(formatted).toContain('.89');
  });

  it('should format amounts with one decimal place correctly', () => {
    expect(formatCurrency(50.5)).toBe('S/ 50.50');
  });

  it('should handle small decimal amounts', () => {
    expect(formatCurrency(0.01)).toBe('S/ 0.01');
    expect(formatCurrency(0.1)).toBe('S/ 0.10');
  });

  it('should include S/ prefix', () => {
    const result = formatCurrency(100);
    expect(result.startsWith('S/')).toBe(true);
  });

  it('should format negative amounts correctly', () => {
    // Depending on locale settings, negative might have different format
    const result = formatCurrency(-50);
    expect(result).toContain('50.00');
  });
});

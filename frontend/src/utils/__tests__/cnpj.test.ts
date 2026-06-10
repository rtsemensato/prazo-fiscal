import { describe, expect, it } from 'vitest';
import { formatCnpj, isValidCNPJ, stripCnpj } from '@/utils/cnpj';

describe('cnpj utils', () => {
  it('should strip non-digit characters', () => {
    expect(stripCnpj('11.222.333/0001-81')).toBe('11222333000181');
  });

  it('should format cnpj', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('should validate a valid cnpj', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
  });

  it('should reject invalid cnpj', () => {
    expect(isValidCNPJ('11.222.333/0000-00')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';

/**
 * API Client utility tests — validation helpers and formatters.
 * These test pure functions extracted from app logic.
 */

// From the app: Arabic date formatter
function formatArabicDate(date: Date): string {
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Certificate number formatter: YYYY-NNNN
function formatCertNumber(year: number, seq: number): string {
  return `${year}-${seq.toString().padStart(4, '0')}`;
}

// Validate username: 3-50 chars, alphanumeric + underscore
function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,50}$/.test(username);
}

// Validate password: min 6 chars
function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

// Truncate text with ellipsis
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

describe('Date Formatting', () => {
  it('formats date in Arabic locale', () => {
    const date = new Date(2026, 3, 13); // April 13, 2026
    const formatted = formatArabicDate(date);
    // ar-EG locale uses Arabic-Indic numerals (٢٠٢٦)
    expect(formatted).toContain('٢٠٢٦');
    expect(formatted).toContain('أبريل');
  });
});

describe('Certificate Number Formatting', () => {
  it('formats with leading zeros', () => {
    expect(formatCertNumber(2026, 1)).toBe('2026-0001');
  });

  it('formats large numbers correctly', () => {
    expect(formatCertNumber(2026, 1234)).toBe('2026-1234');
  });

  it('handles max sequence', () => {
    expect(formatCertNumber(2026, 9999)).toBe('2026-9999');
  });
});

describe('Username Validation', () => {
  it('accepts valid username', () => {
    expect(isValidUsername('admin')).toBe(true);
    expect(isValidUsername('user_123')).toBe(true);
  });

  it('rejects short username', () => {
    expect(isValidUsername('ab')).toBe(false);
  });

  it('rejects empty username', () => {
    expect(isValidUsername('')).toBe(false);
  });

  it('rejects special characters', () => {
    expect(isValidUsername('user@name')).toBe(false);
    expect(isValidUsername('user name')).toBe(false);
  });
});

describe('Password Validation', () => {
  it('accepts valid password', () => {
    expect(isValidPassword('password123')).toBe(true);
  });

  it('rejects short password', () => {
    expect(isValidPassword('12345')).toBe(false);
  });

  it('accepts exactly 6 chars', () => {
    expect(isValidPassword('123456')).toBe(true);
  });
});

describe('Text Truncation', () => {
  it('does not truncate short text', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long text with ellipsis', () => {
    expect(truncate('this is a very long text', 10)).toBe('this is...');
  });

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

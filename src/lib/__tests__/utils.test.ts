import { describe, it, expect } from 'vitest';
import { formatDateISO, parseDateOnly } from '../utils';

describe('date utils', () => {
  it('formatDateISO returns YYYY-MM-DD for local date', () => {
    const d = new Date(2026, 0, 19); // 2026-01-19 local
    expect(formatDateISO(d)).toBe('2026-01-19');
  });

  it('parseDateOnly parses YYYY-MM-DD to local midnight Date', () => {
    const s = '2026-01-19';
    const d = parseDateOnly(s);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(19);
    // time should be local midnight
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('roundtrip: parseDateOnly -> formatDateISO returns same string', () => {
    const s = '2026-01-01';
    const d = parseDateOnly(s);
    expect(formatDateISO(d)).toBe(s);
  });

  it('parseDateOnly accepts ISO datetime and extracts date prefix', () => {
    const iso = '2026-01-19T12:34:56.000Z';
    const d = parseDateOnly(iso);
    expect(formatDateISO(d)).toBe('2026-01-19');
  });
});

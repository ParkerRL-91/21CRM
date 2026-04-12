import { describe, it, expect } from 'vitest';
import {
  isValidQuoteTransition,
  getValidNextStatuses,
  isTerminalStatus,
  isReadOnlyStatus,
  validateTransition,
  getStatusLabel,
} from './quote-status';

describe('isValidQuoteTransition', () => {
  // Happy path transitions
  const validTransitions = [
    ['draft', 'in_review'],
    ['draft', 'expired'],
    ['in_review', 'approved'],
    ['in_review', 'denied'],
    ['approved', 'presented'],
    ['approved', 'expired'],
    ['denied', 'draft'],
    ['presented', 'accepted'],
    ['presented', 'rejected'],
    ['presented', 'expired'],
    ['accepted', 'contracted'],
    ['expired', 'draft'],
  ];

  validTransitions.forEach(([from, to]) => {
    it(`allows ${from} → ${to}`, () => {
      expect(isValidQuoteTransition(from, to)).toBe(true);
    });
  });

  // Invalid transitions
  const invalidTransitions = [
    ['draft', 'accepted'],
    ['draft', 'contracted'],
    ['in_review', 'presented'],
    ['approved', 'contracted'],
    ['rejected', 'draft'],
    ['rejected', 'approved'],
    ['contracted', 'draft'],
    ['contracted', 'expired'],
  ];

  invalidTransitions.forEach(([from, to]) => {
    it(`rejects ${from} → ${to}`, () => {
      expect(isValidQuoteTransition(from, to)).toBe(false);
    });
  });
});

describe('getValidNextStatuses', () => {
  it('returns [in_review, expired] for draft', () => {
    expect(getValidNextStatuses('draft')).toEqual(['in_review', 'expired']);
  });

  it('returns [contracted] for accepted', () => {
    expect(getValidNextStatuses('accepted')).toEqual(['contracted']);
  });

  it('returns [] for rejected (terminal)', () => {
    expect(getValidNextStatuses('rejected')).toEqual([]);
  });

  it('returns [] for contracted (terminal)', () => {
    expect(getValidNextStatuses('contracted')).toEqual([]);
  });
});

describe('isTerminalStatus', () => {
  it('identifies rejected as terminal', () => {
    expect(isTerminalStatus('rejected')).toBe(true);
  });

  it('identifies contracted as terminal', () => {
    expect(isTerminalStatus('contracted')).toBe(true);
  });

  it('identifies draft as non-terminal', () => {
    expect(isTerminalStatus('draft')).toBe(false);
  });
});

describe('isReadOnlyStatus', () => {
  it('draft is editable', () => {
    expect(isReadOnlyStatus('draft')).toBe(false);
  });

  it('denied is editable (for revision)', () => {
    expect(isReadOnlyStatus('denied')).toBe(false);
  });

  it('in_review is read-only', () => {
    expect(isReadOnlyStatus('in_review')).toBe(true);
  });

  it('approved is read-only', () => {
    expect(isReadOnlyStatus('approved')).toBe(true);
  });

  it('accepted is read-only', () => {
    expect(isReadOnlyStatus('accepted')).toBe(true);
  });
});

describe('validateTransition', () => {
  it('returns valid: true for valid transition', () => {
    expect(validateTransition('draft', 'in_review')).toEqual({ valid: true });
  });

  it('returns descriptive error for invalid transition', () => {
    const result = validateTransition('draft', 'accepted');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('Cannot transition');
      expect(result.error).toContain('Draft');
      expect(result.error).toContain('Accepted');
    }
  });

  it('returns terminal error for rejected', () => {
    const result = validateTransition('rejected', 'draft');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('terminal');
    }
  });

  it('returns unknown status error', () => {
    const result = validateTransition('bogus', 'draft');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('Unknown status');
    }
  });
});

describe('getStatusLabel', () => {
  it('returns human-readable labels', () => {
    expect(getStatusLabel('in_review')).toBe('In Review');
    expect(getStatusLabel('contracted')).toBe('Contracted');
  });

  it('returns raw value for unknown status', () => {
    expect(getStatusLabel('unknown')).toBe('unknown');
  });
});

/**
 * Quote status machine — enforces valid state transitions for the full
 * quote lifecycle: draft → in_review → approved → presented → accepted → contracted
 */

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['in_review', 'expired'],
  in_review: ['approved', 'denied'],
  approved: ['presented', 'expired'],
  denied: ['draft'], // back to draft for revision
  presented: ['accepted', 'rejected', 'expired'],
  accepted: ['contracted'],
  rejected: [], // terminal
  expired: ['draft'], // can re-open by updating expiration
  contracted: [], // terminal
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  denied: 'Denied',
  presented: 'Presented',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  contracted: 'Contracted',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  in_review: 'blue',
  approved: 'green',
  denied: 'red',
  presented: 'purple',
  accepted: 'green',
  rejected: 'red',
  expired: 'gray',
  contracted: 'green',
};

export function isValidQuoteTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidNextStatuses(current: string): string[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function isTerminalStatus(status: string): boolean {
  return (VALID_TRANSITIONS[status]?.length ?? 0) === 0;
}

export function isReadOnlyStatus(status: string): boolean {
  // Only draft and denied allow editing
  return !['draft', 'denied'].includes(status);
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? 'gray';
}

/**
 * Validates a status transition and returns a descriptive error if invalid.
 */
export function validateTransition(
  from: string,
  to: string
): { valid: true } | { valid: false; error: string } {
  if (!VALID_TRANSITIONS[from]) {
    return { valid: false, error: `Unknown status: ${from}` };
  }

  if (!VALID_TRANSITIONS[to] && to !== 'contracted') {
    // contracted is valid as a target even though it has no outgoing transitions
    if (!Object.keys(VALID_TRANSITIONS).includes(to)) {
      return { valid: false, error: `Unknown target status: ${to}` };
    }
  }

  if (!isValidQuoteTransition(from, to)) {
    const validNext = getValidNextStatuses(from);
    if (validNext.length === 0) {
      return {
        valid: false,
        error: `Quote in "${getStatusLabel(from)}" status is terminal and cannot be changed`,
      };
    }
    return {
      valid: false,
      error: `Cannot transition from "${getStatusLabel(from)}" to "${getStatusLabel(to)}". Valid transitions: ${validNext.map(getStatusLabel).join(', ')}`,
    };
  }

  return { valid: true };
}

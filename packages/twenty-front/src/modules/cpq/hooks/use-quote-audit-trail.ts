import { useState, useCallback } from 'react';

export type AuditEventType =
  | 'quote_created'
  | 'line_item_added'
  | 'line_item_removed'
  | 'line_item_edited'
  | 'discount_changed'
  | 'status_changed'
  | 'approval_submitted'
  | 'approval_approved'
  | 'approval_rejected'
  | 'pdf_generated';

export type AuditEntry = {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  eventType: AuditEventType;
  description: string;
  details?: Record<string, string>;
};

export const useQuoteAuditTrail = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  const addEntry = useCallback(
    (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
      setEntries((prev) => [
        {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date(),
          ...entry,
        },
        ...prev,
      ]);
    },
    [],
  );

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  return { entries, addEntry, clearEntries };
};

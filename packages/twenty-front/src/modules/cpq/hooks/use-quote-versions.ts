import { useState, useCallback } from 'react';

export type VersionedLineItem = {
  id: string;
  productName: string;
  listPrice: string;
  quantity: number;
  discountPercent: number;
  netTotal: string | null;
};

export type QuoteVersion = {
  version: number;
  timestamp: Date;
  lineItems: VersionedLineItem[];
  quoteName: string;
  subtotal: number;
};

// Generates a human-readable summary comparing a version to the previous one.
const buildVersionSummary = (
  current: QuoteVersion,
  previous: QuoteVersion | undefined,
): string => {
  if (!previous) {
    return `Initial version with ${current.lineItems.length} item${current.lineItems.length === 1 ? '' : 's'}`;
  }

  const previousIds = new Set(previous.lineItems.map((li) => li.productName));
  const currentIds = new Set(current.lineItems.map((li) => li.productName));

  const added = current.lineItems.filter(
    (li) => !previousIds.has(li.productName),
  ).length;
  const removed = previous.lineItems.filter(
    (li) => !currentIds.has(li.productName),
  ).length;

  const parts: string[] = [];

  if (added > 0) {
    parts.push(`Added ${added} item${added === 1 ? '' : 's'}`);
  }
  if (removed > 0) {
    parts.push(`removed ${removed} item${removed === 1 ? '' : 's'}`);
  }

  // Check for value changes on items that exist in both
  const previousMap = new Map(
    previous.lineItems.map((li) => [li.productName, li]),
  );
  let changedCount = 0;

  current.lineItems.forEach((li) => {
    const prev = previousMap.get(li.productName);

    if (!prev) {
      return;
    }

    if (
      prev.quantity !== li.quantity ||
      prev.discountPercent !== li.discountPercent ||
      prev.listPrice !== li.listPrice
    ) {
      changedCount++;
    }
  });

  if (changedCount > 0) {
    parts.push(
      `${changedCount} item${changedCount === 1 ? '' : 's'} changed`,
    );
  }

  if (parts.length === 0) {
    return 'No changes';
  }

  // Capitalize first letter of the joined summary
  const joined = parts.join(', ');

  return joined.charAt(0).toUpperCase() + joined.slice(1);
};

export const useQuoteVersions = () => {
  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);

  const createVersion = useCallback(
    (snapshot: Omit<QuoteVersion, 'version' | 'timestamp'>) => {
      setVersions((prev) => {
        const newVersion: QuoteVersion = {
          ...snapshot,
          version: prev.length + 1,
          timestamp: new Date(),
        };

        const updated = [...prev, newVersion];
        setCurrentVersion(newVersion.version);

        return updated;
      });
    },
    [],
  );

  const getVersionSummary = useCallback(
    (version: QuoteVersion): string => {
      const versionIndex = versions.findIndex(
        (v) => v.version === version.version,
      );
      const previous =
        versionIndex > 0 ? versions[versionIndex - 1] : undefined;

      return buildVersionSummary(version, previous);
    },
    [versions],
  );

  return { versions, currentVersion, createVersion, setCurrentVersion, getVersionSummary };
};

import { useState, useCallback, useMemo } from 'react';

type LineItemForGrouping = {
  id: string;
  productName: string;
  netTotal: string | null;
  group?: string;
};

type LineItemGroup = {
  name: string;
  originalName: string;
  items: LineItemForGrouping[];
  subtotal: number;
  isCollapsed: boolean;
};

// Hook to organize flat line items into collapsible, renameable groups.
// Used in the quote builder to give visual structure to complex quotes
// with many line items spanning multiple categories.
export const useLineItemGroups = (lineItems: LineItemForGrouping[]) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [groupNames, setGroupNames] = useState<Map<string, string>>(new Map());

  const groups: LineItemGroup[] = useMemo(() => {
    const grouped = new Map<string, LineItemForGrouping[]>();

    for (const item of lineItems) {
      const group = item.group ?? 'Ungrouped';

      if (!grouped.has(group)) {
        grouped.set(group, []);
      }

      grouped.get(group)!.push(item);
    }

    return Array.from(grouped.entries()).map(([name, items]) => ({
      name: groupNames.get(name) ?? name,
      originalName: name,
      items,
      subtotal: items.reduce(
        (sum, item) => sum + parseFloat(item.netTotal ?? '0'),
        0,
      ),
      isCollapsed: collapsedGroups.has(name),
    }));
  }, [lineItems, collapsedGroups, groupNames]);

  const toggleGroup = useCallback((groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);

      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }

      return next;
    });
  }, []);

  const renameGroup = useCallback((oldName: string, newName: string) => {
    setGroupNames((prev) => new Map(prev).set(oldName, newName));
  }, []);

  return { groups, toggleGroup, renameGroup };
};

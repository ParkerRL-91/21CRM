import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';

import { CALCULATE_PRICE } from 'src/modules/cpq/graphql/cpq.operations';
import type { LineItem } from 'src/modules/cpq/components/CpqLineItemTable';

// Formats a number as a currency string (USD by default)
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

// Parses a currency string to a plain number
const parseCurrency = (value: string): number =>
  parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;

export const useCpqQuoteBuilder = () => {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const [calculatePriceMutation] = useMutation(CALCULATE_PRICE);

  // Recalculate pricing for a single line item via the CPQ engine
  const recalculateLineItem = useCallback(
    async (item: LineItem): Promise<LineItem> => {
      try {
        const response = await calculatePriceMutation({
          variables: {
            input: {
              listPrice: item.listPrice,
              quantity: item.quantity,
              manualDiscountPercent: item.discountPercent,
            },
          },
        });

        const pricing = response.data?.calculatePrice;
        if (!pricing) {
          return item;
        }

        return {
          ...item,
          netPrice: pricing.netUnitPrice,
          netTotal: pricing.netTotal,
        };
      } catch {
        // Return item unchanged if pricing call fails
        return item;
      }
    },
    [calculatePriceMutation],
  );

  const addLineItem = useCallback(
    async (productName: string, listPrice = '$0.00') => {
      const newItem: LineItem = {
        id: crypto.randomUUID(),
        product: productName,
        quantity: 1,
        listPrice,
        discountPercent: 0,
        netPrice: listPrice,
        netTotal: listPrice,
      };

      const pricedItem = await recalculateLineItem(newItem);

      setLineItems((prev) => [...prev, pricedItem]);
    },
    [recalculateLineItem],
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      const validQuantity = Math.max(1, quantity);

      setLineItems((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, quantity: validQuantity } : item,
        );
        return updated;
      });

      // Recalculate pricing after state update
      const item = lineItems.find((i) => i.id === id);
      if (!item) {
        return;
      }

      const updatedItem = { ...item, quantity: validQuantity };
      const pricedItem = await recalculateLineItem(updatedItem);

      setLineItems((prev) =>
        prev.map((i) => (i.id === id ? pricedItem : i)),
      );
    },
    [lineItems, recalculateLineItem],
  );

  const updateDiscount = useCallback(
    async (id: string, discountPercent: number) => {
      const validDiscount = Math.min(100, Math.max(0, discountPercent));

      const item = lineItems.find((i) => i.id === id);
      if (!item) {
        return;
      }

      const updatedItem = { ...item, discountPercent: validDiscount };
      const pricedItem = await recalculateLineItem(updatedItem);

      setLineItems((prev) =>
        prev.map((i) => (i.id === id ? pricedItem : i)),
      );
    },
    [lineItems, recalculateLineItem],
  );

  const removeLineItem = useCallback((id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Compute running totals from line items
  const subtotal = lineItems.reduce(
    (sum, item) => sum + parseCurrency(item.listPrice) * item.quantity,
    0,
  );
  const grandTotal = lineItems.reduce(
    (sum, item) => sum + parseCurrency(item.netTotal),
    0,
  );
  const totalDiscount = subtotal - grandTotal;

  return {
    lineItems,
    subtotal: formatCurrency(subtotal),
    totalDiscount: formatCurrency(totalDiscount),
    grandTotal: formatCurrency(grandTotal),
    addLineItem,
    updateQuantity,
    updateDiscount,
    removeLineItem,
  };
};

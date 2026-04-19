import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type CpqLineItem = {
  id: string;
  productName: string;
  listPrice: string;
  quantity: number;
  discountPercent: number;
  netUnitPrice: string;
  netTotal: string;
};

export const cpqQuoteLineItemsState = createAtomState<CpqLineItem[]>({
  key: 'cpqQuoteLineItemsState',
  defaultValue: [],
});

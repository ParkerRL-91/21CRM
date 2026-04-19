import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type CpqQuoteTotals = {
  subtotal: string;
  totalDiscount: string;
  grandTotal: string;
};

export const cpqQuoteTotalsState = createAtomState<CpqQuoteTotals>({
  key: 'cpqQuoteTotalsState',
  defaultValue: {
    subtotal: '0.00',
    totalDiscount: '0.00',
    grandTotal: '0.00',
  },
});

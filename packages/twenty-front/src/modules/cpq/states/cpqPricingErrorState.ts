import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const cpqPricingErrorState = createAtomState<string | null>({
  key: 'cpqPricingErrorState',
  defaultValue: null,
});

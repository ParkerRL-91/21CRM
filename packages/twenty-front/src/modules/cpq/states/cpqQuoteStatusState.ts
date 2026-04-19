import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type CpqQuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export const cpqQuoteStatusState = createAtomState<CpqQuoteStatus>({
  key: 'cpqQuoteStatusState',
  defaultValue: 'draft',
});

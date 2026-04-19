import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const cpqSetupErrorState = createAtomState<string | null>({
  key: 'cpqSetupErrorState',
  defaultValue: null,
});

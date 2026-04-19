import { useMutation, useQuery } from '@apollo/client/react';

import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { cpqSetupErrorState } from '@/cpq/states/cpqSetupErrorState';
import { GET_CPQ_STATUS } from '@/cpq/graphql/queries/getCpqStatus';
import { SETUP_CPQ } from '@/cpq/graphql/mutations/setupCpq';

type CpqStatusData = {
  cpqStatus: {
    isSetUp: boolean;
    objectCount: number;
    expectedCount: number;
    foundObjects: string[];
    missingObjects: string[];
    version: string;
  };
};

type SetupCpqData = {
  setupCpq: {
    objectsCreated: string[];
    fieldsCreated: number;
    relationsCreated: number;
    skipped: string[];
    errors: string[];
  };
};

// Hook to manage CPQ setup state — checks if CPQ objects exist
// and triggers setup when needed. Uses Apollo instead of fetch.
export const useCpqSetup = () => {
  const [error, setError] = useAtomState(cpqSetupErrorState);

  const { data, loading: isLoading, refetch } = useQuery<CpqStatusData>(
    GET_CPQ_STATUS,
    { fetchPolicy: 'cache-and-network' },
  );

  const [setupCpqMutation, { loading: isSettingUp }] =
    useMutation<SetupCpqData>(SETUP_CPQ);

  const isSetUp = data?.cpqStatus.isSetUp ?? null;

  const runSetup = async () => {
    setError(null);
    const result = await setupCpqMutation();
    const setupResult = result.data?.setupCpq;

    if (setupResult && setupResult.errors.length > 0) {
      setError(`Setup completed with errors: ${setupResult.errors.join(', ')}`);
    }

    await refetch();
    return setupResult;
  };

  return {
    isSetUp,
    isLoading: isLoading || isSettingUp,
    error,
    runSetup,
  };
};

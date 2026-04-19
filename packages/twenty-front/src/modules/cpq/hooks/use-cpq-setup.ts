import { useMutation, useQuery } from '@apollo/client';

import {
  GET_CPQ_STATUS,
  SETUP_CPQ,
} from 'src/modules/cpq/graphql/cpq.operations';

// Hook to manage CPQ setup state — checks if CPQ objects exist
// and triggers setup when needed.
// Workspace context comes from the auth token automatically via Apollo Client.
export const useCpqSetup = () => {
  const {
    data,
    loading: isLoading,
    error,
    refetch,
  } = useQuery(GET_CPQ_STATUS, {
    fetchPolicy: 'cache-and-network',
  });

  const [setupCpqMutation, { loading: isSettingUp }] = useMutation(SETUP_CPQ, {
    refetchQueries: [{ query: GET_CPQ_STATUS }],
  });

  const isSetUp = data?.cpqStatus?.isSetUp ?? null;

  const runSetup = async () => {
    const result = await setupCpqMutation();
    return result.data?.setupCpq;
  };

  const checkStatus = async () => {
    await refetch();
  };

  return {
    isSetUp,
    isLoading: isLoading || isSettingUp,
    error: error?.message ?? null,
    checkStatus,
    runSetup,
  };
};

import { useCallback, useState } from 'react';

import { tokenPairState } from '@/auth/states/tokenPairState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Hook to manage CPQ setup state — checks if CPQ objects exist
// and triggers setup when needed.
// Workspace identity is derived server-side from the JWT — no workspaceId
// path param or body field needed on the REST calls.
export const useCpqSetup = (_workspaceId: string) => {
  const [isSetUp, setIsSetUp] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenPair = useAtomStateValue(tokenPairState);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const token = tokenPair?.accessOrWorkspaceAgnosticToken?.token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [tokenPair]);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      // Route is GET /cpq/status — workspace resolved from JWT by guard
      const response = await fetch('/cpq/status', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }
      const data = await response.json();
      // Backend getSetupStatus() returns { isSetUp, objectCount, ... }
      setIsSetUp(data.isSetUp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check CPQ status');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const runSetup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Workspace resolved from JWT by @AuthWorkspace() — no body needed
      const response = await fetch('/cpq/setup', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.message ?? `Setup failed: ${response.status}`);
      }
      const data = await response.json();

      if (data.errors?.length > 0) {
        setError(`Setup completed with errors: ${data.errors.join(', ')}`);
      }

      setIsSetUp(true);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CPQ setup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  const runTeardown = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/cpq/teardown', {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Teardown failed: ${response.status}`);
      }
      setIsSetUp(false);
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CPQ teardown failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  return { isSetUp, isLoading, error, checkStatus, runSetup, runTeardown };
};

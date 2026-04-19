import { useCallback, useState } from 'react';

// Hook to manage CPQ setup state — checks if CPQ objects exist
// and triggers setup when needed.
export const useCpqSetup = (workspaceId: string) => {
  const [isSetUp, setIsSetUp] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/cpq/status');
      const data = await response.json();
      // Backend getSetupStatus() returns { isSetUp, objectCount, ... }
      setIsSetUp(data.isSetUp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check CPQ status');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const runSetup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/cpq/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });
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
  }, [workspaceId]);

  return { isSetUp, isLoading, error, checkStatus, runSetup };
};

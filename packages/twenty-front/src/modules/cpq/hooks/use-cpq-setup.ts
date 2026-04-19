import { useCallback, useState } from 'react';

import { REACT_APP_SERVER_BASE_URL } from '~/config';

export type CpqStatus = {
  isSetUp: boolean;
  objectCount: number;
  expectedCount: number;
  foundObjects: string[];
  missingObjects: string[];
  version: string;
};

export type ProductSeedInput = {
  name: string;
  productFamily: string;
  configType: string;
  listPriceAmountMicros: number;
  listPriceCurrencyCode: string;
  region: string;
  currency: string;
  sku: string;
  isActive: boolean;
};

const SERVER_BASE = REACT_APP_SERVER_BASE_URL ?? '';

// Hook to manage CPQ setup state — checks if CPQ objects exist,
// triggers setup/teardown, and seeds the product catalog.
export const useCpqSetup = (_workspaceId: string) => {
  const [status, setStatus] = useState<CpqStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTearingDown, setIsTearingDown] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedResult, setSeedResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_BASE}/cpq/status`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: CpqStatus = await response.json();
      setStatus(data);
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to check CPQ status',
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runSetup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_BASE}/cpq/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.errors?.length > 0) {
        setError(`Setup completed with errors: ${data.errors.join(', ')}`);
      }

      // Refresh status after setup
      const freshStatus = await checkStatus();
      return { setupResult: data, status: freshStatus };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'CPQ setup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [checkStatus]);

  const runTeardown = useCallback(async () => {
    setIsTearingDown(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_BASE}/cpq/teardown`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      // Refresh status after teardown
      const freshStatus = await checkStatus();
      return { teardownResult: data, status: freshStatus };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'CPQ teardown failed';
      setError(message);
      throw err;
    } finally {
      setIsTearingDown(false);
    }
  }, [checkStatus]);

  const seedCatalog = useCallback(async (products: ProductSeedInput[]) => {
    setIsSeeding(true);
    setSeedResult(null);
    setError(null);
    try {
      const response = await fetch(`${SERVER_BASE}/cpq/seed-catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ products }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setSeedResult(result);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Product seeding failed';
      setError(message);
      throw err;
    } finally {
      setIsSeeding(false);
    }
  }, []);

  return {
    // backward-compat alias
    isSetUp: status?.isSetUp ?? null,
    status,
    isLoading,
    isTearingDown,
    isSeeding,
    error,
    seedResult,
    checkStatus,
    runSetup,
    runTeardown,
    seedCatalog,
  };
};

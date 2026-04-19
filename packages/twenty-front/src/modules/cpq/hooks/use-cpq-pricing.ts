import { useCallback, useState } from 'react';

// Types matching the backend PricingInput / PricingResult
type PricingInput = {
  listPrice: string;
  quantity: number;
  productBaseTermMonths?: number;
  quoteTermMonths?: number;
  contractedPrice?: string;
  discountSchedule?: {
    type: 'tiered' | 'volume' | 'term';
    tiers: Array<{ lowerBound: number; upperBound: number | null; value: number }>;
  };
  manualDiscountPercent?: number;
  manualDiscountAmount?: number;
  manualPriceOverride?: number;
  floorPrice?: string;
};

type PricingResult = {
  netUnitPrice: string;
  netTotal: string;
  listPrice: string;
  auditSteps: Array<{
    ruleName: string;
    inputPrice: string;
    outputPrice: string;
    parameters?: Record<string, string>;
    timestamp: string;
  }>;
};

// Hook to call the CPQ pricing engine from the frontend.
// Used in the quote builder to calculate line item prices in real-time.
export const useCpqPricing = () => {
  const [result, setResult] = useState<PricingResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = useCallback(async (input: PricingInput) => {
    setIsCalculating(true);
    setError(null);
    try {
      const response = await fetch('/cpq/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data: PricingResult = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pricing calculation failed');
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return { result, isCalculating, error, calculatePrice };
};

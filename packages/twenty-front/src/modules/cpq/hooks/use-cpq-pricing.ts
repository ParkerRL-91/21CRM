import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';

import { CALCULATE_PRICE } from 'src/modules/cpq/graphql/cpq.operations';

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
  const [error, setError] = useState<string | null>(null);

  const [calculatePriceMutation, { loading: isCalculating }] =
    useMutation(CALCULATE_PRICE);

  const calculatePrice = useCallback(
    async (input: PricingInput) => {
      setError(null);
      try {
        const response = await calculatePriceMutation({
          variables: { input },
        });
        const data = response.data?.calculatePrice as PricingResult | null;
        if (data) {
          setResult(data);
        }
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Pricing calculation failed',
        );
        return null;
      }
    },
    [calculatePriceMutation],
  );

  return { result, isCalculating, error, calculatePrice };
};

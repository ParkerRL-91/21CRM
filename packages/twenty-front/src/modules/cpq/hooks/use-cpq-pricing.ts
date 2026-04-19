import { useMutation } from '@apollo/client/react';

import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { cpqPricingErrorState } from '@/cpq/states/cpqPricingErrorState';
import { CALCULATE_PRICE } from '@/cpq/graphql/mutations/calculatePrice';

type DiscountTierInput = {
  lowerBound: number;
  upperBound: number | null;
  value: number;
};

type DiscountScheduleInput = {
  type: 'tiered' | 'volume' | 'term';
  tiers: DiscountTierInput[];
};

export type PricingInput = {
  listPrice: string;
  quantity: number;
  productBaseTermMonths?: number;
  quoteTermMonths?: number;
  contractedPrice?: string;
  discountSchedule?: DiscountScheduleInput;
  manualDiscountPercent?: number;
  manualDiscountAmount?: number;
  manualPriceOverride?: number;
  floorPrice?: string;
};

export type PricingAuditStep = {
  ruleName: string;
  inputPrice: string;
  outputPrice: string;
  parameters?: Record<string, string>;
  timestamp: string;
};

export type PricingResult = {
  netUnitPrice: string;
  netTotal: string;
  listPrice: string;
  auditSteps: PricingAuditStep[];
};

type CalculatePriceData = {
  calculatePrice: PricingResult;
};

// Hook to call the CPQ pricing engine from the frontend.
// Used in the quote builder to calculate line item prices in real-time.
export const useCpqPricing = () => {
  const [error, setError] = useAtomState(cpqPricingErrorState);

  const [calculatePriceMutation, { data, loading: isCalculating }] =
    useMutation<CalculatePriceData>(CALCULATE_PRICE);

  const result = data?.calculatePrice ?? null;

  const calculatePrice = async (input: PricingInput) => {
    setError(null);
    const mutationResult = await calculatePriceMutation({
      variables: { input },
    });
    return mutationResult.data?.calculatePrice ?? null;
  };

  return { result, isCalculating, error, calculatePrice };
};

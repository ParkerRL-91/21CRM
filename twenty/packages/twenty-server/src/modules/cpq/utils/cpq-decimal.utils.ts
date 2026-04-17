import Decimal from 'decimal.js';

// Centralized Decimal.js configuration for all CPQ services.
// Import this module once at the top of any service that uses Decimal.js.
// This ensures consistent precision and rounding across pricing, contracts,
// renewals, and PDF generation.
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export const CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  CAD: 1.37,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.53,
  CHF: 0.88,
  JPY: 155.5,
  INR: 83.5,
};

export const convertCurrency = (
  amount: Decimal,
  fromCurrency: string,
  toCurrency: string,
): Decimal => {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = CURRENCY_RATES[fromCurrency];
  const toRate = CURRENCY_RATES[toCurrency];

  if (!fromRate || !toRate) {
    throw new Error(
      `Unsupported currency pair: ${fromCurrency} → ${toCurrency}`,
    );
  }

  return amount
    .dividedBy(fromRate)
    .times(toRate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
};

export const roundForCurrency = (
  amount: Decimal,
  currency: string,
): Decimal => {
  if (currency === 'CHF') {
    return amount.times(20).round().dividedBy(20);
  }
  if (currency === 'JPY') {
    return amount.round();
  }
  return amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
};

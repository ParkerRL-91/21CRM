'use client';

import { useState, useCallback } from 'react';
import type { TierRow } from '@/lib/cpq/tier-utils';
import {
  validateTiers,
  calculateGraduatedPrice,
  calculateVolumePriceForQuantity,
  addTier,
  removeTier,
} from '@/lib/cpq/tier-utils';

interface TierTableEditorProps {
  tiers: TierRow[];
  onChange: (tiers: TierRow[]) => void;
  pricingModel: 'graduated' | 'volume';
}

export function TierTableEditor({ tiers, onChange, pricingModel }: TierTableEditorProps) {
  const [testQuantity, setTestQuantity] = useState<number>(100);
  const validation = validateTiers(tiers);

  const calculate = pricingModel === 'graduated'
    ? calculateGraduatedPrice
    : calculateVolumePriceForQuantity;
  const calcResult = calculate(testQuantity, tiers);

  const updateTier = useCallback(
    (index: number, field: keyof TierRow, value: number | null) => {
      const updated = tiers.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      );
      onChange(updated);
    },
    [tiers, onChange]
  );

  const handleAddTier = () => {
    const lastPrice = tiers.length > 0 ? tiers[tiers.length - 1].unitPrice * 0.8 : 50;
    onChange(addTier(tiers, Math.round(lastPrice * 100) / 100));
  };

  const handleRemoveTier = (index: number) => {
    onChange(removeTier(tiers, index));
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Pricing Tiers</label>

      {/* Tier table */}
      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm" role="table">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left text-xs text-gray-500">From</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">To</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">Unit Price</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => {
              const tierErrors = validation.errors.filter((e) => e.tierIndex === i);
              const tierWarnings = validation.warnings.filter((w) => w.tierIndex === i);
              const hasError = tierErrors.length > 0;
              const hasWarning = tierWarnings.length > 0;

              return (
                <tr
                  key={i}
                  className={`border-b ${hasError ? 'bg-red-50' : hasWarning ? 'bg-yellow-50' : ''}`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={tier.from}
                      onChange={(e) => updateTier(i, 'from', parseInt(e.target.value) || 0)}
                      className="w-20 rounded border px-2 py-1 text-sm"
                      min={1}
                      aria-label={`Tier ${i + 1} from quantity`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {tier.to === null ? (
                      <span className="text-gray-400 text-sm">∞ Unlimited</span>
                    ) : (
                      <input
                        type="number"
                        value={tier.to}
                        onChange={(e) => updateTier(i, 'to', parseInt(e.target.value) || 0)}
                        className="w-20 rounded border px-2 py-1 text-sm"
                        min={tier.from}
                        aria-label={`Tier ${i + 1} to quantity`}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-1">$</span>
                      <input
                        type="number"
                        value={tier.unitPrice}
                        onChange={(e) => updateTier(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 rounded border px-2 py-1 text-sm"
                        min={0}
                        step={0.01}
                        aria-label={`Tier ${i + 1} unit price`}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(i)}
                      className="text-gray-400 hover:text-red-500 text-sm"
                      aria-label={`Remove tier ${i + 1}`}
                      disabled={tiers.length <= 1}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Validation messages */}
      {validation.errors.map((err, i) => (
        <p key={`err-${i}`} className="mt-1 text-xs text-red-600" role="alert">
          !! {err.message}
        </p>
      ))}
      {validation.warnings.map((warn, i) => (
        <p key={`warn-${i}`} className="mt-1 text-xs text-yellow-600">
          △ {warn.message}
        </p>
      ))}

      <button
        type="button"
        onClick={handleAddTier}
        className="mt-2 text-sm text-blue-500 hover:text-blue-700"
      >
        + Add Tier
      </button>

      {/* Live calculator */}
      <div className="mt-4 rounded border bg-gray-50 p-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Test: If a customer buys...
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={testQuantity}
            onChange={(e) => setTestQuantity(parseInt(e.target.value) || 0)}
            className="w-24 rounded border px-2 py-1 text-sm"
            min={0}
            aria-label="Test quantity"
          />
          <span className="text-sm text-gray-500">units</span>
        </div>

        {testQuantity > 0 && validation.valid && (
          <div className="mt-3 text-sm">
            {calcResult.breakdown.map((b, i) => (
              <div key={i} className="text-gray-600">
                {pricingModel === 'graduated'
                  ? `Tier ${i + 1}: ${b.quantity} × $${b.unitPrice} = $${b.subtotal}`
                  : `All ${b.quantity} units at $${b.unitPrice}/unit = $${b.subtotal}`}
              </div>
            ))}
            <div className="mt-2 font-semibold">
              Total: ${calcResult.totalPrice}
              <span className="ml-2 text-gray-400 font-normal">
                (${calcResult.effectiveRate}/unit effective)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

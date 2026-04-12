'use client';

import { useState } from 'react';

export type PricingModel = 'flat' | 'per_unit' | 'graduated' | 'volume';

interface PricingModelSelectorProps {
  value: PricingModel;
  onChange: (model: PricingModel) => void;
}

interface ModelOption {
  id: PricingModel;
  title: string;
  description: string;
  diagram: string;
  example: string;
  advanced: boolean;
}

const MODELS: ModelOption[] = [
  {
    id: 'flat',
    title: 'Flat Rate',
    description: 'One price for all customers regardless of quantity',
    diagram: '═══════',
    example: 'Example: $99/month for all features',
    advanced: false,
  },
  {
    id: 'per_unit',
    title: 'Per Unit',
    description: 'Price multiplied by quantity (seats, users, licenses)',
    diagram: '× Qty =',
    example: 'Example: $29/user × 10 users = $290/month',
    advanced: false,
  },
  {
    id: 'graduated',
    title: 'Graduated (Tiered)',
    description: 'Each tier has its own rate — units charged at their tier\'s price',
    diagram: '┐ ┐ ┐',
    example: 'Example: First 100 at $10, next 100 at $8. 150 units = (100×$10)+(50×$8) = $1,400',
    advanced: true,
  },
  {
    id: 'volume',
    title: 'Volume (All-Units)',
    description: 'All units get the rate of the highest applicable tier',
    diagram: '└────',
    example: 'Example: 80 units in 51-100 tier at $40 → all 80 at $40 = $3,200',
    advanced: true,
  },
];

export function PricingModelSelector({ value, onChange }: PricingModelSelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(
    value === 'graduated' || value === 'volume'
  );
  const [expandedInfo, setExpandedInfo] = useState<PricingModel | null>(null);

  const visibleModels = showAdvanced ? MODELS : MODELS.filter((m) => !m.advanced);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Pricing Model</label>
      <div className="grid grid-cols-2 gap-3">
        {visibleModels.map((model) => (
          <div key={model.id}>
            <button
              type="button"
              onClick={() => onChange(model.id)}
              className={`w-full rounded-lg border-2 p-4 text-left transition ${
                value === model.id
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-pressed={value === model.id}
              aria-label={`Select ${model.title} pricing`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg text-gray-400" aria-hidden="true">
                  {model.diagram}
                </span>
                {value === model.id && (
                  <span className="text-blue-500 text-sm" aria-label="Selected">✓</span>
                )}
              </div>
              <h4 className="mt-2 font-medium text-sm">{model.title}</h4>
              <p className="mt-1 text-xs text-gray-500">{model.description}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedInfo(expandedInfo === model.id ? null : model.id);
                }}
                className="mt-2 text-xs text-blue-500 hover:text-blue-700"
                aria-expanded={expandedInfo === model.id}
                aria-label={`Learn more about ${model.title}`}
              >
                {expandedInfo === model.id ? 'Hide details' : 'Learn more'} ⓘ
              </button>
            </button>

            {expandedInfo === model.id && (
              <div className="mt-1 rounded border bg-gray-50 p-3 text-xs text-gray-600">
                {model.example}
              </div>
            )}
          </div>
        ))}
      </div>

      {!showAdvanced && (
        <button
          type="button"
          onClick={() => setShowAdvanced(true)}
          className="mt-3 text-sm text-blue-500 hover:text-blue-700"
        >
          Show advanced pricing models &rarr;
        </button>
      )}
    </div>
  );
}

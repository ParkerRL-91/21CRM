'use client';

import { useState } from 'react';
import { PricingModelSelector, type PricingModel } from './pricing-model-selector';
import { TierTableEditor } from './tier-table-editor';
import type { PricingTemplate } from './pricing-template-data';
import type { TierRow } from '@/lib/cpq/tier-utils';

type ProductType = 'subscription' | 'one_time' | 'professional_service';

interface ProductWizardData {
  // Step 1
  productType: ProductType;
  // Step 2
  name: string;
  sku: string;
  description: string;
  family: string;
  // Step 3
  pricingModel: PricingModel;
  price: number;
  billingFrequency: 'monthly' | 'quarterly' | 'annual';
  defaultTermMonths: number;
  tiers: TierRow[];
  // Service-specific
  rateType: 'hourly' | 'project';
  estimatedHours: number;
}

interface ProductWizardProps {
  initialTemplate?: PricingTemplate;
  onSubmit: (data: ProductWizardData) => void;
  onCancel: () => void;
}

const PRODUCT_TYPES: Array<{ id: ProductType; icon: string; title: string; description: string }> = [
  { id: 'subscription', icon: '🔄', title: 'Subscription', description: 'Recurring product with billing period and term' },
  { id: 'one_time', icon: '💳', title: 'One-Time', description: 'Single charge — implementation, setup, or license' },
  { id: 'professional_service', icon: '👤', title: 'Professional Service', description: 'Consulting, training, or custom work' },
];

const DEFAULT_DATA: ProductWizardData = {
  productType: 'subscription',
  name: '',
  sku: '',
  description: '',
  family: '',
  pricingModel: 'flat',
  price: 0,
  billingFrequency: 'monthly',
  defaultTermMonths: 12,
  tiers: [{ from: 1, to: 100, unitPrice: 50 }, { from: 101, to: null, unitPrice: 40 }],
  rateType: 'hourly',
  estimatedHours: 0,
};

export function ProductWizard({ initialTemplate, onSubmit, onCancel }: ProductWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ProductWizardData>(() => {
    if (!initialTemplate) return DEFAULT_DATA;
    return {
      ...DEFAULT_DATA,
      productType: initialTemplate.defaults.productType,
      pricingModel: initialTemplate.defaults.pricingModel,
      price: initialTemplate.defaults.defaultPrice ?? 0,
      billingFrequency: initialTemplate.defaults.billingFrequency ?? 'monthly',
      defaultTermMonths: initialTemplate.defaults.defaultTermMonths ?? 12,
      tiers: initialTemplate.defaults.placeholderTiers?.map((t) => ({
        from: t.from, to: t.to, unitPrice: t.price,
      })) ?? DEFAULT_DATA.tiers,
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof ProductWizardData>(field: K, value: ProductWizardData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const { [field]: _, ...rest } = prev; return rest; });
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 2) {
      if (!data.name.trim()) newErrors.name = 'Product name is required';
    }
    if (step === 3) {
      if (data.pricingModel === 'flat' && data.price <= 0 && data.productType !== 'professional_service') {
        newErrors.price = 'Price must be greater than 0';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 4)); };
  const prev = () => setStep((s) => Math.max(s - 1, 1));
  const handleSubmit = () => { if (validateStep()) onSubmit(data); };

  const showTiers = data.pricingModel === 'graduated' || data.pricingModel === 'volume';

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          {['Type', 'Details', 'Pricing', 'Review'].map((label, i) => (
            <span key={label} className={i + 1 <= step ? 'text-blue-600 font-medium' : ''}>
              {i + 1}. {label}
            </span>
          ))}
        </div>
        <div className="h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Type */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">What type of product is this?</h2>
          <div className="grid grid-cols-3 gap-4">
            {PRODUCT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => update('productType', type.id)}
                className={`rounded-lg border-2 p-5 text-left transition ${
                  data.productType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-pressed={data.productType === type.id}
              >
                <div className="text-2xl mb-2" aria-hidden="true">{type.icon}</div>
                <h3 className="font-medium">{type.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Product Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => update('name', e.target.value)}
                className={`w-full rounded border px-3 py-2 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g., Platform Pro"
                aria-label="Product name"
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={data.sku}
                onChange={(e) => update('sku', e.target.value)}
                className="w-full rounded border px-3 py-2"
                placeholder="e.g., PLAT-PRO-001"
                aria-label="Product SKU"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description <span className="text-gray-400">(optional)</span></label>
              <textarea
                value={data.description}
                onChange={(e) => update('description', e.target.value)}
                className="w-full rounded border px-3 py-2"
                rows={3}
                placeholder="Brief product description..."
                aria-label="Product description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Family <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={data.family}
                onChange={(e) => update('family', e.target.value)}
                className="w-full rounded border px-3 py-2"
                placeholder="e.g., Platform, Analytics, Services"
                aria-label="Product family"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Pricing</h2>
          <div className="space-y-6">
            {/* Subscription-specific fields */}
            {data.productType === 'subscription' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Billing Period</label>
                  <select
                    value={data.billingFrequency}
                    onChange={(e) => update('billingFrequency', e.target.value as typeof data.billingFrequency)}
                    className="w-full rounded border px-3 py-2"
                    aria-label="Billing period"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Default Term</label>
                  <select
                    value={data.defaultTermMonths}
                    onChange={(e) => update('defaultTermMonths', parseInt(e.target.value))}
                    className="w-full rounded border px-3 py-2"
                    aria-label="Default contract term"
                  >
                    <option value={1}>1 month</option>
                    <option value={3}>3 months</option>
                    <option value={6}>6 months</option>
                    <option value={12}>12 months</option>
                    <option value={24}>24 months</option>
                    <option value={36}>36 months</option>
                  </select>
                </div>
              </div>
            )}

            {/* Service-specific fields */}
            {data.productType === 'professional_service' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rate Type</label>
                  <select
                    value={data.rateType}
                    onChange={(e) => update('rateType', e.target.value as 'hourly' | 'project')}
                    className="w-full rounded border px-3 py-2"
                    aria-label="Rate type"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="project">Fixed Project Fee</option>
                  </select>
                </div>
                {data.rateType === 'hourly' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Estimated Hours</label>
                    <input
                      type="number"
                      value={data.estimatedHours || ''}
                      onChange={(e) => update('estimatedHours', parseInt(e.target.value) || 0)}
                      className="w-full rounded border px-3 py-2"
                      min={0}
                      aria-label="Estimated hours"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Pricing model selector */}
            {data.productType !== 'professional_service' && (
              <PricingModelSelector
                value={data.pricingModel}
                onChange={(model) => update('pricingModel', model)}
              />
            )}

            {/* Price input or tier table */}
            {showTiers ? (
              <TierTableEditor
                tiers={data.tiers}
                onChange={(tiers) => update('tiers', tiers)}
                pricingModel={data.pricingModel as 'graduated' | 'volume'}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {data.productType === 'professional_service'
                    ? data.rateType === 'hourly' ? 'Hourly Rate' : 'Project Fee'
                    : 'Price'}
                </label>
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">$</span>
                  <input
                    type="number"
                    value={data.price || ''}
                    onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
                    className={`w-40 rounded border px-3 py-2 ${errors.price ? 'border-red-500' : ''}`}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    aria-label="Product price"
                    aria-invalid={!!errors.price}
                  />
                  {data.productType === 'subscription' && (
                    <span className="ml-2 text-sm text-gray-500">
                      /{data.billingFrequency === 'monthly' ? 'mo' : data.billingFrequency === 'quarterly' ? 'qtr' : 'yr'}
                    </span>
                  )}
                  {data.productType === 'professional_service' && data.rateType === 'hourly' && (
                    <span className="ml-2 text-sm text-gray-500">/hour</span>
                  )}
                </div>
                {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Review & Create</h2>
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Type</span>
              <span className="text-sm font-medium capitalize">{data.productType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium">{data.name || '(unnamed)'}</span>
            </div>
            {data.sku && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">SKU</span>
                <span className="text-sm">{data.sku}</span>
              </div>
            )}
            {data.family && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Family</span>
                <span className="text-sm">{data.family}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Pricing</span>
              <span className="text-sm font-medium">
                {showTiers
                  ? `${data.pricingModel} (${data.tiers.length} tiers)`
                  : `$${data.price.toLocaleString()}`}
                {data.productType === 'subscription' && ` / ${data.billingFrequency}`}
              </span>
            </div>
            {data.productType === 'subscription' && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Default Term</span>
                <span className="text-sm">{data.defaultTermMonths} months</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={step === 1 ? onCancel : prev}
          className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
        >
          {step === 1 ? 'Cancel' : '← Back'}
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            className="rounded bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-green-600 px-6 py-2 text-sm text-white hover:bg-green-700"
          >
            Create Product ✓
          </button>
        )}
      </div>
    </div>
  );
}

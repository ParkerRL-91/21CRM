// Pre-built pricing templates for the product creation wizard.
// Used by CpqTemplateGallery when the product catalog is empty.

export type PricingModelType = 'flat' | 'per_unit' | 'graduated' | 'volume';

export type PricingTemplate = {
  id: string;
  icon: string;
  title: string;
  description: string;
  defaults: {
    productType: 'subscription' | 'one_time' | 'professional_service';
    chargeType: 'recurring' | 'one_time' | 'usage';
    billingFrequency?: 'monthly' | 'quarterly' | 'annual';
    defaultTermMonths?: number;
    pricingModel: PricingModelType;
    defaultPrice?: number;
    placeholderTiers?: Array<{ from: number; to: number | null; price: number }>;
  };
};

export const CPQ_PRICING_TEMPLATES: PricingTemplate[] = [
  {
    id: 'per-seat-saas',
    icon: 'IconUsers',
    title: 'Per-Seat SaaS',
    description: '$X/user/month — scales with team size',
    defaults: {
      productType: 'subscription',
      chargeType: 'recurring',
      billingFrequency: 'monthly',
      defaultTermMonths: 12,
      pricingModel: 'per_unit',
      defaultPrice: 29,
    },
  },
  {
    id: 'usage-based',
    icon: 'IconChartBar',
    title: 'Usage-Based',
    description: '$X per unit of consumption',
    defaults: {
      productType: 'subscription',
      chargeType: 'usage',
      billingFrequency: 'monthly',
      defaultTermMonths: 12,
      pricingModel: 'graduated',
      placeholderTiers: [
        { from: 1, to: 1000, price: 0.01 },
        { from: 1001, to: 10000, price: 0.008 },
        { from: 10001, to: null, price: 0.005 },
      ],
    },
  },
  {
    id: 'flat-rate',
    icon: 'IconBox',
    title: 'Flat Rate',
    description: 'Simple recurring charge',
    defaults: {
      productType: 'subscription',
      chargeType: 'recurring',
      billingFrequency: 'monthly',
      defaultTermMonths: 12,
      pricingModel: 'flat',
      defaultPrice: 99,
    },
  },
  {
    id: 'tiered-volume',
    icon: 'IconTrendingUp',
    title: 'Tiered Volume',
    description: 'Lower price at higher volumes',
    defaults: {
      productType: 'subscription',
      chargeType: 'recurring',
      billingFrequency: 'annual',
      defaultTermMonths: 12,
      pricingModel: 'volume',
      placeholderTiers: [
        { from: 1, to: 100, price: 50 },
        { from: 101, to: 500, price: 40 },
        { from: 501, to: null, price: 30 },
      ],
    },
  },
  {
    id: 'one-time-fee',
    icon: 'IconTool',
    title: 'One-Time Fee',
    description: 'Implementation or setup charge',
    defaults: {
      productType: 'one_time',
      chargeType: 'one_time',
      pricingModel: 'flat',
      defaultPrice: 5000,
    },
  },
  {
    id: 'professional-services',
    icon: 'IconUser',
    title: 'Professional Services',
    description: 'Consulting or training — hourly or project',
    defaults: {
      productType: 'professional_service',
      chargeType: 'one_time',
      pricingModel: 'per_unit',
      defaultPrice: 200,
    },
  },
];

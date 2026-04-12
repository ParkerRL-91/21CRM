import { describe, it, expect } from 'vitest';
import {
  createContractSchema,
  createFromDealSchema,
  updateContractSchema,
  renewalConfigSchema,
  addSubscriptionSchema,
  modifySubscriptionSchema,
  listContractsQuerySchema,
  isValidContractTransition,
  isValidSubscriptionTransition,
  ProposedSubscriptionLineSchema,
  AmendmentChangesSchema,
  RiskSignalSchema,
} from './validation';

// ============================================================================
// Contract status transitions
// ============================================================================

describe('isValidContractTransition', () => {
  it('allows draft → active', () => {
    expect(isValidContractTransition('draft', 'active')).toBe(true);
  });

  it('allows active → amended', () => {
    expect(isValidContractTransition('active', 'amended')).toBe(true);
  });

  it('allows active → pending_renewal', () => {
    expect(isValidContractTransition('active', 'pending_renewal')).toBe(true);
  });

  it('allows active → expired', () => {
    expect(isValidContractTransition('active', 'expired')).toBe(true);
  });

  it('allows active → cancelled', () => {
    expect(isValidContractTransition('active', 'cancelled')).toBe(true);
  });

  it('allows amended → active', () => {
    expect(isValidContractTransition('amended', 'active')).toBe(true);
  });

  it('allows pending_renewal → renewed', () => {
    expect(isValidContractTransition('pending_renewal', 'renewed')).toBe(true);
  });

  it('allows pending_renewal → expired', () => {
    expect(isValidContractTransition('pending_renewal', 'expired')).toBe(true);
  });

  it('rejects draft → cancelled', () => {
    expect(isValidContractTransition('draft', 'cancelled')).toBe(false);
  });

  it('rejects expired → active', () => {
    expect(isValidContractTransition('expired', 'active')).toBe(false);
  });

  it('rejects cancelled → active', () => {
    expect(isValidContractTransition('cancelled', 'active')).toBe(false);
  });

  it('rejects unknown state', () => {
    expect(isValidContractTransition('unknown', 'active')).toBe(false);
  });
});

// ============================================================================
// Subscription status transitions
// ============================================================================

describe('isValidSubscriptionTransition', () => {
  it('allows pending → active', () => {
    expect(isValidSubscriptionTransition('pending', 'active')).toBe(true);
  });

  it('allows active → pending_amendment', () => {
    expect(isValidSubscriptionTransition('active', 'pending_amendment')).toBe(
      true
    );
  });

  it('allows active → pending_cancellation', () => {
    expect(
      isValidSubscriptionTransition('active', 'pending_cancellation')
    ).toBe(true);
  });

  it('allows active → suspended', () => {
    expect(isValidSubscriptionTransition('active', 'suspended')).toBe(true);
  });

  it('allows suspended → active', () => {
    expect(isValidSubscriptionTransition('suspended', 'active')).toBe(true);
  });

  it('allows pending_cancellation → cancelled', () => {
    expect(
      isValidSubscriptionTransition('pending_cancellation', 'cancelled')
    ).toBe(true);
  });

  it('rejects active → cancelled (must go through pending_cancellation)', () => {
    expect(isValidSubscriptionTransition('active', 'cancelled')).toBe(false);
  });

  it('rejects cancelled → active (no reactivation)', () => {
    expect(isValidSubscriptionTransition('cancelled', 'active')).toBe(false);
  });
});

// ============================================================================
// Create contract schema
// ============================================================================

describe('createContractSchema', () => {
  const validInput = {
    contractName: 'Acme Corp Enterprise License',
    accountHubspotId: '12345',
    accountName: 'Acme Corp',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    totalValue: 120000,
    currencyCode: 'CAD',
  };

  it('accepts valid input', () => {
    const result = createContractSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing contractName', () => {
    const { contractName, ...rest } = validInput;
    const result = createContractSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects empty contractName', () => {
    const result = createContractSchema.safeParse({
      ...validInput,
      contractName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative totalValue', () => {
    const result = createContractSchema.safeParse({
      ...validInput,
      totalValue: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createContractSchema.safeParse({
      ...validInput,
      startDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid currency code length', () => {
    const result = createContractSchema.safeParse({
      ...validInput,
      currencyCode: 'US',
    });
    expect(result.success).toBe(false);
  });

  it('defaults currency to CAD', () => {
    const { currencyCode, ...rest } = validInput;
    const result = createContractSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currencyCode).toBe('CAD');
    }
  });

  it('accepts valid subscriptions', () => {
    const result = createContractSchema.safeParse({
      ...validInput,
      subscriptions: [
        {
          productName: 'Platform Pro',
          quantity: 1,
          unitPrice: 60000,
          annualValue: 60000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Create from deal schema
// ============================================================================

describe('createFromDealSchema', () => {
  it('accepts valid deal ID', () => {
    const result = createFromDealSchema.safeParse({
      dealHubspotId: '12345',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty deal ID', () => {
    const result = createFromDealSchema.safeParse({
      dealHubspotId: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional startDate and termMonths', () => {
    const result = createFromDealSchema.safeParse({
      dealHubspotId: '12345',
      startDate: '2026-01-01',
      termMonths: 12,
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Renewal config schema
// ============================================================================

describe('renewalConfigSchema', () => {
  it('accepts valid config', () => {
    const result = renewalConfigSchema.safeParse({
      defaultLeadDays: 90,
      defaultPricingMethod: 'same_price',
      notifyOwnerOnCreation: true,
      jobEnabled: true,
    });
    expect(result.success).toBe(true);
  });

  it('requires uplift percentage when method is uplift', () => {
    const result = renewalConfigSchema.safeParse({
      defaultLeadDays: 90,
      defaultPricingMethod: 'uplift_percentage',
      // missing defaultUpliftPercentage
    });
    expect(result.success).toBe(false);
  });

  it('accepts uplift with percentage provided', () => {
    const result = renewalConfigSchema.safeParse({
      defaultLeadDays: 90,
      defaultPricingMethod: 'uplift_percentage',
      defaultUpliftPercentage: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects lead days below 7', () => {
    const result = renewalConfigSchema.safeParse({
      defaultLeadDays: 3,
      defaultPricingMethod: 'same_price',
    });
    expect(result.success).toBe(false);
  });

  it('rejects lead days above 365', () => {
    const result = renewalConfigSchema.safeParse({
      defaultLeadDays: 400,
      defaultPricingMethod: 'same_price',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// JSONB shape validators
// ============================================================================

describe('ProposedSubscriptionLineSchema', () => {
  it('accepts valid proposed subscription', () => {
    const result = ProposedSubscriptionLineSchema.safeParse({
      subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
      productName: 'Platform Pro',
      quantity: 1,
      oldUnitPrice: '60000.00',
      newUnitPrice: '61800.00',
      oldAnnualValue: '60000.00',
      newAnnualValue: '61800.00',
      pricingMethod: 'uplift_percentage',
      billingFrequency: 'annual',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid pricing method', () => {
    const result = ProposedSubscriptionLineSchema.safeParse({
      subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
      productName: 'Platform Pro',
      quantity: 1,
      oldUnitPrice: '60000.00',
      newUnitPrice: '61800.00',
      oldAnnualValue: '60000.00',
      newAnnualValue: '61800.00',
      pricingMethod: 'invalid_method',
      billingFrequency: 'annual',
    });
    expect(result.success).toBe(false);
  });
});

describe('AmendmentChangesSchema', () => {
  it('accepts valid amendment changes', () => {
    const result = AmendmentChangesSchema.safeParse({
      field: 'quantity',
      oldValue: 5,
      newValue: 10,
    });
    expect(result.success).toBe(true);
  });

  it('accepts null old value (new field)', () => {
    const result = AmendmentChangesSchema.safeParse({
      field: 'discount_percentage',
      oldValue: null,
      newValue: '10.00',
    });
    expect(result.success).toBe(true);
  });
});

describe('RiskSignalSchema', () => {
  it('accepts valid risk signal', () => {
    const result = RiskSignalSchema.safeParse({
      name: 'stage_stagnation',
      weight: 0.25,
      score: 75,
      description: 'Deal has not progressed in 21 days',
      detectedAt: '2026-04-12T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects score above 100', () => {
    const result = RiskSignalSchema.safeParse({
      name: 'test',
      weight: 0.5,
      score: 150,
      description: 'test',
      detectedAt: '2026-04-12T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weight above 1', () => {
    const result = RiskSignalSchema.safeParse({
      name: 'test',
      weight: 1.5,
      score: 50,
      description: 'test',
      detectedAt: '2026-04-12T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

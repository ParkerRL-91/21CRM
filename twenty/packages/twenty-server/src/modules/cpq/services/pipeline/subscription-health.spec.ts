import { SubscriptionHealthEngine } from './subscription-health';
import type { SubscriptionLineItem } from './subscription-health';

describe('SubscriptionHealthEngine', () => {
  let engine: SubscriptionHealthEngine;

  beforeEach(() => {
    engine = new SubscriptionHealthEngine();
  });

  describe('parseBillingPeriodMonths', () => {
    it('parses P1M as 1 month', () => expect(engine.parseBillingPeriodMonths('P1M')).toBe(1));
    it('parses P3M as 3 months', () => expect(engine.parseBillingPeriodMonths('P3M')).toBe(3));
    it('parses P6M as 6 months', () => expect(engine.parseBillingPeriodMonths('P6M')).toBe(6));
    it('parses P12M as 12 months', () => expect(engine.parseBillingPeriodMonths('P12M')).toBe(12));
    it('parses P1Y as 12 months', () => expect(engine.parseBillingPeriodMonths('P1Y')).toBe(12));
    it('returns 0 for null/empty', () => expect(engine.parseBillingPeriodMonths('')).toBe(0));
  });

  describe('calculateARRFromLineItems', () => {
    it('calculates ARR from monthly subscription', () => {
      const items: SubscriptionLineItem[] = [
        { amount: '1000', billingPeriod: 'P1M', productName: 'Platform' },
      ];
      const result = engine.calculateARRFromLineItems(items);
      expect(result.arr).toBe('12000');
      expect(result.mrr).toBe('1000');
    });

    it('calculates ARR from annual subscription', () => {
      const items: SubscriptionLineItem[] = [
        { amount: '12000', billingPeriod: 'P12M', productName: 'Platform' },
      ];
      const result = engine.calculateARRFromLineItems(items);
      expect(result.arr).toBe('12000');
      expect(result.mrr).toBe('1000');
    });

    it('calculates ARR from quarterly subscription', () => {
      const items: SubscriptionLineItem[] = [
        { amount: '3000', billingPeriod: 'P3M', productName: 'Platform' },
      ];
      const result = engine.calculateARRFromLineItems(items);
      expect(result.arr).toBe('12000');
      expect(result.mrr).toBe('1000');
    });

    it('excludes one-time items from ARR', () => {
      const items: SubscriptionLineItem[] = [
        { amount: '12000', billingPeriod: 'P12M', productName: 'Platform' },
        { amount: '5000', billingPeriod: null, productName: 'Setup Fee' },
      ];
      const result = engine.calculateARRFromLineItems(items);
      expect(result.arr).toBe('12000');
      expect(result.oneTimeRevenue).toBe('5000');
      expect(result.recurringLineItemCount).toBe(1);
      expect(result.oneTimeLineItemCount).toBe(1);
    });

    it('handles empty items array', () => {
      const result = engine.calculateARRFromLineItems([]);
      expect(result.arr).toBe('0');
      expect(result.mrr).toBe('0');
    });

    it('sums multiple subscriptions', () => {
      const items: SubscriptionLineItem[] = [
        { amount: '12000', billingPeriod: 'P12M', productName: 'Platform' },
        { amount: '6000', billingPeriod: 'P12M', productName: 'Support' },
      ];
      const result = engine.calculateARRFromLineItems(items);
      expect(result.arr).toBe('18000');
    });
  });

  describe('calculateNRR', () => {
    it('calculates NRR above 100% (healthy)', () => {
      const result = engine.calculateNRR('100000', '20000', '5000', '3000');
      expect(result.nrrPercent).toBe('112.0');
      expect(result.isHealthy).toBe(true);
    });

    it('calculates NRR below 100% (unhealthy)', () => {
      const result = engine.calculateNRR('100000', '5000', '10000', '15000');
      expect(result.nrrPercent).toBe('80.0');
      expect(result.isHealthy).toBe(false);
    });

    it('handles zero beginning ARR', () => {
      const result = engine.calculateNRR('0', '10000', '0', '0');
      expect(result.nrrPercent).toBe('0');
      expect(result.isHealthy).toBe(false);
    });

    it('calculates exact 100% NRR', () => {
      const result = engine.calculateNRR('100000', '10000', '5000', '5000');
      expect(result.nrrPercent).toBe('100.0');
      expect(result.isHealthy).toBe(true);
    });
  });

  describe('calculateARRMovement', () => {
    it('detects new ARR from products not in previous period', () => {
      const current: SubscriptionLineItem[] = [
        { amount: '12000', billingPeriod: 'P12M', productName: 'Platform' },
      ];
      const result = engine.calculateARRMovement(current, []);
      expect(result.newARR).toBe('12000');
      expect(result.beginningARR).toBe('0');
    });

    it('detects churned ARR from products not in current period', () => {
      const previous: SubscriptionLineItem[] = [
        { amount: '12000', billingPeriod: 'P12M', productName: 'Platform' },
      ];
      const result = engine.calculateARRMovement([], previous);
      expect(result.churnARR).toBe('12000');
    });

    it('detects expansion ARR from increased amounts', () => {
      const previous: SubscriptionLineItem[] = [
        { amount: '12000', billingPeriod: 'P12M', productName: 'Platform' },
      ];
      const current: SubscriptionLineItem[] = [
        { amount: '18000', billingPeriod: 'P12M', productName: 'Platform' },
      ];
      const result = engine.calculateARRMovement(current, previous);
      expect(result.expansionARR).toBe('6000');
    });

    it('detects contraction ARR from decreased amounts', () => {
      const previous: SubscriptionLineItem[] = [
        { amount: '18000', billingPeriod: 'P12M', productName: 'Platform' },
      ];
      const current: SubscriptionLineItem[] = [
        { amount: '12000', billingPeriod: 'P12M', productName: 'Platform' },
      ];
      const result = engine.calculateARRMovement(current, previous);
      expect(result.contractionARR).toBe('6000');
    });

    it('calculates correct ending ARR', () => {
      const previous: SubscriptionLineItem[] = [
        { amount: '12000', billingPeriod: 'P12M', productName: 'Platform' },
        { amount: '6000', billingPeriod: 'P12M', productName: 'Support' },
      ];
      const current: SubscriptionLineItem[] = [
        { amount: '15000', billingPeriod: 'P12M', productName: 'Platform' },
        // Support churned
        { amount: '3000', billingPeriod: 'P12M', productName: 'Add-on' },
      ];
      const result = engine.calculateARRMovement(current, previous);
      expect(result.beginningARR).toBe('18000');
      expect(result.expansionARR).toBe('3000');
      expect(result.churnARR).toBe('6000');
      expect(result.newARR).toBe('3000');
      expect(result.endingARR).toBe('18000'); // 18000 + 3000 + 3000 - 0 - 6000
    });
  });
});

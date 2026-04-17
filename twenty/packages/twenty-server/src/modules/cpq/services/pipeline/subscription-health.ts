import { Injectable, Logger } from '@nestjs/common';

import { Decimal } from 'src/modules/cpq/utils/cpq-decimal.utils';

// Subscription health engine — calculates ARR, MRR, NRR, and ARR
// movement (new, expansion, contraction, churn) from line item data.
// Uses Decimal.js for all monetary arithmetic.
@Injectable()
export class SubscriptionHealthEngine {
  private readonly logger = new Logger(SubscriptionHealthEngine.name);

  calculateARRFromLineItems(lineItems: SubscriptionLineItem[]): ARRResult {
    let totalARR = new Decimal(0);
    let totalMRR = new Decimal(0);
    let oneTimeRevenue = new Decimal(0);
    let recurringCount = 0;
    let oneTimeCount = 0;

    for (const item of lineItems) {
      const amount = new Decimal(item.amount || '0');

      if (!item.billingPeriod) {
        oneTimeRevenue = oneTimeRevenue.plus(amount);
        oneTimeCount++;
        continue;
      }

      const months = this.parseBillingPeriodMonths(item.billingPeriod);
      if (months <= 0) {
        oneTimeRevenue = oneTimeRevenue.plus(amount);
        oneTimeCount++;
        continue;
      }

      const monthlyValue = amount.dividedBy(months);
      const annualValue = monthlyValue.times(12);

      totalMRR = totalMRR.plus(monthlyValue);
      totalARR = totalARR.plus(annualValue);
      recurringCount++;
    }

    return {
      arr: totalARR.toDecimalPlaces(2).toString(),
      mrr: totalMRR.toDecimalPlaces(2).toString(),
      oneTimeRevenue: oneTimeRevenue.toDecimalPlaces(2).toString(),
      recurringLineItemCount: recurringCount,
      oneTimeLineItemCount: oneTimeCount,
    };
  }

  calculateNRR(
    beginningARR: string,
    expansionARR: string,
    contractionARR: string,
    churnARR: string,
  ): NRRResult {
    const beginning = new Decimal(beginningARR || '0');
    const expansion = new Decimal(expansionARR || '0');
    const contraction = new Decimal(contractionARR || '0');
    const churn = new Decimal(churnARR || '0');

    if (beginning.isZero()) {
      return {
        nrr: '0',
        nrrPercent: '0',
        endingARR: expansion.minus(contraction).minus(churn).toDecimalPlaces(2).toString(),
        isHealthy: false,
      };
    }

    const endingARR = beginning.plus(expansion).minus(contraction).minus(churn);
    const nrrPercent = endingARR.dividedBy(beginning).times(100);

    return {
      nrr: endingARR.toDecimalPlaces(2).toString(),
      nrrPercent: nrrPercent.toDecimalPlaces(1).toString(),
      endingARR: endingARR.toDecimalPlaces(2).toString(),
      isHealthy: nrrPercent.gte(100),
    };
  }

  calculateARRMovement(
    currentPeriodItems: SubscriptionLineItem[],
    previousPeriodItems: SubscriptionLineItem[],
  ): ARRMovementResult {
    const currentByProduct = this.groupByProduct(currentPeriodItems);
    const previousByProduct = this.groupByProduct(previousPeriodItems);

    let newARR = new Decimal(0);
    let expansionARR = new Decimal(0);
    let contractionARR = new Decimal(0);
    let churnARR = new Decimal(0);

    const allProducts = new Set([
      ...Object.keys(currentByProduct),
      ...Object.keys(previousByProduct),
    ]);

    for (const product of allProducts) {
      const current = currentByProduct[product] || new Decimal(0);
      const previous = previousByProduct[product] || new Decimal(0);

      if (previous.isZero() && current.gt(0)) {
        newARR = newARR.plus(current);
      } else if (current.isZero() && previous.gt(0)) {
        churnARR = churnARR.plus(previous);
      } else if (current.gt(previous)) {
        expansionARR = expansionARR.plus(current.minus(previous));
      } else if (current.lt(previous)) {
        contractionARR = contractionARR.plus(previous.minus(current));
      }
    }

    const previousTotal = Object.values(previousByProduct)
      .reduce((sum, v) => sum.plus(v), new Decimal(0));

    return {
      beginningARR: previousTotal.toDecimalPlaces(2).toString(),
      newARR: newARR.toDecimalPlaces(2).toString(),
      expansionARR: expansionARR.toDecimalPlaces(2).toString(),
      contractionARR: contractionARR.toDecimalPlaces(2).toString(),
      churnARR: churnARR.toDecimalPlaces(2).toString(),
      endingARR: previousTotal
        .plus(newARR)
        .plus(expansionARR)
        .minus(contractionARR)
        .minus(churnARR)
        .toDecimalPlaces(2)
        .toString(),
    };
  }

  parseBillingPeriodMonths(period: string): number {
    if (!period) return 0;
    const match = period.match(/^P(\d+)M$/i);
    if (match) return parseInt(match[1], 10);
    if (period.toLowerCase() === 'p1y' || period === 'P12M') return 12;
    if (period.toLowerCase() === 'p1m') return 1;
    if (period.toLowerCase() === 'p3m') return 3;
    if (period.toLowerCase() === 'p6m') return 6;
    return 0;
  }

  private groupByProduct(items: SubscriptionLineItem[]): Record<string, Decimal> {
    const result: Record<string, Decimal> = {};
    for (const item of items) {
      if (!item.billingPeriod) continue;
      const months = this.parseBillingPeriodMonths(item.billingPeriod);
      if (months <= 0) continue;

      const key = item.productName || item.productId || 'unknown';
      const monthlyValue = new Decimal(item.amount || '0').dividedBy(months);
      const annualValue = monthlyValue.times(12);

      if (!result[key]) result[key] = new Decimal(0);
      result[key] = result[key].plus(annualValue);
    }
    return result;
  }
}

// Types
export type SubscriptionLineItem = {
  productId?: string;
  productName?: string;
  amount: string;
  billingPeriod: string | null;
  status?: string;
};

export type ARRResult = {
  arr: string;
  mrr: string;
  oneTimeRevenue: string;
  recurringLineItemCount: number;
  oneTimeLineItemCount: number;
};

export type NRRResult = {
  nrr: string;
  nrrPercent: string;
  endingARR: string;
  isHealthy: boolean;
};

export type ARRMovementResult = {
  beginningARR: string;
  newARR: string;
  expansionARR: string;
  contractionARR: string;
  churnARR: string;
  endingARR: string;
};

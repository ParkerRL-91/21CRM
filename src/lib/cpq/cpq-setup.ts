import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ============================================================================
// Types
// ============================================================================

export type ProductRecord = {
  id: string;
  name: string;
  sku?: string;
  defaultPrice?: number;
  defaultSubscriptionTermMonths?: number;
  billingFrequency?: string;
  chargeType: string;
  productType: string;
};

export type PriceBookEntryRecord = {
  productId: string;
  unitPrice: number;
  currencyCode: string;
};

export type ObjectList = {
  products: ProductRecord[];
  priceBookEntries: PriceBookEntryRecord[];
};

export type LineItemInput = {
  productId: string;
  quantity: number;
  discountPercent?: number;
};

export type ResolvedLineItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  discountPercent: number;
  netUnitPrice: string;
  netTotal: string;
};

export type SetupResult = {
  resolvedLineItems: ResolvedLineItem[];
  grandTotal: string;
};

// ============================================================================
// CpqSetupService
// ============================================================================

/**
 * CpqSetupService resolves product + price book data for a set of line items.
 *
 * The `lookupFn` is injected at construction time to keep this class
 * independently testable. In production, `lookupFn` would query the database.
 *
 * The key pattern: `setupCpq()` calls `lookupFn` **once** and passes the
 * cached result to every per-line-item processor — eliminating the N+1 problem
 * that occurs when lookups are performed inside loops.
 */
export class CpqSetupService {
  private readonly lookupFn: () => Promise<ObjectList>;

  constructor(lookupFn: () => Promise<ObjectList>) {
    this.lookupFn = lookupFn;
  }

  /**
   * Set up (resolve + price) a list of quote line items.
   *
   * Fetches the object list ONCE, then processes each line item using
   * the cached data. No further calls to `lookupFn` are made per item.
   */
  async setupCpq(lineItems: LineItemInput[]): Promise<SetupResult> {
    // Single fetch — cached for all subsequent per-item calls
    const objectList = await this.lookupFn();

    const resolvedLineItems = lineItems.map((item) =>
      this.resolveLineItem(item, objectList)
    );

    const grandTotal = resolvedLineItems
      .reduce((sum, li) => sum.plus(new Decimal(li.netTotal)), new Decimal(0))
      .toDecimalPlaces(2)
      .toString();

    return { resolvedLineItems, grandTotal };
  }

  private resolveLineItem(
    item: LineItemInput,
    objectList: ObjectList
  ): ResolvedLineItem {
    const product = objectList.products.find((p) => p.id === item.productId);
    const entry = objectList.priceBookEntries.find(
      (e) => e.productId === item.productId
    );

    const productName = product?.name ?? 'Unknown Product';
    const baseUnitPrice = new Decimal(
      entry?.unitPrice ?? product?.defaultPrice ?? 0
    );

    const discountPercent = item.discountPercent ?? 0;
    const multiplier = new Decimal(1).minus(
      new Decimal(discountPercent).dividedBy(100)
    );
    const netUnitPrice = baseUnitPrice
      .times(multiplier)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const quantity = Math.max(0, item.quantity);
    const netTotal = netUnitPrice
      .times(quantity)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      productId: item.productId,
      productName,
      quantity,
      unitPrice: baseUnitPrice.toString(),
      discountPercent,
      netUnitPrice: netUnitPrice.toString(),
      netTotal: netTotal.toString(),
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// PDF generation service — renders quote data as structured output
// suitable for @react-pdf/renderer. The actual PDF rendering requires
// the renderer package; this service prepares the data and template config.
//
// Architecture: QuotePdfData → Template selection → React PDF component → Buffer
// The React component lives in templates/quote-pdf-template.tsx
@Injectable()
export class CpqPdfService {
  private readonly logger = new Logger(CpqPdfService.name);

  // Prepare quote data for PDF rendering.
  // Aggregates line items by group, calculates totals, and merges
  // with template configuration (logo, colors, terms).
  prepareQuotePdfData(
    quote: QuoteRecord,
    lineItems: QuoteLineItemRecord[],
    groups: QuoteLineGroupRecord[],
    templateConfig: QuoteTemplateConfig,
  ): QuotePdfData {
    // Organize line items into groups
    const groupedItems = this.groupLineItems(lineItems, groups);

    // Calculate totals
    const subtotal = lineItems.reduce(
      (sum, item) => sum.plus(new Decimal(item.netTotal || '0')),
      new Decimal(0),
    );
    const discountTotal = lineItems.reduce(
      (sum, item) => sum.plus(new Decimal(item.discountAmount || '0')),
      new Decimal(0),
    );

    return {
      // Header
      quoteNumber: quote.quoteNumber,
      versionNumber: quote.versionNumber || 1,
      createdDate: quote.createdAt,
      expirationDate: quote.expirationDate,
      customerName: quote.accountName || '',
      customerAddress: quote.customerAddress || '',

      // Rep info
      repName: quote.repName || '',
      repEmail: quote.repEmail || '',
      repPhone: quote.repPhone || '',

      // Line items organized by groups
      sections: groupedItems,

      // Totals
      subtotal: subtotal.toDecimalPlaces(2).toString(),
      discountTotal: discountTotal.toDecimalPlaces(2).toString(),
      taxTotal: quote.taxTotal || '0',
      grandTotal: quote.grandTotal || subtotal.toString(),

      // Payment
      paymentTerms: quote.paymentTerms || 'Net 30',
      subscriptionTermMonths: quote.subscriptionTermMonths,
      startDate: quote.startDate,

      // Template config
      template: {
        logoUrl: templateConfig.logoUrl,
        primaryColor: templateConfig.primaryColor || '#1a56db',
        companyName: templateConfig.companyName || '',
        companyAddress: templateConfig.companyAddress || '',
        footerText: templateConfig.footerText || '',
        termsText: templateConfig.termsText || '',
        showDiscountColumn: templateConfig.showDiscountColumn ?? true,
        showSkuColumn: templateConfig.showSkuColumn ?? false,
        showDescriptionColumn: templateConfig.showDescriptionColumn ?? true,
      },
    };
  }

  // Generate a filename for the PDF
  generateFilename(
    companyName: string,
    quoteNumber: string,
    version: number,
  ): string {
    const sanitized = companyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const date = new Date().toISOString().split('T')[0];
    return `${sanitized}_Quote_${quoteNumber}_v${version}_${date}.pdf`;
  }

  // Organize line items into groups with subtotals
  private groupLineItems(
    lineItems: QuoteLineItemRecord[],
    groups: QuoteLineGroupRecord[],
  ): PdfSection[] {
    const sortedItems = [...lineItems].sort(
      (itemA, itemB) => (itemA.sortOrder || 0) - (itemB.sortOrder || 0),
    );

    if (groups.length === 0) {
      // No groups — single "Products" section
      return [{
        name: 'Products',
        items: sortedItems.map((item) => this.formatLineItem(item)),
        subtotal: sortedItems.reduce(
          (sum, item) => sum.plus(new Decimal(item.netTotal || '0')),
          new Decimal(0),
        ).toDecimalPlaces(2).toString(),
      }];
    }

    const sortedGroups = [...groups].sort(
      (groupA, groupB) => (groupA.sortOrder || 0) - (groupB.sortOrder || 0),
    );

    const sections: PdfSection[] = sortedGroups.map((group) => {
      const groupItems = sortedItems.filter(
        (item) => item.groupId === group.id,
      );
      return {
        name: group.name,
        items: groupItems.map((item) => this.formatLineItem(item)),
        subtotal: groupItems.reduce(
          (sum, item) => sum.plus(new Decimal(item.netTotal || '0')),
          new Decimal(0),
        ).toDecimalPlaces(2).toString(),
      };
    });

    // Items without a group go into "Other"
    const ungroupedItems = sortedItems.filter(
      (item) => !item.groupId || !groups.some((group) => group.id === item.groupId),
    );
    if (ungroupedItems.length > 0) {
      sections.push({
        name: 'Other',
        items: ungroupedItems.map((item) => this.formatLineItem(item)),
        subtotal: ungroupedItems.reduce(
          (sum, item) => sum.plus(new Decimal(item.netTotal || '0')),
          new Decimal(0),
        ).toDecimalPlaces(2).toString(),
      });
    }

    return sections;
  }

  // Format a line item for PDF display
  private formatLineItem(item: QuoteLineItemRecord): PdfLineItem {
    return {
      productName: item.productName,
      productSku: item.productSku || '',
      description: item.description || '',
      quantity: item.quantity,
      listPrice: item.listPrice || '0',
      discountPercent: item.discountPercent,
      netUnitPrice: item.netUnitPrice || '0',
      netTotal: item.netTotal || '0',
      billingType: item.billingType || 'recurring',
    };
  }
}

// Input types — records from Twenty's custom objects
export type QuoteRecord = {
  quoteNumber: string;
  versionNumber?: number;
  createdAt: string;
  expirationDate: string;
  accountName?: string;
  customerAddress?: string;
  repName?: string;
  repEmail?: string;
  repPhone?: string;
  grandTotal?: string;
  taxTotal?: string;
  paymentTerms?: string;
  subscriptionTermMonths?: number;
  startDate?: string;
};

export type QuoteLineItemRecord = {
  id: string;
  productName: string;
  productSku?: string;
  description?: string;
  quantity: number;
  listPrice?: string;
  discountPercent?: number;
  discountAmount?: string;
  netUnitPrice?: string;
  netTotal?: string;
  billingType?: string;
  sortOrder?: number;
  groupId?: string;
};

export type QuoteLineGroupRecord = {
  id: string;
  name: string;
  sortOrder?: number;
};

export type QuoteTemplateConfig = {
  logoUrl?: string;
  primaryColor?: string;
  companyName?: string;
  companyAddress?: string;
  footerText?: string;
  termsText?: string;
  showDiscountColumn?: boolean;
  showSkuColumn?: boolean;
  showDescriptionColumn?: boolean;
};

// Output types — structured data for the React PDF renderer
export type QuotePdfData = {
  quoteNumber: string;
  versionNumber: number;
  createdDate: string;
  expirationDate: string;
  customerName: string;
  customerAddress: string;
  repName: string;
  repEmail: string;
  repPhone: string;
  sections: PdfSection[];
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  paymentTerms: string;
  subscriptionTermMonths?: number;
  startDate?: string;
  template: {
    logoUrl?: string;
    primaryColor: string;
    companyName: string;
    companyAddress: string;
    footerText: string;
    termsText: string;
    showDiscountColumn: boolean;
    showSkuColumn: boolean;
    showDescriptionColumn: boolean;
  };
};

export type PdfSection = {
  name: string;
  items: PdfLineItem[];
  subtotal: string;
};

export type PdfLineItem = {
  productName: string;
  productSku: string;
  description: string;
  quantity: number;
  listPrice: string;
  discountPercent?: number;
  netUnitPrice: string;
  netTotal: string;
  billingType: string;
};

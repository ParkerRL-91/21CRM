import { CpqPdfService } from './cpq-pdf.service';

import type { QuoteRecord, QuoteLineItemRecord, QuoteLineGroupRecord } from './cpq-pdf.service';

describe('CpqPdfService', () => {
  let service: CpqPdfService;

  const sampleQuote: QuoteRecord = {
    quoteNumber: 'Q-2026-0042',
    versionNumber: 1,
    createdAt: '2026-04-12',
    expirationDate: '2026-05-12',
    accountName: 'Acme Corp',
    grandTotal: '120000',
    paymentTerms: 'Net 30',
    subscriptionTermMonths: 12,
    startDate: '2026-01-01',
  };

  const sampleLineItems: QuoteLineItemRecord[] = [
    { id: 'li-1', productName: 'Platform Pro', quantity: 1, listPrice: '60000', netUnitPrice: '60000', netTotal: '60000', billingType: 'recurring', sortOrder: 10, groupId: 'g-1' },
    { id: 'li-2', productName: 'Analytics', quantity: 5, listPrice: '6000', netUnitPrice: '6000', netTotal: '30000', billingType: 'recurring', sortOrder: 20, groupId: 'g-1' },
    { id: 'li-3', productName: 'Implementation', quantity: 1, listPrice: '30000', netUnitPrice: '30000', netTotal: '30000', billingType: 'one_time', sortOrder: 10, groupId: 'g-2' },
  ];

  const sampleGroups: QuoteLineGroupRecord[] = [
    { id: 'g-1', name: 'Platform Subscription', sortOrder: 1 },
    { id: 'g-2', name: 'Professional Services', sortOrder: 2 },
  ];

  const defaultTemplate = {
    companyName: '21CRM Inc',
    primaryColor: '#1a56db',
  };

  beforeEach(() => {
    service = new CpqPdfService();
  });

  describe('prepareQuotePdfData', () => {
    it('should organize line items into groups', () => {
      const data = service.prepareQuotePdfData(
        sampleQuote, sampleLineItems, sampleGroups, defaultTemplate,
      );

      expect(data.sections).toHaveLength(2);
      expect(data.sections[0].name).toBe('Platform Subscription');
      expect(data.sections[0].items).toHaveLength(2);
      expect(data.sections[1].name).toBe('Professional Services');
      expect(data.sections[1].items).toHaveLength(1);
    });

    it('should calculate section subtotals', () => {
      const data = service.prepareQuotePdfData(
        sampleQuote, sampleLineItems, sampleGroups, defaultTemplate,
      );

      expect(data.sections[0].subtotal).toBe('90000');
      expect(data.sections[1].subtotal).toBe('30000');
    });

    it('should calculate overall subtotal', () => {
      const data = service.prepareQuotePdfData(
        sampleQuote, sampleLineItems, sampleGroups, defaultTemplate,
      );

      expect(data.subtotal).toBe('120000');
    });

    it('should handle line items with no groups', () => {
      const data = service.prepareQuotePdfData(
        sampleQuote, sampleLineItems, [], defaultTemplate,
      );

      expect(data.sections).toHaveLength(1);
      expect(data.sections[0].name).toBe('Products');
      expect(data.sections[0].items).toHaveLength(3);
    });

    it('should put ungrouped items in Other section', () => {
      const itemsWithUngrouped = [
        ...sampleLineItems,
        { id: 'li-4', productName: 'Extra', quantity: 1, netTotal: '5000', sortOrder: 30 } as QuoteLineItemRecord,
      ];

      const data = service.prepareQuotePdfData(
        sampleQuote, itemsWithUngrouped, sampleGroups, defaultTemplate,
      );

      const otherSection = data.sections.find((section) => section.name === 'Other');
      expect(otherSection).toBeDefined();
      expect(otherSection?.items).toHaveLength(1);
    });

    it('should include template configuration', () => {
      const data = service.prepareQuotePdfData(
        sampleQuote, sampleLineItems, sampleGroups,
        { companyName: 'Test Co', primaryColor: '#ff0000', termsText: 'Net 60 terms apply.' },
      );

      expect(data.template.companyName).toBe('Test Co');
      expect(data.template.primaryColor).toBe('#ff0000');
      expect(data.template.termsText).toBe('Net 60 terms apply.');
    });

    it('should default template values when not provided', () => {
      const data = service.prepareQuotePdfData(
        sampleQuote, sampleLineItems, [], {},
      );

      expect(data.template.primaryColor).toBe('#1a56db');
      expect(data.template.showDiscountColumn).toBe(true);
      expect(data.template.showSkuColumn).toBe(false);
    });

    it('should sort items by sortOrder within groups', () => {
      const unsortedItems: QuoteLineItemRecord[] = [
        { id: 'li-b', productName: 'Second', quantity: 1, netTotal: '100', sortOrder: 20 } as QuoteLineItemRecord,
        { id: 'li-a', productName: 'First', quantity: 1, netTotal: '100', sortOrder: 10 } as QuoteLineItemRecord,
      ];

      const data = service.prepareQuotePdfData(
        sampleQuote, unsortedItems, [], defaultTemplate,
      );

      expect(data.sections[0].items[0].productName).toBe('First');
      expect(data.sections[0].items[1].productName).toBe('Second');
    });
  });

  describe('generateFilename', () => {
    it('should generate formatted filename', () => {
      const filename = service.generateFilename('Acme Corp', 'Q-2026-0042', 1);

      expect(filename).toContain('Acme_Corp');
      expect(filename).toContain('Q-2026-0042');
      expect(filename).toContain('v1');
      expect(filename).toContain('.pdf');
    });

    it('should sanitize special characters from company name', () => {
      const filename = service.generateFilename('Acme & Co. (Ltd)', 'Q-001', 2);

      expect(filename).not.toContain('&');
      expect(filename).not.toContain('(');
      expect(filename).toContain('Acme');
    });

    it('should truncate long company names', () => {
      const longName = 'A'.repeat(100);
      const filename = service.generateFilename(longName, 'Q-001', 1);

      expect(filename.length).toBeLessThan(120);
    });
  });
});

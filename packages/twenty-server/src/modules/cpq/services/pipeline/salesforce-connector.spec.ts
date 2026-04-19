import {
  SalesforceConnector,
  normalizeOpportunity,
  normalizeContact,
  normalizeAccount,
  type SfdcOpportunity,
  type SfdcContact,
  type SfdcAccount,
  type SfClient,
} from './salesforce-connector';

const mockOpp: SfdcOpportunity = {
  Id: 'opp-1',
  Name: 'Acme Corp Deal',
  OwnerId: 'user-1',
  Owner: { Name: 'Alice Rep' },
  StageName: 'Negotiation/Review',
  Amount: 100000,
  Probability: 80,
  CloseDate: '2026-06-30',
  AccountId: 'acct-1',
  Account: { Name: 'Acme Corp' },
  CreatedDate: '2026-01-01T00:00:00.000Z',
  LastModifiedDate: '2026-04-01T00:00:00.000Z',
};

const mockContact: SfdcContact = {
  Id: 'con-1',
  FirstName: 'John',
  LastName: 'Smith',
  Email: 'john@acme.com',
  Phone: '555-0100',
  AccountId: 'acct-1',
  OwnerId: 'user-1',
  CreatedDate: '2026-01-01T00:00:00.000Z',
  LastModifiedDate: '2026-04-01T00:00:00.000Z',
};

const mockAccount: SfdcAccount = {
  Id: 'acct-1',
  Name: 'Acme Corp',
  Website: 'https://acme.com',
  Industry: 'Technology',
  NumberOfEmployees: 500,
  AnnualRevenue: 10000000,
  OwnerId: 'user-1',
  CreatedDate: '2026-01-01T00:00:00.000Z',
  LastModifiedDate: '2026-04-01T00:00:00.000Z',
};

describe('salesforce-connector', () => {
  describe('normalizeOpportunity', () => {
    it('should map SFDC fields to NormalizedDeal', () => {
      const deal = normalizeOpportunity(mockOpp);
      expect(deal.id).toBe('opp-1');
      expect(deal.name).toBe('Acme Corp Deal');
      expect(deal.ownerId).toBe('user-1');
      expect(deal.ownerName).toBe('Alice Rep');
      expect(deal.stage).toBe('Negotiation/Review');
      expect(deal.amount).toBe(100000);
      expect(deal.probability).toBe(80);
      expect(deal.closeDate).toBe('2026-06-30');
      expect(deal.accountId).toBe('acct-1');
      expect(deal.accountName).toBe('Acme Corp');
    });

    it('should fall back to stage probability map when Probability is null', () => {
      const opp: SfdcOpportunity = { ...mockOpp, Probability: null };
      const deal = normalizeOpportunity(opp);
      // Negotiation/Review maps to 80
      expect(deal.probability).toBe(80);
    });

    it('should use 50 as default probability for unknown stages', () => {
      const opp: SfdcOpportunity = { ...mockOpp, StageName: 'Custom Stage', Probability: null };
      const deal = normalizeOpportunity(opp);
      expect(deal.probability).toBe(50);
    });

    it('should fall back to ownerId for ownerName when Owner not provided', () => {
      const opp: SfdcOpportunity = { ...mockOpp, Owner: undefined };
      const deal = normalizeOpportunity(opp);
      expect(deal.ownerName).toBe('user-1');
    });

    it('should default amount to 0 when null', () => {
      const opp: SfdcOpportunity = { ...mockOpp, Amount: null };
      const deal = normalizeOpportunity(opp);
      expect(deal.amount).toBe(0);
    });
  });

  describe('normalizeContact', () => {
    it('should map SFDC contact fields', () => {
      const contact = normalizeContact(mockContact);
      expect(contact.id).toBe('con-1');
      expect(contact.firstName).toBe('John');
      expect(contact.lastName).toBe('Smith');
      expect(contact.email).toBe('john@acme.com');
      expect(contact.phone).toBe('555-0100');
      expect(contact.accountId).toBe('acct-1');
    });

    it('should default firstName to empty string when null', () => {
      const contact = normalizeContact({ ...mockContact, FirstName: null });
      expect(contact.firstName).toBe('');
    });

    it('should set phone to undefined when null', () => {
      const contact = normalizeContact({ ...mockContact, Phone: null });
      expect(contact.phone).toBeUndefined();
    });
  });

  describe('normalizeAccount', () => {
    it('should map SFDC account fields', () => {
      const account = normalizeAccount(mockAccount);
      expect(account.id).toBe('acct-1');
      expect(account.name).toBe('Acme Corp');
      expect(account.domain).toBe('https://acme.com');
      expect(account.industry).toBe('Technology');
      expect(account.employeeCount).toBe(500);
      expect(account.annualRevenue).toBe(10000000);
    });

    it('should set optional fields to undefined when null', () => {
      const account = normalizeAccount({ ...mockAccount, Website: null, Industry: null });
      expect(account.domain).toBeUndefined();
      expect(account.industry).toBeUndefined();
    });
  });

  describe('SalesforceConnector', () => {
    const makeClient = (records: unknown[]): SfClient => ({
      query: jest.fn().mockResolvedValue({ totalSize: records.length, done: true, records }),
    });

    it('should fetch and normalize deals', async () => {
      const client = makeClient([mockOpp]);
      const connector = new SalesforceConnector(client);
      const result = await connector.fetchDeals();
      expect(result.records).toHaveLength(1);
      expect(result.records[0].id).toBe('opp-1');
      expect(result.hasMore).toBe(false);
    });

    it('should fetch and normalize contacts', async () => {
      const client = makeClient([mockContact]);
      const connector = new SalesforceConnector(client);
      const result = await connector.fetchContacts();
      expect(result.records[0].id).toBe('con-1');
    });

    it('should fetch and normalize accounts', async () => {
      const client = makeClient([mockAccount]);
      const connector = new SalesforceConnector(client);
      const result = await connector.fetchAccounts();
      expect(result.records[0].id).toBe('acct-1');
    });

    it('should include LIMIT in SOQL query', async () => {
      const client = makeClient([]);
      const connector = new SalesforceConnector(client);
      await connector.fetchDeals({ limit: 50 });
      expect((client.query as jest.Mock).mock.calls[0][0]).toContain('LIMIT 50');
    });

    it('should include WHERE clause for updatedSince filter', async () => {
      const client = makeClient([]);
      const connector = new SalesforceConnector(client);
      await connector.fetchDeals({ updatedSince: '2026-04-01T00:00:00.000Z' });
      expect((client.query as jest.Mock).mock.calls[0][0]).toContain('WHERE');
      expect((client.query as jest.Mock).mock.calls[0][0]).toContain('LastModifiedDate');
    });

    it('should set hasMore=true when done=false', async () => {
      const client: SfClient = {
        query: jest.fn().mockResolvedValue({ totalSize: 100, done: false, records: [mockOpp] }),
      };
      const connector = new SalesforceConnector(client);
      const result = await connector.fetchDeals();
      expect(result.hasMore).toBe(true);
    });
  });
});

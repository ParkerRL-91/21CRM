import { describe, it, expect, vi } from 'vitest';
import {
  normalizeOpportunity,
  normalizeContact,
  normalizeAccount,
  SalesforceConnector,
  SfdcOpportunity,
  SfdcContact,
  SfdcAccount,
  SfClient,
  SfdcQueryResult,
} from './salesforce-connector';

// ============================================================================
// Fixtures
// ============================================================================

const opp: SfdcOpportunity = {
  Id: 'opp-001',
  Name: 'Acme Renewal 2026',
  OwnerId: 'user-1',
  Owner: { Name: 'Alice Smith' },
  StageName: 'Proposal/Price Quote',
  Amount: 120_000,
  Probability: 70,
  CloseDate: '2026-06-30',
  AccountId: 'acct-1',
  Account: { Name: 'Acme Corp' },
  CreatedDate: '2026-01-15T10:00:00Z',
  LastModifiedDate: '2026-04-01T09:00:00Z',
};

const contact: SfdcContact = {
  Id: 'con-001',
  FirstName: 'John',
  LastName: 'Doe',
  Email: 'john.doe@acme.com',
  Phone: '+1-555-0100',
  AccountId: 'acct-1',
  OwnerId: 'user-1',
  CreatedDate: '2026-01-15T10:00:00Z',
  LastModifiedDate: '2026-03-20T14:00:00Z',
};

const account: SfdcAccount = {
  Id: 'acct-1',
  Name: 'Acme Corp',
  Website: 'https://acme.com',
  Industry: 'Technology',
  NumberOfEmployees: 500,
  AnnualRevenue: 50_000_000,
  OwnerId: 'user-1',
  CreatedDate: '2025-06-01T00:00:00Z',
  LastModifiedDate: '2026-02-10T00:00:00Z',
};

// ============================================================================
// normalizeOpportunity
// ============================================================================

describe('normalizeOpportunity', () => {
  it('maps core fields correctly', () => {
    const deal = normalizeOpportunity(opp);
    expect(deal.id).toBe('opp-001');
    expect(deal.name).toBe('Acme Renewal 2026');
    expect(deal.ownerId).toBe('user-1');
    expect(deal.ownerName).toBe('Alice Smith');
    expect(deal.stage).toBe('Proposal/Price Quote');
    expect(deal.amount).toBe(120_000);
    expect(deal.probability).toBe(70);
    expect(deal.closeDate).toBe('2026-06-30');
    expect(deal.accountId).toBe('acct-1');
    expect(deal.accountName).toBe('Acme Corp');
  });

  it('defaults amount to 0 when null', () => {
    const deal = normalizeOpportunity({ ...opp, Amount: null });
    expect(deal.amount).toBe(0);
  });

  it('defaults ownerName to OwnerId when Owner relation missing', () => {
    const deal = normalizeOpportunity({ ...opp, Owner: undefined });
    expect(deal.ownerName).toBe('user-1');
  });

  it('defaults accountName to AccountId when Account relation missing', () => {
    const deal = normalizeOpportunity({ ...opp, Account: undefined });
    expect(deal.accountName).toBe('acct-1');
  });

  it('infers probability from stage when Probability is null', () => {
    const deal = normalizeOpportunity({ ...opp, Probability: null, StageName: 'Qualification' });
    expect(deal.probability).toBe(20);
  });

  it('defaults unknown stage probability to 50', () => {
    const deal = normalizeOpportunity({ ...opp, Probability: null, StageName: 'Custom Stage' });
    expect(deal.probability).toBe(50);
  });

  it('sets Closed Won probability to 100', () => {
    const deal = normalizeOpportunity({ ...opp, Probability: null, StageName: 'Closed Won' });
    expect(deal.probability).toBe(100);
  });
});

// ============================================================================
// normalizeContact
// ============================================================================

describe('normalizeContact', () => {
  it('maps core fields', () => {
    const c = normalizeContact(contact);
    expect(c.id).toBe('con-001');
    expect(c.firstName).toBe('John');
    expect(c.lastName).toBe('Doe');
    expect(c.email).toBe('john.doe@acme.com');
    expect(c.phone).toBe('+1-555-0100');
    expect(c.accountId).toBe('acct-1');
  });

  it('defaults firstName to empty string when null', () => {
    const c = normalizeContact({ ...contact, FirstName: null });
    expect(c.firstName).toBe('');
  });

  it('defaults email to empty string when null', () => {
    const c = normalizeContact({ ...contact, Email: null });
    expect(c.email).toBe('');
  });

  it('sets phone to undefined when null', () => {
    const c = normalizeContact({ ...contact, Phone: null });
    expect(c.phone).toBeUndefined();
  });
});

// ============================================================================
// normalizeAccount
// ============================================================================

describe('normalizeAccount', () => {
  it('maps core fields', () => {
    const a = normalizeAccount(account);
    expect(a.id).toBe('acct-1');
    expect(a.name).toBe('Acme Corp');
    expect(a.domain).toBe('https://acme.com');
    expect(a.industry).toBe('Technology');
    expect(a.employeeCount).toBe(500);
    expect(a.annualRevenue).toBe(50_000_000);
  });

  it('sets optional fields to undefined when null', () => {
    const a = normalizeAccount({ ...account, Website: null, Industry: null });
    expect(a.domain).toBeUndefined();
    expect(a.industry).toBeUndefined();
  });
});

// ============================================================================
// SalesforceConnector
// ============================================================================

function mockClient<T>(result: SfdcQueryResult<T>): SfClient {
  return { query: vi.fn().mockResolvedValue(result) };
}

describe('SalesforceConnector', () => {
  it('has name "salesforce"', () => {
    const connector = new SalesforceConnector(mockClient({ totalSize: 0, done: true, records: [] }));
    expect(connector.name).toBe('salesforce');
  });

  it('fetchDeals returns normalized deals', async () => {
    const client = mockClient<SfdcOpportunity>({ totalSize: 1, done: true, records: [opp] });
    const connector = new SalesforceConnector(client);
    const result = await connector.fetchDeals();
    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe('opp-001');
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('fetchContacts returns normalized contacts', async () => {
    const client = mockClient<SfdcContact>({ totalSize: 1, done: true, records: [contact] });
    const connector = new SalesforceConnector(client);
    const result = await connector.fetchContacts();
    expect(result.records[0].email).toBe('john.doe@acme.com');
  });

  it('fetchAccounts returns normalized accounts', async () => {
    const client = mockClient<SfdcAccount>({ totalSize: 1, done: true, records: [account] });
    const connector = new SalesforceConnector(client);
    const result = await connector.fetchAccounts();
    expect(result.records[0].name).toBe('Acme Corp');
  });

  it('passes updatedSince filter to SOQL', async () => {
    const client = mockClient<SfdcOpportunity>({ totalSize: 0, done: true, records: [] });
    const connector = new SalesforceConnector(client);
    await connector.fetchDeals({ updatedSince: '2026-04-01T00:00:00Z' });
    const querySoql: string = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(querySoql).toContain('LastModifiedDate >= 2026-04-01T00:00:00Z');
  });

  it('includes LIMIT in SOQL', async () => {
    const client = mockClient<SfdcOpportunity>({ totalSize: 0, done: true, records: [] });
    const connector = new SalesforceConnector(client);
    await connector.fetchDeals({ limit: 50 });
    const soql: string = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(soql).toContain('LIMIT 50');
  });

  it('hasMore is true when SFDC result is not done', async () => {
    const client = mockClient<SfdcOpportunity>({
      totalSize: 500,
      done: false,
      records: [opp],
      nextRecordsUrl: '/next',
    });
    const connector = new SalesforceConnector(client);
    const result = await connector.fetchDeals();
    expect(result.hasMore).toBe(true);
  });
});

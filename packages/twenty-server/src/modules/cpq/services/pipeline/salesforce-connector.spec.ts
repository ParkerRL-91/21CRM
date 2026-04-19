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

const baseOpp: SfdcOpportunity = {
  Id: 'opp-1',
  Name: 'Big Deal',
  OwnerId: 'user-1',
  Owner: { Name: 'Alice' },
  StageName: 'Qualification',
  Amount: 50000,
  Probability: 20,
  CloseDate: '2026-06-30',
  AccountId: 'acct-1',
  Account: { Name: 'Acme Corp' },
  CreatedDate: '2026-01-01T00:00:00Z',
  LastModifiedDate: '2026-03-01T00:00:00Z',
};

const baseContact: SfdcContact = {
  Id: 'con-1',
  FirstName: 'Jane',
  LastName: 'Doe',
  Email: 'jane@acme.com',
  Phone: '+1-555-0100',
  AccountId: 'acct-1',
  OwnerId: 'user-1',
  CreatedDate: '2026-01-01T00:00:00Z',
  LastModifiedDate: '2026-03-01T00:00:00Z',
};

const baseAccount: SfdcAccount = {
  Id: 'acct-1',
  Name: 'Acme Corp',
  Website: 'https://acme.com',
  Industry: 'Technology',
  NumberOfEmployees: 500,
  AnnualRevenue: 10000000,
  OwnerId: 'user-1',
  CreatedDate: '2026-01-01T00:00:00Z',
  LastModifiedDate: '2026-03-01T00:00:00Z',
};

describe('normalizeOpportunity', () => {
  it('should map SFDC fields to normalized deal', () => {
    const deal = normalizeOpportunity(baseOpp);
    expect(deal.id).toBe('opp-1');
    expect(deal.name).toBe('Big Deal');
    expect(deal.ownerId).toBe('user-1');
    expect(deal.ownerName).toBe('Alice');
    expect(deal.stage).toBe('Qualification');
    expect(deal.amount).toBe(50000);
    expect(deal.probability).toBe(20);
    expect(deal.closeDate).toBe('2026-06-30');
    expect(deal.accountId).toBe('acct-1');
    expect(deal.accountName).toBe('Acme Corp');
  });

  it('should fall back to stage probability when Probability is null', () => {
    const deal = normalizeOpportunity({ ...baseOpp, Probability: null });
    expect(deal.probability).toBe(20); // Qualification = 20 in STAGE_PROBABILITY map
  });

  it('should default amount to 0 when Amount is null', () => {
    const deal = normalizeOpportunity({ ...baseOpp, Amount: null });
    expect(deal.amount).toBe(0);
  });

  it('should fall back to OwnerId as ownerName when Owner is missing', () => {
    const deal = normalizeOpportunity({ ...baseOpp, Owner: undefined });
    expect(deal.ownerName).toBe('user-1');
  });

  it('should put extra fields into properties', () => {
    const deal = normalizeOpportunity({ ...baseOpp, CustomField__c: 'foo' });
    expect(deal.properties['CustomField__c']).toBe('foo');
  });
});

describe('normalizeContact', () => {
  it('should map SFDC contact fields', () => {
    const contact = normalizeContact(baseContact);
    expect(contact.id).toBe('con-1');
    expect(contact.firstName).toBe('Jane');
    expect(contact.lastName).toBe('Doe');
    expect(contact.email).toBe('jane@acme.com');
    expect(contact.phone).toBe('+1-555-0100');
    expect(contact.accountId).toBe('acct-1');
    expect(contact.ownerId).toBe('user-1');
  });

  it('should default firstName to empty string when null', () => {
    const contact = normalizeContact({ ...baseContact, FirstName: null });
    expect(contact.firstName).toBe('');
  });

  it('should default email to empty string when null', () => {
    const contact = normalizeContact({ ...baseContact, Email: null });
    expect(contact.email).toBe('');
  });
});

describe('normalizeAccount', () => {
  it('should map SFDC account fields', () => {
    const account = normalizeAccount(baseAccount);
    expect(account.id).toBe('acct-1');
    expect(account.name).toBe('Acme Corp');
    expect(account.domain).toBe('https://acme.com');
    expect(account.industry).toBe('Technology');
    expect(account.employeeCount).toBe(500);
    expect(account.annualRevenue).toBe(10000000);
    expect(account.ownerId).toBe('user-1');
  });

  it('should set domain to undefined when Website is null', () => {
    const account = normalizeAccount({ ...baseAccount, Website: null });
    expect(account.domain).toBeUndefined();
  });
});

describe('SalesforceConnector', () => {
  const makeClient = <T>(records: T[], totalSize = records.length): SfClient => ({
    query: jest.fn().mockResolvedValue({
      totalSize,
      done: true,
      records,
    } as SfdcQueryResult<T>),
  });

  it('should fetch and normalize deals', async () => {
    const client = makeClient<SfdcOpportunity>([baseOpp]);
    const connector = new SalesforceConnector(client);
    const result = await connector.fetchDeals();
    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe('opp-1');
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('should fetch and normalize contacts', async () => {
    const client = makeClient<SfdcContact>([baseContact]);
    const connector = new SalesforceConnector(client);
    const result = await connector.fetchContacts();
    expect(result.records[0].id).toBe('con-1');
  });

  it('should fetch and normalize accounts', async () => {
    const client = makeClient<SfdcAccount>([baseAccount]);
    const connector = new SalesforceConnector(client);
    const result = await connector.fetchAccounts();
    expect(result.records[0].id).toBe('acct-1');
  });

  it('should set hasMore = true when done is false', async () => {
    const client: SfClient = {
      query: jest.fn().mockResolvedValue({
        totalSize: 2,
        done: false,
        records: [baseOpp],
        nextRecordsUrl: '/next',
      } as SfdcQueryResult<SfdcOpportunity>),
    };
    const connector = new SalesforceConnector(client);
    const result = await connector.fetchDeals();
    expect(result.hasMore).toBe(true);
  });

  it('should include updatedSince in WHERE clause when provided', async () => {
    const client = makeClient<SfdcOpportunity>([]);
    const connector = new SalesforceConnector(client);
    await connector.fetchDeals({ updatedSince: '2026-01-01T00:00:00Z' });
    const soql = (client.query as jest.Mock).mock.calls[0][0] as string;
    expect(soql).toContain('WHERE');
    expect(soql).toContain('LastModifiedDate >= 2026-01-01T00:00:00Z');
  });
});

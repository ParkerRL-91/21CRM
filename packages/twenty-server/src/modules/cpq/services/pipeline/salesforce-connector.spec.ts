import {
  SalesforceConnector,
  normalizeOpportunity,
  normalizeContact,
  normalizeAccount,
  SfdcOpportunity,
  SfdcContact,
  SfdcAccount,
  SfdcQueryResult,
  SfClient,
} from './salesforce-connector';

// ============================================================================
// Fixture factories
// ============================================================================

function makeSfdcOpportunity(overrides: Partial<SfdcOpportunity> = {}): SfdcOpportunity {
  return {
    Id: 'opp1',
    Name: 'Acme Deal',
    OwnerId: 'user1',
    Owner: { Name: 'Alice' },
    StageName: 'Qualification',
    Amount: 50000,
    Probability: 20,
    CloseDate: '2026-06-30',
    AccountId: 'acct1',
    Account: { Name: 'Acme Corp' },
    CreatedDate: '2026-01-01T00:00:00Z',
    LastModifiedDate: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

function makeSfdcContact(overrides: Partial<SfdcContact> = {}): SfdcContact {
  return {
    Id: 'con1',
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'john@acme.com',
    Phone: '+1-555-0100',
    AccountId: 'acct1',
    OwnerId: 'user1',
    CreatedDate: '2026-01-01T00:00:00Z',
    LastModifiedDate: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

function makeSfdcAccount(overrides: Partial<SfdcAccount> = {}): SfdcAccount {
  return {
    Id: 'acct1',
    Name: 'Acme Corp',
    Website: 'https://acme.com',
    Industry: 'Technology',
    NumberOfEmployees: 500,
    AnnualRevenue: 10000000,
    OwnerId: 'user1',
    CreatedDate: '2026-01-01T00:00:00Z',
    LastModifiedDate: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

function makeQueryResult<T>(records: T[], done = true): SfdcQueryResult<T> {
  return { totalSize: records.length, done, records };
}

// ============================================================================
// normalizeOpportunity
// ============================================================================

describe('normalizeOpportunity', () => {
  it('maps SFDC fields to NormalizedDeal shape', () => {
    const opp = makeSfdcOpportunity();
    const deal = normalizeOpportunity(opp);

    expect(deal.id).toBe('opp1');
    expect(deal.name).toBe('Acme Deal');
    expect(deal.ownerId).toBe('user1');
    expect(deal.ownerName).toBe('Alice');
    expect(deal.stage).toBe('Qualification');
    expect(deal.amount).toBe(50000);
    expect(deal.probability).toBe(20);
    expect(deal.closeDate).toBe('2026-06-30');
    expect(deal.accountId).toBe('acct1');
    expect(deal.accountName).toBe('Acme Corp');
    expect(deal.createdAt).toBe('2026-01-01T00:00:00Z');
    expect(deal.updatedAt).toBe('2026-04-01T00:00:00Z');
  });

  it('defaults amount to 0 when null', () => {
    const opp = makeSfdcOpportunity({ Amount: null });
    expect(normalizeOpportunity(opp).amount).toBe(0);
  });

  it('defaults amount to 0 when undefined', () => {
    const opp = makeSfdcOpportunity({ Amount: undefined });
    expect(normalizeOpportunity(opp).amount).toBe(0);
  });

  it('falls back to stage-based probability when Probability is null', () => {
    // Qualification → 20 per STAGE_PROBABILITY map
    const opp = makeSfdcOpportunity({ Probability: null });
    const deal = normalizeOpportunity(opp);
    expect(deal.probability).toBe(20);
  });

  it('falls back to 50 for unknown stage when Probability is null', () => {
    const opp = makeSfdcOpportunity({ StageName: 'Custom Stage', Probability: null });
    const deal = normalizeOpportunity(opp);
    expect(deal.probability).toBe(50);
  });

  it('falls back ownerName to OwnerId when Owner is absent', () => {
    const opp = makeSfdcOpportunity({ Owner: undefined });
    const deal = normalizeOpportunity(opp);
    expect(deal.ownerName).toBe('user1');
  });

  it('falls back accountName to AccountId when Account is absent', () => {
    const opp = makeSfdcOpportunity({ Account: undefined });
    const deal = normalizeOpportunity(opp);
    expect(deal.accountName).toBe('acct1');
  });

  it('places extra scalar fields in properties', () => {
    const opp = { ...makeSfdcOpportunity(), CustomField__c: 'custom-value' };
    const deal = normalizeOpportunity(opp);
    expect(deal.properties['CustomField__c']).toBe('custom-value');
  });

  it('excludes non-scalar extra fields from properties', () => {
    const opp = { ...makeSfdcOpportunity(), NestedObj: { deep: true } };
    const deal = normalizeOpportunity(opp);
    expect(deal.properties['NestedObj']).toBeUndefined();
  });
});

// ============================================================================
// normalizeContact
// ============================================================================

describe('normalizeContact', () => {
  it('maps SFDC contact fields to NormalizedContact shape', () => {
    const contact = makeSfdcContact();
    const normalized = normalizeContact(contact);

    expect(normalized.id).toBe('con1');
    expect(normalized.firstName).toBe('John');
    expect(normalized.lastName).toBe('Doe');
    expect(normalized.email).toBe('john@acme.com');
    expect(normalized.phone).toBe('+1-555-0100');
    expect(normalized.accountId).toBe('acct1');
    expect(normalized.ownerId).toBe('user1');
    expect(normalized.createdAt).toBe('2026-01-01T00:00:00Z');
    expect(normalized.updatedAt).toBe('2026-04-01T00:00:00Z');
  });

  it('defaults firstName to empty string when null', () => {
    const contact = makeSfdcContact({ FirstName: null });
    expect(normalizeContact(contact).firstName).toBe('');
  });

  it('defaults email to empty string when null', () => {
    const contact = makeSfdcContact({ Email: null });
    expect(normalizeContact(contact).email).toBe('');
  });

  it('sets phone to undefined when null', () => {
    const contact = makeSfdcContact({ Phone: null });
    expect(normalizeContact(contact).phone).toBeUndefined();
  });

  it('sets accountId to undefined when null', () => {
    const contact = makeSfdcContact({ AccountId: null });
    expect(normalizeContact(contact).accountId).toBeUndefined();
  });
});

// ============================================================================
// normalizeAccount
// ============================================================================

describe('normalizeAccount', () => {
  it('maps SFDC account fields to NormalizedAccount shape', () => {
    const account = makeSfdcAccount();
    const normalized = normalizeAccount(account);

    expect(normalized.id).toBe('acct1');
    expect(normalized.name).toBe('Acme Corp');
    expect(normalized.domain).toBe('https://acme.com');
    expect(normalized.industry).toBe('Technology');
    expect(normalized.employeeCount).toBe(500);
    expect(normalized.annualRevenue).toBe(10000000);
    expect(normalized.ownerId).toBe('user1');
  });

  it('sets domain to undefined when Website is null', () => {
    const account = makeSfdcAccount({ Website: null });
    expect(normalizeAccount(account).domain).toBeUndefined();
  });

  it('sets employeeCount to undefined when null', () => {
    const account = makeSfdcAccount({ NumberOfEmployees: null });
    expect(normalizeAccount(account).employeeCount).toBeUndefined();
  });

  it('sets annualRevenue to undefined when null', () => {
    const account = makeSfdcAccount({ AnnualRevenue: null });
    expect(normalizeAccount(account).annualRevenue).toBeUndefined();
  });
});

// ============================================================================
// SalesforceConnector (with mock SfClient)
// ============================================================================

describe('SalesforceConnector', () => {
  function makeMockClient(overrides: Partial<SfClient> = {}): SfClient {
    return {
      query: jest.fn().mockResolvedValue(makeQueryResult([])),
      ...overrides,
    };
  }

  describe('fetchDeals', () => {
    it('returns normalized deals from query result', async () => {
      const opp = makeSfdcOpportunity();
      const client = makeMockClient({
        query: jest.fn().mockResolvedValue(makeQueryResult([opp])),
      });
      const connector = new SalesforceConnector(client);

      const result = await connector.fetchDeals();

      expect(result.records).toHaveLength(1);
      expect(result.records[0].id).toBe('opp1');
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('sets hasMore: true when done is false', async () => {
      const client = makeMockClient({
        query: jest.fn().mockResolvedValue(makeQueryResult([makeSfdcOpportunity()], false)),
      });
      const connector = new SalesforceConnector(client);

      const result = await connector.fetchDeals();

      expect(result.hasMore).toBe(true);
    });

    it('includes updatedSince in WHERE clause when provided', async () => {
      const client = makeMockClient();
      const connector = new SalesforceConnector(client);

      await connector.fetchDeals({ updatedSince: '2026-04-01T00:00:00Z' });

      const soql: string = (client.query as jest.Mock).mock.calls[0][0];
      expect(soql).toContain('WHERE');
      expect(soql).toContain('LastModifiedDate >= 2026-04-01T00:00:00Z');
    });

    it('does not include WHERE clause when no updatedSince provided', async () => {
      const client = makeMockClient();
      const connector = new SalesforceConnector(client);

      await connector.fetchDeals();

      const soql: string = (client.query as jest.Mock).mock.calls[0][0];
      expect(soql).not.toContain('WHERE');
    });

    it('applies default LIMIT of 200', async () => {
      const client = makeMockClient();
      const connector = new SalesforceConnector(client);

      await connector.fetchDeals();

      const soql: string = (client.query as jest.Mock).mock.calls[0][0];
      expect(soql).toContain('LIMIT 200');
    });

    it('applies custom limit when provided', async () => {
      const client = makeMockClient();
      const connector = new SalesforceConnector(client);

      await connector.fetchDeals({ limit: 50 });

      const soql: string = (client.query as jest.Mock).mock.calls[0][0];
      expect(soql).toContain('LIMIT 50');
    });

    it('includes OFFSET when offset > 0', async () => {
      const client = makeMockClient();
      const connector = new SalesforceConnector(client);

      await connector.fetchDeals({ offset: 100 });

      const soql: string = (client.query as jest.Mock).mock.calls[0][0];
      expect(soql).toContain('OFFSET 100');
    });
  });

  describe('fetchContacts', () => {
    it('returns normalized contacts from query result', async () => {
      const contact = makeSfdcContact();
      const client = makeMockClient({
        query: jest.fn().mockResolvedValue(makeQueryResult([contact])),
      });
      const connector = new SalesforceConnector(client);

      const result = await connector.fetchContacts();

      expect(result.records).toHaveLength(1);
      expect(result.records[0].id).toBe('con1');
      expect(result.total).toBe(1);
    });

    it('includes updatedSince in WHERE clause for contacts', async () => {
      const client = makeMockClient();
      const connector = new SalesforceConnector(client);

      await connector.fetchContacts({ updatedSince: '2026-04-01T00:00:00Z' });

      const soql: string = (client.query as jest.Mock).mock.calls[0][0];
      expect(soql).toContain('LastModifiedDate >= 2026-04-01T00:00:00Z');
    });
  });

  describe('fetchAccounts', () => {
    it('returns normalized accounts from query result', async () => {
      const account = makeSfdcAccount();
      const client = makeMockClient({
        query: jest.fn().mockResolvedValue(makeQueryResult([account])),
      });
      const connector = new SalesforceConnector(client);

      const result = await connector.fetchAccounts();

      expect(result.records).toHaveLength(1);
      expect(result.records[0].id).toBe('acct1');
      expect(result.total).toBe(1);
    });

    it('includes updatedSince in WHERE clause for accounts', async () => {
      const client = makeMockClient();
      const connector = new SalesforceConnector(client);

      await connector.fetchAccounts({ updatedSince: '2026-03-01T00:00:00Z' });

      const soql: string = (client.query as jest.Mock).mock.calls[0][0];
      expect(soql).toContain('WHERE');
      expect(soql).toContain('LastModifiedDate >= 2026-03-01T00:00:00Z');
    });
  });

  it('exposes name as "salesforce"', () => {
    const connector = new SalesforceConnector(makeMockClient());
    expect(connector.name).toBe('salesforce');
  });
});

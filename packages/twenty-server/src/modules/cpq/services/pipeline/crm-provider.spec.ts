import {
  CrmProvider,
  NormalizedDeal,
  NormalizedContact,
  NormalizedAccount,
  FetchOptions,
  FetchResult,
} from './crm-provider';

// Verify the CrmProvider contract is implementable and types are correct
// by building a minimal in-memory mock that satisfies the interface.

const makeDeal = (): NormalizedDeal => ({
  id: 'deal-1',
  name: 'Test Deal',
  ownerId: 'user-1',
  ownerName: 'Alice',
  stage: 'Qualification',
  amount: 50000,
  probability: 20,
  closeDate: '2026-06-30',
  accountId: 'acct-1',
  accountName: 'Acme',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  properties: {},
});

const makeContact = (): NormalizedContact => ({
  id: 'con-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@acme.com',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  properties: {},
});

const makeAccount = (): NormalizedAccount => ({
  id: 'acct-1',
  name: 'Acme Corp',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  properties: {},
});

class MockCrmProvider implements CrmProvider {
  readonly name = 'mock';

  async fetchDeals(options?: FetchOptions): Promise<FetchResult<NormalizedDeal>> {
    const limit = options?.limit ?? 200;
    return { records: [makeDeal()], total: 1, hasMore: false };
  }

  async fetchContacts(options?: FetchOptions): Promise<FetchResult<NormalizedContact>> {
    return { records: [makeContact()], total: 1, hasMore: false };
  }

  async fetchAccounts(options?: FetchOptions): Promise<FetchResult<NormalizedAccount>> {
    return { records: [makeAccount()], total: 1, hasMore: false };
  }
}

describe('CrmProvider interface', () => {
  let provider: CrmProvider;

  beforeEach(() => {
    provider = new MockCrmProvider();
  });

  it('should expose a name property', () => {
    expect(provider.name).toBe('mock');
  });

  it('should return normalized deals from fetchDeals', async () => {
    const result = await provider.fetchDeals();
    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe('deal-1');
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('should return normalized contacts from fetchContacts', async () => {
    const result = await provider.fetchContacts();
    expect(result.records[0].id).toBe('con-1');
    expect(result.records[0].email).toBe('jane@acme.com');
  });

  it('should return normalized accounts from fetchAccounts', async () => {
    const result = await provider.fetchAccounts();
    expect(result.records[0].id).toBe('acct-1');
    expect(result.records[0].name).toBe('Acme Corp');
  });

  it('should support FetchOptions with updatedSince and limit', async () => {
    const options: FetchOptions = { updatedSince: '2026-01-01T00:00:00Z', limit: 10, offset: 0 };
    await expect(provider.fetchDeals(options)).resolves.not.toThrow();
  });
});

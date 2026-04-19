// CRM provider abstraction.
// Normalizes deal/contact/account data from any CRM into 21CRM's internal model.

export type NormalizedDeal = {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  stage: string;
  amount: number;
  probability: number;  // 0-100
  closeDate: string;    // ISO date
  accountId: string;
  accountName: string;
  createdAt: string;    // ISO datetime
  updatedAt: string;    // ISO datetime
  properties: Record<string, string | number | boolean | null>;
};

export type NormalizedContact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  accountId?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  properties: Record<string, string | number | boolean | null>;
};

export type NormalizedAccount = {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  employeeCount?: number;
  annualRevenue?: number;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  properties: Record<string, string | number | boolean | null>;
};

export type FetchOptions = {
  updatedSince?: string; // ISO datetime — for incremental sync
  limit?: number;
  offset?: number;
};

export type FetchResult<T> = {
  records: T[];
  total: number;
  hasMore: boolean;
};

// CrmProvider type — implement this to add a new CRM integration.
export type CrmProvider = {
  readonly name: string;

  fetchDeals(options?: FetchOptions): Promise<FetchResult<NormalizedDeal>>;
  fetchContacts(options?: FetchOptions): Promise<FetchResult<NormalizedContact>>;
  fetchAccounts(options?: FetchOptions): Promise<FetchResult<NormalizedAccount>>;
};

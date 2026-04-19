/**
 * Salesforce CRM provider implementation.
 * Maps SFDC Opportunity/Contact/Account objects to the NormalizedDeal model.
 *
 * NOTE: This module implements the mapping and normalization logic.
 * The actual HTTP transport (SFDC REST API calls) is injected via SfClient
 * to keep the connector testable without live Salesforce credentials.
 */

import {
  CrmProvider,
  FetchOptions,
  FetchResult,
  NormalizedDeal,
  NormalizedContact,
  NormalizedAccount,
} from './crm-provider';

// ============================================================================
// SFDC raw types (subset of Opportunity/Contact/Account fields)
// ============================================================================

export type SfdcOpportunity = {
  Id: string;
  Name: string;
  OwnerId: string;
  Owner?: { Name: string };
  StageName: string;
  Amount?: number | null;
  Probability?: number | null;
  CloseDate: string;
  AccountId: string;
  Account?: { Name: string };
  CreatedDate: string;
  LastModifiedDate: string;
  [key: string]: unknown;
};

export type SfdcContact = {
  Id: string;
  FirstName?: string | null;
  LastName: string;
  Email?: string | null;
  Phone?: string | null;
  AccountId?: string | null;
  OwnerId?: string | null;
  CreatedDate: string;
  LastModifiedDate: string;
  [key: string]: unknown;
};

export type SfdcAccount = {
  Id: string;
  Name: string;
  Website?: string | null;
  Industry?: string | null;
  NumberOfEmployees?: number | null;
  AnnualRevenue?: number | null;
  OwnerId?: string | null;
  CreatedDate: string;
  LastModifiedDate: string;
  [key: string]: unknown;
};

export type SfdcQueryResult<T> = {
  totalSize: number;
  done: boolean;
  records: T[];
  nextRecordsUrl?: string;
};

/** Minimal Salesforce HTTP client interface */
export type SfClient = {
  query<T>(soql: string): Promise<SfdcQueryResult<T>>;
};

// ============================================================================
// Normalizers
// ============================================================================

/** Map SFDC StageName to a probability (0-100) if not explicitly set. */
const STAGE_PROBABILITY: Record<string, number> = {
  Prospecting: 10,
  Qualification: 20,
  'Needs Analysis': 30,
  'Value Proposition': 40,
  'Id. Decision Makers': 50,
  'Perception Analysis': 60,
  'Proposal/Price Quote': 70,
  'Negotiation/Review': 80,
  'Closed Won': 100,
  'Closed Lost': 0,
};

export function normalizeOpportunity(opp: SfdcOpportunity): NormalizedDeal {
  const probability =
    opp.Probability != null
      ? Number(opp.Probability)
      : (STAGE_PROBABILITY[opp.StageName] ?? 50);

  // Extract domain-specific known fields; rest go to properties
  const { Id, Name, OwnerId, Owner, StageName, Amount, Probability, CloseDate,
    AccountId, Account, CreatedDate, LastModifiedDate, ...rest } = opp;

  const properties: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
      properties[k] = v;
    }
  }

  return {
    id: Id,
    name: Name,
    ownerId: OwnerId,
    ownerName: Owner?.Name ?? OwnerId,
    stage: StageName,
    amount: Amount ?? 0,
    probability,
    closeDate: CloseDate,
    accountId: AccountId,
    accountName: Account?.Name ?? AccountId,
    createdAt: CreatedDate,
    updatedAt: LastModifiedDate,
    properties,
  };
}

export function normalizeContact(contact: SfdcContact): NormalizedContact {
  const { Id, FirstName, LastName, Email, Phone, AccountId, OwnerId,
    CreatedDate, LastModifiedDate, ...rest } = contact;

  const properties: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
      properties[k] = v;
    }
  }

  return {
    id: Id,
    firstName: FirstName ?? '',
    lastName: LastName,
    email: Email ?? '',
    phone: Phone ?? undefined,
    accountId: AccountId ?? undefined,
    ownerId: OwnerId ?? undefined,
    createdAt: CreatedDate,
    updatedAt: LastModifiedDate,
    properties,
  };
}

export function normalizeAccount(account: SfdcAccount): NormalizedAccount {
  const { Id, Name, Website, Industry, NumberOfEmployees, AnnualRevenue, OwnerId,
    CreatedDate, LastModifiedDate, ...rest } = account;

  const properties: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
      properties[k] = v;
    }
  }

  return {
    id: Id,
    name: Name,
    domain: Website ?? undefined,
    industry: Industry ?? undefined,
    employeeCount: NumberOfEmployees ?? undefined,
    annualRevenue: AnnualRevenue ?? undefined,
    ownerId: OwnerId ?? undefined,
    createdAt: CreatedDate,
    updatedAt: LastModifiedDate,
    properties,
  };
}

// ============================================================================
// SalesforceConnector
// ============================================================================

function buildWhereClause(options?: FetchOptions): string {
  const clauses: string[] = [];
  if (options?.updatedSince) {
    clauses.push(`LastModifiedDate >= ${options.updatedSince}`);
  }
  return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

function buildLimitOffset(options?: FetchOptions): string {
  const limit = options?.limit ?? 200;
  const offset = options?.offset ?? 0;
  return offset > 0 ? `LIMIT ${limit} OFFSET ${offset}` : `LIMIT ${limit}`;
}

export class SalesforceConnector implements CrmProvider {
  readonly name = 'salesforce';

  constructor(private readonly client: SfClient) {}

  async fetchDeals(options?: FetchOptions): Promise<FetchResult<NormalizedDeal>> {
    const where = buildWhereClause(options);
    const limitOffset = buildLimitOffset(options);
    const soql = `SELECT Id, Name, OwnerId, Owner.Name, StageName, Amount, Probability, CloseDate, AccountId, Account.Name, CreatedDate, LastModifiedDate FROM Opportunity ${where} ORDER BY LastModifiedDate DESC ${limitOffset}`;

    const result = await this.client.query<SfdcOpportunity>(soql);
    return {
      records: result.records.map(normalizeOpportunity),
      total: result.totalSize,
      hasMore: !result.done,
    };
  }

  async fetchContacts(options?: FetchOptions): Promise<FetchResult<NormalizedContact>> {
    const where = buildWhereClause(options);
    const limitOffset = buildLimitOffset(options);
    const soql = `SELECT Id, FirstName, LastName, Email, Phone, AccountId, OwnerId, CreatedDate, LastModifiedDate FROM Contact ${where} ORDER BY LastModifiedDate DESC ${limitOffset}`;

    const result = await this.client.query<SfdcContact>(soql);
    return {
      records: result.records.map(normalizeContact),
      total: result.totalSize,
      hasMore: !result.done,
    };
  }

  async fetchAccounts(options?: FetchOptions): Promise<FetchResult<NormalizedAccount>> {
    const where = buildWhereClause(options);
    const limitOffset = buildLimitOffset(options);
    const soql = `SELECT Id, Name, Website, Industry, NumberOfEmployees, AnnualRevenue, OwnerId, CreatedDate, LastModifiedDate FROM Account ${where} ORDER BY LastModifiedDate DESC ${limitOffset}`;

    const result = await this.client.query<SfdcAccount>(soql);
    return {
      records: result.records.map(normalizeAccount),
      total: result.totalSize,
      hasMore: !result.done,
    };
  }
}

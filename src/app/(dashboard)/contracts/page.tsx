'use client';

import { useState } from 'react';

type ContractStatus = 'active' | 'expired' | 'cancelled' | 'pending_renewal' | 'renewed' | 'draft' | 'amended';

interface Contract {
  id: string;
  contractNumber: string;
  contractName: string;
  accountName: string;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  totalValue: number;
  ownerName: string;
  renewalStatus: string | null;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
  pending_renewal: 'bg-yellow-100 text-yellow-800',
  renewed: 'bg-blue-100 text-blue-800',
  draft: 'bg-gray-100 text-gray-500',
  amended: 'bg-purple-100 text-purple-800',
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function ExpirationBadge({ days, status }: { days: number; status: string }) {
  if (status === 'expired' || status === 'cancelled') {
    return <span className="text-gray-400" title="Contract ended">— Ended</span>;
  }
  const icon = days <= 30 ? '!!' : days <= 60 ? '!' : days <= 90 ? '△' : '✓';
  const color = days <= 30 ? 'text-red-600' : days <= 60 ? 'text-amber-500' : days <= 90 ? 'text-yellow-500' : 'text-green-600';
  return (
    <span className={color} title={`Expires in ${days} days`} aria-label={`Expires in ${days} days`}>
      {icon} {days}d
    </span>
  );
}

export default function ContractsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const contracts: Contract[] = []; // TODO: Fetch from /api/contracts

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contracts</h1>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          + New Contract
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <select
          className="rounded border px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending_renewal">Pending Renewal</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="text"
          placeholder="Search contracts..."
          className="rounded border px-3 py-2 text-sm flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search contracts"
        />
      </div>

      {contracts.length === 0 ? (
        <div className="rounded border-2 border-dashed p-12 text-center text-gray-400">
          <p className="text-lg">No contracts found</p>
          <p className="mt-2 text-sm">Create your first contract to get started.</p>
        </div>
      ) : (
        <table className="w-full text-left text-sm" role="table">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-3 px-2">Contract</th>
              <th className="py-3 px-2">Account</th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 px-2">Start</th>
              <th className="py-3 px-2">End</th>
              <th className="py-3 px-2">Value</th>
              <th className="py-3 px-2">Expiration</th>
              <th className="py-3 px-2">Owner</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50 cursor-pointer">
                <td className="py-3 px-2 font-medium">{c.contractName}</td>
                <td className="py-3 px-2">{c.accountName}</td>
                <td className="py-3 px-2">
                  <span className={`rounded-full px-2 py-1 text-xs ${statusColors[c.status] ?? ''}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-2">{c.startDate}</td>
                <td className="py-3 px-2">{c.endDate}</td>
                <td className="py-3 px-2">${c.totalValue.toLocaleString()}</td>
                <td className="py-3 px-2">
                  <ExpirationBadge days={daysUntil(c.endDate)} status={c.status} />
                </td>
                <td className="py-3 px-2">{c.ownerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

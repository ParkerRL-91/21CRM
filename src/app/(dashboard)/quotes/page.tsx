'use client';

import { useState } from 'react';
import { getStatusLabel, getStatusColor } from '@/lib/cpq/quote-status';

export default function QuotesPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          + New Quote
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <select className="rounded border px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type">
          <option value="all">All Types</option>
          <option value="new">New Business</option>
          <option value="amendment">Amendment</option>
          <option value="renewal">Renewal</option>
        </select>
        <select className="rounded border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="presented">Presented</option>
          <option value="accepted">Accepted</option>
        </select>
      </div>

      <div className="rounded border-2 border-dashed p-12 text-center text-gray-400">
        <p className="text-lg">No quotes found</p>
        <p className="mt-2 text-sm">Create your first quote to start building proposals.</p>
      </div>
    </div>
  );
}

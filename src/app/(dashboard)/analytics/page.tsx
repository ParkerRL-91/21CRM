'use client';

import Link from 'next/link';

const reports = [
  { href: '/analytics/quotes', title: 'Quote Activity', description: 'Quotes created, sent, accepted, rejected by period and rep', icon: '📊' },
  { href: '/analytics/discounts', title: 'Discount Analysis', description: 'Average discount by product, rep, and segment', icon: '💰' },
  { href: '/analytics/renewal-forecast', title: 'Renewal Forecast', description: 'Upcoming renewals, values, and likelihood', icon: '🔄' },
  { href: '/analytics/arr-waterfall', title: 'ARR Waterfall', description: 'Beginning + New + Expansion - Contraction - Churn = Ending', icon: '📈' },
];

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Analytics</h1>
      <div className="grid grid-cols-2 gap-4">
        {reports.map((r) => (
          <Link key={r.href} href={r.href} className="rounded border p-6 hover:border-blue-300 hover:bg-blue-50 transition">
            <div className="text-2xl mb-2">{r.icon}</div>
            <h2 className="text-lg font-semibold">{r.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

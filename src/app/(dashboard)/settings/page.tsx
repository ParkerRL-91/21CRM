'use client';

import Link from 'next/link';

const settingsSections = [
  { href: '/settings/products', title: 'Products', description: 'Manage product catalog' },
  { href: '/settings/price-books', title: 'Price Books', description: 'Manage pricing for different segments' },
  { href: '/settings/renewals', title: 'Renewal Automation', description: 'Configure renewal timing, pricing, and notifications' },
  { href: '/settings/quote-templates', title: 'Quote Templates', description: 'Customize PDF quote templates' },
  { href: '/settings/approval-rules', title: 'Approval Rules', description: 'Configure discount approval thresholds' },
];

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="space-y-2">
        {settingsSections.map((s) => (
          <Link key={s.href} href={s.href} className="block rounded border p-4 hover:bg-gray-50">
            <h2 className="font-medium">{s.title}</h2>
            <p className="text-sm text-gray-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

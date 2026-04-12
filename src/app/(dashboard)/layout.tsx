'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/quotes', label: 'Quotes' },
  { href: '/contracts', label: 'Contracts' },
  { href: '/renewals', label: 'Renewals' },
  { href: '/subscriptions', label: 'Subscriptions' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      <nav className="w-56 border-r bg-gray-50 p-4">
        <div className="mb-6 text-xl font-bold">21CRM</div>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded px-3 py-2 text-sm ${
                  pathname?.startsWith(item.href)
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

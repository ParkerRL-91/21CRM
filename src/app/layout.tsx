import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '21CRM — RevOps Platform',
  description: 'Self-hosted RevOps platform with CPQ, pipeline analytics, and revenue recognition',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

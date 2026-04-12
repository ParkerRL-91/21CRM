'use client';

export default function SubscriptionsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Subscriptions</h1>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <MetricCard label="Active Subscriptions" value="0" />
        <MetricCard label="Total ARR" value="$0" />
        <MetricCard label="Total MRR" value="$0" />
        <MetricCard label="Net Revenue Retention" value="—%" />
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Expiring Subscriptions</h2>
        <div className="mt-2 flex gap-4">
          <ExpirationBucket label="30 days" count={0} color="red" />
          <ExpirationBucket label="60 days" count={0} color="amber" />
          <ExpirationBucket label="90 days" count={0} color="yellow" />
        </div>
      </div>

      <div className="rounded border-2 border-dashed p-12 text-center text-gray-400">
        <p>Subscription data will populate from contract subscriptions.</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function ExpirationBucket({ label, count, color }: { label: string; count: number; color: string }) {
  const bgColors: Record<string, string> = { red: 'bg-red-50', amber: 'bg-amber-50', yellow: 'bg-yellow-50' };
  return (
    <div className={`rounded border p-3 ${bgColors[color] ?? ''}`}>
      <div className="text-sm text-gray-500">Within {label}</div>
      <div className="text-xl font-bold">{count}</div>
    </div>
  );
}

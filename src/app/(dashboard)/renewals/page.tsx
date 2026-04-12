'use client';

import { useState } from 'react';

type ViewMode = 'report' | 'kanban';

export default function RenewalsPage() {
  const [view, setView] = useState<ViewMode>('report');
  const [period, setPeriod] = useState('Q2-2026');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Renewal Pipeline</h1>
        <div className="flex gap-2">
          <select className="rounded border px-3 py-2 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Select period">
            <option value="Q1-2026">Q1 2026</option>
            <option value="Q2-2026">Q2 2026</option>
            <option value="Q3-2026">Q3 2026</option>
            <option value="Q4-2026">Q4 2026</option>
          </select>
          <div className="flex rounded border">
            <button className={`px-3 py-2 text-sm ${view === 'report' ? 'bg-blue-100 text-blue-700' : ''}`} onClick={() => setView('report')}>Report</button>
            <button className={`px-3 py-2 text-sm ${view === 'kanban' ? 'bg-blue-100 text-blue-700' : ''}`} onClick={() => setView('kanban')}>Kanban</button>
          </div>
          <button className="rounded border px-3 py-2 text-sm hover:bg-gray-50">Export CSV</button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <MetricCard label="Renewable" value="$0" sublabel="0 contracts" />
        <MetricCard label="Renewal Rate" value="0%" sublabel="— vs prior" />
        <MetricCard label="At-Risk" value="0" sublabel="$0 value" />
        <MetricCard label="Churned" value="0" sublabel="$0 value" />
      </div>

      {/* NRR bar */}
      <div className="mb-6 rounded border p-4">
        <div className="text-sm font-medium text-gray-500">Net Revenue Retention</div>
        <div className="mt-1 text-2xl font-bold">—%</div>
        <div className="mt-2 h-4 rounded bg-gray-100" />
      </div>

      {view === 'report' ? (
        <div className="rounded border-2 border-dashed p-12 text-center text-gray-400">
          <p>Renewal pipeline data will appear here once contracts are created.</p>
        </div>
      ) : (
        <div className="rounded border-2 border-dashed p-12 text-center text-gray-400">
          <p>Kanban board will show renewal opportunities by stage.</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="rounded border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-400">{sublabel}</div>
    </div>
  );
}

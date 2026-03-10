import { useState, useEffect } from 'react';
import { api } from '../api/client';

type Report = {
  summary: { totalSales: number; count: number };
  byDay: { _id: string; total: number; count: number }[];
};

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.reports.sales(from || undefined, to || undefined);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [from, to]);

  const exportCsv = () => {
    if (!data) return;
    const headers = ['Date', 'Invoices', 'Total'];
    const rows = data.byDay.map((d) => [d._id, d.count, d.total.toFixed(2)]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${from || 'all'}-${to || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Reports</h2>

      <div className="card">
        <h3 className="mb-4 font-semibold text-slate-700">Sales summary</h3>
        <div className="mb-4 flex flex-wrap gap-4">
          <input
            type="date"
            className="input w-40"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="From"
          />
          <input
            type="date"
            className="input w-40"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To"
          />
          <button type="button" onClick={load} className="btn-secondary px-4 py-2">
            Apply
          </button>
          <button type="button" onClick={exportCsv} disabled={!data?.byDay?.length} className="btn-primary px-4 py-2">
            Export CSV
          </button>
        </div>
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : data ? (
          <>
            <div className="mb-6 flex flex-wrap gap-6 rounded-xl border border-slate-200 bg-surface-50 p-4">
              <div>
                <p className="text-sm text-slate-600">Total sales</p>
                <p className="text-2xl font-bold text-primary-700">{data.summary.totalSales.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Number of invoices</p>
                <p className="text-2xl font-bold text-slate-800">{data.summary.count}</p>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Invoices</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byDay.map((d) => (
                    <tr key={d._id}>
                      <td>{d._id}</td>
                      <td className="text-right">{d.count}</td>
                      <td className="text-right font-medium">{d.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.byDay.length === 0 && <p className="mt-4 text-slate-500">No data for the selected range.</p>}
          </>
        ) : null}
      </div>
    </div>
  );
}

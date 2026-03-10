import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Toast from '../components/Toast';

type Customer = { _id: string; name: string; phone?: string; email?: string; address?: string };
type Invoice = {
  _id: string;
  invoiceNumber: string;
  date: string;
  customerId: Customer | null;
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  items: { productName: string; quantity: number; unitPrice: number; amount: number }[];
};

export default function Invoices() {
  const [list, setList] = useState<Invoice[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.invoices.list(from || undefined, to || undefined);
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [from, to]);

  const openDetail = async (id: string) => {
    try {
      const inv = await api.invoices.get(id);
      setDetail(inv);
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    }
  };

  const printInvoice = () => {
    if (!detail) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const customer = detail.customerId;
    const rows = detail.items.map((i) => `<tr><td>${i.productName}</td><td>${i.quantity}</td><td>${i.unitPrice.toFixed(2)}</td><td>${i.amount.toFixed(2)}</td></tr>`).join('');
    win.document.write(`
      <!DOCTYPE html><html><head><title>Invoice ${detail.invoiceNumber}</title>
      <style>
        body { font-family: system-ui; padding: 24px; max-width: 600px; margin: 0 auto; }
        h1 { margin: 0 0 8px; font-size: 1.5rem; }
        .meta { color: #666; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background: #f5f5f5; }
        .total { font-weight: bold; font-size: 1.1rem; margin-top: 8px; }
      </style></head><body>
      <h1>Invoice ${detail.invoiceNumber}</h1>
      <div class="meta">Date: ${new Date(detail.date).toLocaleDateString()}</div>
      ${customer ? `<p><strong>${customer.name}</strong><br/>${[customer.phone, customer.email, customer.address].filter(Boolean).join(' · ')}</p>` : ''}
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total">Subtotal: ${detail.subtotal.toFixed(2)} | Tax: ${detail.tax.toFixed(2)} | Total: ${detail.total.toFixed(2)}</div>
      ${detail.notes ? `<p style="margin-top:16px;color:#666;">${detail.notes}</p>` : ''}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Invoices</h2>

      <div className="card">
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
        </div>
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th className="text-right">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv) => (
                  <tr key={inv._id}>
                    <td className="font-medium">{inv.invoiceNumber}</td>
                    <td>{new Date(inv.date).toLocaleDateString()}</td>
                    <td>{inv.customerId?.name ?? '—'}</td>
                    <td className="text-right">{inv.total.toFixed(2)}</td>
                    <td>
                      <button type="button" onClick={() => openDetail(inv._id)} className="btn-ghost text-sm">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.length === 0 && !loading && <p className="mt-4 text-slate-500">No invoices in this range.</p>}
      </div>

      {detail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-semibold">Invoice {detail.invoiceNumber}</h3>
              <div className="flex gap-2">
                <button type="button" onClick={printInvoice} className="btn-primary">
                  Print
                </button>
                <button type="button" onClick={() => setDetail(null)} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
            <p className="mt-2 text-slate-600">Date: {new Date(detail.date).toLocaleString()}</p>
            {detail.customerId && (
              <p className="mt-1 text-slate-600">
                Customer: {detail.customerId.name}
                {detail.customerId.phone && ` · ${detail.customerId.phone}`}
              </p>
            )}
            <div className="table-wrap mt-4">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((i, idx) => (
                    <tr key={idx}>
                      <td>{i.productName}</td>
                      <td className="text-right">{i.quantity}</td>
                      <td className="text-right">{i.unitPrice.toFixed(2)}</td>
                      <td className="text-right">{i.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-right font-semibold">
              Subtotal: {detail.subtotal.toFixed(2)} | Tax: {detail.tax.toFixed(2)} | Total: {detail.total.toFixed(2)}
            </p>
            {detail.notes && <p className="mt-2 text-slate-600">{detail.notes}</p>}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

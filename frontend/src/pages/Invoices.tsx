import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Toast from '../components/Toast';

type Customer = { _id: string; name: string; phone?: string; email?: string; address?: string };
type Invoice = {
  _id: string;
  invoiceNumber: string;
  date: string;
  customerId: Customer | null;
  createdByEmail?: string;
  createdByName?: string;
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
    const rows = detail.items
      .map(
        (i) =>
          `<tr><td>${i.productName}</td><td class="num">${i.quantity}</td><td class="num">${i.unitPrice.toFixed(
            2,
          )}</td><td class="num">${i.amount.toFixed(2)}</td></tr>`,
      )
      .join('');
    win.document.write(`
      <!DOCTYPE html><html><head><title>Invoice ${detail.invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; max-width: 720px; margin: 0 auto; color: #111827; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
        .store-name { font-size: 1.35rem; font-weight: 700; color: #111827; }
        .store-meta { font-size: 0.8rem; color: #4b5563; margin-top: 4px; white-space: pre-line; }
        .contact { font-size: 0.8rem; color: #4b5563; text-align: right; }
        h1 { margin: 0 0 4px; font-size: 1.25rem; }
        .meta-block { margin-bottom: 12px; font-size: 0.9rem; color: #374151; }
        .label { font-weight: 600; }
        .customer { margin: 16px 0; font-size: 0.9rem; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.9rem; }
        th, td { border: 1px solid #e5e7eb; padding: 8px 10px; }
        th { background: #f9fafb; text-align: left; }
        td.num, th.num { text-align: right; }
        .summary { margin-top: 8px; font-weight: 600; text-align: right; font-size: 0.95rem; }
        .notes { margin-top: 16px; font-size: 0.85rem; color: #4b5563; }
      </style></head><body>
      <div class="header">
        <div>
          <div class="store-name">Khatu Shyam Books Store</div>
          <div class="store-meta">Mhada Colony, Behind A S Club
Chh. Shambhajinagar</div>
        </div>
        <div class="contact">
          <div class="label">Contact</div>
          <div>+91 8421630880</div>
        </div>
      </div>

      <h1>Invoice ${detail.invoiceNumber}</h1>
      <div class="meta-block">
        <div><span class="label">Date &amp; time:</span> ${new Date(detail.date).toLocaleString()}</div>
        ${detail.createdByName || detail.createdByEmail ? `<div><span class="label">Created by:</span> ${detail.createdByName || detail.createdByEmail}</div>` : ''}
      </div>

      ${
        customer
          ? `<div class="customer"><div class="label">Billed to:</div><div><strong>${customer.name}</strong></div><div>${[
              customer.phone,
              customer.address,
            ]
              .filter(Boolean)
              .join(' · ')}</div></div>`
          : ''
      }

      <table>
        <thead>
          <tr><th>Item</th><th class="num">Qty</th><th class="num">Price (INR)</th><th class="num">Amount (INR)</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="summary">Subtotal: ${detail.subtotal.toFixed(2)} INR | Total: ${detail.total.toFixed(2)} INR</div>
      ${detail.notes ? `<div class="notes">${detail.notes}</div>` : ''}
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
              <div className="mt-2 text-slate-600 text-sm">
                <span className="font-semibold">Billed to:</span>
                <p className="mt-1 text-base font-medium">{detail.customerId.name}</p>
                {detail.customerId.phone && <p className="text-sm">{detail.customerId.phone}</p>}
                {detail.customerId.address && <p className="text-sm">{detail.customerId.address}</p>}
              </div>
            )}
            <div className="table-wrap mt-4">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-right">Qty</th>
                  <th className="text-right">Price (INR)</th>
                  <th className="text-right">Amount (INR)</th>
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
              Subtotal: {detail.subtotal.toFixed(2)} INR | Tax: {detail.tax.toFixed(2)} | Total: {detail.total.toFixed(2)} INR
            </p>
            {detail.notes && <p className="mt-2 text-slate-600">{detail.notes}</p>}
            {(detail.createdByName || detail.createdByEmail) && (
              <p className="mt-3 text-right text-slate-500 text-sm">
                Created by: {detail.createdByName || detail.createdByEmail}
              </p>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

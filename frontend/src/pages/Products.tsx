import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { api } from '../api/client';
import Toast from '../components/Toast';

type Product = { _id: string; barcode: string; name: string; price: number; unit: string; description?: string };

// Labels per page in grid (3 columns x 4 rows)
const LABELS_PER_PAGE = 12;
const COLS = 3;
const ROWS = 4;

export default function Products() {
  const [list, setList] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ barcode: '', name: '', price: '', unit: 'pcs', description: '' });
  const [printQty, setPrintQty] = useState<Record<string, number>>({});
  const [labelType, setLabelType] = useState<'barcode' | 'qr'>('barcode');
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!form.barcode.trim()) {
      setQrPreviewUrl(null);
      return;
    }
    getQRDataUrl(form.barcode).then(setQrPreviewUrl).catch(() => setQrPreviewUrl(null));
  }, [form.barcode]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.products.list(q || undefined);
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [q]);

  const openAdd = () => {
    setForm({ barcode: '', name: '', price: '', unit: 'pcs', description: '' });
    setEditing(null);
    setModal('add');
  };

  const openEdit = (p: Product) => {
    setForm({ barcode: p.barcode, name: p.name, price: String(p.price), unit: p.unit || 'pcs', description: p.description || '' });
    setEditing(p);
    setModal('edit');
  };

  const generateBarcode = async () => {
    try {
      const { barcode } = await api.products.generateBarcode();
      setForm((f) => ({ ...f, barcode }));
      setToast({ message: 'Barcode generated', type: 'success' });
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    }
  };

  const save = async () => {
    const name = form.name.trim();
    const barcode = form.barcode.trim();
    const price = parseFloat(form.price);
    if (!name || !barcode || isNaN(price)) {
      setToast({ message: 'Name, barcode and price are required', type: 'error' });
      return;
    }
    try {
      if (editing) {
        await api.products.update(editing._id, { barcode, name, price, unit: form.unit, description: form.description });
        setToast({ message: 'Product updated', type: 'success' });
      } else {
        await api.products.create({ barcode, name, price, unit: form.unit, description: form.description });
        setToast({ message: 'Product added', type: 'success' });
      }
      setModal(null);
      load();
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.products.delete(id);
      setToast({ message: 'Product deleted', type: 'success' });
      load();
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    }
  };

  const getBarcodeDataUrl = (barcode: string): string => {
    const canvas = barcodeCanvasRef.current;
    if (!canvas) return '';
    JsBarcode(canvas, barcode, { format: 'CODE128', width: 2, height: 60, displayValue: true });
    return canvas.toDataURL('image/png');
  };

  const getQRDataUrl = (text: string): Promise<string> => {
    return QRCode.toDataURL(text, { width: 180, margin: 1 });
  };

  const openPrintLabel = (p: Product) => {
    const dataUrl = getBarcodeDataUrl(p.barcode);
    if (!dataUrl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>Label - ${p.name.replace(/</g, '&lt;')}</title>
      <style>
        body { font-family: system-ui; padding: 16px; margin: 0; }
        .label { width: 2in; border: 1px solid #ccc; padding: 8px; text-align: center; }
        .label h3 { margin: 0 0 8px; font-size: 14px; word-break: break-word; }
        .label img { max-width: 100%; height: auto; }
        .label .price { font-weight: bold; margin-top: 4px; }
      </style></head><body>
      <div class="label">
        <h3>${p.name.replace(/</g, '&lt;')}</h3>
        <img src="${dataUrl}" alt="Barcode" />
        <div class="price">₹${p.price.toFixed(2)}</div>
      </div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const openPrintQRLabel = async (p: Product) => {
    try {
      const dataUrl = await getQRDataUrl(p.barcode);
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`
        <!DOCTYPE html><html><head><title>QR Label - ${p.name.replace(/</g, '&lt;')}</title>
        <style>
          body { font-family: system-ui; padding: 16px; margin: 0; }
          .label { width: 2in; border: 1px solid #ccc; padding: 8px; text-align: center; }
          .label h3 { margin: 0 0 8px; font-size: 14px; word-break: break-word; }
          .label img { max-width: 100%; height: auto; }
          .label .price { font-weight: bold; margin-top: 4px; }
        </style></head><body>
        <div class="label">
          <h3>${p.name.replace(/</g, '&lt;')}</h3>
          <img src="${dataUrl}" alt="QR Code" />
          <div class="price">₹${p.price.toFixed(2)}</div>
        </div>
        </body></html>
      `);
      win.document.close();
      setTimeout(() => { win.print(); win.close(); }, 300);
    } catch {
      setToast({ message: 'Failed to generate QR code', type: 'error' });
    }
  };

  const openPrintLabelsGrid = async () => {
    const items: { product: Product; qty: number }[] = list
      .filter((p) => (printQty[p._id] || 0) > 0)
      .map((p) => ({ product: p, qty: printQty[p._id] || 0 }));
    if (items.length === 0) {
      setToast({ message: 'Set quantity (≥1) for at least one product to print labels.', type: 'error' });
      return;
    }
    const canvas = barcodeCanvasRef.current;
    if (labelType === 'barcode' && !canvas) return;
    const labels: { name: string; price: string; dataUrl: string }[] = [];
    for (const { product, qty } of items) {
      const dataUrl = labelType === 'qr'
        ? await getQRDataUrl(product.barcode)
        : getBarcodeDataUrl(product.barcode);
      const name = product.name.replace(/</g, '&lt;').replace(/"/g, '&quot;');
      const price = '₹' + product.price.toFixed(2);
      for (let i = 0; i < qty; i++) labels.push({ name, price, dataUrl });
    }
    const pages: { name: string; price: string; dataUrl: string }[][] = [];
    for (let i = 0; i < labels.length; i += LABELS_PER_PAGE) {
      pages.push(labels.slice(i, i + LABELS_PER_PAGE));
    }
    const labelsHtml = (pageLabels: { name: string; price: string; dataUrl: string }[]) => {
      const cells = pageLabels.map(
        (l) => `
        <div class="label-cell">
          <div class="label-inner">
            <div class="label-name">${l.name}</div>
            <img src="${l.dataUrl}" alt="" class="label-barcode" />
            <div class="label-price">${l.price}</div>
          </div>
        </div>`
      );
      while (cells.length < LABELS_PER_PAGE) cells.push('<div class="label-cell label-cell--empty"></div>');
      return cells.join('');
    };
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Labels</title>
      <style>
        @page { size: A4; margin: 8mm; }
        * { box-sizing: border-box; }
        body { font-family: system-ui, sans-serif; margin: 0; padding: 8px; }
        .page { page-break-after: always; }
        .page:last-child { page-break-after: auto; }
        .grid { display: grid; grid-template-columns: repeat(${COLS}, 1fr); grid-template-rows: repeat(${ROWS}, 1fr); gap: 0; width: 100%; min-height: 270mm; }
        .label-cell { border: 1px dashed #333; padding: 6px; display: flex; align-items: center; justify-content: center; min-height: 65mm; }
        .label-cell--empty { border-color: #ccc; }
        .label-inner { text-align: center; width: 100%; padding: 4px; }
        .label-name { font-size: 11px; font-weight: 600; margin-bottom: 4px; word-break: break-word; line-height: 1.2; }
        .label-barcode { max-width: 100%; height: 38px; object-fit: contain; }
        .label-price { font-size: 12px; font-weight: bold; margin-top: 2px; }
        @media print {
          body { padding: 0; background: white; }
          .page { min-height: 0; }
          .grid { min-height: 270mm; }
        }
      </style></head><body>
      ${pages.map((p) => `<div class="page"><div class="grid">${labelsHtml(p)}</div></div>`).join('')}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Products</h2>
        <button type="button" onClick={openAdd} className="btn-primary px-4 py-2">
          Add product
        </button>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <input
            type="search"
            placeholder="Search by name or barcode..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input max-w-md"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Label type:</span>
            <select
              value={labelType}
              onChange={(e) => setLabelType(e.target.value as 'barcode' | 'qr')}
              className="input py-1.5 text-sm"
            >
              <option value="barcode">Barcode</option>
              <option value="qr">QR code</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => openPrintLabelsGrid()}
            className="btn-primary px-4 py-2"
          >
            Print selected labels
          </button>
        </div>
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Barcode</th>
                  <th>Name</th>
                  <th className="text-right">Price</th>
                  <th>Unit</th>
                  <th className="w-24 text-center">Print qty</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p._id}>
                    <td className="font-mono text-sm">{p.barcode}</td>
                    <td>{p.name}</td>
                    <td className="text-right">{p.price.toFixed(2)}</td>
                    <td>{p.unit}</td>
                    <td className="text-center">
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={printQty[p._id] ?? 0}
                        onChange={(e) => setPrintQty((prev) => ({ ...prev, [p._id]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                        className="input w-16 py-1.5 text-center text-sm"
                      />
                    </td>
                    <td className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEdit(p)} className="btn-ghost text-sm">
                        Edit
                      </button>
                      <button type="button" onClick={() => openPrintLabel(p)} className="btn-ghost text-sm">
                        Print barcode
                      </button>
                      <button type="button" onClick={() => openPrintQRLabel(p)} className="btn-ghost text-sm">
                        Print QR code
                      </button>
                      <button type="button" onClick={() => deleteProduct(p._id)} className="btn-ghost text-red-600 text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.length === 0 && !loading && <p className="mt-4 text-slate-500">No products. Add one to get started.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
          <div className="card w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">{editing ? 'Edit product' : 'Add product'}</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Barcode or QR code value"
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                />
                <button type="button" onClick={generateBarcode} className="btn-secondary shrink-0">
                  Generate
                </button>
              </div>
              {qrPreviewUrl && (
                <div className="flex items-center gap-3 rounded border border-slate-200 bg-slate-50 p-3">
                  <img src={qrPreviewUrl} alt="QR preview" className="h-20 w-20 shrink-0" />
                  <span className="text-sm text-slate-600">QR code preview (same value as barcode — scannable at Billing)</span>
                </div>
              )}
              <input
                className="input"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Unit (e.g. pcs)"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={save} className="btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={barcodeCanvasRef} className="hidden" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

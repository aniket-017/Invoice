import { useRef, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import Toast from '../components/Toast';

type CartItem = {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export default function Billing() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [customers, setCustomers] = useState<{ _id: string; name: string }[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const addByBarcode = useCallback(async (barcode: string) => {
    const code = barcode.trim();
    if (!code) return;
    try {
      const product = await api.products.getByBarcode(code);
      setCart((prev) => {
        const i = prev.find((x) => x.productId === product._id);
        if (i) {
          const q = i.quantity + 1;
          return prev.map((x) => (x.productId === product._id ? { ...x, quantity: q, amount: q * x.unitPrice } : x));
        }
        return [...prev, { productId: product._id, productName: product.name, barcode: product.barcode, quantity: 1, unitPrice: product.price, amount: product.price }];
      });
      setToast({ message: `Added ${product.name}`, type: 'success' });
    } catch {
      setToast({ message: 'Product not found for barcode', type: 'error' });
    }
  }, []);

  const { scannerContainerId, active, error, start, stop } = useBarcodeScanner(addByBarcode);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = (e.target as HTMLInputElement).value;
      addByBarcode(v);
      (e.target as HTMLInputElement).value = '';
    }
  };

  const loadCustomers = async () => {
    const list = await api.customers.list();
    setCustomers(list);
  };

  const subtotal = cart.reduce((s, i) => s + i.amount, 0);
  const tax = 0;
  const total = subtotal + tax;

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((x) => x.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const completeSale = async () => {
    if (cart.length === 0) {
      setToast({ message: 'Cart is empty', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await api.invoices.create({
        customerId: customerId || undefined,
        items: cart,
        tax,
        notes: '',
      });
      setToast({ message: 'Sale completed', type: 'success' });
      setCart([]);
      setCustomerId('');
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Billing</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <h3 className="font-semibold text-slate-700">Scan or enter barcode / QR code</h3>
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan barcode or QR code, or type and press Enter"
            className="input text-lg"
            onKeyDown={handleBarcodeKeyDown}
            autoFocus
          />
          <div className="flex gap-2">
            {!active ? (
              <button type="button" onClick={start} className="btn-primary px-4 py-2">
                Open camera scanner
              </button>
            ) : (
              <button type="button" onClick={stop} className="btn-secondary px-4 py-2">
                Stop camera
              </button>
            )}
          </div>
          {/* Scanner container: always in DOM so start() can find it; visible when active */}
          <div
            id={scannerContainerId}
            className={active ? 'max-h-64 overflow-hidden rounded-xl border border-slate-200 [&_video]:max-h-64' : 'hidden'}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Customer (optional)</h3>
            <button type="button" onClick={loadCustomers} className="btn-ghost text-sm">
              Load list
            </button>
          </div>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="input"
          >
            <option value="">— None —</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold text-slate-700">Cart</h3>
        {cart.length === 0 ? (
          <p className="text-slate-500">Cart is empty. Scan or enter a barcode or QR code to add items.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((i) => (
                    <tr key={i.productId}>
                      <td>{i.productName}</td>
                      <td className="text-right">{i.quantity}</td>
                      <td className="text-right">{i.unitPrice.toFixed(2)}</td>
                      <td className="text-right font-medium">{i.amount.toFixed(2)}</td>
                      <td>
                        <button type="button" onClick={() => removeItem(i.productId)} className="btn-ghost text-red-600 text-sm">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
              <div className="text-lg">
                <span className="text-slate-600">Subtotal:</span> <span className="font-semibold">{subtotal.toFixed(2)}</span>
                {tax > 0 && (
                  <>
                    <span className="ml-4 text-slate-600">Tax:</span> <span className="font-semibold">{tax.toFixed(2)}</span>
                  </>
                )}
                <span className="ml-4 text-slate-600">Total:</span> <span className="font-bold text-primary-700">{total.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={clearCart} className="btn-secondary px-4 py-2">
                  Clear cart
                </button>
                <button type="button" onClick={completeSale} disabled={loading} className="btn-primary px-6 py-2">
                  {loading ? 'Processing…' : 'Complete sale'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

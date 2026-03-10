import { Router } from 'express';
import { Invoice } from '../models/Invoice.js';

const router = Router();

function getNextInvoiceNumber(): string {
  return 'INV-' + Date.now();
}

router.get('/', async (req, res) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const filter: Record<string, unknown> = {};
    if (from) filter.date = { ...((filter.date as object) || {}), $gte: new Date(from) };
    if (to) filter.date = { ...((filter.date as object) || {}), $lte: new Date(to) };
    const invoices = await Invoice.find(filter)
      .populate('customerId', 'name phone email address')
      .sort({ date: -1 })
      .lean();
    res.json(invoices);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .lean();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customerId, items, tax = 0, notes = '' } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }
    const subtotal = items.reduce((sum: number, i: { amount: number }) => sum + Number(i.amount), 0);
    const total = subtotal + Number(tax);
    const invoice = await Invoice.create({
      customerId: customerId || null,
      invoiceNumber: getNextInvoiceNumber(),
      date: new Date(),
      subtotal,
      tax: Number(tax),
      total,
      notes: String(notes),
      items: items.map((i: { productId: string; productName: string; barcode: string; quantity: number; unitPrice: number; amount: number }) => ({
        productId: i.productId,
        productName: i.productName,
        barcode: i.barcode,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount,
      })),
    });
    const populated = await Invoice.findById(invoice._id)
      .populate('customerId', 'name phone email address')
      .lean();
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;

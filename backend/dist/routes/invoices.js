import { Router } from 'express';
import { Invoice } from '../models/Invoice.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
router.use(authMiddleware);
function getNextInvoiceNumber() {
    return 'INV-' + Date.now();
}
router.get('/', async (req, res) => {
    try {
        const from = req.query.from;
        const to = req.query.to;
        const filter = {};
        if (from)
            filter.date = { ...(filter.date || {}), $gte: new Date(from) };
        if (to)
            filter.date = { ...(filter.date || {}), $lte: new Date(to) };
        const invoices = await Invoice.find(filter)
            .populate('customerId', 'name phone email address')
            .sort({ date: -1 })
            .lean();
        res.json(invoices);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customerId', 'name phone email address')
            .lean();
        if (!invoice)
            return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const { customerId, items, tax = 0, notes = '' } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'items array is required' });
        }
        const subtotal = items.reduce((sum, i) => sum + Number(i.amount), 0);
        const total = subtotal + Number(tax);
        const authUser = req.user;
        const invoice = await Invoice.create({
            customerId: customerId || null,
            invoiceNumber: getNextInvoiceNumber(),
            date: new Date(),
            createdByEmail: authUser?.email || '',
            createdByName: authUser?.name || '',
            subtotal,
            tax: Number(tax),
            total,
            notes: String(notes),
            items: items.map((i) => ({
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;

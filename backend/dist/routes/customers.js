import { Router } from 'express';
import { Customer } from '../models/Customer.js';
const router = Router();
router.get('/', async (req, res) => {
    try {
        const q = req.query.q?.trim() || '';
        const filter = q
            ? {
                $or: [
                    { name: new RegExp(q, 'i') },
                    { phone: new RegExp(q, 'i') },
                    { email: new RegExp(q, 'i') },
                ],
            }
            : {};
        const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
        res.json(customers);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).lean();
        if (!customer)
            return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        if (!name)
            return res.status(400).json({ error: 'name is required' });
        const customer = await Customer.create({
            name: String(name).trim(),
            phone: phone || '',
            email: email || '',
            address: address || '',
        });
        res.status(201).json(customer);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        const update = {};
        if (name !== undefined)
            update.name = String(name).trim();
        if (phone !== undefined)
            update.phone = phone;
        if (email !== undefined)
            update.email = email;
        if (address !== undefined)
            update.address = address;
        const customer = await Customer.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
        if (!customer)
            return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const result = await Customer.findByIdAndDelete(req.params.id);
        if (!result)
            return res.status(404).json({ error: 'Customer not found' });
        res.status(204).send();
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;

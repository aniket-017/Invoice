import { Router } from 'express';
import { Invoice } from '../models/Invoice.js';
const router = Router();
router.get('/sales', async (req, res) => {
    try {
        const from = req.query.from;
        const to = req.query.to;
        const match = {};
        if (from || to) {
            match.date = {};
            if (from)
                match.date.$gte = new Date(from);
            if (to)
                match.date.$lte = new Date(to);
        }
        const summary = await Invoice.aggregate([
            ...(Object.keys(match).length ? [{ $match: match }] : []),
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$total' },
                    count: { $sum: 1 },
                },
            },
        ]);
        const byDay = await Invoice.aggregate([
            ...(Object.keys(match).length ? [{ $match: match }] : []),
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    total: { $sum: '$total' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.json({
            summary: summary[0] || { totalSales: 0, count: 0 },
            byDay,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;

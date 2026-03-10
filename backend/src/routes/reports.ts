import { Router } from 'express';
import { Invoice } from '../models/Invoice.js';

const router = Router();

router.get('/sales', async (req, res) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const match: Record<string, unknown> = {};
    if (from || to) {
      match.date = {};
      if (from) (match.date as Record<string, Date>).$gte = new Date(from);
      if (to) (match.date as Record<string, Date>).$lte = new Date(to);
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
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;

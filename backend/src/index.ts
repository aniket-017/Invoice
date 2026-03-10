import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { connectDb } from './db/connect.js';
import productsRouter from './routes/products.js';
import customersRouter from './routes/customers.js';
import invoicesRouter from './routes/invoices.js';
import reportsRouter from './routes/reports.js';
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = process.env.PORT || 1970;

app.use(cors());
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
} else {
  console.warn('frontend/dist not found – backend will serve API only.');
}

async function start() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`Barcode Billing API running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

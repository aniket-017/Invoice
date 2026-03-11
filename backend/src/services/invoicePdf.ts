import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

type InvoiceItem = {
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type InvoiceForPdf = {
  _id: string;
  invoiceNumber: string;
  date: Date | string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdByName?: string;
  customerId?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  items: InvoiceItem[];
};

export async function generateInvoicePdf(invoice: InvoiceForPdf): Promise<string> {
  const invoicesDir = path.join(process.cwd(), 'invoices');
  await fs.promises.mkdir(invoicesDir, { recursive: true });

  const safeNumber = invoice.invoiceNumber.replace(/[^A-Za-z0-9_-]/g, '_');
  const filename = `${safeNumber}.pdf`;
  const filePath = path.join(invoicesDir, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Invoice No: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.date).toLocaleString()}`);
    if (invoice.createdByName) {
      doc.text(`Created by: ${invoice.createdByName}`);
    }
    doc.moveDown();

    if (invoice.customerId) {
      doc.text('Bill To:');
      if (invoice.customerId.name) doc.text(invoice.customerId.name);
      if (invoice.customerId.phone) doc.text(`Phone: ${invoice.customerId.phone}`);
      if (invoice.customerId.email) doc.text(`Email: ${invoice.customerId.email}`);
      if (invoice.customerId.address) doc.text(invoice.customerId.address);
      doc.moveDown();
    }

    doc.fontSize(11).text('Items', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10);
    doc.text('Product', { continued: true, width: 200 });
    doc.text('Qty', { continued: true, width: 60, align: 'right' });
    doc.text('Price', { continued: true, width: 80, align: 'right' });
    doc.text('Amount', { width: 80, align: 'right' });
    doc.moveDown(0.5);

    invoice.items.forEach((item) => {
      doc.text(item.productName, { continued: true, width: 200 });
      doc.text(String(item.quantity), { continued: true, width: 60, align: 'right' });
      doc.text(item.unitPrice.toFixed(2), { continued: true, width: 80, align: 'right' });
      doc.text(item.amount.toFixed(2), { width: 80, align: 'right' });
    });

    doc.moveDown();
    doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, { align: 'right' });
    if (invoice.tax) {
      doc.text(`Tax: ${invoice.tax.toFixed(2)}`, { align: 'right' });
    }
    doc.text(`Total: ${invoice.total.toFixed(2)}`, { align: 'right' });

    if (invoice.notes) {
      doc.moveDown();
      doc.text('Notes:');
      doc.text(invoice.notes);
    }

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
}


import mongoose from 'mongoose';
const invoiceItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    barcode: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
}, { _id: false });
const invoiceSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: () => new Date() },
    createdByEmail: { type: String, default: '' },
    createdByName: { type: String, default: '' },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String, default: '' },
    items: [invoiceItemSchema],
}, { timestamps: true });
invoiceSchema.index({ date: -1 });
export const Invoice = mongoose.model('Invoice', invoiceSchema);

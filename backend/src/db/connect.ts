import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/barcode-billing';

export async function connectDb(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
}

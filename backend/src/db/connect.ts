import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDb(): Promise<void> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
}

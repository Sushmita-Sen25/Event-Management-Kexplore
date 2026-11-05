import mongoose from 'mongoose';
import { config } from './config.js';

mongoose.set('strictQuery', true);

export async function connectDatabase() {
  await mongoose.connect(config.databaseUrl, { serverSelectionTimeoutMS: 15000, maxPoolSize: 10 });
  console.log(`[db] connected to ${mongoose.connection.name}`);
}

export const databaseStatus = () =>
  ({ 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' })[mongoose.connection.readyState];

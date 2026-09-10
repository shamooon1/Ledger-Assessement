import * as mongoose from 'mongoose';
import { config } from 'dotenv';

config();

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/equipment-ledger?replicaSet=rs0';
  await mongoose.connect(uri);
  console.log('connected');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

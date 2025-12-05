import { MongoClient, Db, Collection } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB_NAME || 'finance';

if (!MONGO_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export interface Transaction {
  _id?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyAnalytics {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  categories: {
    [key: string]: {
      income: number;
      expense: number;
    };
  };
}

export async function getTransactionsCollection(): Promise<Collection<Transaction>> {
  const { db } = await connectToDatabase();
  return db.collection<Transaction>('transactions');
}

export async function getAnalyticsCollection(): Promise<Collection<MonthlyAnalytics>> {
  const { db } = await connectToDatabase();
  return db.collection<MonthlyAnalytics>('analytics');
}
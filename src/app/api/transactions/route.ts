import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsCollection, Transaction } from '@/lib/mongodb';

export async function GET() {
  try {
    const collection = await getTransactionsCollection();
    const transactions = await collection
      .find({})
      .sort({ date: -1 })
      .toArray();
    
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, category, description, date } = body;

    if (!type || !amount || !category || !description || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { success: false, error: 'Type must be income or expense' },
        { status: 400 }
      );
    }

    const transaction: Omit<Transaction, '_id'> = {
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = await getTransactionsCollection();
    const result = await collection.insertOne(transaction);

    return NextResponse.json({
      success: true,
      data: { ...transaction, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsCollection } from '@/lib/mongodb';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');
    
    const collection = await getTransactionsCollection();
    const endDate = new Date();
    const startDate = subMonths(endDate, months - 1);
    
    const transactions = await collection
      .find({
        date: {
          $gte: startOfMonth(startDate),
          $lte: endOfMonth(endDate),
        },
      })
      .sort({ date: 1 })
      .toArray();

    const monthlyData = new Map();
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(endDate, i);
      const monthKey = format(monthDate, 'yyyy-MM');
      monthlyData.set(monthKey, {
        month: format(monthDate, 'MMM yyyy'),
        year: monthDate.getFullYear(),
        monthNumber: monthDate.getMonth() + 1,
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        transactionCount: 0,
        categories: {},
      });
    }

    transactions.forEach((transaction) => {
      const monthKey = format(new Date(transaction.date), 'yyyy-MM');
      const monthData = monthlyData.get(monthKey);
      
      if (monthData) {
        if (transaction.type === 'income') {
          monthData.totalIncome += transaction.amount;
        } else {
          monthData.totalExpenses += transaction.amount;
        }
        
        monthData.transactionCount++;
        
        if (!monthData.categories[transaction.category]) {
          monthData.categories[transaction.category] = {
            income: 0,
            expense: 0,
          };
        }
        
        if (transaction.type === 'income') {
          monthData.categories[transaction.category].income += transaction.amount;
        } else {
          monthData.categories[transaction.category].expense += transaction.amount;
        }
      }
    });

    monthlyData.forEach((monthData) => {
      monthData.netIncome = monthData.totalIncome - monthData.totalExpenses;
    });

    const analyticsData = Array.from(monthlyData.values());

    const categoryTotals = new Map();
    transactions.forEach((transaction) => {
      if (!categoryTotals.has(transaction.category)) {
        categoryTotals.set(transaction.category, { income: 0, expense: 0 });
      }
      
      const category = categoryTotals.get(transaction.category);
      if (transaction.type === 'income') {
        category.income += transaction.amount;
      } else {
        category.expense += transaction.amount;
      }
    });

    const recentTransactions = await collection
      .find({})
      .sort({ date: -1 })
      .limit(10)
      .toArray();

    const summary = {
      totalIncome: analyticsData.reduce((sum, month) => sum + month.totalIncome, 0),
      totalExpenses: analyticsData.reduce((sum, month) => sum + month.totalExpenses, 0),
      netIncome: 0,
      transactionCount: transactions.length,
    };
    summary.netIncome = summary.totalIncome - summary.totalExpenses;

    return NextResponse.json({
      success: true,
      data: {
        monthly: analyticsData,
        categories: Object.fromEntries(categoryTotals),
        summary,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
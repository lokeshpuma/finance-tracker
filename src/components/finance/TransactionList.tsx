'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Trash2, TrendingUp, TrendingDown, File, Download } from 'lucide-react';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Array<{
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }>;
}

interface TransactionListProps {
  refreshTrigger: number;
}

export default function TransactionList({ refreshTrigger }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTransactions(transactions.filter(t => t._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/upload?id=${fileId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {transactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No transactions yet. Add your first transaction above!
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.category} • {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </div>
                      {transaction.attachments && transaction.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {transaction.attachments.map((attachment, idx) => (
                            <button
                              key={idx}
                              onClick={() => downloadFile(attachment.fileId, attachment.fileName)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                            >
                              <File className="h-3 w-3" />
                              <span>{attachment.fileName}</span>
                              <Download className="h-3 w-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {transaction.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTransaction(transaction._id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
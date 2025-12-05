'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, X, File } from 'lucide-react';

interface TransactionFormProps {
  onTransactionAdded: () => void;
}

const incomeCategories = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Other Income',
];

const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Rent/Mortgage',
  'Insurance',
  'Other Expense',
];

export default function TransactionForm({ onTransactionAdded }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }>>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (transactionId?: string): Promise<Array<{
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }>> => {
    const uploaded: Array<{
      fileId: string;
      fileName: string;
      fileSize: number;
      fileType: string;
    }> = [];

    for (const file of selectedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (transactionId) {
          formData.append('transactionId', transactionId);
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          uploaded.push(result.data);
        } else {
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
        }
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    return uploaded;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First, upload files if any
      let attachments: Array<{
        fileId: string;
        fileName: string;
        fileSize: number;
        fileType: string;
      }> = [];

      if (selectedFiles.length > 0) {
        attachments = await uploadFiles();
      }

      // Then create the transaction with file attachments
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`${formData.type === 'income' ? 'Income' : 'Expense'} added successfully!`);
        setFormData({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
        setSelectedFiles([]);
        setUploadedFiles([]);
        onTransactionAdded();
      } else {
        toast.error(result.error || 'Failed to add transaction');
      }
    } catch (error) {
      toast.error('Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') => {
                  setFormData({ ...formData, type: value, category: '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Attach Files (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,.csv,.xlsx,.xls"
              />
              <Label
                htmlFor="file"
                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Choose Files</span>
              </Label>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : `Add ${formData.type === 'income' ? 'Income' : 'Expense'}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Brain } from "lucide-react";
import { format } from "date-fns";
import { Transaction } from '@/lib/types';
import { categorizeTransaction, CategorizeTransactionOutput } from '@/ai/flows/smart-transaction-categorization'; // AI Flow
import { useToast } from '@/hooks/use-toast';

interface AddTransactionModalProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const commonCategories = ["Groceries", "Utilities", "Transport", "Entertainment", "Salary", "Freelance", "Rent", "Healthcare", "Shopping", "Other"];

export function AddTransactionModal({ onAddTransaction, isOpen, onOpenChange, trigger }: AddTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState(''); // For custom category
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCategorizing, setIsCategorizing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || (!category && !newCategory) || !type || !date) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    const finalCategory = category === 'Other' && newCategory ? newCategory : category;
    if (!finalCategory) {
       toast({ title: "Category Missing", description: "Please select or enter a category.", variant: "destructive" });
       return;
    }

    onAddTransaction({
      date: date.toISOString(),
      description,
      category: finalCategory,
      amount: type === 'income' ? parseFloat(amount) : -parseFloat(amount),
      type,
    });
    // Reset form
    setDescription('');
    setAmount('');
    setCategory('');
    setNewCategory('');
    setType('expense');
    setDate(new Date());
    if(onOpenChange) onOpenChange(false);
    toast({ title: "Transaction Added", description: "Your transaction has been successfully added." });
  };

  const handleAICategorize = async () => {
    if (!description || !amount) {
      toast({ title: "Info Needed for AI", description: "Please enter description and amount first.", variant: "destructive" });
      return;
    }
    setIsCategorizing(true);
    try {
      const result: CategorizeTransactionOutput = await categorizeTransaction({
        transactionDescription: description,
        transactionAmount: parseFloat(amount),
      });
      setCategory(result.category); // Or suggest if not in commonCategories
      toast({ title: "AI Categorization", description: `Suggested category: ${result.category} (Confidence: ${(result.confidence * 100).toFixed(0)}%)` });
    } catch (error) {
      console.error("AI Categorization failed:", error);
      toast({ title: "AI Error", description: "Could not categorize transaction automatically.", variant: "destructive" });
    }
    setIsCategorizing(false);
  };
  
  const dialogContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as 'income' | 'expense')}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="flex-grow">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {commonCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" onClick={handleAICategorize} variant="outline" size="icon" disabled={isCategorizing} title="AI Categorize">
            <Brain className="w-4 h-4" />
          </Button>
        </div>
        {category === 'Other' && (
          <Input 
            id="new-category" 
            placeholder="Enter custom category" 
            value={newCategory} 
            onChange={(e) => setNewCategory(e.target.value)} 
            className="mt-2"
          />
        )}
      </div>
      <div>
        <Label htmlFor="date">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full justify-start text-left font-normal"
              id="date"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <DialogFooter>
        <Button type="submit">Add Transaction</Button>
      </DialogFooter>
    </form>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>Fill in the details of your transaction.</DialogDescription>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle> {/* This would be dynamic if used for editing */}
          <DialogDescription>Update the details of your transaction.</DialogDescription>
        </DialogHeader>
        {dialogContent} {/* This part should be pre-filled if editing */}
      </DialogContent>
    </Dialog>
  );
}


"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Brain } from "lucide-react";
import { format } from "date-fns";
import type { Transaction } from '@/lib/types'; // Ensure this is `type { Transaction }`
import { categorizeTransaction, CategorizeTransactionOutput } from '@/ai/flows/smart-transaction-categorization';
import { useToast } from '@/hooks/use-toast';

interface AddTransactionModalProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => void;
  onUpdateTransaction?: (transaction: Transaction) => void; // For editing
  editingTransaction?: Transaction | null; // For pre-filling form
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const commonCategories = ["Groceries", "Utilities", "Transport", "Entertainment", "Salary", "Freelance", "Rent", "Healthcare", "Shopping", "Other"];

export function AddTransactionModal({ 
  onAddTransaction, 
  onUpdateTransaction,
  editingTransaction,
  isOpen, 
  onOpenChange, 
  trigger 
}: AddTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCategorizing, setIsCategorizing] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!editingTransaction;

  useEffect(() => {
    if (isEditMode && editingTransaction && isOpen) {
      setDescription(editingTransaction.description);
      setAmount(String(Math.abs(editingTransaction.amount)));
      
      const isCommon = commonCategories.includes(editingTransaction.category);
      if (isCommon) {
        setCategory(editingTransaction.category);
        setNewCategory('');
      } else {
        setCategory('Other');
        setNewCategory(editingTransaction.category);
      }
      
      setType(editingTransaction.type);
      setDate(new Date(editingTransaction.date));
    } else if (!isOpen) { // Reset form when modal is closed and not in edit mode (or edit is finished)
      resetForm();
    }
  }, [editingTransaction, isOpen, isEditMode]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('');
    setNewCategory('');
    setType('expense');
    setDate(new Date());
  };

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

    const transactionData = {
      date: date.toISOString(),
      description,
      category: finalCategory,
      amount: type === 'income' ? parseFloat(amount) : -parseFloat(amount),
      type,
    };

    if (isEditMode && onUpdateTransaction && editingTransaction) {
      onUpdateTransaction({
        ...transactionData,
        id: editingTransaction.id,
        userId: editingTransaction.userId, // Pass along userId
      });
    } else {
      onAddTransaction(transactionData as Omit<Transaction, 'id' | 'userId'>);
    }
    
    // Reset form happens in useEffect based on isOpen, or can be explicit here if onOpenChange(false) is called by parent
    if(onOpenChange) onOpenChange(false); // Parent will handle resetting editingTransaction
    // toast is handled by parent for success
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
      
      const isCommon = commonCategories.includes(result.category);
      if (isCommon) {
        setCategory(result.category);
        setNewCategory('');
      } else {
        setCategory('Other');
        setNewCategory(result.category);
      }
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
          <Select value={category} onValueChange={(val) => { setCategory(val); if (val !== 'Other') setNewCategory(''); }}>
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
            required={category === 'Other'}
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
        <Button type="submit">{isEditMode ? "Update Transaction" : "Add Transaction"}</Button>
      </DialogFooter>
    </form>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the details of your transaction." : "Fill in the details of your transaction."}
            </DialogDescription>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
      </Dialog>
    );
  }

  // This direct usage might be less common now that trigger is preferred
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
          <DialogDescription>
             {isEditMode ? "Update the details of your transaction." : "Fill in the details of your transaction."}
          </DialogDescription>
        </DialogHeader>
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
}

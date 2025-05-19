"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Budget } from '@/lib/types';
import { Brain } from 'lucide-react';
import { aiPoweredBudgetSuggestions, AIPoweredBudgetSuggestionsOutput } from '@/ai/flows/ai-powered-budget-suggestions'; // AI Flow
import { useToast } from '@/hooks/use-toast';

interface CreateBudgetModalProps {
  onAddBudget: (budget: Omit<Budget, 'id' | 'spentAmount'>) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const commonCategories = ["Groceries", "Utilities", "Transport", "Entertainment", "Healthcare", "Shopping", "Education", "Personal Care", "Other"];
const budgetPeriods = ['Monthly', 'Quarterly', 'Yearly', 'Custom'];

export function CreateBudgetModal({ onAddBudget, isOpen, onOpenChange, trigger }: CreateBudgetModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [period, setPeriod] = useState<Budget['period']>('Monthly');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [userIncome, setUserIncome] = useState(''); // For AI input
  const [userSpendingHabits, setUserSpendingHabits] = useState(''); // For AI input
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!category && !newCategory) || !allocatedAmount || !period) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    
    const finalCategory = category === 'Other' && newCategory ? newCategory : category;
    if (!finalCategory) {
       toast({ title: "Category Missing", description: "Please select or enter a category.", variant: "destructive" });
       return;
    }

    onAddBudget({
      name,
      category: finalCategory,
      allocatedAmount: parseFloat(allocatedAmount),
      period,
    });
    // Reset form
    setName('');
    setCategory('');
    setNewCategory('');
    setAllocatedAmount('');
    setPeriod('Monthly');
    setAiSuggestion(null);
    setUserIncome('');
    setUserSpendingHabits('');
    if(onOpenChange) onOpenChange(false);
    toast({ title: "Budget Created", description: `Budget "${name}" has been successfully created.` });
  };

  const handleAISuggestions = async () => {
    if (!userIncome || !userSpendingHabits) {
      toast({ title: "Info Needed for AI", description: "Please provide your income and spending habits for AI suggestions.", variant: "destructive"});
      return;
    }
    setIsSuggesting(true);
    setAiSuggestion(null);
    try {
      const result: AIPoweredBudgetSuggestionsOutput = await aiPoweredBudgetSuggestions({
        income: parseFloat(userIncome),
        spendingHabits: userSpendingHabits,
      });
      setAiSuggestion(result.suggestedBudgets);
      toast({ title: "AI Suggestions Ready", description: "Budget suggestions have been generated."});
    } catch (error) {
      console.error("AI suggestion failed:", error);
      setAiSuggestion("Could not generate suggestions at this time.");
      toast({ title: "AI Error", description: "Failed to generate budget suggestions.", variant: "destructive"});
    }
    setIsSuggesting(false);
  };
  
  const dialogContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="budgetName">Budget Name</Label>
        <Input id="budgetName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Monthly Groceries" required />
      </div>
      <div>
        <Label htmlFor="budgetCategory">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="budgetCategory">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {commonCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
        {category === 'Other' && (
          <Input id="newBudCategory" placeholder="Enter custom category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="mt-2"/>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="budgetAmount">Allocated Amount ($)</Label>
          <Input id="budgetAmount" type="number" value={allocatedAmount} onChange={(e) => setAllocatedAmount(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="budgetPeriod">Period</Label>
          <Select value={period} onValueChange={(value) => setPeriod(value as Budget['period'])}>
            <SelectTrigger id="budgetPeriod">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {budgetPeriods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* AI Budget Suggestions Section */}
      <div className="p-4 space-y-3 border rounded-md bg-muted/30">
        <h4 className="font-semibold text-md">AI Budget Helper</h4>
        <p className="text-sm text-muted-foreground">Get AI-powered suggestions for your budget.</p>
        <div>
            <Label htmlFor="userIncome">Your Monthly Income ($)</Label>
            <Input id="userIncome" type="number" value={userIncome} onChange={e => setUserIncome(e.target.value)} placeholder="e.g., 5000"/>
        </div>
        <div>
            <Label htmlFor="userSpendingHabits">Describe Your Spending Habits</Label>
            <Textarea id="userSpendingHabits" value={userSpendingHabits} onChange={e => setUserSpendingHabits(e.target.value)} placeholder="e.g., I spend about $200 on dining out, $100 on hobbies..."/>
        </div>
        <Button type="button" variant="outline" onClick={handleAISuggestions} disabled={isSuggesting}>
          <Brain className="w-4 h-4 mr-2" /> {isSuggesting ? 'Getting Suggestions...' : 'Get AI Suggestions'}
        </Button>
        {aiSuggestion && (
          <div className="p-3 mt-2 text-sm border rounded-md bg-background max-h-32 overflow-y-auto">
            <p className="whitespace-pre-wrap">{aiSuggestion}</p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="submit">Create Budget</Button>
      </DialogFooter>
    </form>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
            <DialogDescription>Define a new budget for your spending category.</DialogDescription>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
      </Dialog>
    );
  }
  
  return ( // Fallback for direct modal usage, e.g., for editing if adapted
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create/Edit Budget</DialogTitle>
            <DialogDescription>Manage your budget details.</DialogDescription>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
    </Dialog>
  );
}

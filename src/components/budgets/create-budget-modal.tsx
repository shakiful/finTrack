
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Budget } from '@/lib/types';
import { Brain, CalendarIcon } from "lucide-react";
import { aiPoweredBudgetSuggestions, AIPoweredBudgetSuggestionsOutput } from '@/ai/flows/ai-powered-budget-suggestions';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateBudgetModalProps {
  onAddBudget: (budget: Omit<Budget, 'id' | 'userId' | 'spentAmount'>) => void;
  onUpdateBudget?: (budget: Budget) => void;
  editingBudget?: Budget | null;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const commonCategories = ["Groceries", "Utilities", "Transport", "Entertainment", "Healthcare", "Shopping", "Education", "Personal Care", "Rent", "Housing", "Subscriptions", "Insurance", "Debt Payment", "Savings", "Investments", "Salary", "Freelance Income", "Gifts Received", "Other"];
const budgetPeriods = ['Monthly', 'Quarterly', 'Yearly', 'Custom'];

export function CreateBudgetModal({ onAddBudget, onUpdateBudget, editingBudget, isOpen, onOpenChange, trigger }: CreateBudgetModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [spentAmount, setSpentAmount] = useState('0');
  const [period, setPeriod] = useState<Budget['period']>('Monthly');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  const [isRecurringBill, setIsRecurringBill] = useState(false);
  const [dueDateDay, setDueDateDay] = useState<number | undefined>();

  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [userIncome, setUserIncome] = useState('');
  const [userSpendingHabits, setUserSpendingHabits] = useState('');
  const { toast } = useToast();

  const isEditMode = !!editingBudget;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingBudget) {
        setName(editingBudget.name);
        const isCommonCat = commonCategories.includes(editingBudget.category);
        if (isCommonCat) {
          setCategory(editingBudget.category);
          setNewCategory('');
        } else {
          setCategory('Other');
          setNewCategory(editingBudget.category);
        }
        setAllocatedAmount(String(editingBudget.allocatedAmount));
        setSpentAmount(String(editingBudget.spentAmount || 0));
        setPeriod(editingBudget.period);
        setStartDate(editingBudget.startDate ? new Date(editingBudget.startDate) : undefined);
        setEndDate(editingBudget.endDate ? new Date(editingBudget.endDate) : undefined);
        setIsRecurringBill(editingBudget.isRecurringBill || false);
        setDueDateDay(editingBudget.dueDateDay);
        setAiSuggestion(null); 
        setUserIncome(''); 
        setUserSpendingHabits('');
      } else {
        setName('');
        setCategory('');
        setNewCategory('');
        setAllocatedAmount('');
        setSpentAmount('0'); 
        setPeriod('Monthly');
        setStartDate(undefined);
        setEndDate(undefined);
        setIsRecurringBill(false);
        setDueDateDay(undefined);
        setAiSuggestion(null);
        setUserIncome('');
        setUserSpendingHabits('');
      }
    }
  }, [editingBudget, isEditMode, isOpen]);


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

    const parsedAllocatedAmount = parseFloat(allocatedAmount);
    if (isNaN(parsedAllocatedAmount) || parsedAllocatedAmount < 0) {
        toast({ title: "Invalid Amount", description: "Allocated amount must be a valid non-negative number.", variant: "destructive" });
        return;
    }
    
    const parsedSpentAmount = isEditMode ? parseFloat(spentAmount) : 0;
     if (isEditMode && (isNaN(parsedSpentAmount) || parsedSpentAmount < 0)) {
        toast({ title: "Invalid Spent Amount", description: "Spent amount must be a valid non-negative number.", variant: "destructive" });
        return;
    }

    if (isRecurringBill && period === 'Monthly' && (!dueDateDay || dueDateDay < 1 || dueDateDay > 31)) {
      toast({ title: "Invalid Due Day", description: "For monthly recurring bills, please enter a valid due day (1-31).", variant: "destructive" });
      return;
    }

    let budgetPayload: Partial<Budget> = {
        name,
        category: finalCategory,
        allocatedAmount: parsedAllocatedAmount,
        period,
        isRecurringBill: isRecurringBill,
    };
    
    if (isEditMode) {
        budgetPayload.spentAmount = parsedSpentAmount;
    }

    // Only add startDate/endDate if period is 'Custom' AND the date is defined
    if (period === 'Custom' && startDate) {
        budgetPayload.startDate = startDate.toISOString();
    }
    if (period === 'Custom' && endDate) {
        budgetPayload.endDate = endDate.toISOString();
    }
    
    if (isRecurringBill && period === 'Monthly' && dueDateDay) {
        budgetPayload.dueDateDay = dueDateDay;
    }

    if (isEditMode && onUpdateBudget && editingBudget) {
      onUpdateBudget({ 
        ...editingBudget, 
        ...budgetPayload,
        spentAmount: parsedSpentAmount 
      } as Budget); 
      toast({ title: "Budget Updated", description: `Budget "${name}" has been updated.` });
    } else {
      const { spentAmount: payloadSpentAmountForAdd, ...restOfPayloadForAdd } = budgetPayload;
      onAddBudget(restOfPayloadForAdd as Omit<Budget, 'id' | 'userId' | 'spentAmount'>);
      toast({ title: "Budget Created", description: `Budget "${name}" has been created.` });
    }

    if(onOpenChange) onOpenChange(false);
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
  
  const formContent = ( 
    <div className="space-y-4 p-6"> {/* Content padding handled here */}
      <div>
        <Label htmlFor="budgetName">Budget Name</Label>
        <Input id="budgetName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Monthly Groceries, Netflix Subscription" required />
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
          <Input id="budgetAmount" type="number" step="0.01" value={allocatedAmount} onChange={(e) => setAllocatedAmount(e.target.value)} required />
        </div>
        {isEditMode && (
          <div>
            <Label htmlFor="spentAmount">Spent Amount ($)</Label>
            <Input id="spentAmount" type="number" step="0.01" value={spentAmount} onChange={(e) => setSpentAmount(e.target.value)} required />
          </div>
        )}
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

      {period === 'Custom' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full justify-start text-left font-normal" id="startDate">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full justify-start text-left font-normal" id="endDate">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => startDate ? date < startDate : false} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="isRecurringBill" checked={isRecurringBill} onCheckedChange={(checked) => setIsRecurringBill(checked as boolean)} />
          <Label htmlFor="isRecurringBill" className="font-normal">This is a recurring bill/subscription</Label>
        </div>
        {isRecurringBill && period === 'Monthly' && (
          <div>
            <Label htmlFor="dueDateDay">Due Day of Month (1-31)</Label>
            <Input 
              id="dueDateDay" 
              type="number" 
              min="1" max="31" 
              value={dueDateDay || ''} 
              onChange={(e) => setDueDateDay(parseInt(e.target.value, 10) || undefined)} 
              placeholder="e.g., 15"
            />
          </div>
        )}
      </div>
      
      {!isEditMode && (
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
      )}
    </div>
  );

  const wrappedDialogContent = (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0"> {/* Parent allows child to take space and manages overflow for flex */}
      <ScrollArea className="flex-1"> {/* ScrollArea takes available space */}
        {formContent} {/* formContent is the scrollable content with its own padding */}
      </ScrollArea>
      <DialogFooter className="p-6 pt-4 border-t flex-shrink-0"> {/* Footer is fixed */}
        <Button type="submit">{isEditMode ? "Update Budget" : "Create Budget"}</Button>
      </DialogFooter>
    </form>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{isEditMode ? "Edit Budget" : "Create New Budget"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the details of your budget." : "Define a new budget for your spending category."}
            </DialogDescription>
          </DialogHeader>
          {wrappedDialogContent}
        </DialogContent>
      </Dialog>
    );
  }
  
  return ( 
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
           <DialogHeader className="p-6 pb-4 border-b">
             <DialogTitle>{isEditMode ? "Edit Budget" : "Create New Budget"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the details of your budget." : "Define a new budget for your spending category."}
            </DialogDescription>
          </DialogHeader>
          {wrappedDialogContent}
        </DialogContent>
    </Dialog>
  );
}

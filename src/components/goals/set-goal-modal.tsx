
"use client";

import React, { useState, useEffect } from 'react'; // Added useEffect
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { Goal } from '@/lib/types'; // Ensure this is `type { Goal }`
import { useToast } from '@/hooks/use-toast';

interface SetGoalModalProps {
  onAddGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  onUpdateGoal?: (goal: Goal) => void; // For editing
  editingGoal?: Goal | null; // For pre-filling form
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function SetGoalModal({ 
    onAddGoal, 
    onUpdateGoal, 
    editingGoal, 
    isOpen, 
    onOpenChange, 
    trigger 
}: SetGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [description, setDescription] = useState('');
  // const [initialSaving, setInitialSaving] = useState(''); // Not used for currentAmount directly here.
  const { toast } = useToast();
  
  const isEditMode = !!editingGoal;

  useEffect(() => {
    if (isEditMode && editingGoal && isOpen) {
      setName(editingGoal.name);
      setTargetAmount(String(editingGoal.targetAmount));
      setTargetDate(editingGoal.targetDate ? new Date(editingGoal.targetDate) : undefined);
      setDescription(editingGoal.description || '');
      // setInitialSaving(String(editingGoal.currentAmount)); // If modal handles currentAmount directly
    } else if (!isOpen) { // Reset form when modal is closed
      resetForm();
    }
  }, [editingGoal, isOpen, isEditMode]);

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setTargetDate(undefined);
    setDescription('');
    // setInitialSaving('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetAmount.trim() === '') {
      toast({ title: "Missing Fields", description: "Goal Name and Target Amount are required.", variant: "destructive" });
      return;
    }

    const parsedTargetAmount = parseFloat(targetAmount);
    if (isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Target Amount must be a valid positive number.", variant: "destructive" });
      return;
    }

    const goalData: Omit<Goal, 'id' | 'currentAmount' | 'userId'> = { // userId is added by parent
      name: name.trim(),
      targetAmount: parsedTargetAmount,
      targetDate: targetDate?.toISOString(), // Will be undefined if targetDate is not set
      description: description.trim() || undefined, // Send undefined if empty so parent can omit
    };

    if (isEditMode && onUpdateGoal && editingGoal) {
        onUpdateGoal({
            ...editingGoal, // includes id, userId, currentAmount
            ...goalData, // overrides with new name, targetAmount, targetDate, description
        });
         toast({ title: "Goal Updated", description: `Your goal "${goalData.name}" has been updated.` });
    } else {
        onAddGoal(goalData as Omit<Goal, 'id' | 'currentAmount' | 'userId'>); // Cast needed as onAddGoal expects slightly different type
        toast({ title: "Goal Set", description: `Your goal "${goalData.name}" has been set.` });
    }
    
    // resetForm(); // Resetting is handled by useEffect on isOpen change
    if(onOpenChange) onOpenChange(false);
  };

  const dialogContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="goalName">Goal Name</Label>
        <Input id="goalName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Save for Vacation" required />
      </div>
      <div className="grid grid-cols-1 gap-4"> {/* Adjusted for simplicity; initialSaving was conceptual */}
        <div>
          <Label htmlFor="targetAmount">Target Amount ($)</Label>
          <Input id="targetAmount" type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="e.g., 1000" required />
        </div>
        {/* 
        For editing initial/current savings, this would be part of the form:
        {isEditMode && (
          <div>
            <Label htmlFor="currentAmount">Current Amount ($)</Label>
            <Input id="currentAmount" type="number" value={initialSaving} onChange={(e) => setInitialSaving(e.target.value)} />
          </div>
        )}
        */}
      </div>
      <div>
        <Label htmlFor="targetDate">Target Date (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full justify-start text-left font-normal"
              id="targetDate"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {targetDate ? format(targetDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={targetDate}
              onSelect={setTargetDate}
              initialFocus
              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label htmlFor="goalDescription">Description (Optional)</Label>
        <Textarea id="goalDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more details about your goal" />
      </div>
      <DialogFooter>
        <Button type="submit">{isEditMode ? "Update Goal" : "Set Goal"}</Button>
      </DialogFooter>
    </form>
  );

  if (trigger) {
     return (
      <Dialog open={isOpen} onOpenChange={(open) => {
          if (onOpenChange) onOpenChange(open);
          if (!open) resetForm(); // Ensure form resets if modal is closed externally
      }}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Financial Goal" : "Set New Financial Goal"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the details of your financial goal." : "Define your financial target and plan your savings."}
            </DialogDescription>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
      </Dialog>
    );
  }
  
  return ( // Fallback for direct modal usage (less common now with trigger pattern)
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (onOpenChange) onOpenChange(open);
        if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Financial Goal" : "Set New Financial Goal"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of your financial goal." : "Define your financial target and plan your savings."}
          </DialogDescription>
        </DialogHeader>
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
}

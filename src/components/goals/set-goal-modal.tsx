"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Goal } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface SetGoalModalProps {
  onAddGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  // To adapt for editing later:
  // initialData?: Omit<Goal, 'id'>; 
}

export function SetGoalModal({ onAddGoal, isOpen, onOpenChange, trigger }: SetGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [description, setDescription] = useState('');
  const [initialSaving, setInitialSaving] = useState(''); // For conceptual "current savings" input
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) {
      toast({ title: "Missing Fields", description: "Goal Name and Target Amount are required.", variant: "destructive" });
      return;
    }

    const goalData: Omit<Goal, 'id' | 'currentAmount'> = {
      name,
      targetAmount: parseFloat(targetAmount),
      targetDate: targetDate?.toISOString(),
      description,
    };
    // In a real app, initialSaving would be part of Goal and set here
    // For this structure, onAddGoal only takes Omit<Goal, 'id' | 'currentAmount'>
    // We'll assume currentAmount starts at 0 unless initialData is provided for editing.

    onAddGoal(goalData);
    // Reset form
    setName('');
    setTargetAmount('');
    setTargetDate(undefined);
    setDescription('');
    setInitialSaving('');
    if(onOpenChange) onOpenChange(false);
    toast({ title: "Goal Set", description: `Your goal "${name}" has been set.` });
  };

  const dialogContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="goalName">Goal Name</Label>
        <Input id="goalName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Save for Vacation" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="targetAmount">Target Amount ($)</Label>
          <Input id="targetAmount" type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="initialSaving">Initial Savings ($) (Optional)</Label>
          <Input id="initialSaving" type="number" value={initialSaving} onChange={(e) => setInitialSaving(e.target.value)} placeholder="0.00" />
        </div>
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
        <Button type="submit">Set Goal</Button>
      </DialogFooter>
    </form>
  );

  if (trigger) {
     return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set New Financial Goal</DialogTitle>
            <DialogDescription>Define your financial target and plan your savings.</DialogDescription>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
      </Dialog>
    );
  }
  
  return ( // Fallback for direct modal usage
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set/Edit Financial Goal</DialogTitle>
          <DialogDescription>Manage your financial goal details.</DialogDescription>
        </DialogHeader>
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
}

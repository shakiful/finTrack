"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Target, PlusCircle } from "lucide-react";
import { GoalCard } from '@/components/goals/goal-card';
import { SetGoalModal } from '@/components/goals/set-goal-modal';
import { Goal, exampleGoals } from '@/lib/types'; // Using example data
import { useToast } from "@/hooks/use-toast";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null); // For future edit
  const [addingFundsGoal, setAddingFundsGoal] = useState<Goal | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setGoals(exampleGoals);
  }, []);

  const handleAddGoal = (newGoalData: Omit<Goal, 'id' | 'currentAmount'>) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: String(Date.now() + Math.random()), // Simple unique ID
      currentAmount: 0, // New goals start with 0 saved
    };
    // If initialSaving was part of newGoalData, it would be set here.
    // e.g. currentAmount: newGoalData.initialSaving || 0
    setGoals(prev => [...prev, newGoal]);
    setIsModalOpen(false);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    // setIsModalOpen(true); // Open modal pre-filled for editing
    toast({ title: "Edit Action", description: `Editing goal: ${goal.name}. (Full edit UI not implemented)`});
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    toast({ title: "Goal Deleted", description: "The financial goal has been removed." });
  };
  
  const handleOpenAddFundsModal = (goal: Goal) => {
    setAddingFundsGoal(goal);
    setFundAmount(''); // Reset amount
  };

  const handleConfirmAddFunds = () => {
    if (!addingFundsGoal || !fundAmount) return;
    const amountToAdd = parseFloat(fundAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive"});
      return;
    }

    setGoals(prevGoals => 
      prevGoals.map(g => 
        g.id === addingFundsGoal.id 
          ? { ...g, currentAmount: Math.min(g.currentAmount + amountToAdd, g.targetAmount) } 
          : g
      )
    );
    toast({ title: "Funds Added", description: `$${amountToAdd.toFixed(2)} added to "${addingFundsGoal.name}".`});
    setAddingFundsGoal(null);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Financial Goals</h1>
            <p className="text-muted-foreground">Set and track your progress towards your financial aspirations.</p>
        </div>
        <SetGoalModal
            onAddGoal={handleAddGoal}
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />Set New Goal</Button>}
        />
      </div>

      {goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              onAddFunds={handleOpenAddFundsModal}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center col-span-full">
            <CardHeader>
                <div className="mx-auto bg-muted/50 p-3 rounded-full w-fit">
                    <Target className="w-10 h-10 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">No Goals Set Yet</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Define your financial goals to start tracking your progress.</p>
            </CardContent>
            <CardFooter className="justify-center">
                 <SetGoalModal
                    onAddGoal={handleAddGoal}
                    isOpen={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />Set New Goal</Button>}
                />
            </CardFooter>
        </Card>
      )}

      {/* Add Funds Modal */}
      <Dialog open={!!addingFundsGoal} onOpenChange={(open) => !open && setAddingFundsGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to "{addingFundsGoal?.name}"</DialogTitle>
            <DialogDescription>
              Current: ${addingFundsGoal?.currentAmount.toFixed(2)} / Target: ${addingFundsGoal?.targetAmount.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="fundAmount">Amount to Add ($)</Label>
              <Input 
                id="fundAmount" 
                type="number" 
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingFundsGoal(null)}>Cancel</Button>
            <Button onClick={handleConfirmAddFunds}>Add Funds</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Placeholder Card component if not already defined elsewhere
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

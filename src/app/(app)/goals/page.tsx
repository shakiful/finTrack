
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, PlusCircle } from "lucide-react";
import { GoalCard } from '@/components/goals/goal-card';
import { SetGoalModal } from '@/components/goals/set-goal-modal';
import type { Goal } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc, updateDoc, Timestamp, deleteField } from "firebase/firestore";
import { onAuthStateChanged, User } from 'firebase/auth';

export default function GoalsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addingFundsGoal, setAddingFundsGoal] = useState<Goal | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setGoals([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(collection(db, "goals"), where("userId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const goalsData: Goal[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        goalsData.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
          targetDate: data.targetDate ? (data.targetDate as Timestamp).toDate().toISOString() : undefined,
          description: data.description,
        });
      });
      setGoals(goalsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching goals:", error);
      toast({ title: "Error", description: "Could not fetch goals.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, toast]);

  const handleAddGoal = async (newGoalData: Omit<Goal, 'id' | 'userId' | 'currentAmount'>) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const goalToSave: {
        name: string;
        targetAmount: number;
        userId: string;
        currentAmount: number;
        targetDate?: Timestamp | ReturnType<typeof deleteField>;
        description?: string | ReturnType<typeof deleteField>;
      } = {
        name: newGoalData.name,
        targetAmount: newGoalData.targetAmount,
        userId: currentUser.uid,
        currentAmount: 0, 
      };

      if (newGoalData.targetDate) {
        goalToSave.targetDate = Timestamp.fromDate(new Date(newGoalData.targetDate));
      } else {
         goalToSave.targetDate = deleteField();
      }
      if (newGoalData.description) {
        goalToSave.description = newGoalData.description;
      } else {
         goalToSave.description = deleteField();
      }
      
      await addDoc(collection(db, "goals"), goalToSave);
      // Toast handled in modal
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding goal:", error);
      toast({ title: "Error", description: "Could not add goal.", variant: "destructive" });
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleUpdateGoal = async (updatedGoal: Goal) => {
    if (!currentUser || !updatedGoal.id) return;
    try {
      const goalRef = doc(db, "goals", updatedGoal.id);
      
      const { id, userId, ...dataFieldsToUpdate } = updatedGoal;
      const dataForUpdate: any = {...dataFieldsToUpdate};


      if (dataFieldsToUpdate.hasOwnProperty('targetDate')) {
        if (dataFieldsToUpdate.targetDate) {
          dataForUpdate.targetDate = Timestamp.fromDate(new Date(dataFieldsToUpdate.targetDate));
        } else {
          dataForUpdate.targetDate = deleteField(); 
        }
      }

      if (dataFieldsToUpdate.hasOwnProperty('description')) {
        if (dataFieldsToUpdate.description) {
          dataForUpdate.description = dataFieldsToUpdate.description;
        } else {
          dataForUpdate.description = deleteField(); 
        }
      }
      
      if (Object.keys(dataForUpdate).length > 0) {
        await updateDoc(goalRef, dataForUpdate);
         // Toast handled in modal
      } else {
         toast({ title: "No Changes", description: "No changes were made to the goal." });
      }

      setIsModalOpen(false); 
      setEditingGoal(null);
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({ title: "Error", description: "Could not update goal.", variant: "destructive" });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, "goals", goalId));
      toast({ title: "Goal Deleted", description: "The financial goal has been removed." });
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({ title: "Error", description: "Could not delete goal.", variant: "destructive" });
    }
  };
  
  const handleOpenAddFundsModal = (goal: Goal) => {
    setAddingFundsGoal(goal);
    setFundAmount('');
  };

  const handleConfirmAddFunds = async () => {
    if (!currentUser || !addingFundsGoal || !fundAmount) return;
    const amountToAdd = parseFloat(fundAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive"});
      return;
    }

    try {
      const goalRef = doc(db, "goals", addingFundsGoal.id);
      const newCurrentAmount = Math.min(addingFundsGoal.currentAmount + amountToAdd, addingFundsGoal.targetAmount);
      await updateDoc(goalRef, { currentAmount: newCurrentAmount });
      toast({ title: "Funds Added", description: `$${amountToAdd.toFixed(2)} added to "${addingFundsGoal.name}".`});
      setAddingFundsGoal(null);
    } catch (error) {
      console.error("Error adding funds:", error);
      toast({ title: "Error", description: "Could not add funds to goal.", variant: "destructive" });
    }
  };
  
  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingGoal(null); 
    }
  }

  if (isLoading && !currentUser) {
    return <div className="flex justify-center items-center h-64">Loading user data...</div>;
  }
   if (!currentUser && !isLoading) {
     return <div className="flex justify-center items-center h-64">Please log in to view goals.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Financial Goals</h1>
            <p className="text-muted-foreground">Set and track your progress towards your financial aspirations.</p>
        </div>
        <SetGoalModal
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal} 
            editingGoal={editingGoal} 
            isOpen={isModalOpen}
            onOpenChange={handleModalOpenChange}
            trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />{editingGoal ? "Edit Goal" : "Set New Goal"}</Button>}
        />
      </div>

      {isLoading && currentUser && <div className="text-center">Loading goals...</div>}
      {!isLoading && goals.length > 0 ? (
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
        !isLoading && (
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
                      onUpdateGoal={handleUpdateGoal}
                      editingGoal={editingGoal}
                      isOpen={isModalOpen && !editingGoal} // Only open this instance if not editing
                      onOpenChange={handleModalOpenChange}
                      trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />Set New Goal</Button>}
                  />
              </CardFooter>
          </Card>
        )
      )}

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

    
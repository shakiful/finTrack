
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChartIcon, PlusCircle } from "lucide-react";
import { BudgetCard } from '@/components/budgets/budget-card';
import { CreateBudgetModal } from '@/components/budgets/create-budget-modal';
import type { Budget } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc, updateDoc, Timestamp, deleteField } from "firebase/firestore";
import { onAuthStateChanged, User } from 'firebase/auth';

export default function BudgetsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setBudgets([]);
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
    const q = query(collection(db, "budgets"), where("userId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const budgetsData: Budget[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        budgetsData.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          category: data.category,
          allocatedAmount: data.allocatedAmount,
          spentAmount: data.spentAmount || 0, 
          period: data.period,
          startDate: data.startDate ? (data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : String(data.startDate)) : undefined,
          endDate: data.endDate ? (data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : String(data.endDate)) : undefined,
          isRecurringBill: data.isRecurringBill || false,
          dueDateDay: data.dueDateDay,
        });
      });
      setBudgets(budgetsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching budgets:", error);
      toast({ title: "Error", description: "Could not fetch budgets.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, toast]);

  const handleAddBudget = async (newBudgetData: Omit<Budget, 'id' | 'userId' | 'spentAmount'>) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const budgetToSave: any = {
        ...newBudgetData, 
        userId: currentUser.uid,
        spentAmount: 0, 
        isRecurringBill: newBudgetData.isRecurringBill || false,
      };

      if (newBudgetData.startDate) {
        budgetToSave.startDate = Timestamp.fromDate(new Date(newBudgetData.startDate));
      } else {
        // For add, if startDate is not provided, don't include it or explicitly delete if schema requires absence
         delete budgetToSave.startDate; // Or use deleteField() if updating an existing template, but this is for addDoc
      }
      if (newBudgetData.endDate) {
        budgetToSave.endDate = Timestamp.fromDate(new Date(newBudgetData.endDate));
      } else {
         delete budgetToSave.endDate;
      }
      
      if (newBudgetData.isRecurringBill && newBudgetData.period === 'Monthly' && newBudgetData.dueDateDay !== undefined) {
        budgetToSave.dueDateDay = newBudgetData.dueDateDay;
      } else {
        delete budgetToSave.dueDateDay;
      }
      
      await addDoc(collection(db, "budgets"), budgetToSave);
      setIsModalOpen(false); // Toast is handled in modal
    } catch (error) {
      console.error("Error adding budget:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Error adding budget", description: errorMessage, variant: "destructive" });
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleUpdateBudget = async (updatedBudget: Budget) => {
    if (!currentUser || !updatedBudget.id) {
      toast({ title: "Error", description: "Cannot update budget. Missing user or budget ID.", variant: "destructive" });
      return;
    }
    try {
      const budgetRef = doc(db, "budgets", updatedBudget.id);
      
      const dataToUpdate: { [key: string]: any } = {
        name: updatedBudget.name,
        category: updatedBudget.category,
        allocatedAmount: updatedBudget.allocatedAmount,
        spentAmount: updatedBudget.spentAmount || 0,
        period: updatedBudget.period,
        isRecurringBill: updatedBudget.isRecurringBill || false,
      };

      // Handle startDate
      if (updatedBudget.period === 'Custom') {
        dataToUpdate.startDate = updatedBudget.startDate ? Timestamp.fromDate(new Date(updatedBudget.startDate)) : deleteField();
      } else {
        dataToUpdate.startDate = deleteField(); // Remove if not 'Custom'
      }

      // Handle endDate
      if (updatedBudget.period === 'Custom') {
        dataToUpdate.endDate = updatedBudget.endDate ? Timestamp.fromDate(new Date(updatedBudget.endDate)) : deleteField();
      } else {
        dataToUpdate.endDate = deleteField(); // Remove if not 'Custom'
      }

      // Handle dueDateDay
      if (updatedBudget.isRecurringBill && updatedBudget.period === 'Monthly') {
        dataToUpdate.dueDateDay = (updatedBudget.dueDateDay !== undefined && updatedBudget.dueDateDay !== null) ? updatedBudget.dueDateDay : deleteField();
      } else {
        dataToUpdate.dueDateDay = deleteField(); // Remove if not a monthly recurring bill
      }
      
      await updateDoc(budgetRef, dataToUpdate);
      setIsModalOpen(false);
      setEditingBudget(null);
      // Toast is handled in modal upon successful submission by modal's handleSubmit
    } catch (error) {
      console.error("Error updating budget:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Error updating budget", description: errorMessage, variant: "destructive" });
    }
  };


  const handleDeleteBudget = async (budgetId: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, "budgets", budgetId));
      toast({ title: "Budget Deleted", description: "The budget has been removed." });
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast({ title: "Error", description: "Could not delete budget.", variant: "destructive" });
    }
  };
  
  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingBudget(null); 
    }
  }

  if (isLoading && !currentUser) {
    return <div className="flex justify-center items-center h-64">Loading user data...</div>;
  }
   if (!currentUser && !isLoading) {
     return <div className="flex justify-center items-center h-64">Please log in to view budgets.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground">Create and track your spending budgets and recurring bills.</p>
        </div>
        {/* This button now correctly reflects edit mode title if editingBudget is set */}
        <Button onClick={() => setIsModalOpen(true)}> 
            <PlusCircle className="w-4 h-4 mr-2" />
            {editingBudget ? "Edit Budget" : "Create New Budget"}
        </Button>
      </div>
        <CreateBudgetModal
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget} 
            editingBudget={editingBudget} 
            isOpen={isModalOpen}
            onOpenChange={handleModalOpenChange}
            // Removed trigger from here, as the button above handles opening.
            // If you want a trigger directly on the modal for the "empty state" scenario, that's separate.
        />

      {isLoading && currentUser && <div className="text-center">Loading budgets...</div>}
      {!isLoading && budgets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard 
              key={budget.id} 
              budget={budget} 
              onEdit={handleEditBudget} 
              onDelete={handleDeleteBudget}
            />
          ))}
        </div>
      ) : (
        !isLoading && (
          <Card className="text-center col-span-full">
              <CardHeader>
                  <div className="mx-auto bg-muted/50 p-3 rounded-full w-fit">
                      <PieChartIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-4">No Budgets Yet</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">Get started by creating your first budget or recurring bill.</p>
              </CardContent>
              <CardFooter className="justify-center">
                  {/* Button for empty state - also opens the same modal instance */}
                  <Button onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}>
                      <PlusCircle className="w-4 h-4 mr-2" />Create New Budget
                  </Button>
              </CardFooter>
          </Card>
        )
      )}
    </div>
  );
}

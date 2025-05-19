
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
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
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
          spentAmount: data.spentAmount, // Assuming spentAmount is tracked and updated elsewhere
          period: data.period,
          startDate: data.startDate ? (data.startDate as Timestamp).toDate().toISOString() : undefined,
          endDate: data.endDate ? (data.endDate as Timestamp).toDate().toISOString() : undefined,
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
      const budgetToSave = {
        ...newBudgetData,
        userId: currentUser.uid,
        spentAmount: 0, // New budgets start with 0 spent
        startDate: newBudgetData.startDate ? Timestamp.fromDate(new Date(newBudgetData.startDate)) : undefined,
        endDate: newBudgetData.endDate ? Timestamp.fromDate(new Date(newBudgetData.endDate)) : undefined,
      };
      await addDoc(collection(db, "budgets"), budgetToSave);
      toast({ title: "Budget Created", description: `Budget "${newBudgetData.name}" has been created.` });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding budget:", error);
      toast({ title: "Error", description: "Could not add budget.", variant: "destructive" });
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    // setIsModalOpen(true); // This would open CreateBudgetModal adapted for editing
    toast({ title: "Edit Action (Conceptual)", description: `Editing budget: ${budget.name}. Full edit UI with Firestore update needs modal adaptation.`});
    // For a full implementation, CreateBudgetModal would need an onUpdate prop and pre-filling logic like AddTransactionModal
  };

   const handleUpdateBudget = async (updatedBudget: Budget) => {
    if (!currentUser || !updatedBudget.id) return;
    try {
      const budgetRef = doc(db, "budgets", updatedBudget.id);
      const dataToUpdate = {
        ...updatedBudget,
        startDate: updatedBudget.startDate ? Timestamp.fromDate(new Date(updatedBudget.startDate)) : undefined,
        endDate: updatedBudget.endDate ? Timestamp.fromDate(new Date(updatedBudget.endDate)) : undefined,
      };
      // delete (dataToUpdate as any).id;
      // delete (dataToUpdate as any).userId;
      await updateDoc(budgetRef, dataToUpdate);
      toast({ title: "Budget Updated", description: "Budget has been updated." });
      setIsModalOpen(false);
      setEditingBudget(null);
    } catch (error) {
      console.error("Error updating budget:", error);
      toast({ title: "Error", description: "Could not update budget.", variant: "destructive" });
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
            <p className="text-muted-foreground">Create and track your spending budgets.</p>
        </div>
        <CreateBudgetModal
            onAddBudget={handleAddBudget}
            // onUpdateBudget={handleUpdateBudget} // Add this prop if modal is adapted
            // editingBudget={editingBudget} // Add this prop
            isOpen={isModalOpen}
            onOpenChange={handleModalOpenChange}
            trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />Create New Budget</Button>}
        />
      </div>

      {isLoading && currentUser && <div className="text-center">Loading budgets...</div>}
      {!isLoading && budgets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard 
              key={budget.id} 
              budget={budget} 
              onEdit={handleEditBudget} // For full edit, this should open modal with budget data
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
                  <p className="text-muted-foreground">Get started by creating your first budget.</p>
              </CardContent>
              <CardFooter className="justify-center">
                  <CreateBudgetModal
                      onAddBudget={handleAddBudget}
                      isOpen={isModalOpen} // This single modal instance might be tricky for create vs edit
                      onOpenChange={handleModalOpenChange}
                      trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />Create New Budget</Button>}
                  />
              </CardFooter>
          </Card>
        )
      )}
    </div>
  );
}

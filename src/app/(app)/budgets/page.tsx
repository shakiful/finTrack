
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
          startDate: data.startDate ? (data.startDate as Timestamp).toDate().toISOString() : undefined,
          endDate: data.endDate ? (data.endDate as Timestamp).toDate().toISOString() : undefined,
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
      };

      if (newBudgetData.startDate) {
        budgetToSave.startDate = Timestamp.fromDate(new Date(newBudgetData.startDate));
      } else {
        budgetToSave.startDate = deleteField();
      }
      if (newBudgetData.endDate) {
        budgetToSave.endDate = Timestamp.fromDate(new Date(newBudgetData.endDate));
      } else {
        budgetToSave.endDate = deleteField();
      }

      if (newBudgetData.hasOwnProperty('isRecurringBill')) {
        budgetToSave.isRecurringBill = newBudgetData.isRecurringBill;
      } else {
        budgetToSave.isRecurringBill = deleteField();
      }
       if (newBudgetData.hasOwnProperty('dueDateDay') && newBudgetData.dueDateDay !== undefined) {
        budgetToSave.dueDateDay = newBudgetData.dueDateDay;
      } else {
        budgetToSave.dueDateDay = deleteField();
      }
      
      await addDoc(collection(db, "budgets"), budgetToSave);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding budget:", error);
      toast({ title: "Error", description: "Could not add budget.", variant: "destructive" });
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

   const handleUpdateBudget = async (updatedBudget: Budget) => {
    if (!currentUser || !updatedBudget.id) return;
    try {
      const budgetRef = doc(db, "budgets", updatedBudget.id);
      const { id, userId, ...dataToUpdateFirebase } = updatedBudget;

      const dataToSave: any = { ...dataToUpdateFirebase };

      if (dataToUpdateFirebase.hasOwnProperty('startDate')) {
        dataToSave.startDate = dataToUpdateFirebase.startDate ? Timestamp.fromDate(new Date(dataToUpdateFirebase.startDate)) : deleteField();
      }
      if (dataToUpdateFirebase.hasOwnProperty('endDate')) {
         dataToSave.endDate = dataToUpdateFirebase.endDate ? Timestamp.fromDate(new Date(dataToUpdateFirebase.endDate)) : deleteField();
      }
      if (dataToUpdateFirebase.hasOwnProperty('isRecurringBill')) {
        dataToSave.isRecurringBill = dataToUpdateFirebase.isRecurringBill;
      } else {
         dataToSave.isRecurringBill = deleteField(); // if not present in updatedBudget, remove it
      }
      if (dataToUpdateFirebase.hasOwnProperty('dueDateDay')) {
        dataToSave.dueDateDay = dataToUpdateFirebase.dueDateDay !== undefined ? dataToUpdateFirebase.dueDateDay : deleteField();
      } else {
        dataToSave.dueDateDay = deleteField(); // if not present in updatedBudget, remove it
      }
      
      await updateDoc(budgetRef, dataToSave);
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
            <p className="text-muted-foreground">Create and track your spending budgets and recurring bills.</p>
        </div>
        <CreateBudgetModal
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget} 
            editingBudget={editingBudget} 
            isOpen={isModalOpen}
            onOpenChange={handleModalOpenChange}
            trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />{editingBudget ? "Edit Budget" : "Create New Budget"}</Button>}
        />
      </div>

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
                  <CreateBudgetModal
                      onAddBudget={handleAddBudget}
                      onUpdateBudget={handleUpdateBudget}
                      editingBudget={editingBudget}
                      isOpen={isModalOpen && !editingBudget} 
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

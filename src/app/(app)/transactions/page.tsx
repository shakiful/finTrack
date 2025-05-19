
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TransactionTable } from '@/components/transactions/transaction-table';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import type { Transaction, Budget } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  orderBy,
  getDoc,
  getDocs, // Added for fetching budgets and transactions for recalculation
  Firestore
} from "firebase/firestore";
import { onAuthStateChanged, User } from 'firebase/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

// Function to update spentAmount for affected budgets
async function updateAffectedBudgets(userId: string, transactionCategory: string, transactionDate: Date, firestoreDb: Firestore) {
  if (!userId || !transactionCategory || !firestoreDb) return;

  try {
    const budgetsQuery = query(
      collection(firestoreDb, "budgets"),
      where("userId", "==", userId),
      where("category", "==", transactionCategory)
    );
    const budgetSnapshots = await getDocs(budgetsQuery);

    for (const budgetDoc of budgetSnapshots.docs) {
      const budget = { id: budgetDoc.id, ...budgetDoc.data() } as Budget;
      let periodStartDate: Date | null = null;
      let periodEndDate: Date | null = null;

      if (budget.period === 'Custom' && budget.startDate && budget.endDate) {
        periodStartDate = new Date(budget.startDate);
        periodEndDate = new Date(budget.endDate);
      } else if (budget.period === 'Monthly' && budget.startDate) {
        // For monthly budgets with a start date, assume the budget applies to the month of its start date
        // This logic might need refinement based on how users define/expect monthly budgets
        const budgetMonthDate = new Date(budget.startDate);
        if (transactionDate.getFullYear() === budgetMonthDate.getFullYear() &&
            transactionDate.getMonth() === budgetMonthDate.getMonth()){
             periodStartDate = startOfMonth(budgetMonthDate);
             periodEndDate = endOfMonth(budgetMonthDate);
        }
      }
      // Add more sophisticated period calculations for Quarterly/Yearly or Monthly without explicit startDate if needed.
      // For now, if periodStartDate/EndDate are not set, we skip recalculation for that budget.

      if (periodStartDate && periodEndDate) {
        // Ensure transaction date falls within the budget's active period
        if (transactionDate >= periodStartDate && transactionDate <= periodEndDate) {
          const transactionsForBudgetQuery = query(
            collection(firestoreDb, "transactions"),
            where("userId", "==", userId),
            where("category", "==", budget.category),
            where("type", "==", "expense"),
            where("date", ">=", Timestamp.fromDate(periodStartDate)),
            where("date", "<=", Timestamp.fromDate(periodEndDate))
          );

          const transactionsSnap = await getDocs(transactionsForBudgetQuery);
          let newSpentAmount = 0;
          transactionsSnap.forEach(txDoc => {
            newSpentAmount += Math.abs(txDoc.data().amount);
          });

          const budgetRef = doc(firestoreDb, "budgets", budget.id);
          await updateDoc(budgetRef, { spentAmount: newSpentAmount });
        }
      }
    }
  } catch (error) {
    console.error("Error updating budget spent amounts:", error);
    // Optionally, show a toast to the user if this fails, but be mindful of toast fatigue
  }
}


export default function TransactionsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setTransactions([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc")
    );

    const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
      const transactionsData: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactionsData.push({
          id: doc.id,
          userId: data.userId,
          date: (data.date as Timestamp).toDate().toISOString(),
          description: data.description,
          category: data.category,
          amount: data.amount,
          type: data.type,
        });
      });
      setTransactions(transactionsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      toast({ title: "Error", description: "Could not fetch transactions.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [currentUser]);

  const handleAddTransaction = async (newTransactionData: Omit<Transaction, 'id' | 'userId'>) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to add transactions.", variant: "destructive" });
      return;
    }
    try {
      const transactionToSave = {
        ...newTransactionData,
        userId: currentUser.uid,
        date: Timestamp.fromDate(new Date(newTransactionData.date)),
      };
      await addDoc(collection(db, "transactions"), transactionToSave);
      toast({ title: "Transaction Added", description: "Your transaction has been successfully added." });
      setIsModalOpen(false);
      if (newTransactionData.type === 'expense') {
        await updateAffectedBudgets(currentUser.uid, newTransactionData.category, new Date(newTransactionData.date), db);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({ title: "Error", description: "Could not add transaction.", variant: "destructive" });
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
    if (!currentUser || !updatedTransaction.id || !editingTransaction) {
      toast({ title: "Error", description: "Could not update transaction. Missing user or transaction ID.", variant: "destructive" });
      return;
    }
    try {
      const transactionRef = doc(db, "transactions", updatedTransaction.id);
      const originalTransactionCategory = editingTransaction.category;
      const originalTransactionDate = new Date(editingTransaction.date);
      const originalTransactionType = editingTransaction.type;


      const { id, userId, ...dataFieldsToUpdate } = updatedTransaction;
      const dataToSave = {
        ...dataFieldsToUpdate,
        date: Timestamp.fromDate(new Date(updatedTransaction.date)),
      };

      await updateDoc(transactionRef, dataToSave);
      toast({ title: "Transaction Updated", description: "Your transaction has been successfully updated." });

      // Update budget for the new category/date if it's an expense
      if (updatedTransaction.type === 'expense') {
        await updateAffectedBudgets(currentUser.uid, updatedTransaction.category, new Date(updatedTransaction.date), db);
      }
      // If category or date changed, or type changed from income to expense, also update the old budget
      if (originalTransactionType === 'expense' && (originalTransactionCategory !== updatedTransaction.category || originalTransactionDate.getTime() !== new Date(updatedTransaction.date).getTime() || updatedTransaction.type !== 'expense')) {
        await updateAffectedBudgets(currentUser.uid, originalTransactionCategory, originalTransactionDate, db);
      }


      setIsModalOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({ title: "Error", description: "Could not update transaction.", variant: "destructive" });
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!currentUser) return;
    try {
      const txDocRef = doc(db, "transactions", transactionId);
      const txDocSnap = await getDoc(txDocRef);

      if (!txDocSnap.exists()) {
        toast({ title: "Error", description: "Transaction not found.", variant: "destructive" });
        return;
      }
      const deletedTransactionData = txDocSnap.data() as Transaction;


      await deleteDoc(txDocRef);
      toast({ title: "Transaction Deleted", description: "The transaction has been removed." });

      if (deletedTransactionData.type === 'expense' && deletedTransactionData.category) {
        await updateAffectedBudgets(currentUser.uid, deletedTransactionData.category, new Date(deletedTransactionData.date), db);
      }

    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({ title: "Error", description: "Could not delete transaction.", variant: "destructive" });
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };

  if (isLoading && !currentUser) {
    return <div className="flex justify-center items-center h-64">Loading user data...</div>;
  }
  if (!currentUser && !isLoading) {
     return <div className="flex justify-center items-center h-64">Please log in to view transactions.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">View and manage all your income and expenses.</p>
        </div>
        <AddTransactionModal
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            editingTransaction={editingTransaction}
            isOpen={isModalOpen}
            onOpenChange={handleModalOpenChange}
            trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />Add New Transaction</Button>}
        />
      </div>

      {isLoading && currentUser && <div className="text-center">Loading transactions...</div>}
      {!isLoading && currentUser && (
        <TransactionTable
          transactions={transactions}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />
      )}
    </div>
  );
}

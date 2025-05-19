
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
  getDocs,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged, User } from 'firebase/auth';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

// Function to recalculate and update spent amount for affected budgets
async function updateAffectedBudgets(
  userId: string,
  transactionCategory: string,
  dbInstance: typeof db
) {
  console.log(`Updating budgets for category: ${transactionCategory} and user: ${userId}`);
  const budgetsRef = collection(dbInstance, 'budgets');
  const qBudgets = query(
    budgetsRef,
    where('userId', '==', userId),
    where('category', '==', transactionCategory)
  );

  try {
    const budgetSnapshot = await getDocs(qBudgets);
    if (budgetSnapshot.empty) {
      console.log(`No budgets found for category ${transactionCategory}`);
      return;
    }

    for (const budgetDoc of budgetSnapshot.docs) {
      const budget = { id: budgetDoc.id, ...budgetDoc.data() } as Budget;
      let periodStart: Date | null = null;
      let periodEnd: Date | null = null;

      if (budget.period === 'Custom' && budget.startDate && budget.endDate) {
        periodStart = parseISO(budget.startDate);
        periodEnd = parseISO(budget.endDate);
      } else if (budget.period === 'Monthly' && budget.startDate) {
        // Assumes startDate on a "Monthly" budget defines its specific month
        const budgetMonthDate = parseISO(budget.startDate);
        periodStart = startOfMonth(budgetMonthDate);
        periodEnd = endOfMonth(budgetMonthDate);
      } else {
        // Skip budgets where the period cannot be clearly determined for recalculation
        // (e.g., 'Monthly' without a startDate, 'Quarterly', 'Yearly' without full logic here)
        console.log(`Skipping budget ${budget.name} due to indeterminate period for client-side update.`);
        continue;
      }

      if (!periodStart || !periodEnd) continue;

      const transactionsRef = collection(dbInstance, 'transactions');
      const qTransactions = query(
        transactionsRef,
        where('userId', '==', userId),
        where('category', '==', budget.category),
        where('date', '>=', Timestamp.fromDate(periodStart)),
        where('date', '<=', Timestamp.fromDate(periodEnd))
      );

      const transactionSnapshot = await getDocs(qTransactions);
      let newSpentAmount = 0;
      transactionSnapshot.forEach(txDoc => {
        const tx = txDoc.data() as Omit<Transaction, 'id' | 'userId'>;
        // Ensure amount is treated as positive for expenses when summing for budget's spentAmount
        if (tx.type === 'expense') {
             // amounts are stored negative for expenses, so take absolute or sum directly if budget expects positive spent
            newSpentAmount += Math.abs(tx.amount);
        }
        // If incomes were to reduce 'spentAmount' (unlikely for typical budgets), add logic here.
      });

      const budgetToUpdateRef = doc(dbInstance, 'budgets', budget.id);
      await updateDoc(budgetToUpdateRef, { spentAmount: newSpentAmount });
      console.log(`Updated budget "${budget.name}" (ID: ${budget.id}) spent amount to ${newSpentAmount}`);
    }
  } catch (error) {
    console.error("Error updating affected budgets:", error);
    // It's a background update, so direct user-facing toast might be noisy. Log is good.
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
      await updateAffectedBudgets(currentUser.uid, newTransactionData.category, db);
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
      const originalCategory = editingTransaction.category;
      
      const { id, userId, ...dataFieldsToUpdate } = updatedTransaction;
      const dataToSave = {
        ...dataFieldsToUpdate,
        date: Timestamp.fromDate(new Date(updatedTransaction.date)),
      };

      await updateDoc(transactionRef, dataToSave);
      toast({ title: "Transaction Updated", description: "Your transaction has been successfully updated." });
      
      // Update budget for the new/current category
      await updateAffectedBudgets(currentUser.uid, updatedTransaction.category, db);
      // If category changed, also update budget for the old category
      if (originalCategory && originalCategory !== updatedTransaction.category) {
        await updateAffectedBudgets(currentUser.uid, originalCategory, db);
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
      // Fetch the transaction first to get its details for budget update
      const txDocRef = doc(db, "transactions", transactionId);
      const txDocSnap = await getDoc(txDocRef); 
      
      if (!txDocSnap.exists()) {
        toast({ title: "Error", description: "Transaction not found, cannot update budgets.", variant: "destructive" });
        // Still attempt to delete if it exists by ID, though unlikely if not found here.
        await deleteDoc(doc(db, "transactions", transactionId)); // Attempt delete anyway
        toast({ title: "Transaction Deleted", description: "The transaction has been removed." });
        return;
      }
      // Casting to ensure we have the structure, though `id` and `userId` are not directly from `data()`
      const deletedTransactionData = txDocSnap.data() as { category: string, [key:string]: any };


      await deleteDoc(doc(db, "transactions", transactionId));
      toast({ title: "Transaction Deleted", description: "The transaction has been removed." });

      // Update affected budgets using the category from the fetched transaction data
      if (deletedTransactionData.category) {
        await updateAffectedBudgets(currentUser.uid, deletedTransactionData.category, db);
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


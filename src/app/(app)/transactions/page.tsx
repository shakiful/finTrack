
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TransactionTable } from '@/components/transactions/transaction-table';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import type { Transaction } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { onAuthStateChanged, User } from 'firebase/auth';

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
      orderBy("date", "desc") // Order by date descending
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
  }, [currentUser]); // Removed toast from dependencies

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
    if (!currentUser || !updatedTransaction.id) {
      toast({ title: "Error", description: "Could not update transaction. Missing user or transaction ID.", variant: "destructive" });
      return;
    }
    try {
      const transactionRef = doc(db, "transactions", updatedTransaction.id);
      
      // Prepare data for Firestore, excluding id and userId from the direct update payload
      const { id, userId, ...dataFieldsToUpdate } = updatedTransaction;
      const dataToSave = {
        ...dataFieldsToUpdate,
        date: Timestamp.fromDate(new Date(updatedTransaction.date)),
        // userId is not updated as it defines ownership
      };

      await updateDoc(transactionRef, dataToSave);
      toast({ title: "Transaction Updated", description: "Your transaction has been successfully updated." });
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
      await deleteDoc(doc(db, "transactions", transactionId));
      toast({ title: "Transaction Deleted", description: "The transaction has been removed." });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({ title: "Error", description: "Could not delete transaction.", variant: "destructive" });
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingTransaction(null); // Reset editing state when modal closes
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

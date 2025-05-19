"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TransactionTable } from '@/components/transactions/transaction-table';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import { Transaction, exampleTransactions } from '@/lib/types'; // Using example data
import { useToast } from "@/hooks/use-toast";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  // Load example transactions on mount
  useEffect(() => {
    setTransactions(exampleTransactions);
  }, []);

  const handleAddTransaction = (newTransactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...newTransactionData,
      id: String(Date.now() + Math.random()), // Simple unique ID
    };
    setTransactions(prev => [newTransaction, ...prev]); // Add to top for visibility
    setIsModalOpen(false);
  };
  
  const handleEditTransaction = (transaction: Transaction) => {
    // This would involve setting this transaction data into the modal
    // For simplicity, we'll just log it. A full edit would require a more complex modal or form.
    setEditingTransaction(transaction);
    toast({ title: "Edit Action", description: `Editing transaction: ${transaction.description}. (Full edit UI not implemented in this example)`});
    // Potentially open a modal pre-filled with transaction data
    // setIsModalOpen(true); // If modal supports edit mode
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    toast({ title: "Transaction Deleted", description: "The transaction has been removed." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">View and manage all your income and expenses.</p>
        </div>
        <AddTransactionModal 
            onAddTransaction={handleAddTransaction}
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />Add New Transaction</Button>}
        />
      </div>
      
      <TransactionTable 
        transactions={transactions} 
        onEdit={handleEditTransaction} 
        onDelete={handleDeleteTransaction} 
      />

      {/* If you want a separate modal instance for editing, it could be managed here */}
      {/* {editingTransaction && <EditTransactionModal transaction={editingTransaction} ... />} */}
    </div>
  );
}

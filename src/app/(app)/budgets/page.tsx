"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PieChartIcon, PlusCircle } from "lucide-react";
import { BudgetCard } from '@/components/budgets/budget-card';
import { CreateBudgetModal } from '@/components/budgets/create-budget-modal';
import { Budget, exampleBudgets } from '@/lib/types'; // Using example data
import { useToast } from "@/hooks/use-toast";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null); // For future edit functionality
  const { toast } = useToast();

  // Load example budgets on mount
  useEffect(() => {
    setBudgets(exampleBudgets);
  }, []);

  const handleAddBudget = (newBudgetData: Omit<Budget, 'id' | 'spentAmount'>) => {
    const newBudget: Budget = {
      ...newBudgetData,
      id: String(Date.now() + Math.random()), // Simple unique ID
      spentAmount: 0, // New budgets start with 0 spent
    };
    setBudgets(prev => [...prev, newBudget]);
    setIsModalOpen(false);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    // setIsModalOpen(true); // Open modal pre-filled with budget data
    toast({ title: "Edit Action", description: `Editing budget: ${budget.name}. (Full edit UI not implemented)`});
  };

  const handleDeleteBudget = (budgetId: string) => {
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
    toast({ title: "Budget Deleted", description: "The budget has been removed." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground">Create and track your spending budgets.</p>
        </div>
        <CreateBudgetModal
            onAddBudget={handleAddBudget}
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />Create New Budget</Button>}
        />
      </div>

      {budgets.length > 0 ? (
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
                    isOpen={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    trigger={<Button><PlusCircle className="w-4 h-4 mr-2" />Create New Budget</Button>}
                />
            </CardFooter>
        </Card>
      )}
      {/* Edit modal would go here, opened when editingBudget is set */}
    </div>
  );
}

// Placeholder Card component if not already defined elsewhere
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

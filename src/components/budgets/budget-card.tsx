"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Budget } from '@/lib/types';
import { PieChartIcon, Edit3, Trash2 } from "lucide-react";

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const progress = budget.allocatedAmount > 0 ? (budget.spentAmount / budget.allocatedAmount) * 100 : 0;
  const remaining = budget.allocatedAmount - budget.spentAmount;
  const isOverBudget = budget.spentAmount > budget.allocatedAmount;

  return (
    <Card className="flex flex-col transition-shadow duration-300 hover:shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <PieChartIcon className="w-6 h-6 text-primary" />
                <CardTitle className="text-xl">{budget.name}</CardTitle>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{budget.period}</span>
        </div>
        <CardDescription>Category: {budget.category}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Spent: ${budget.spentAmount.toFixed(2)}</span>
            <span>Allocated: ${budget.allocatedAmount.toFixed(2)}</span>
          </div>
          <Progress value={Math.min(progress, 100)} className={`mt-1 h-3 ${isOverBudget ? 'bg-red-500 [&>*]:bg-red-700' : ''}`} />
        </div>
        <p className={`text-sm font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
          {isOverBudget 
            ? `Over budget by $${Math.abs(remaining).toFixed(2)}` 
            : `$${remaining.toFixed(2)} remaining`}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(budget)} aria-label={`Edit budget ${budget.name}`}>
          <Edit3 className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(budget.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50" aria-label={`Delete budget ${budget.name}`}>
          <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />  <span className="hidden sm:inline">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

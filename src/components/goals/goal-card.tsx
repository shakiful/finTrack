"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Goal } from '@/lib/types';
import { Target, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onAddFunds: (goal: Goal) => void; // New prop for adding funds
}

export function GoalCard({ goal, onEdit, onDelete, onAddFunds }: GoalCardProps) {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const isCompleted = goal.currentAmount >= goal.targetAmount;

  return (
    <Card className={`flex flex-col transition-shadow duration-300 hover:shadow-xl ${isCompleted ? 'border-green-500 bg-green-500/5 dark:bg-green-500/10' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCompleted ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Target className="w-6 h-6 text-primary" />}
            <CardTitle className="text-xl">{goal.name}</CardTitle>
          </div>
          {isCompleted && <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">Completed!</span>}
        </div>
        <CardDescription>
          Target: ${goal.targetAmount.toFixed(2)}
          {goal.targetDate && ` by ${format(new Date(goal.targetDate), "MMM dd, yyyy")}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Saved: ${goal.currentAmount.toFixed(2)}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className={`mt-1 h-3 ${isCompleted ? '[&>*]:bg-green-500' : ''}`} />
        </div>
        {goal.description && <p className="mt-2 text-sm text-muted-foreground">{goal.description}</p>}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {!isCompleted && (
            <Button variant="outline" size="sm" onClick={() => onAddFunds(goal)}>
              Add Funds
            </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onEdit(goal)} aria-label={`Edit goal ${goal.name}`}>
          <Edit3 className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50" aria-label={`Delete goal ${goal.name}`}>
          <Trash2 className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

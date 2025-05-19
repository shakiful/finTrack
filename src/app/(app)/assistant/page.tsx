"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Lightbulb, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { aiPoweredBudgetSuggestions, AIPoweredBudgetSuggestionsOutput } from '@/ai/flows/ai-powered-budget-suggestions';
import { identifyPotentialSavings, IdentifyPotentialSavingsOutput, IdentifyPotentialSavingsInput } from '@/ai/flows/identify-potential-savings';
import { categorizeTransaction, CategorizeTransactionOutput } from '@/ai/flows/smart-transaction-categorization';
import { exampleTransactions } from '@/lib/types'; // For demo

interface AIResult {
  title: string;
  content: string;
  type: 'success' | 'error' | 'info';
}

export default function SmartAssistantPage() {
  const { toast } = useToast();
  
  // State for Budget Suggestions
  const [income, setIncome] = useState('');
  const [spendingHabits, setSpendingHabits] = useState('');
  const [budgetSuggestionResult, setBudgetSuggestionResult] = useState<AIResult | null>(null);
  const [isSuggestingBudget, setIsSuggestingBudget] = useState(false);

  // State for Savings Identification
  const [financialGoals, setFinancialGoals] = useState('');
  // For simplicity, we'll use stringified example transactions. In a real app, this would be dynamic.
  const [transactionDataForSavings, setTransactionDataForSavings] = useState(JSON.stringify(exampleTransactions.slice(0,10), null, 2));
  const [savingsResult, setSavingsResult] = useState<AIResult | null>(null);
  const [isIdentifyingSavings, setIsIdentifyingSavings] = useState(false);

  // State for Transaction Categorization
  const [transactionDesc, setTransactionDesc] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [categorizationResult, setCategorizationResult] = useState<AIResult | null>(null);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const handleBudgetSuggestions = async () => {
    if (!income || !spendingHabits) {
      toast({ title: "Missing Info", description: "Income and spending habits are required.", variant: "destructive" });
      return;
    }
    setIsSuggestingBudget(true);
    setBudgetSuggestionResult(null);
    try {
      const result: AIPoweredBudgetSuggestionsOutput = await aiPoweredBudgetSuggestions({
        income: parseFloat(income),
        spendingHabits,
      });
      setBudgetSuggestionResult({ title: "Budget Suggestions", content: result.suggestedBudgets, type: 'success' });
    } catch (error) {
      console.error("AI Budget Suggestion Error:", error);
      setBudgetSuggestionResult({ title: "Error", content: "Could not generate budget suggestions.", type: 'error' });
    }
    setIsSuggestingBudget(false);
  };

  const handleIdentifySavings = async () => {
     if (!transactionDataForSavings) {
      toast({ title: "Missing Info", description: "Transaction data is required.", variant: "destructive" });
      return;
    }
    setIsIdentifyingSavings(true);
    setSavingsResult(null);
    try {
      const input: IdentifyPotentialSavingsInput = { spendingData: transactionDataForSavings };
      if (financialGoals) input.financialGoals = financialGoals;
      
      const result: IdentifyPotentialSavingsOutput = await identifyPotentialSavings(input);
      const content = `Potential Savings Opportunities:\n${result.savingsOpportunities}\n\nTotal Potential Savings: ${result.totalPotentialSavings}`;
      setSavingsResult({ title: "Savings Opportunities", content, type: 'success' });
    } catch (error) {
      console.error("AI Savings Identification Error:", error);
      setSavingsResult({ title: "Error", content: "Could not identify potential savings.", type: 'error' });
    }
    setIsIdentifyingSavings(false);
  };

  const handleCategorizeTransaction = async () => {
    if (!transactionDesc || !transactionAmount) {
      toast({ title: "Missing Info", description: "Transaction description and amount are required.", variant: "destructive" });
      return;
    }
    setIsCategorizing(true);
    setCategorizationResult(null);
    try {
      const result: CategorizeTransactionOutput = await categorizeTransaction({
        transactionDescription: transactionDesc,
        transactionAmount: parseFloat(transactionAmount),
      });
      const content = `Category: ${result.category}\nConfidence: ${(result.confidence * 100).toFixed(0)}%`;
      setCategorizationResult({ title: "Transaction Categorized", content, type: 'success' });
    } catch (error) {
      console.error("AI Transaction Categorization Error:", error);
      setCategorizationResult({ title: "Error", content: "Could not categorize transaction.", type: 'error' });
    }
    setIsCategorizing(false);
  };

  const AIResultDisplay = ({ result }: { result: AIResult | null }) => {
    if (!result) return null;
    const Icon = result.type === 'success' ? CheckCircle : result.type === 'error' ? AlertTriangle : Lightbulb;
    const color = result.type === 'success' ? 'text-green-500' : result.type === 'error' ? 'text-red-500' : 'text-blue-500';

    return (
      <div className={`mt-4 p-4 border rounded-md bg-background ${result.type === 'error' ? 'border-red-500/50' : 'border-green-500/50'}`}>
        <div className={`flex items-center font-semibold ${color}`}>
          <Icon className="w-5 h-5 mr-2" />
          {result.title}
        </div>
        <p className="mt-2 text-sm whitespace-pre-wrap text-foreground/80">{result.content}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Smart Financial Assistant</h1>
        <p className="text-muted-foreground">Leverage AI to get insights and suggestions for your finances.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="text-primary"/> AI-Powered Budget Suggestions</CardTitle>
          <CardDescription>Get personalized budget recommendations based on your income and spending.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="income">Monthly Income ($)</Label>
            <Input id="income" type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="e.g., 5000" />
          </div>
          <div>
            <Label htmlFor="spendingHabits">Describe Your Spending Habits</Label>
            <Textarea id="spendingHabits" value={spendingHabits} onChange={(e) => setSpendingHabits(e.target.value)} placeholder="e.g., Dining out: $200, Groceries: $400, Hobbies: $100..." />
          </div>
          <Button onClick={handleBudgetSuggestions} disabled={isSuggestingBudget}>
            {isSuggestingBudget ? 'Generating...' : 'Get Budget Suggestions'}
          </Button>
          <AIResultDisplay result={budgetSuggestionResult} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary"/> Identify Potential Savings</CardTitle>
          <CardDescription>Let AI analyze your spending and find ways to save money.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transactionData">Transaction Data (JSON format or detailed list)</Label>
            <Textarea id="transactionData" value={transactionDataForSavings} onChange={(e) => setTransactionDataForSavings(e.target.value)} rows={5} placeholder="Paste your transaction data here or describe it." />
            <p className="text-xs text-muted-foreground mt-1">Using example transactions for demo. Replace with your actual data.</p>
          </div>
          <div>
            <Label htmlFor="financialGoals">Financial Goals (Optional)</Label>
            <Input id="financialGoals" value={financialGoals} onChange={(e) => setFinancialGoals(e.target.value)} placeholder="e.g., Save for a car, Pay off debt" />
          </div>
          <Button onClick={handleIdentifySavings} disabled={isIdentifyingSavings}>
            {isIdentifyingSavings ? 'Analyzing...' : 'Find Savings'}
          </Button>
          <AIResultDisplay result={savingsResult} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="text-primary"/> Smart Transaction Categorization</CardTitle>
          <CardDescription>Automatically categorize a transaction based on its description and amount.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transactionDesc">Transaction Description</Label>
            <Input id="transactionDesc" value={transactionDesc} onChange={(e) => setTransactionDesc(e.target.value)} placeholder="e.g., Starbucks Coffee" />
          </div>
           <div>
            <Label htmlFor="transactionAmount">Transaction Amount ($)</Label>
            <Input id="transactionAmount" type="number" value={transactionAmount} onChange={(e) => setTransactionAmount(e.target.value)} placeholder="e.g., 5.75 (use negative for expenses if applicable)" />
          </div>
          <Button onClick={handleCategorizeTransaction} disabled={isCategorizing}>
            {isCategorizing ? 'Categorizing...' : 'Categorize Transaction'}
          </Button>
          <AIResultDisplay result={categorizationResult} />
        </CardContent>
      </Card>
    </div>
  );
}

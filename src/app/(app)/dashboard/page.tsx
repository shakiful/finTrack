
"use client";

import React, { useState, useEffect } from 'react'; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart as LineChartIconLucide, PieChartIcon, TrendingUp, TrendingDown, PlusCircle, DollarSign, CalendarDays, Target, Banknote, HandCoins, Tv, Zap, Dumbbell } from "lucide-react";
import Link from "next/link";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell, Line, LineChart, PieChart } from 'recharts';
import type { Transaction, Goal } from '@/lib/types'; // Updated import
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db } from '@/lib/firebase'; // Firebase
import { collection, query, where, onSnapshot, Timestamp, orderBy, limit } from "firebase/firestore"; // Firebase
import { onAuthStateChanged, User } from 'firebase/auth'; // Firebase
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';


const SummaryWidget = ({ title, value, icon, trend, trendValue, isLoading }: { title: string; value: string; icon: React.ReactNode; trend?: 'up' | 'down'; trendValue?: string, isLoading?: boolean }) => (
  <Card className="transition-shadow duration-300 hover:shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="w-3/4 h-8 mt-1" /> : <div className="text-2xl font-bold">{value}</div>}
      {trend && trendValue && !isLoading && (
        <p className={`text-xs text-muted-foreground flex items-center ${trend === 'up' ? 'text-accent' : 'text-destructive'}`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {trendValue}
        </p>
      )}
      {isLoading && <Skeleton className="w-1/2 h-4 mt-1" />}
    </CardContent>
  </Card>
);


export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [financialGoals, setFinancialGoals] = useState<Goal[]>([]);
  
  // State for dashboard summaries - these will be calculated
  const [currentBalance, setCurrentBalance] = useState(0);
  const [mtdIncome, setMtdIncome] = useState(0);
  const [mtdExpenses, setMtdExpenses] = useState(0);
  const [savingsProgress, setSavingsProgress] = useState(0); // percentage

  // Chart data states
  const [incomeExpenseChartData, setIncomeExpenseChartData] = useState<any[]>([]);
  const [spendingData, setSpendingData] = useState<any[]>([]);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setMounted(true); // Indicate client-side mount after auth state is known
      if (!user) {
        setIsLoading(false);
        // Reset all data if user logs out
        setRecentTransactions([]);
        setFinancialGoals([]);
        setCurrentBalance(0);
        setMtdIncome(0);
        setMtdExpenses(0);
        setSavingsProgress(0);
        setIncomeExpenseChartData([]);
        setSpendingData([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch transactions for dashboard
  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const sixMonthsAgo = startOfMonth(subMonths(now, 5)); // For 6 months of data including current

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      where("date", ">=", Timestamp.fromDate(sixMonthsAgo)), // Fetch last 6 months for charts/MTD
      orderBy("date", "desc")
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const allFetchedTransactions: Transaction[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        allFetchedTransactions.push({ 
          id: doc.id, 
          ...data, 
          date: (data.date as Timestamp).toDate().toISOString() 
        } as Transaction);
      });
      
      setRecentTransactions(allFetchedTransactions.slice(0, 5));

      // Calculate MTD Income/Expenses and Current Balance
      let newMtdIncome = 0;
      let newMtdExpenses = 0;
      let newCurrentBalance = 0; // This might need a starting point or be calculated from all transactions ever

      const monthlyIncome: Record<string, number> = {};
      const monthlyExpenses: Record<string, number> = {};
      const categorySpending: Record<string, number> = {};


      allFetchedTransactions.forEach(tx => {
        const txDate = new Date(tx.date);
        // For current balance, sum all
        if (tx.type === 'income') newCurrentBalance += tx.amount;
        else newCurrentBalance -= Math.abs(tx.amount);

        // MTD calculations
        if (txDate >= currentMonthStart && txDate <= endOfMonth(now)) {
          if (tx.type === 'income') newMtdIncome += tx.amount;
          else newMtdExpenses += Math.abs(tx.amount);
        }

        // For Income/Expense Chart (last 6 months)
        const monthKey = format(txDate, "MMM"); // "Jan", "Feb"
        if (txDate >= sixMonthsAgo){
            if (tx.type === 'income') {
                monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + tx.amount;
            } else {
                monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + Math.abs(tx.amount);
            }
        }
         // For Spending by Category Chart (current month)
        if (tx.type === 'expense' && txDate >= currentMonthStart && txDate <= endOfMonth(now)) {
            categorySpending[tx.category] = (categorySpending[tx.category] || 0) + Math.abs(tx.amount);
        }
      });

      setMtdIncome(newMtdIncome);
      setMtdExpenses(newMtdExpenses);
      setCurrentBalance(newCurrentBalance); // Note: This is a running balance of fetched transactions.

      // Prepare income/expense chart data
      const chartMonths = Array.from({length: 6}, (_, i) => format(subMonths(now, 5 - i), "MMM"));
      const newIncomeExpenseData = chartMonths.map(month => ({
        month,
        income: monthlyIncome[month] || 0,
        expenses: monthlyExpenses[month] || 0,
      }));
      setIncomeExpenseChartData(newIncomeExpenseData);

      // Prepare spending by category data
      const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
      const newSpendingData = Object.entries(categorySpending)
        .map(([name, value], index) => ({ name, value, fill: colors[index % colors.length] }))
        .sort((a,b) => b.value - a.value) // Sort for pie chart display
        .slice(0,5); // Show top 5 categories, or adjust as needed
      setSpendingData(newSpendingData);


      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching transactions for dashboard:", error);
      setIsLoading(false);
    });

    return () => unsubscribeTransactions();
  }, [currentUser]);

  // Fetch goals for dashboard
  useEffect(() => {
    if (!currentUser) return;
    
    const goalsQuery = query(
      collection(db, "goals"),
      where("userId", "==", currentUser.uid),
      limit(3) // Limit to 3 for dashboard display
    );

    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      const fetchedGoals: Goal[] = [];
      let totalTarget = 0;
      let totalCurrent = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        const goal = { 
            id: doc.id, 
            ...data, 
            targetDate: data.targetDate ? (data.targetDate as Timestamp).toDate().toISOString() : undefined 
        } as Goal;
        fetchedGoals.push(goal);
        totalTarget += goal.targetAmount;
        totalCurrent += goal.currentAmount;
      });
      setFinancialGoals(fetchedGoals);
      if (totalTarget > 0) {
        setSavingsProgress(Math.round((totalCurrent / totalTarget) * 100));
      } else {
        setSavingsProgress(0);
      }
    });
    return () => unsubscribeGoals();
  }, [currentUser]);


const incomeExpenseChartConfig = { 
  income: { label: "Income", color: "hsl(var(--chart-2))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const spendingByCategoryChartConfig = {
  // Dynamically generate this based on spendingData keys if needed, or predefine common ones
  // For simplicity, this will be used by ChartContainer but legend/tooltip will use data keys
} satisfies ChartConfig;


  if (!mounted) { // Wait for client-side mount to avoid hydration issues with auth
    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div>
                    <Skeleton className="w-48 h-8" />
                    <Skeleton className="w-64 h-4 mt-2" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="w-32 h-10" />
                    <Skeleton className="w-32 h-10" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="w-full h-32 rounded-lg"/>)}
            </div>
             <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="w-full h-80 rounded-lg"/>
                <Skeleton className="w-full h-80 rounded-lg"/>
            </div>
        </div>
    );
  }

  if (isLoading && currentUser) {
     return <div className="text-center py-10">Loading dashboard data...</div>
  }
  
  if (!currentUser && !isLoading) {
     return <div className="text-center py-10">Please log in to view your dashboard.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
        </div>
        <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/transactions"><PlusCircle className="w-4 h-4 mr-2" />Add Transaction</Link></Button>
            <Button asChild><Link href="/budgets"><PieChartIcon className="w-4 h-4 mr-2" />Create Budget</Link></Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryWidget title="Current Balance" value={`$${currentBalance.toFixed(2)}`} icon={<DollarSign className="w-5 h-5 text-muted-foreground" />} isLoading={isLoading} />
        <SummaryWidget title="Income (MTD)" value={`$${mtdIncome.toFixed(2)}`} icon={<Banknote className="w-5 h-5 text-muted-foreground" />} trend="up" trendValue="" isLoading={isLoading} />
        <SummaryWidget title="Expenses (MTD)" value={`$${mtdExpenses.toFixed(2)}`} icon={<HandCoins className="w-5 h-5 text-muted-foreground" />} trend="down" trendValue="" isLoading={isLoading} />
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Savings Progress</CardTitle>
                <Target className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="w-1/2 h-8 mt-1"/> : <div className="text-2xl font-bold">{savingsProgress}%</div> }
                {isLoading ? <Skeleton className="w-full h-2 mt-2"/> : <Progress value={savingsProgress} className="w-full mt-2 h-2" /> }
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Income vs. Expenses</CardTitle>
            <CardDescription>Monthly overview for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] lg:h-[350px]">
            {isLoading ? <Skeleton className="w-full h-full" /> : (
             <ChartContainer config={incomeExpenseChartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeExpenseChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Legend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="income" strokeWidth={2} stroke="var(--color-income)" dot={{ fill: "var(--color-income)", r:4 }} activeDot={{r:6}} />
                  <Line type="monotone" dataKey="expenses" strokeWidth={2} stroke="var(--color-expenses)" dot={{ fill: "var(--color-expenses)", r:4 }} activeDot={{r:6}} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Current month's spending breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] lg:h-[350px] flex items-center justify-center">
            {isLoading ? <Skeleton className="w-full h-full" /> : (
            <ChartContainer config={spendingByCategoryChartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie data={spendingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false} 
                           label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              return (
                                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
                                      {`${(percent * 100).toFixed(0)}%`}
                                  </text>
                              );
                           }}
                      >
                       {spendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                       ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                      <Legend content={<ChartLegendContent nameKey="name"/>}/>
                  </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/transactions" className="text-sm text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="w-full h-40" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction: Transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className={`text-right ${transaction.type === 'income' ? 'text-accent' : 'text-destructive'}`}>
                        {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center">No recent transactions.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills & Subscriptions</CardTitle>
            <CardDescription>Don't miss a payment. (Static Demo)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Netflix', date: '25th June', amount: 15.99, icon: <Tv className="w-5 h-5" /> },
              { name: 'Electricity Bill', date: '28th June', amount: 75.50, icon: <Zap className="w-5 h-5" /> },
              { name: 'Gym Membership', date: '1st July', amount: 40.00, icon: <Dumbbell className="w-5 h-5" /> },
            ].map((bill, index) => (
              <div key={index} className="flex items-center p-3 rounded-md bg-muted/50">
                <div className="p-2 mr-3 rounded-full bg-primary/10 text-primary">
                  {bill.icon || <CalendarDays className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium">{bill.name}</p>
                  <p className="text-sm text-muted-foreground">Due: {bill.date}</p>
                </div>
                <p className="ml-auto font-semibold">${bill.amount.toFixed(2)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Goals</CardTitle>
          <Link href="/goals" className="text-sm text-primary hover:underline">Manage Goals</Link>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? Array.from({length:3}).map((_,i) => <Skeleton key={i} className="w-full h-40 rounded-lg"/>) : 
            financialGoals.length > 0 ? (
            financialGoals.map(goal => (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                  <CardDescription>Target: ${goal.targetAmount.toFixed(2)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="mb-2 h-3" />
                  <p className="text-sm text-muted-foreground">
                    ${goal.currentAmount.toFixed(2)} saved ({((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%)
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground md:col-span-2 lg:col-span-3 text-center">No financial goals set yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

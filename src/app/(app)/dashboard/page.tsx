
"use client";

import React, { useState, useEffect } from 'react'; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart as LineChartIconLucide, PieChartIcon, TrendingUp, TrendingDown, PlusCircle, DollarSign, CalendarDays, Target, Banknote, HandCoins, Tv, Zap, Dumbbell, CreditCard, Wifi, ShoppingBag, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell, Line, LineChart, PieChart as RechartsPieChart } from 'recharts';
import type { Transaction, Goal, Budget, UpcomingBillDisplay } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db } from '@/lib/firebase'; 
import { collection, query, where, onSnapshot, Timestamp, orderBy, limit } from "firebase/firestore"; 
import { onAuthStateChanged, User } from 'firebase/auth'; 
import { format, startOfMonth, endOfMonth, subMonths, getDate, getMonth, getYear, addMonths, isPast } from 'date-fns';


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
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true); 

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [financialGoals, setFinancialGoals] = useState<Goal[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBillDisplay[]>([]);
  
  const [currentBalance, setCurrentBalance] = useState(0);
  const [mtdIncome, setMtdIncome] = useState(0);
  const [mtdExpenses, setMtdExpenses] = useState(0);
  const [savingsProgress, setSavingsProgress] = useState(0); 

  const [incomeExpenseChartData, setIncomeExpenseChartData] = useState<any[]>([]);
  const [spendingData, setSpendingData] = useState<any[]>([]);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setMounted(true); 
      if (!user) {
        setIsLoadingDashboard(false);
        setRecentTransactions([]);
        setFinancialGoals([]);
        setUpcomingBills([]);
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

  // Fetch Transactions and Budgets for calculations
  useEffect(() => {
    if (!currentUser) return;
    setIsLoadingDashboard(true);

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const sixMonthsAgo = startOfMonth(subMonths(now, 5)); 

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      // Fetch more transactions if needed for accurate "paid" status of bills from previous month end
      orderBy("date", "desc") 
    );
    
    const budgetsQuery = query(
        collection(db, "budgets"),
        where("userId", "==", currentUser.uid)
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (transactionsSnapshot) => {
      const allFetchedTransactions: Transaction[] = [];
      transactionsSnapshot.forEach(doc => {
        const data = doc.data();
        allFetchedTransactions.push({ 
          id: doc.id, 
          ...data, 
          date: (data.date as Timestamp).toDate().toISOString() 
        } as Transaction);
      });
      
      setRecentTransactions(allFetchedTransactions.filter(tx => new Date(tx.date) >= sixMonthsAgo).slice(0, 5));

      let newMtdIncome = 0;
      let newMtdExpenses = 0;
      let newCurrentBalance = 0; 

      const monthlyIncome: Record<string, number> = {};
      const monthlyExpenses: Record<string, number> = {};
      const categorySpending: Record<string, number> = {};

      allFetchedTransactions.forEach(tx => {
        const txDate = new Date(tx.date);
        // Simplified balance - sum all transactions. Could be refined.
        if (tx.type === 'income') newCurrentBalance += tx.amount;
        else newCurrentBalance -= Math.abs(tx.amount);

        if (txDate >= currentMonthStart && txDate <= endOfMonth(now)) {
          if (tx.type === 'income') newMtdIncome += tx.amount;
          else newMtdExpenses += Math.abs(tx.amount);
        }

        const monthKey = format(txDate, "MMM"); 
        if (txDate >= sixMonthsAgo){
            if (tx.type === 'income') {
                monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + tx.amount;
            } else {
                monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + Math.abs(tx.amount);
            }
        }
        if (tx.type === 'expense' && txDate >= currentMonthStart && txDate <= endOfMonth(now)) {
            categorySpending[tx.category] = (categorySpending[tx.category] || 0) + Math.abs(tx.amount);
        }
      });

      setMtdIncome(newMtdIncome);
      setMtdExpenses(newMtdExpenses);
      setCurrentBalance(newCurrentBalance); 

      const chartMonths = Array.from({length: 6}, (_, i) => format(subMonths(now, 5 - i), "MMM"));
      const newIncomeExpenseData = chartMonths.map(month => ({
        month,
        income: monthlyIncome[month] || 0,
        expenses: monthlyExpenses[month] || 0,
      }));
      setIncomeExpenseChartData(newIncomeExpenseData);

      const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
      const newSpendingData = Object.entries(categorySpending)
        .map(([name, value], index) => ({ name, value, fill: colors[index % colors.length] }))
        .sort((a,b) => b.value - a.value) 
        .slice(0,5); 
      setSpendingData(newSpendingData);

      // Nested snapshot for budgets, or use Promise.all for separate fetches
      const unsubscribeBudgets = onSnapshot(budgetsQuery, (budgetsSnapshot) => {
          const fetchedBudgets: Budget[] = [];
          budgetsSnapshot.forEach(doc => {
            const data = doc.data();
            fetchedBudgets.push({
                id: doc.id,
                ...data
            } as Budget);
          });
          
          // Calculate Upcoming Bills
          const today = new Date();
          const currentYear = getYear(today);
          const currentMonthIndex = getMonth(today); // 0-11

          const bills: UpcomingBillDisplay[] = [];
          fetchedBudgets.filter(b => b.isRecurringBill && b.period === 'Monthly' && b.dueDateDay)
            .forEach(bill => {
                let dueDateThisMonth = new Date(currentYear, currentMonthIndex, bill.dueDateDay!);
                
                if (isPast(dueDateThisMonth) && getDate(today) > bill.dueDateDay!) { // If due date in current month is past
                    dueDateThisMonth = addMonths(dueDateThisMonth, 1); // Look at next month's due date
                }

                // Basic "paid" check: is there an expense transaction for this category this month?
                const isPaid = allFetchedTransactions.some(tx => 
                    tx.type === 'expense' &&
                    tx.category === bill.category &&
                    getMonth(new Date(tx.date)) === getMonth(dueDateThisMonth) && // Check if transaction is in the same month as the due date (current or next)
                    getYear(new Date(tx.date)) === getYear(dueDateThisMonth) &&
                    Math.abs(tx.amount) >= bill.allocatedAmount * 0.8 // Optional: amount check (e.g. at least 80% of bill)
                );

                bills.push({
                    id: bill.id,
                    name: bill.name,
                    category: bill.category,
                    amount: bill.allocatedAmount,
                    dueDate: dueDateThisMonth,
                    isPaid: isPaid,
                    // icon: mapCategoryToIcon(bill.category) // Implement mapCategoryToIcon
                });
            });
          
          setUpcomingBills(bills.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 3)); // Show top 3 upcoming
          setIsLoadingDashboard(false);
      });
      return () => unsubscribeBudgets(); // Clean up budget listener

    }, (error) => {
      console.error("Error fetching transactions for dashboard:", error);
      setIsLoadingDashboard(false);
    });

    return () => unsubscribeTransactions(); // Clean up transaction listener
  }, [currentUser]);


  // Fetch Goals
  useEffect(() => {
    if (!currentUser) return;
    
    const goalsQuery = query(
      collection(db, "goals"),
      where("userId", "==", currentUser.uid),
      limit(3) 
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
  // Dynamically filled by data
} satisfies ChartConfig;

const mapCategoryToIcon = (category: string): React.ReactNode => {
    switch (category.toLowerCase()) {
        case 'subscriptions':
        case 'netflix':
        case 'spotify':
            return <Tv className="w-5 h-5" />;
        case 'utilities':
        case 'electricity':
        case 'water':
            return <Zap className="w-5 h-5" />;
        case 'internet':
        case 'phone':
            return <Wifi className="w-5 h-5" />;
        case 'rent':
        case 'mortgage':
            return <HandCoins className="w-5 h-5" />; // Or a house icon
        case 'insurance':
            return <ShieldCheck className="w-5 h-5" />;
        case 'debt payment':
        case 'loan':
            return <CreditCard className="w-5 h-5" />;
        case 'shopping':
            return <ShoppingBag className="w-5 h-5" />;
        case 'gym':
            return <Dumbbell className="w-5 h-5" />;
        default:
            return <CalendarDays className="w-5 h-5" />;
    }
};


  if (!mounted) { 
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

  if (isLoadingDashboard && currentUser) {
     return <div className="text-center py-10">Loading dashboard data...</div>
  }
  
  if (!currentUser && !isLoadingDashboard) {
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
            <Button asChild><Link href="/budgets"><PieChartIcon className="w-4 h-4 mr-2" />Manage Budgets</Link></Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryWidget title="Current Balance" value={`$${currentBalance.toFixed(2)}`} icon={<DollarSign className="w-5 h-5 text-muted-foreground" />} isLoading={isLoadingDashboard} />
        <SummaryWidget title="Income (MTD)" value={`$${mtdIncome.toFixed(2)}`} icon={<Banknote className="w-5 h-5 text-muted-foreground" />} trend="up" trendValue="" isLoading={isLoadingDashboard} />
        <SummaryWidget title="Expenses (MTD)" value={`$${mtdExpenses.toFixed(2)}`} icon={<HandCoins className="w-5 h-5 text-muted-foreground" />} trend="down" trendValue="" isLoading={isLoadingDashboard} />
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Savings Progress</CardTitle>
                <Target className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoadingDashboard ? <Skeleton className="w-1/2 h-8 mt-1"/> : <div className="text-2xl font-bold">{savingsProgress}%</div> }
                {isLoadingDashboard ? <Skeleton className="w-full h-2 mt-2"/> : <Progress value={savingsProgress} className="w-full mt-2 h-2" /> }
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
            {isLoadingDashboard ? <Skeleton className="w-full h-full" /> : (
             <ChartContainer config={incomeExpenseChartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeExpenseChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <ChartLegend content={<ChartLegendContent />} />
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
            {isLoadingDashboard ? <Skeleton className="w-full h-full" /> : (
            <ChartContainer config={spendingByCategoryChartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
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
                  </RechartsPieChart>
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
            {isLoadingDashboard ? <Skeleton className="w-full h-40" /> : (
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
            <CardDescription>Key recurring monthly payments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingDashboard ? Array.from({length:3}).map((_,i) => <Skeleton key={i} className="w-full h-16 rounded-md"/>) : 
            upcomingBills.length > 0 ? (
              upcomingBills.map((bill) => (
                <div key={bill.id} className={`flex items-center p-3 rounded-md bg-muted/50 ${bill.isPaid ? 'opacity-70' : ''}`}>
                  <div className={`p-2 mr-3 rounded-full ${bill.isPaid ? 'bg-green-500/20 text-green-600' : 'bg-primary/10 text-primary'}`}>
                    {bill.isPaid ? <CheckCircle2 className="w-5 h-5" /> : (mapCategoryToIcon(bill.category) || <CalendarDays className="w-5 h-5" />)}
                  </div>
                  <div>
                    <p className={`font-medium ${bill.isPaid ? 'line-through' : ''}`}>{bill.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {format(bill.dueDate, "MMM dd")}
                    </p>
                  </div>
                  <p className={`ml-auto font-semibold ${bill.isPaid ? 'line-through text-muted-foreground' : ''}`}>
                    ${bill.amount.toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">No upcoming bills marked, or all paid for the current/next cycle. Add recurring bills in Budgets.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Goals</CardTitle>
          <Link href="/goals" className="text-sm text-primary hover:underline">Manage Goals</Link>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingDashboard ? Array.from({length:3}).map((_,i) => <Skeleton key={i} className="w-full h-40 rounded-lg"/>) : 
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

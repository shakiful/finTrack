
"use client";

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, PieChartIcon, TrendingUp, TrendingDown, PlusCircle, DollarSign, CalendarDays, Target, Banknote, HandCoins } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell, Line, PieChart } from 'recharts';
import { exampleTransactions, exampleGoals, Transaction } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton import

const chartData = [
  { month: "Jan", income: 4000, expenses: 2400 },
  { month: "Feb", income: 3000, expenses: 1398 },
  { month: "Mar", income: 2000, expenses: 5800 },
  { month: "Apr", income: 2780, expenses: 3908 },
  { month: "May", income: 1890, expenses: 4800 },
  { month: "Jun", income: 2390, expenses: 3800 },
];

const spendingData = [
  { name: 'Groceries', value: 400, fill: "hsl(var(--chart-1))" },
  { name: 'Utilities', value: 300, fill: "hsl(var(--chart-2))" },
  { name: 'Transport', value: 200, fill: "hsl(var(--chart-3))" },
  { name: 'Entertainment', value: 250, fill: "hsl(var(--chart-4))" },
  { name: 'Other', value: 150, fill: "hsl(var(--chart-5))" },
];

const chartConfig = {
  income: { label: "Income", color: "hsl(var(--chart-2))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-1))" },
};

const SummaryWidget = ({ title, value, icon, trend, trendValue }: { title: string; value: string; icon: React.ReactNode; trend?: 'up' | 'down'; trendValue?: string }) => (
  <Card className="transition-shadow duration-300 hover:shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && trendValue && (
        <p className={`text-xs text-muted-foreground flex items-center ${trend === 'up' ? 'text-accent' : 'text-destructive'}`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {trendValue} from last month
        </p>
      )}
    </CardContent>
  </Card>
);


export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const recentTransactions = exampleTransactions.slice(0, 5);
  const currentBalance = 5830.50;
  const mtdIncome = 1250.00;
  const mtdExpenses = 489.75;
  const savingsProgress = 65; // percentage

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
        </div>
        <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/transactions/add"><PlusCircle className="w-4 h-4 mr-2" />Add Transaction</Link></Button>
            <Button asChild><Link href="/budgets/create"><PieChartIcon className="w-4 h-4 mr-2" />Create Budget</Link></Button>
        </div>
      </div>
      
      {/* Summary Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryWidget title="Current Balance" value={`$${currentBalance.toFixed(2)}`} icon={<DollarSign className="w-5 h-5 text-muted-foreground" />} trend="up" trendValue="+5.2%" />
        <SummaryWidget title="Income (MTD)" value={`$${mtdIncome.toFixed(2)}`} icon={<Banknote className="w-5 h-5 text-muted-foreground" />} trend="up" trendValue="+10%" />
        <SummaryWidget title="Expenses (MTD)" value={`$${mtdExpenses.toFixed(2)}`} icon={<HandCoins className="w-5 h-5 text-muted-foreground" />} trend="down" trendValue="-3%" />
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Savings Progress</CardTitle>
                <Target className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{savingsProgress}%</div>
                <Progress value={savingsProgress} className="w-full mt-2 h-2" />
            </CardContent>
        </Card>
      </div>

      {/* Main Charts Area */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Income vs. Expenses</CardTitle>
            <CardDescription>Monthly overview for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] lg:h-[350px]">
             <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Current month's spending breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] lg:h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={spendingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false} 
                         label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Upcoming Bills */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/transactions" className="text-sm text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
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
                {mounted ? (
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
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-tx-${index}`}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[70px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills & Subscriptions</CardTitle>
            <CardDescription>Don't miss a payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Netflix', date: '25th June', amount: 15.99, icon: <Image src="https://placehold.co/24x24.png" alt="Netflix" width={24} height={24} data-ai-hint="tv streaming" /> },
              { name: 'Electricity Bill', date: '28th June', amount: 75.50, icon: <Image src="https://placehold.co/24x24.png" alt="Electricity" width={24} height={24} data-ai-hint="energy power" /> },
              { name: 'Gym Membership', date: '1st July', amount: 40.00, icon: <Image src="https://placehold.co/24x24.png" alt="Gym" width={24} height={24} data-ai-hint="fitness workout" /> },
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

      {/* Financial Goals Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Goals</CardTitle>
          <Link href="/goals" className="text-sm text-primary hover:underline">Manage Goals</Link>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mounted ? (
            exampleGoals.slice(0,3).map(goal => (
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
            Array.from({ length: 3 }).map((_, index) => ( 
              <Card key={`loading-goal-${index}`}>
                <CardHeader>
                  <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
                  <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}


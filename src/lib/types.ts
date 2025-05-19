export interface Transaction {
  id: string;
  date: string; // ISO string
  description: string;
  category: string;
  amount: number; // positive for income, negative for expense
  type: 'income' | 'expense';
}

export interface Budget {
  id: string;
  name: string; // e.g., "Groceries Q3"
  category: string; // e.g., "Groceries"
  allocatedAmount: number;
  spentAmount: number;
  period: 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom';
  startDate?: string; // ISO string, for custom period
  endDate?: string; // ISO string, for custom period
}

export interface Goal {
  id:string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // ISO string
  description?: string;
}

// Example data - replace with actual data fetching logic
export const exampleTransactions: Transaction[] = [
  { id: '1', date: new Date().toISOString(), description: 'Salary Deposit', category: 'Income', amount: 5000, type: 'income' },
  { id: '2', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: 'Groceries', category: 'Food', amount: -75, type: 'expense' },
  { id: '3', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: 'Netflix Subscription', category: 'Entertainment', amount: -15, type: 'expense' },
  { id: '4', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'Freelance Project', category: 'Income', amount: 300, type: 'income' },
  { id: '5', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), description: 'Dinner Out', category: 'Food', amount: -50, type: 'expense' },
];

export const exampleBudgets: Budget[] = [
  { id: '1', name: 'Monthly Groceries', category: 'Food', allocatedAmount: 400, spentAmount: 125, period: 'Monthly' },
  { id: '2', name: 'Entertainment Fund', category: 'Entertainment', allocatedAmount: 150, spentAmount: 65, period: 'Monthly' },
  { id: '3', name: 'Utilities', category: 'Utilities', allocatedAmount: 200, spentAmount: 180, period: 'Monthly' },
];

export const exampleGoals: Goal[] = [
  { id: '1', name: 'Vacation to Hawaii', targetAmount: 3000, currentAmount: 1200, targetDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '2', name: 'New Laptop', targetAmount: 1500, currentAmount: 400, targetDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '3', name: 'Emergency Fund', targetAmount: 5000, currentAmount: 2500 },
];


export interface Transaction {
  id: string;
  userId: string; // Added to scope to user
  date: string; // ISO string
  description: string;
  category: string;
  amount: number; // positive for income, negative for expense
  type: 'income' | 'expense';
}

export interface Budget {
  id: string;
  userId: string; // Added to scope to user
  name: string; // e.g., "Groceries Q3"
  category: string; // e.g., "Groceries"
  allocatedAmount: number;
  spentAmount: number;
  period: 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom';
  startDate?: string; // ISO string, for custom period
  endDate?: string; // ISO string, for custom period

  // New fields for recurring bills/subscriptions
  isRecurringBill?: boolean;
  dueDateDay?: number; // Day of the month (1-31) for monthly bills, if period is 'Monthly'
}

export interface Goal {
  id:string;
  userId: string; // Added to scope to user
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // ISO string
  description?: string;
}

// Example data has been removed as data will now come from Firestore.
export const exampleTransactions: Transaction[] = [];
export const exampleBudgets: Budget[] = [];
export const exampleGoals: Goal[] = [];

// Interface for displaying upcoming bills on the dashboard
export interface UpcomingBillDisplay {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  icon?: React.ReactNode; // Optional: for mapping category to icon
}

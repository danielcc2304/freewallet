export type ExpenseKind = 'expense' | 'income' | 'transfer' | 'refund';
export type ExpenseGroup = 'needs' | 'wants' | 'savings';
export interface ExpenseAccount {
    id: string;
    name: string;
    type: 'bank' | 'cash' | 'credit';
    openingBalanceCents: number;
    openingDate: string;
    archived: boolean;
}
export interface ExpenseCategory {
    id: string;
    name: string;
    color: string;
    group: ExpenseGroup;
}
export interface ExpenseEntry {
    id: string;
    kind: ExpenseKind;
    date: string;
    amountCents: number;
    accountId: string;
    toAccountId?: string;
    categoryId?: string;
    description: string;
    tags: string[];
    note: string;
    recurrenceId?: string;
    scheduledDate?: string;
}
export interface ExpenseBudget {
    month: string;
    limitCents: number;
    categoryLimits: { categoryId: string; limitCents: number }[];
}
export interface ExpenseRecurrence {
    id: string;
    title: string;
    kind: 'expense' | 'income';
    amountCents: number;
    accountId: string;
    categoryId?: string;
    startDate: string;
    endDate?: string;
    frequency: 'weekly' | 'monthly' | 'yearly';
    paused: boolean;
    skippedDates: string[];
}
export interface ExpenseGoal {
    id: string;
    name: string;
    targetCents: number;
    savedCents: number;
    deadline?: string;
}
export interface ExpenseBook {
    version: 1;
    accounts: ExpenseAccount[];
    categories: ExpenseCategory[];
    entries: ExpenseEntry[];
    budgets: ExpenseBudget[];
    recurring: ExpenseRecurrence[];
    goals: ExpenseGoal[];
}

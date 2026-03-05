
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/contexts/AppContext';
import type { ExpenseRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { getYear, getMonth, format } from 'date-fns';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const currentYear = getYear(new Date());
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: format(new Date(currentYear, i), 'MMMM') }));

const expenseSchema = z.object({
  amount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0, { message: "Amount cannot be negative." })
  ),
  year: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().int().min(2020, { message: "Year must be 2020 or later." }).max(currentYear + 1, { message: "Invalid year." })
  ),
  month: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().int().min(1, { message: "Invalid month." }).max(12, { message: "Invalid month." })
  ),
  paid: z.boolean().default(false),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customerId: string;
  expense?: ExpenseRecord | null; // For editing
  targetMonthYear?: { month: number; year: number } | null; // For pre-filling month/year when adding
  onSuccess: () => void; // Callback to refresh parent data
}

export default function ExpenseFormModal({
  isOpen,
  onOpenChange,
  customerId,
  expense,
  targetMonthYear,
  onSuccess,
}: ExpenseFormModalProps) {
  const { addExpense, updateExpense, deleteExpense, getExpenseForCustomerByMonthYear } = useAppContext();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      year: targetMonthYear?.year || expense?.year || getYear(new Date()),
      month: targetMonthYear?.month || expense?.month || getMonth(new Date()) + 1,
      paid: expense?.paid || false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        form.reset({
          amount: expense.amount,
          year: expense.year,
          month: expense.month,
          paid: expense.paid,
        });
      } else if (targetMonthYear) {
         const existing = getExpenseForCustomerByMonthYear(customerId, targetMonthYear.year, targetMonthYear.month);
         if (existing) {
            form.reset({ amount: existing.amount, year: existing.year, month: existing.month, paid: existing.paid });
         } else {
            form.reset({
              amount: 0,
              year: targetMonthYear.year,
              month: targetMonthYear.month,
              paid: false,
            });
         }
      } else {
        form.reset({
          amount: 0,
          year: getYear(new Date()),
          month: getMonth(new Date()) + 1,
          paid: false,
        });
      }
    }
  }, [isOpen, expense, targetMonthYear, form, customerId, getExpenseForCustomerByMonthYear]);

  const onSubmit = (data: ExpenseFormData) => {
    const existingExpenseForMonth = getExpenseForCustomerByMonthYear(customerId, data.year, data.month);
    if (existingExpenseForMonth && (!expense || existingExpenseForMonth.id !== expense.id)) {
      toast({ title: "Error", description: "An expense record already exists for this month and year.", variant: "destructive" });
      return;
    }

    try {
      if (expense) { // Editing existing expense
        updateExpense({ ...expense, ...data });
        toast({ title: "Expense Updated", description: "Expense record updated successfully." });
      } else { // Adding new expense
        addExpense({ customerId, ...data });
        toast({ title: "Expense Added", description: "New expense record added successfully." });
      }
      onSuccess(); // Call parent refresh
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "An error occurred. Please try again.", variant: "destructive" });
      console.error("Expense form error:", error);
    }
  };

  const handleDelete = async () => {
    if (!expense) return;
    
    try {
      const success = await deleteExpense(expense.id);
      if (success) {
        toast({ 
          title: "Expense Deleted", 
          description: `Expense for ${format(new Date(expense.year, expense.month - 1), 'MMMM yyyy')} has been deleted.`
        });
        onSuccess(); // Call parent refresh
        onOpenChange(false);
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to delete expense. Please try again.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "An error occurred while deleting the expense.", 
        variant: "destructive" 
      });
      console.error("Delete expense error:", error);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          <DialogDescription>
            {expense ? 'Update the details of this expense record.' : 'Enter details for a new monthly expense.'}
          </DialogDescription>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={String(field.value)} disabled={!!expense}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={String(field.value)} disabled={!!expense}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (Rs.)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Paid Status</FormLabel>
                    <FormDescription>
                      Mark if this expense has been paid.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              {expense && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button type="submit">{expense ? 'Save Changes' : 'Add Expense'}</Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the expense record for {expense && format(new Date(expense.year, expense.month - 1), 'MMMM yyyy')}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

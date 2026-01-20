
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/contexts/AppContext';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { AlertCircle, CheckCircle2, Loader2, User, Phone, MapPin, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const customerSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(100, { message: "Name must be less than 100 characters." })
    .regex(/^[a-zA-Z\s.'-]+$/, { message: "Name can only contain letters, spaces, and basic punctuation." }),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: "Phone number must be exactly 10 digits.",
    }),
  address: z.string()
    .max(500, { message: "Address must be less than 500 characters." })
    .optional(),
  notes: z.string()
    .max(1000, { message: "Notes must be less than 1000 characters." })
    .optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customerId?: string | null; // For editing
}

export default function CustomerFormSheet({ isOpen, onOpenChange, customerId }: CustomerFormSheetProps) {
  const { addCustomer, updateCustomer, getCustomerById } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      notes: '',
    },
    mode: 'onChange', // Validate on change for immediate feedback
  });

  const editingCustomer = customerId ? getCustomerById(customerId) : null;
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;

  useEffect(() => {
    if (editingCustomer) {
      form.reset({
        name: editingCustomer.name,
        phone: editingCustomer.phone || '',
        address: editingCustomer.address || '',
        notes: editingCustomer.notes || '',
      });
    } else {
      form.reset({ name: '', phone: '', address: '', notes: '' });
    }
    setSubmitError(null);
  }, [editingCustomer, form, isOpen]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!editingCustomer && isDirty) {
      const formData = form.getValues();
      localStorage.setItem('customer-draft', JSON.stringify(formData));
    }
  }, [form.watch(), editingCustomer, isDirty]);

  // Load draft on mount for new customers
  useEffect(() => {
    if (!editingCustomer && isOpen) {
      const draft = localStorage.getItem('customer-draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.name) {
            form.reset(parsed);
            toast({ title: "Draft restored", description: "Your previous draft has been restored." });
          }
        } catch (e) {
          // Ignore invalid drafts
        }
      }
    }
  }, [isOpen, editingCustomer]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      if (editingCustomer) {
        await updateCustomer({ ...editingCustomer, ...data });
        toast({ 
          title: "Customer Updated", 
          description: `${data.name}'s details have been updated.` 
        });
      } else {
        const result = await addCustomer(data);
        if (!result) {
          setSubmitError("Failed to add customer. The phone number may already be in use.");
          return;
        }
        // Clear draft on successful save
        localStorage.removeItem('customer-draft');
        toast({ 
          title: "Customer Added", 
          description: `${data.name} has been added successfully.` 
        });
      }
      onOpenChange(false); 
      form.reset(); 
    } catch (error: any) {
      setSubmitError(error.message || "An error occurred. Please try again.");
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem('customer-draft');
    form.reset({ name: '', phone: '', address: '', notes: '' });
    toast({ title: "Draft cleared" });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <div className="flex flex-col space-y-2 text-center sm:text-left mb-6">
          <SheetTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</SheetTitle>
          <SheetDescription>
            {editingCustomer ? 'Update the details of this customer.' : 'Enter the details for the new customer.'}
          </SheetDescription>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Name *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Customer's full name" 
                      {...field} 
                      className={form.formState.errors.name ? 'border-red-500' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="10-digit mobile number" 
                      {...field}
                      type="tel"
                      maxLength={10}
                      className={form.formState.errors.phone ? 'border-red-500' : ''}
                    />
                  </FormControl>
                  <FormDescription>Used for sending payment reminders</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Address
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Customer's address" 
                      {...field} 
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any specific notes about the customer" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>Private notes, not visible to customer</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <SheetFooter className="pt-6 flex-col sm:flex-row gap-2">
              {!editingCustomer && isDirty && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearDraft}
                  className="text-muted-foreground"
                >
                  Clear draft
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <SheetClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting || !isValid}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {editingCustomer ? 'Save Changes' : 'Add Customer'}
                    </>
                  )}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

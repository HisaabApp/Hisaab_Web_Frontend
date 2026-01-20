"use client";

import React from 'react';
import { LucideIcon, FileText, Users, Search, AlertCircle, Package, Bell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'search' | 'error' | 'minimal';
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const isMinimal = variant === 'minimal';
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isMinimal ? "py-8" : "py-12 px-6",
        className
      )}
    >
      <div 
        className={cn(
          "rounded-full flex items-center justify-center mb-4",
          isMinimal ? "h-12 w-12 bg-muted/50" : "h-16 w-16 bg-muted",
          variant === 'error' && "bg-red-100 dark:bg-red-900/30"
        )}
      >
        <Icon 
          className={cn(
            isMinimal ? "h-6 w-6" : "h-8 w-8",
            "text-muted-foreground",
            variant === 'error' && "text-red-500"
          )} 
        />
      </div>
      
      <h3 className={cn(
        "font-semibold text-foreground",
        isMinimal ? "text-base mb-1" : "text-lg mb-2"
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          "text-muted-foreground max-w-sm",
          isMinimal ? "text-sm" : "text-sm mb-6"
        )}>
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && !isMinimal && (
        <div className="flex flex-wrap gap-3 mt-4">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states
export function NoCustomersState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No customers yet"
      description="Add your first customer to start tracking their expenses and payments."
      action={{ label: "Add Customer", onClick: onAdd }}
    />
  );
}

export function NoSearchResultsState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any matches for "${query}". Try adjusting your search or filters.`}
      variant="search"
      action={{ label: "Clear Search", onClick: onClear }}
    />
  );
}

export function NoExpensesState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="No expenses recorded"
      description="Start adding monthly expenses to track payments."
      action={{ label: "Add Expense", onClick: onAdd }}
    />
  );
}

export function NoNotificationsState() {
  return (
    <EmptyState
      icon={Bell}
      title="No notifications"
      description="You're all caught up! New notifications will appear here."
      variant="minimal"
    />
  );
}

export function NoReportsState() {
  return (
    <EmptyState
      icon={Calendar}
      title="No data available"
      description="Add customers and expenses to see reports and analytics."
    />
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Something went wrong"
      description={message || "An error occurred. Please try again."}
      variant="error"
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
    />
  );
}

export default EmptyState;

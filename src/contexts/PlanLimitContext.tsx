/**
 * PlanLimitContext
 * Global context for plan limit checking and upgrade modal management
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UpgradeModal } from '@/components/UpgradeModal';
import { useAuth } from './AuthContext';

interface PlanLimitContextType {
  showUpgradeModal: (options: {
    limitType?: 'customers' | 'branches' | 'teamMembers' | 'messages' | 'invoices';
    message?: string;
  }) => void;
  hideUpgradeModal: () => void;
  isUpgradeModalOpen: boolean;
}

const PlanLimitContext = createContext<PlanLimitContextType | undefined>(undefined);

export const PlanLimitProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [limitType, setLimitType] = useState<'customers' | 'branches' | 'teamMembers' | 'messages' | 'invoices' | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const { user } = useAuth();

  const showUpgradeModal = useCallback((options: {
    limitType?: 'customers' | 'branches' | 'teamMembers' | 'messages' | 'invoices';
    message?: string;
  }) => {
    setLimitType(options.limitType);
    setMessage(options.message);
    setIsOpen(true);
  }, []);

  const hideUpgradeModal = useCallback(() => {
    setIsOpen(false);
    setLimitType(undefined);
    setMessage(undefined);
  }, []);

  return (
    <PlanLimitContext.Provider
      value={{
        showUpgradeModal,
        hideUpgradeModal,
        isUpgradeModalOpen: isOpen
      }}
    >
      {children}
      <UpgradeModal
        isOpen={isOpen}
        onClose={hideUpgradeModal}
        limitType={limitType}
        currentPlan={user?.subscription || 'FREE'}
        message={message}
      />
    </PlanLimitContext.Provider>
  );
};

export const usePlanLimitModal = () => {
  const context = useContext(PlanLimitContext);
  if (context === undefined) {
    throw new Error('usePlanLimitModal must be used within a PlanLimitProvider');
  }
  return context;
};

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Branch, Organization } from '@/lib/api/organization.types';
import { organizationApi } from '@/lib/api/organization.service';

interface BranchContextType {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  selectedOrganization: Organization | null;
  setSelectedOrganization: (org: Organization | null) => void;
  availableBranches: Branch[];
  setAvailableBranches: (branches: Branch[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  refreshBranches: () => Promise<void>;
  refreshTrigger: number;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh branches from API
  const refreshBranches = useCallback(async () => {
    try {
      setIsLoading(true);
      const orgsResponse = await organizationApi.organization.getUserOrganizations();
      
      if (orgsResponse.success && orgsResponse.data && orgsResponse.data.length > 0) {
        const membership = orgsResponse.data[0];
        const org = (membership as any).organization || membership;
        
        if (org && org.id) {
          setSelectedOrganization(org);
          localStorage.setItem('selectedOrganization', JSON.stringify(org));
          
          const branchesFromOrg = org.branches;
          if (branchesFromOrg && branchesFromOrg.length > 0) {
            setAvailableBranches(branchesFromOrg);
            
            // Update selected branch if it exists in the new list
            if (selectedBranch) {
              const updatedBranch = branchesFromOrg.find((b: Branch) => b.id === selectedBranch.id);
              if (updatedBranch) {
                setSelectedBranchState(updatedBranch);
                localStorage.setItem('selectedBranch', JSON.stringify(updatedBranch));
              }
            }
          }
        }
      }
      
      // Trigger re-render in components listening to this
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing branches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch]);

  // Load selected branch from localStorage on mount
  useEffect(() => {
    const storedBranchId = localStorage.getItem('selectedBranchId');
    const storedBranch = localStorage.getItem('selectedBranch');
    
    if (storedBranch) {
      try {
        const branch = JSON.parse(storedBranch);
        setSelectedBranchState(branch);
      } catch (error) {
        console.error('Error parsing stored branch:', error);
        localStorage.removeItem('selectedBranch');
        localStorage.removeItem('selectedBranchId');
      }
    }
    
    const storedOrg = localStorage.getItem('selectedOrganization');
    if (storedOrg) {
      try {
        const org = JSON.parse(storedOrg);
        setSelectedOrganization(org);
      } catch (error) {
        console.error('Error parsing stored organization:', error);
        localStorage.removeItem('selectedOrganization');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Save selected branch to localStorage when it changes
  const setSelectedBranch = (branch: Branch | null) => {
    setSelectedBranchState(branch);
    if (branch) {
      localStorage.setItem('selectedBranchId', branch.id);
      localStorage.setItem('selectedBranch', JSON.stringify(branch));
    } else {
      localStorage.removeItem('selectedBranchId');
      localStorage.removeItem('selectedBranch');
    }
  };

  // Save selected organization to localStorage when it changes
  const setSelectedOrganizationWrapper = (org: Organization | null) => {
    setSelectedOrganization(org);
    if (org) {
      localStorage.setItem('selectedOrganization', JSON.stringify(org));
    } else {
      localStorage.removeItem('selectedOrganization');
    }
  };

  return (
    <BranchContext.Provider
      value={{
        selectedBranch,
        setSelectedBranch,
        selectedOrganization,
        setSelectedOrganization: setSelectedOrganizationWrapper,
        availableBranches,
        setAvailableBranches,
        isLoading,
        setIsLoading,
        refreshBranches,
        refreshTrigger
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}

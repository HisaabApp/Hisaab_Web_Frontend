'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/AuthContext';
import { organizationApi } from '@/lib/api/organization.service';
import { Branch, Organization } from '@/lib/api/organization.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function BranchSelector() {
  const {
    selectedBranch,
    setSelectedBranch,
    selectedOrganization,
    setSelectedOrganization,
    availableBranches,
    setAvailableBranches,
    isLoading: contextLoading,
    setIsLoading: setContextLoading
  } = useBranch();

  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load organizations and branches on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      loadOrganizationsAndBranches();
    }
  }, [isAuthenticated]);

  const loadOrganizationsAndBranches = async () => {
    try {
      setIsLoading(true);
      setContextLoading(true);

      // Get user's organizations (returns memberships with nested organizations)
      const orgsResponse = await organizationApi.organization.getUserOrganizations();
      
      if (!orgsResponse.success || !orgsResponse.data || orgsResponse.data.length === 0) {
        // User has no organizations yet - this is OK, just hide the selector
        console.log('No organizations found for user');
        setAvailableBranches([]);
        setContextLoading(false);
        setIsLoading(false);
        return;
      }

      // Extract organization from membership response
      // The API returns memberships with nested organization objects
      const membership = orgsResponse.data[0];
      const org = (membership as any).organization || membership;
      
      // Validate organization has an ID
      if (!org || !org.id) {
        console.error('Organization missing ID:', org);
        setAvailableBranches([]);
        setContextLoading(false);
        setIsLoading(false);
        return;
      }
      
      setSelectedOrganization(org);

      // Extract branches from organization if already included
      const branchesFromOrg = org.branches;
      
      if (branchesFromOrg && branchesFromOrg.length > 0) {
        // Use branches already loaded in organization response
        setAvailableBranches(branchesFromOrg);
        
        // Check if user explicitly selected "All Branches"
        const allBranchesSelected = localStorage.getItem('allBranchesSelected') === 'true';
        
        // Only auto-select first branch if not explicitly viewing all branches
        // and no branch is currently selected
        if (!allBranchesSelected && !selectedBranch) {
          const storedBranchId = localStorage.getItem('selectedBranchId');
          if (storedBranchId) {
            const storedBranch = branchesFromOrg.find((b: Branch) => b.id === storedBranchId);
            if (storedBranch) {
              setSelectedBranch(storedBranch);
            } else {
              setSelectedBranch(branchesFromOrg[0]);
            }
          } else {
            // First time user - select first branch by default
            setSelectedBranch(branchesFromOrg[0]);
          }
        }
      } else {
        // Fetch branches separately
        try {
          const branchesResponse = await organizationApi.branch.getBranches(org.id);
          
          if (branchesResponse.success && branchesResponse.data && branchesResponse.data.length > 0) {
            setAvailableBranches(branchesResponse.data);

            // Check if user explicitly selected "All Branches"
            const allBranchesSelected = localStorage.getItem('allBranchesSelected') === 'true';
            
            // Only auto-select first branch if not explicitly viewing all branches
            if (!allBranchesSelected && !selectedBranch) {
              const storedBranchId = localStorage.getItem('selectedBranchId');
              if (storedBranchId) {
                const storedBranch = branchesResponse.data.find(b => b.id === storedBranchId);
                if (storedBranch) {
                  setSelectedBranch(storedBranch);
                } else {
                  setSelectedBranch(branchesResponse.data[0]);
                }
              } else {
                setSelectedBranch(branchesResponse.data[0]);
              }
            }
          } else {
            setAvailableBranches([]);
          }
        } catch (branchError) {
          console.error('Error fetching branches:', branchError);
          setAvailableBranches([]);
        }
      }
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      setAvailableBranches([]);
    } finally {
      setIsLoading(false);
      setContextLoading(false);
    }
  };

  const handleBranchChange = (branch: Branch) => {
    setSelectedBranch(branch);
    // Store the branch selection
    localStorage.setItem('selectedBranchId', branch.id);
    localStorage.removeItem('allBranchesSelected');
    // Force a page reload to refresh data with new branch context
    window.location.reload();
  };

  const handleViewAllBranches = () => {
    setSelectedBranch(null);
    // Store explicit "all branches" preference
    localStorage.removeItem('selectedBranchId');
    localStorage.removeItem('selectedBranch');
    localStorage.setItem('allBranchesSelected', 'true');
    // Force a page reload to refresh data without branch filter
    window.location.reload();
  };

  if (contextLoading || isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
        <Building2 className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  if (availableBranches.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2 px-3 h-10"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm">
              {selectedBranch ? selectedBranch.name : 'All Branches'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Select Branch</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleViewAllBranches}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>All Branches</span>
            {!selectedBranch && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {availableBranches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => handleBranchChange(branch)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col min-w-0">
                <span className="truncate">{branch.name}</span>
                {branch.address && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {branch.address}
                  </span>
                )}
              </div>
              {selectedBranch?.id === branch.id && (
                <Check className="h-4 w-4 flex-shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

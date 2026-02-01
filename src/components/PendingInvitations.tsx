'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Check, X, Clock, Users, Loader2 } from 'lucide-react';
import { invitationService, Invitation } from '@/lib/api/invitation.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PendingInvitationsProps {
  onInvitationAccepted?: () => void;
}

export default function PendingInvitations({ onInvitationAccepted }: PendingInvitationsProps) {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      const response = await invitationService.getPendingInvitations();
      if (response.success && response.data) {
        setInvitations(response.data);
        // Auto-show dialog if there are pending invitations
        if (response.data.length > 0) {
          setSelectedInvite(response.data[0]);
          setShowDialog(true);
        }
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitation: Invitation) => {
    try {
      setProcessingId(invitation.id);
      const response = await invitationService.acceptInvitation(invitation.id);
      
      if (response.success) {
        toast({
          title: 'Invitation Accepted',
          description: `You have joined ${invitation.organization?.name}!`
        });
        setInvitations(prev => prev.filter(i => i.id !== invitation.id));
        setShowDialog(false);
        onInvitationAccepted?.();
        
        // Reload page to refresh organization data
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to accept invitation',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: Invitation) => {
    try {
      setProcessingId(invitation.id);
      const response = await invitationService.declineInvitation(invitation.id);
      
      if (response.success) {
        toast({
          title: 'Invitation Declined',
          description: 'The invitation has been declined'
        });
        setInvitations(prev => prev.filter(i => i.id !== invitation.id));
        setShowDialog(false);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to decline invitation',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-blue-500';
      case 'STAFF': return 'bg-green-500';
      case 'VIEWER': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    return 'Less than an hour left';
  };

  if (isLoading) {
    return null; // Don't show loading state
  }

  if (invitations.length === 0) {
    return null; // Don't render anything if no invitations
  }

  return (
    <>
      {/* Banner for pending invitations */}
      <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium">
                  You have {invitations.length} pending invitation{invitations.length > 1 ? 's' : ''}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Join an organization to collaborate with your team
                </p>
              </div>
            </div>
            <Button onClick={() => setShowDialog(true)}>
              View Invitation{invitations.length > 1 ? 's' : ''}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invitation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Invitation
            </DialogTitle>
            <DialogDescription>
              You've been invited to join an organization
            </DialogDescription>
          </DialogHeader>

          {selectedInvite && (
            <div className="space-y-4 py-4">
              {/* Organization Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedInvite.organization?.logo ? (
                    <img 
                      src={selectedInvite.organization.logo} 
                      alt={selectedInvite.organization.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedInvite.organization?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Invited by {selectedInvite.invitedBy?.name}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge className={getRoleBadgeColor(selectedInvite.role)}>
                  {selectedInvite.role}
                </Badge>
              </div>

              {/* Expiry */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span className="text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeRemaining(selectedInvite.expiresAt)}
                </span>
              </div>

              {/* Message */}
              {selectedInvite.message && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm italic">"{selectedInvite.message}"</p>
                </div>
              )}

              {/* Multiple invitations indicator */}
              {invitations.length > 1 && (
                <p className="text-xs text-muted-foreground text-center">
                  + {invitations.length - 1} more invitation{invitations.length > 2 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => selectedInvite && handleDecline(selectedInvite)}
              disabled={!!processingId}
              className="flex-1"
            >
              {processingId === selectedInvite?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </>
              )}
            </Button>
            <Button
              onClick={() => selectedInvite && handleAccept(selectedInvite)}
              disabled={!!processingId}
              className="flex-1"
            >
              {processingId === selectedInvite?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Accept & Join
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

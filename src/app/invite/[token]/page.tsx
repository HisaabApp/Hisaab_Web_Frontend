'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, User, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { invitationService, Invitation } from '@/lib/api/invitation.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface InvitationPreview {
  id: string;
  organization: { id: string; name: string };
  invitedBy: { id: string; name: string; email: string };
  role: string;
  branch?: { id: string; name: string } | null;
  expiresAt: string;
  message?: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const token = params.token as string;

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await invitationService.getInvitationByToken(token);
      if (response.success && response.data) {
        setInvitation(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Invalid or expired invitation link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      localStorage.setItem('inviteToken', token);
      router.push(`/login?redirect=/invite/${token}`);
      return;
    }

    try {
      setIsAccepting(true);
      const response = await invitationService.acceptInvitationByToken(token);
      
      if (response.success) {
        setAccepted(true);
        toast({
          title: 'Welcome!',
          description: `You've joined ${invitation?.organization.name}`,
        });
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to accept invitation',
        variant: 'destructive'
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Expires soon';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'STAFF': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'VIEWER': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <CardTitle className="text-xl">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild variant="outline">
              <Link href="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <CardTitle className="text-xl">Welcome to {invitation?.organization.name}!</CardTitle>
            <CardDescription>You've successfully joined the team.</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-500">
            Redirecting to dashboard...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle className="text-xl">You're Invited!</CardTitle>
          <CardDescription>
            Join {invitation?.organization.name}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Organization</span>
              <span className="font-medium">{invitation?.organization.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Role</span>
              <Badge className={getRoleBadgeColor(invitation?.role || '')}>
                {invitation?.role}
              </Badge>
            </div>
            
            {invitation?.branch && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Branch</span>
                <span className="font-medium">{invitation.branch.name}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Invited by</span>
              <span className="font-medium">{invitation?.invitedBy.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Expires</span>
              <span className="flex items-center gap-1 text-orange-600">
                <Clock className="h-4 w-4" />
                {invitation?.expiresAt && formatTimeRemaining(invitation.expiresAt)}
              </span>
            </div>
          </div>

          {invitation?.message && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                "{invitation.message}"
              </p>
            </div>
          )}

          {!isAuthenticated && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> You need to log in or create an account to accept this invitation.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            asChild
          >
            <Link href="/">Decline</Link>
          </Button>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : isAuthenticated ? (
              'Accept Invitation'
            ) : (
              'Login to Accept'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

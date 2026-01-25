"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/lib/api/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Loader2, User, Lock, CheckCircle, AlertCircle, Store, Upload, X, Bell, BellOff, BellRing, Smartphone, CreditCard } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Progress } from '@/components/ui/progress';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.logo || null);
  
  // Push notifications hook
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    preferences: notificationPrefs,
    enablePushNotifications,
    disablePushNotifications,
    updatePreferences: updateNotificationPrefs,
  } = usePushNotifications();

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    businessName: user?.businessName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    logo: user?.logo || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 2MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setProfileData({ ...profileData, logo: base64String });
        setMessage({ type: 'success', text: 'Logo uploaded! Click "Save Changes" to apply.' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setProfileData({ ...profileData, logo: '' });
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await updateProfile({
        name: profileData.name,
        businessName: profileData.businessName,
        phone: profileData.phone,
        address: profileData.address,
        logo: profileData.logo,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      setIsLoading(false);
      return;
    }

    try {
      await profileService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to change password' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-4 px-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="profile" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Password</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal and business information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <Separator />

                {/* Business Logo */}
                <div className="space-y-2">
                  <Label>Business Logo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-border">
                      {logoPreview ? (
                        <AvatarImage src={logoPreview} alt="Business logo" className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10">
                        <Store className="h-10 w-10 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      {logoPreview ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Logo uploaded</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLogo}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove Logo
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />
                          <Label htmlFor="logo-upload">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <span className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Logo
                              </span>
                            </Button>
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Max 2MB, PNG/JPG. Will appear on invoices.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={profileData.businessName}
                    onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                    placeholder="Your dairy business name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    placeholder="Your business address"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="space-y-4">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>
                  Your message quota and subscription details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plan</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user?.subscription === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                    user?.subscription === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.subscription || 'FREE'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Messages Used</span>
                    <span className="font-medium">
                      {user?.messagesUsed || 0} / {user?.messageLimit || 10}
                    </span>
                  </div>
                  <Progress 
                    value={((user?.messagesUsed || 0) / (user?.messageLimit || 10)) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(user?.messageLimit || 10) - (user?.messagesUsed || 0)} messages remaining this month
                  </p>
                </div>

                {user?.subscriptionExpiresAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Expires</span>
                    <span className="font-medium">
                      {new Date(user.subscriptionExpiresAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upgrade Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Upgrade Your Plan</CardTitle>
                <CardDescription>
                  Get more messages and features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Basic Plan */}
                  <div className={`border rounded-lg p-4 ${user?.subscription === 'BASIC' ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">Basic</h4>
                      <span className="text-lg font-bold">₹299<span className="text-xs font-normal">/mo</span></span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>✓ 100 messages/month</li>
                      <li>✓ SMS & WhatsApp</li>
                      <li>✓ Payment Links</li>
                    </ul>
                    {user?.subscription !== 'BASIC' && user?.subscription !== 'PREMIUM' && (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        Coming Soon
                      </Button>
                    )}
                    {user?.subscription === 'BASIC' && (
                      <span className="text-xs text-blue-600 font-medium">Current Plan</span>
                    )}
                  </div>

                  {/* Premium Plan */}
                  <div className={`border rounded-lg p-4 ${user?.subscription === 'PREMIUM' ? 'border-purple-500 bg-purple-50' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">Premium</h4>
                      <span className="text-lg font-bold">₹999<span className="text-xs font-normal">/mo</span></span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>✓ 500 messages/month</li>
                      <li>✓ SMS & WhatsApp</li>
                      <li>✓ Payment Links</li>
                      <li>✓ Priority Support</li>
                    </ul>
                    {user?.subscription !== 'PREMIUM' && (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        Coming Soon
                      </Button>
                    )}
                    {user?.subscription === 'PREMIUM' && (
                      <span className="text-xs text-purple-600 font-medium">Current Plan</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-4">
            {/* Push Notification Enable/Disable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  Receive notifications on your device even when the app is closed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!pushSupported ? (
                  <Alert>
                    <BellOff className="h-4 w-4" />
                    <AlertDescription>
                      Push notifications are not supported on this browser. Try using Chrome, Edge, or Firefox on desktop, or add the app to your home screen on mobile.
                    </AlertDescription>
                  </Alert>
                ) : pushPermission === 'denied' ? (
                  <Alert variant="destructive">
                    <BellOff className="h-4 w-4" />
                    <AlertDescription>
                      Notifications are blocked. Please enable them in your browser settings to receive alerts.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        {pushSubscribed 
                          ? 'You will receive notifications on this device' 
                          : 'Turn on to receive payment reminders and alerts'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pushLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Switch
                        checked={pushSubscribed}
                        onCheckedChange={async (checked) => {
                          if (checked) {
                            const success = await enablePushNotifications();
                            if (success) {
                              setMessage({ type: 'success', text: 'Push notifications enabled!' });
                            } else {
                              setMessage({ type: 'error', text: 'Failed to enable notifications. Please try again.' });
                            }
                          } else {
                            await disablePushNotifications();
                            setMessage({ type: 'success', text: 'Push notifications disabled.' });
                          }
                        }}
                        disabled={pushLoading}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellRing className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose which notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Reminders</Label>
                      <p className="text-xs text-muted-foreground">Get reminded about pending payments</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.paymentReminders}
                      onCheckedChange={(checked) => updateNotificationPrefs({ paymentReminders: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Received</Label>
                      <p className="text-xs text-muted-foreground">Notification when payment is collected</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.paymentReceived}
                      onCheckedChange={(checked) => updateNotificationPrefs({ paymentReceived: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Summary</Label>
                      <p className="text-xs text-muted-foreground">Daily report of collections and pending</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.dailySummary}
                      onCheckedChange={(checked) => updateNotificationPrefs({ dailySummary: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Monthly Report</Label>
                      <p className="text-xs text-muted-foreground">Monthly summary at month end</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.monthlyReport}
                      onCheckedChange={(checked) => updateNotificationPrefs({ monthlyReport: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Customer Updates</Label>
                      <p className="text-xs text-muted-foreground">When customers are added or modified</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.customerUpdates}
                      onCheckedChange={(checked) => updateNotificationPrefs({ customerUpdates: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Alerts</Label>
                      <p className="text-xs text-muted-foreground">Important updates and security alerts</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.systemAlerts}
                      onCheckedChange={(checked) => updateNotificationPrefs({ systemAlerts: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Notification */}
            {pushSubscribed && (
              <Card>
                <CardContent className="pt-6">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('HisaabApp Test', {
                          body: 'Push notifications are working correctly!',
                          icon: '/icons/icon-192x192.png',
                        });
                        setMessage({ type: 'success', text: 'Test notification sent!' });
                      }
                    }}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Send Test Notification
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password *</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    placeholder="Enter your current password"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    placeholder="Confirm your new password"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

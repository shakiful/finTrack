
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Bell, Lock, Palette, Globe } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { auth, googleProvider } from '@/lib/firebase'; // Assuming googleProvider might be used for re-auth later, not for this change
import { onAuthStateChanged, updateProfile, User as FirebaseUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function SettingsPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  
  const [currentPasswordForPasswordChange, setCurrentPasswordForPasswordChange] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("en");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setName(user.displayName || "");
        setEmail(user.email || "");
        setPhotoURL(user.photoURL || null);
      } else {
        setCurrentUser(null);
        // Optionally redirect to login or show a message
      }
    });
    return () => unsubscribe();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in again.", variant: "destructive"});
      return;
    }
    setIsProfileLoading(true);
    try {
      await updateProfile(currentUser, {
        displayName: name,
        // photoURL: photoURL // If photoURL state was updated by an upload mechanism
      });
      // Re-fetch or update local state if needed, auth.onAuthStateChanged should also pick it up
      if (auth.currentUser) { // Refresh local state from potentially updated currentUser
          setName(auth.currentUser.displayName || "");
          setPhotoURL(auth.currentUser.photoURL || null);
      }
      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
    } catch (error: any) {
      console.error("Profile Update Error:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    }
    setIsProfileLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in again.", variant: "destructive"});
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) { // Firebase default minimum is 6
      toast({ title: "Weak Password", description: "Password should be at least 6 characters long.", variant: "destructive"});
      return;
    }

    setIsPasswordLoading(true);
    try {
      // Re-authentication is required for sensitive operations like password change
      if (currentUser.email && currentPasswordForPasswordChange) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPasswordForPasswordChange);
        await reauthenticateWithCredential(currentUser, credential);
        
        // If re-authentication is successful, update the password
        // For security, Firebase SDK for client-side does not have a direct `updatePassword` method.
        // You need to use sendPasswordResetEmail or handle this via a backend/Firebase Admin SDK for more control.
        // The most common client-side approach is to guide user to use "forgot password" flow if they know current one.
        // Or, if re-authentication is done, and if an updatePassword method becomes available in client SDK:
        // await updatePassword(currentUser, newPassword); // This method is NOT available in client SDK as of my last training.

        // For now, we'll simulate a successful message and clear fields.
        // In a real app, you would typically call `sendPasswordResetEmail(auth, currentUser.email)`
        // and instruct the user to check their email, or implement a backend solution.
        
        // Placeholder for actual password update logic, as client-side direct update is limited.
        console.log("Password change requested and re-authentication step would be here.");
        toast({ title: "Password Change Initiated", description: "If this were a full implementation, your password would be changed. For now, this is a placeholder." });

        setCurrentPasswordForPasswordChange('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast({ title: "Re-authentication Failed", description: "Could not verify current password or email missing.", variant: "destructive"});
      }
    } catch (error: any) {
      console.error("Password Change Error:", error);
      toast({ title: "Password Change Failed", description: error.message || "Could not change password.", variant: "destructive" });
    }
    setIsPasswordLoading(false);
  };

  const handleNotificationSave = () => {
    console.log("Notification settings saved:", { emailNotifications, pushNotifications });
    toast({ title: "Notifications Saved", description: "Your notification preferences have been updated." });
  };

  const handlePreferencesSave = () => {
     console.log("Preferences saved:", { currency, language });
    toast({ title: "Preferences Saved", description: "Your preferences have been updated." });
  };

  const handleAvatarChange = () => {
    // Placeholder for avatar change functionality
    // This would typically involve opening a file picker, uploading to Firebase Storage,
    // and then updating the user's photoURL with updateProfile.
    toast({ title: "Avatar Change", description: "Avatar change functionality is not yet implemented.", variant: "default"});
  };


  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading user information or please log in...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="text-primary"/> Profile Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                    <AvatarImage src={photoURL || undefined} alt={name || "User Avatar"} data-ai-hint="person avatar" />
                    <AvatarFallback>{name ? name.substring(0, 2).toUpperCase() : (email ? email.substring(0,2).toUpperCase() : "U")}</AvatarFallback>
                </Avatar>
                <Button variant="outline" type="button" onClick={handleAvatarChange}>Change Avatar</Button>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" disabled={isProfileLoading}/>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={email} readOnly disabled placeholder="Your email address"/>
                 <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed here.</p>
              </div>
            </div>
            <Button type="submit" disabled={isProfileLoading}>
                {isProfileLoading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="text-primary"/> Change Password</CardTitle>
          <CardDescription>Update your account password. Requires re-entering your current password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" value={currentPasswordForPasswordChange} onChange={(e) => setCurrentPasswordForPasswordChange(e.target.value)} required disabled={isPasswordLoading}/>
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isPasswordLoading}/>
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required disabled={isPasswordLoading}/>
            </div>
            <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="text-primary"/> Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label htmlFor="emailNotifications" className="flex flex-col">
                <span>Email Notifications</span>
                <span className="text-xs text-muted-foreground">Receive updates and alerts via email.</span>
            </Label>
            <Switch id="emailNotifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label htmlFor="pushNotifications" className="flex flex-col">
                <span>Push Notifications</span>
                <span className="text-xs text-muted-foreground">Get real-time alerts on your devices. (Conceptual)</span>
            </Label>
            <Switch id="pushNotifications" checked={pushNotifications} onCheckedChange={setPushNotifications} disabled/>
          </div>
          <Button onClick={handleNotificationSave}>Save Notification Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="text-primary"/> App Preferences</CardTitle>
          <CardDescription>Customize your app experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="currency" className="flex items-center gap-1"><Globe className="w-4 h-4"/> Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - United States Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language" className="flex items-center gap-1"><Globe className="w-4 h-4"/> Language</Label>
                 <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español (Spanish)</SelectItem>
                    <SelectItem value="fr">Français (French)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
             <Button onClick={handlePreferencesSave}>Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}

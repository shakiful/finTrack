
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(""); // You might want to store this in Firestore/Realtime DB after signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password should be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // const user = userCredential.user;
      // Optionally, you can update the user's profile with the name here or save it to Firestore
      // await updateProfile(user, { displayName: name });
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "Sign Up Successful", description: "Your account has been created. Welcome!" });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Sign Up Error:", error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormWrapper
      title="Create an Account"
      description="Start managing your finances with FinTrack Flow."
      footerText="Already have an account?"
      footerLinkText="Log In"
      footerLinkHref="/auth/login"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            type="text" 
            placeholder="Your Name" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="transition-shadow duration-200 ease-out focus:shadow-md focus:ring-2 focus:ring-primary/50"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="you@example.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="transition-shadow duration-200 ease-out focus:shadow-md focus:ring-2 focus:ring-primary/50"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="transition-shadow duration-200 ease-out focus:shadow-md focus:ring-2 focus:ring-primary/50"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input 
            id="confirm-password" 
            type="password" 
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="transition-shadow duration-200 ease-out focus:shadow-md focus:ring-2 focus:ring-primary/50"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full transition-transform duration-200 ease-out hover:scale-105" disabled={isLoading}>
          {isLoading ? "Signing Up..." : "Sign Up"}
        </Button>
      </form>
    </AuthFormWrapper>
  );
}

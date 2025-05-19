"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import React from "react";
import { useRouter } from "next/navigation"; // Corrected import

export default function SignUpPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add sign-up logic here
    console.log("Sign up submitted");
    // On successful sign-up:
    router.push("/dashboard");
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
          <Input id="name" type="text" placeholder="Your Name" required 
                 className="transition-shadow duration-200 ease-out focus:shadow-md focus:ring-2 focus:ring-primary/50"/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" required 
                 className="transition-shadow duration-200 ease-out focus:shadow-md focus:ring-2 focus:ring-primary/50"/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required 
                 className="transition-shadow duration-200 ease-out focus:shadow-md focus:ring-2 focus:ring-primary/50"/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input id="confirm-password" type="password" required 
                 className="transition-shadow duration-200 ease-out focus:shadow-md focus:ring-2 focus:ring-primary/50"/>
        </div>
        <Button type="submit" className="w-full transition-transform duration-200 ease-out hover:scale-105">
          Sign Up
        </Button>
      </form>
    </AuthFormWrapper>
  );
}

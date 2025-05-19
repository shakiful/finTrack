"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Corrected import
import React from "react";

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add login logic here
    console.log("Login submitted");
    // On successful login:
    router.push("/dashboard");
  };

  return (
    <AuthFormWrapper
      title="Welcome Back!"
      description="Log in to your FinTrack Flow account."
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkHref="/auth/sign-up"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" required 
                 className="transition-shadow duration-200 ease-out focus:shadow-md focus:ring-2 focus:ring-primary/50"/>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="text-sm text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
          <Input id="password" type="password" required 
                 className="transition-shadow duration-200 ease-out focus:shadow-md focus:ring-2 focus:ring-primary/50"/>
        </div>
        <Button type="submit" className="w-full transition-transform duration-200 ease-out hover:scale-105">
          Log In
        </Button>
      </form>
    </AuthFormWrapper>
  );
}

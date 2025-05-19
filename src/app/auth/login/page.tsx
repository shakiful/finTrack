
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="text-sm text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
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
        <Button type="submit" className="w-full transition-transform duration-200 ease-out hover:scale-105" disabled={isLoading}>
          {isLoading ? "Logging In..." : "Log In"}
        </Button>
      </form>
    </AuthFormWrapper>
  );
}

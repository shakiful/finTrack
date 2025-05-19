
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Added Button import
import { useRouter } from "next/navigation";
import { auth, googleProvider, signInWithPopup } from "@/lib/firebase"; // Firebase imports
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react"; // Added useState

interface AuthFormWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footerLinkHref: string;
  footerLinkText: string;
  footerText: string;
  showSocial?: boolean;
}

export function AuthFormWrapper({
  title,
  description,
  children,
  footerLinkHref,
  footerLinkText,
  footerText,
  showSocial = true,
}: AuthFormWrapperProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: "Sign In Successful", description: "Welcome!" });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      toast({
        title: "Google Sign In Failed",
        description: error.message || "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl animate-fadeInUp">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="md"/>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
          {showSocial && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-card text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4"> {/* Changed to grid-cols-1 */}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? "Signing In..." : "Google"}
                </Button>
                {/* Apple button removed */}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm">
          <p>
            {footerText}{" "}
            <Link href={footerLinkHref} className="font-medium text-primary hover:underline">
              {footerLinkText}
            </Link>
          </p>
          <Link href="/" className="mt-4 text-xs text-muted-foreground hover:underline">
            Back to Homepage
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

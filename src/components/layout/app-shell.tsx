
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  PieChartIcon,
  Settings,
  LogOut,
  UserCircle,
  LifeBuoy,
  Bot,
  ChevronDown,
  // ChevronRight // This icon was imported but not used, removed for cleanliness
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  // SidebarMenuSub, // These were imported but not used
  // SidebarMenuSubItem,
  // SidebarMenuSubButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/mode-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { auth } from "@/lib/firebase"; // Import Firebase auth
import { signOut } from "firebase/auth"; // Import signOut
import { useToast } from "@/hooks/use-toast"; // Import useToast

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/budgets', icon: PieChartIcon, label: 'Budgets' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/assistant', icon: Bot, label: 'Smart Assistant' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter(); // Initialize router
  const { toast } = useToast(); // Initialize toast
  const { state } = useSidebar(); // state can be "expanded" or "collapsed"

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/auth/login');
    } catch (error) {
      console.error("Logout Error:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className={`flex items-center gap-2 ${state === 'collapsed' ? 'justify-center' : ''}`}>
            <Logo size={state === 'collapsed' ? "sm" : "md"}/>
        </div>
      </SidebarHeader>
      <ScrollArea className="flex-grow">
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`w-full justify-start gap-2 ${state === 'collapsed' ? 'px-2' : 'px-3'}`}>
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
                <AvatarFallback>{auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              {state === 'expanded' && <span className="truncate">{auth.currentUser?.displayName || auth.currentUser?.email || 'User Name'}</span>}
              {state === 'expanded' && <ChevronDown className="w-4 h-4 ml-auto" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <UserCircle className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
               <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem>
              <LifeBuoy className="w-4 h-4 mr-2" /> 
              Support
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}


function AppHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
         {/* You can add other header items here like notifications */}
      </div>
    </header>
  );
}


export function AppShell({ children, pageTitle }: { children: React.ReactNode, pageTitle: string }) {
  // Attempt to get user information for display
  // Note: This is a basic way. For real-time updates & proper state management, a context/global state is better.
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null | undefined>(undefined);
  const [currentUserDisplayName, setCurrentUserDisplayName] = React.useState<string | null | undefined>(undefined);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserEmail(user.email);
        setCurrentUserDisplayName(user.displayName);
      } else {
        setCurrentUserEmail(null);
        setCurrentUserDisplayName(null);
      }
    });
    return () => unsubscribe();
  }, []);


  // Dynamically update AvatarFallback and display name in AppSidebar based on auth state
  // This is a simplified approach. Ideally, user state would be managed in a context.
  // The AppSidebar itself could also subscribe to auth.onAuthStateChanged for a cleaner update.
  // For now, the existing logic in AppSidebar's DropdownMenuTrigger for AvatarFallback and name will pick up auth.currentUser


  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AppHeader title={pageTitle} />
          <main className="flex-1 p-4 overflow-auto md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

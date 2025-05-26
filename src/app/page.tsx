
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, DollarSign, BarChart2, ShieldCheck, Brain, BarChartBig, ListChecks, Target, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <Card className="text-center transition-all duration-300 ease-out hover:shadow-xl hover:scale-105 animate-fadeInUp">
    <CardHeader className="flex flex-col items-center">
      <div className="p-3 mb-4 rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const TipCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <Card className="transition-all duration-300 ease-out hover:shadow-xl animate-fadeInUp">
    <CardHeader className="flex flex-row items-center gap-4">
      <div className="p-3 rounded-full bg-accent/10 text-accent">
        {icon}
      </div>
      <div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 px-4 max-w-screen-2xl">
          <Logo />
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 text-center bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-fadeIn">
          <div className="container mx-auto">
            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Take Control of Your Finances <span className="text-primary">Effortlessly</span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto">
              FinTrack Flow helps you track income, manage expenses, set financial goals, and visualize your financial health with ease.
            </p>
            <div className="space-x-4">
              <Button size="lg" asChild className="transition-transform duration-200 ease-out hover:scale-105">
                <Link href="/auth/sign-up">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="transition-transform duration-200 ease-out hover:scale-105">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-background">
          <div className="container mx-auto">
            <h2 className="mb-12 text-3xl font-bold text-center md:text-4xl animate-fadeInUp" style={{animationDelay: '0.2s'}}>Why FinTrack Flow?</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<DollarSign size={32} />}
                title="Expense Tracking"
                description="Easily log and categorize your spending to see where your money goes."
              />
              <FeatureCard
                icon={<BarChart2 size={32} />}
                title="Budget Creation"
                description="Create custom budgets for different categories and monitor your progress."
              />
              <FeatureCard
                icon={<CheckCircle size={32} />}
                title="Goal Setting"
                description="Set financial goals and track your journey towards achieving them."
              />
              <FeatureCard
                icon={<BarChartBig size={32} />}
                title="Visual Reports"
                description="Understand your finances at a glance with intuitive charts and graphs."
              />
               <FeatureCard
                icon={<Brain size={32} />}
                title="Smart Assistant"
                description="Leverage AI for smart transaction categorization, budget suggestions, and savings insights."
              />
              <FeatureCard
                icon={<ShieldCheck size={32} />}
                title="Secure & Private"
                description="Your financial data is protected with bank-level security measures."
              />
            </div>
          </div>
        </section>

        {/* Financial Wellness Tips Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto">
            <h2 className="mb-12 text-3xl font-bold text-center md:text-4xl animate-fadeInUp" style={{animationDelay: '0.4s'}}>Tips for Financial Wellness</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <TipCard
                icon={<ListChecks size={28} />}
                title="Plan Your Spending"
                description="Use our budgeting tools to allocate your income effectively and avoid overspending on non-essentials."
              />
              <TipCard
                icon={<Target size={28} />}
                title="Set Clear Goals"
                description="Define short-term and long-term financial goals to stay motivated and focused on what truly matters to you."
              />
              <TipCard
                icon={<RefreshCw size={28} />}
                title="Review Regularly"
                description="Consistently review your financial progress, adjust your budgets, and update your goals as your life circumstances change."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center bg-primary text-primary-foreground">
          <div className="container animate-fadeInUp" style={{animationDelay: '0.6s'}}>
            <h2 className="mb-6 text-4xl font-bold">Ready to Master Your Money?</h2>
            <p className="mb-10 text-lg opacity-90 max-w-2xl mx-auto">
              Join thousands of users who are taking control of their financial future with FinTrack Flow.
            </p>
            <Button size="lg" variant="secondary" asChild className="transition-transform duration-200 ease-out hover:scale-105 text-primary hover:bg-background/80">
              <Link href="/auth/sign-up">Sign Up Now - It's Free!</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center border-t bg-background">
        <div className="container">
          <Logo size="sm"/>
          <p className="mt-2 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FinTrack Flow. All rights reserved.
          </p>
          <div className="mt-2 space-x-4">
            <Link href="#" className="text-sm hover:underline text-muted-foreground">Privacy Policy</Link>
            <Link href="#" className="text-sm hover:underline text-muted-foreground">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is a placeholder. In a real app, you'd get the page title dynamically.
  // For now, we'll use a generic title or pass it down from specific pages.
  // However, page components cannot directly pass props to layout components.
  // This title would typically be managed by context or a more complex state solution.
  // Or, each page sets its own document.title.
  // For simplicity of the AppHeader, we might hardcode a title or remove it.
  // Let's assume a generic title or that specific pages handle their title.
  // For now, let's make AppHeader display a generic title or the app name.
  // Or, we can derive the title from the route in AppShell itself.
  return <AppShell pageTitle="My Finances">{children}</AppShell>;
}

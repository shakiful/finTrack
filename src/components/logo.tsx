import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const textSizeClass = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl';
  const iconSize = size === 'lg' ? 30 : size === 'md' ? 24 : 20;

  return (
    <Link href="/" className="flex items-center gap-2 group" aria-label="FinTrack Flow Home">
      <TrendingUp className="text-primary group-hover:animate-pulse" size={iconSize} />
      <h1 className={`font-bold ${textSizeClass} text-foreground group-hover:text-primary transition-colors`}>
        FinTrack Flow
      </h1>
    </Link>
  );
}

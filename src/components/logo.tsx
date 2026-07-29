import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** show the wordmark next to the icon */
  withWordmark?: boolean;
}

export function Logo({ className, withWordmark = false }: LogoProps) {
  const mark = (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-7 w-7", !withWordmark && className)}
      role="img"
      aria-label="PVault logo"
    >
      <rect width="64" height="64" rx="18" fill="hsl(var(--primary))" />
      <path
        d="M32 18c-5.523 0-10 4.477-10 10 0 3.53 1.83 6.632 4.594 8.41L24.8 45.2A1.6 1.6 0 0 0 26.375 47h11.25a1.6 1.6 0 0 0 1.575-1.8l-1.794-8.79C40.17 34.632 42 31.53 42 28c0-5.523-4.477-10-10-10Z"
        fill="hsl(var(--primary-foreground))"
      />
    </svg>
  );

  if (!withWordmark) return mark;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {mark}
      <span className="text-sm font-semibold tracking-tight">PVault</span>
    </div>
  );
}

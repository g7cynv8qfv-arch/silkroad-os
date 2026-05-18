import { type ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <span className="font-mono text-lg font-bold tracking-tight text-foreground">
          SilkRoute OS
        </span>
      </div>
      {children}
    </div>
  );
}

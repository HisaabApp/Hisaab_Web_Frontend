"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, FileText, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface MobileNavProps {
  onFabClick?: () => void;
  fabLabel?: string;
}

export default function MobileNav({ onFabClick, fabLabel = 'Add' }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show on login/register pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full min-w-0 py-1 transition-colors",
                  "active:scale-95 touch-manipulation",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-1", isActive && "animate-in zoom-in-50 duration-200")} />
                <span className={cn(
                  "text-[10px] font-medium truncate",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button */}
      {onFabClick && (
        <Button
          onClick={onFabClick}
          className="md:hidden fixed right-4 bottom-20 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
          size="icon"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">{fabLabel}</span>
        </Button>
      )}

      {/* Spacer for bottom nav */}
      <div className="md:hidden h-16" />
    </>
  );
}

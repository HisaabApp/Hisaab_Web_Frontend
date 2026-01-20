"use client";

import React, { useState, useRef, useCallback, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  threshold?: number;
  refreshText?: string;
  releaseText?: string;
  refreshingText?: string;
}

export default function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  refreshText = "Pull to refresh",
  releaseText = "Release to refresh",
  refreshingText = "Refreshing..."
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start pull-to-refresh if at the top of the page
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === 0 || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only pull down (positive diff) and when at top of scroll
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance to make pull feel natural
      const resistance = 0.5;
      const pull = Math.min(diff * resistance, threshold * 1.5);
      setPullDistance(pull);
    }
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    // Reset
    setPullDistance(0);
    startY.current = 0;
    currentY.current = 0;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldRelease = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex flex-col items-center justify-end overflow-hidden transition-all duration-300 z-10",
          "bg-gradient-to-b from-muted/80 to-transparent"
        )}
        style={{
          height: isRefreshing ? threshold : pullDistance,
          top: 0,
        }}
      >
        <div className="flex flex-col items-center pb-2">
          <RefreshCw
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-300",
              isRefreshing && "animate-spin",
              shouldRelease && !isRefreshing && "text-primary"
            )}
            style={{
              transform: isRefreshing 
                ? undefined 
                : `rotate(${progress * 180}deg)`,
            }}
          />
          <span className="text-xs text-muted-foreground mt-1">
            {isRefreshing 
              ? refreshingText 
              : shouldRelease 
                ? releaseText 
                : refreshText}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
          transition: pullDistance === 0 && !isRefreshing ? 'transform 0.3s ease-out' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

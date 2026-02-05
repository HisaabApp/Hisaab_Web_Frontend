/**
 * Utility to format currency with Rupee
 * Uses "Rs." for reliable display across all systems
 */

import React from 'react';

interface RupeeProps {
  amount: number | string;
  className?: string;
  decimals?: number;
}

/**
 * Rupee component that renders currency
 * Uses "Rs." for consistent display
 */
export function Rupee({ amount, className = '', decimals = 0 }: RupeeProps) {
  const formattedAmount = typeof amount === 'number' 
    ? amount.toFixed(decimals) 
    : amount;
  
  return (
    <span className={className}>
      Rs.{formattedAmount}
    </span>
  );
}

/**
 * Format number with Indian rupee
 * Returns a string with Rs. prefix
 */
export function formatRupee(amount: number, decimals: number = 0): string {
  return `Rs.${amount.toFixed(decimals)}`;
}

/**
 * Format number in Indian number system (lakhs, crores)
 * Example: 1000000 -> "10,00,000"
 */
export function formatIndianNumber(num: number): string {
  const numStr = Math.floor(num).toString();
  let result = '';
  const len = numStr.length;
  
  if (len <= 3) {
    return numStr;
  }
  
  // Last 3 digits
  result = numStr.slice(-3);
  let remaining = numStr.slice(0, -3);
  
  // Add comma every 2 digits for lakhs/crores
  while (remaining.length > 2) {
    result = remaining.slice(-2) + ',' + result;
    remaining = remaining.slice(0, -2);
  }
  
  if (remaining.length > 0) {
    result = remaining + ',' + result;
  }
  
  return result;
}

/**
 * Format rupee with Indian number system
 * Example: 1000000 -> "Rs.10,00,000"
 */
export function formatRupeeIndian(amount: number): string {
  return `Rs.${formatIndianNumber(amount)}`;
}

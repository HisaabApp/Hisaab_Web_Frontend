/**
 * Utility to format currency with proper Rupee symbol
 * Uses a font stack that reliably renders the ₹ symbol
 */

import React from 'react';

interface RupeeProps {
  amount: number | string;
  className?: string;
  decimals?: number;
}

/**
 * Rupee component that properly renders the ₹ symbol
 * Uses Arial font which has reliable rupee glyph support
 */
export function Rupee({ amount, className = '', decimals = 0 }: RupeeProps) {
  const formattedAmount = typeof amount === 'number' 
    ? amount.toFixed(decimals) 
    : amount;
  
  return (
    <span className={className}>
      <span style={{ fontFamily: 'Arial, Roboto, sans-serif' }}>₹</span>
      {formattedAmount}
    </span>
  );
}

/**
 * Format number with Indian rupee symbol
 * Returns a string with ₹ prefix
 */
export function formatRupee(amount: number, decimals: number = 0): string {
  return `₹${amount.toFixed(decimals)}`;
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
 * Example: 1000000 -> "₹10,00,000"
 */
export function formatRupeeIndian(amount: number): string {
  return `₹${formatIndianNumber(amount)}`;
}

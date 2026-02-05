/**
 * PlanComparison Component
 * Detailed comparison table of all plans
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Minus } from 'lucide-react';
import type { PlanComparison } from '@/lib/api/services/plan.service';

interface PlanComparisonProps {
  comparison: PlanComparison;
}

export const PlanComparisonTable: React.FC<PlanComparisonProps> = ({ comparison }) => {
  // Safety checks for comparison data
  if (!comparison || !comparison.plans || !Array.isArray(comparison.plans) || 
      !comparison.features || !Array.isArray(comparison.features)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Plan Comparison</CardTitle>
          <CardDescription>Compare features across all plans</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Comparison data is not available. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-600 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-gray-300 mx-auto" />
      );
    }
    
    if (value === -1) return <span className="text-sm font-medium">Unlimited</span>;
    if (typeof value === 'number') return <span className="text-sm font-medium">{value.toLocaleString()}</span>;
    if (value === 'N/A') return <Minus className="h-5 w-5 text-gray-300 mx-auto" />;
    
    return <span className="text-sm">{value}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Plan Comparison</CardTitle>
        <CardDescription>Compare features across all plans</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Feature</th>
                {comparison.plans.map((plan) => (
                  <th key={plan.name} className="text-center py-3 px-4 font-semibold">
                    <div className="flex flex-col items-center gap-1">
                      <span>{plan.displayName}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {plan.currency}{plan.price}/mo
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {comparison.features.map((category, categoryIdx) => (
                <React.Fragment key={category?.category || categoryIdx}>
                  {/* Category Header */}
                  <tr className={`bg-muted/50 ${categoryIdx > 0 ? 'border-t-2' : ''}`}>
                    <td colSpan={comparison.plans.length + 1} className="py-2 px-4 font-semibold text-sm">
                      {category?.category || 'Features'}
                    </td>
                  </tr>

                  {/* Category Items */}
                  {Array.isArray(category?.items) && category.items.map((item, itemIdx) => (
                    <tr key={item?.name || itemIdx} className={`border-b ${itemIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-sm">{item?.name || 'Feature'}</div>
                          {item?.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </td>
                      {comparison.plans.map((plan) => (
                        <td key={`${item?.name || itemIdx}-${plan.name}`} className="text-center py-3 px-4">
                          {renderValue(item?.plans?.[plan.name] ?? false)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};


import { useMemo } from 'react';

export function usePeriodsComparison(data = [], overrides = {}) {
  return useMemo(() => {
    // Initialize Result
    const result = {
      currentValue: 0,
      previousValue: 0,
      percentChange: 0,
      displayPercent: '0%',
      trend: 'neutral',
      sparklineData: data || []
    };

    let currentSum = 0;
    let prevSum = 0;

    // Use overrides if provided (for distinct counts or weighted averages)
    if (overrides.currentValue !== undefined && overrides.previousValue !== undefined) {
        currentSum = overrides.currentValue;
        prevSum = overrides.previousValue;
    } else if (data && data.length > 0) {
        // Default Logic: Compare Last 7 Days (Current) vs Previous 7 Days (Previous)
        const periodDays = 7;
        const totalPoints = data.length;
        
        const currentEnd = totalPoints;
        const currentStart = Math.max(0, totalPoints - periodDays);
        
        const prevEnd = currentStart;
        const prevStart = Math.max(0, prevEnd - periodDays);

        const currentPeriodData = data.slice(currentStart, currentEnd);
        const prevPeriodData = data.slice(prevStart, prevEnd);

        currentSum = currentPeriodData.reduce((sum, item) => sum + (item.value || 0), 0);
        prevSum = prevPeriodData.reduce((sum, item) => sum + (item.value || 0), 0);
    }

    let percentChange = 0;
    let trend = 'neutral';
    let displayPercent = '0%';

    // Calculate Comparison Logic
    if (prevSum === 0) {
        if (currentSum > 0) {
            percentChange = 100; 
            trend = 'up';
            displayPercent = 'N/A'; 
        } else {
            // 0 vs 0
            percentChange = 0;
            trend = 'neutral';
            displayPercent = '0%';
        }
    } else {
        percentChange = ((currentSum - prevSum) / prevSum) * 100;
        trend = percentChange > 0 ? 'up' : (percentChange < 0 ? 'down' : 'neutral');
        displayPercent = `${Math.abs(Math.round(percentChange))}%`;
    }

    return {
      currentValue: currentSum,
      previousValue: prevSum,
      percentChange,
      displayPercent,
      trend,
      sparklineData: data 
    };
  }, [data, overrides]);
}


import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { useDarkMode } from '@/contexts/DarkModeContext';

function KPICard({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    sparklineData, 
    index, 
    loading = false
}) {
  const { isDarkMode } = useDarkMode();

  const getTrendColor = (t) => {
    if (t === 'up') return 'text-emerald-600 dark:text-emerald-400';
    if (t === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getTrendIcon = (t) => {
    if (t === 'up') return <TrendingUp className="h-3 w-3 mr-1" />;
    if (t === 'down') return <TrendingDown className="h-3 w-3 mr-1" />;
    return <Minus className="h-3 w-3 mr-1" />;
  };

  const getLineColor = (t) => {
      if (t === 'up') return '#10b981'; // Emerald 500
      if (t === 'down') return '#ef4444'; // Red 500
      return '#94a3b8'; // Slate 400
  };

  const safeData = sparklineData && sparklineData.length > 0 
    ? sparklineData 
    : [{ value: 0 }, { value: 0 }];

  if (loading) {
     return (
        <Card className="h-full border-gray-200 dark:border-slate-800 dark:bg-slate-900">
             <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse dark:bg-slate-800" />
                    <div className="w-20 h-8 bg-gray-100 rounded animate-pulse dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                    <div className="w-24 h-4 bg-gray-100 rounded animate-pulse dark:bg-slate-800" />
                    <div className="w-32 h-8 bg-gray-100 rounded animate-pulse dark:bg-slate-800" />
                </div>
             </CardContent>
        </Card>
     );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Card className="relative overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 dark:bg-slate-900 dark:border-slate-800 h-full flex flex-col">
        <CardContent className="p-5 flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg dark:bg-slate-800">
               <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
             
             {/* Sparkline */}
             <div className="h-[40px] w-[100px] -mr-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={safeData}>
                        <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={getLineColor(trend?.direction)} 
                            strokeWidth={2} 
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</h3>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center text-xs">
            {trend && (
                <span className={`flex items-center font-medium ${getTrendColor(trend.direction)}`}>
                    {getTrendIcon(trend.direction)}
                    {trend.displayPercent || `${Math.abs(trend.percentChange)}%`}
                </span>
            )}
            <span className="text-gray-400 ml-2 dark:text-slate-500">vs période préc.</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default KPICard;

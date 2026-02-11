
import React from 'react';
import { cn } from '@/lib/utils';

const Alert = React.forwardRef(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      'relative w-full rounded-lg border p-4',
      {
        'bg-white text-gray-950 border-gray-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-50': variant === 'default',
        'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-900': variant === 'destructive',
        'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-900': variant === 'info',
      },
      className
    )}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };


import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SkeletonLoader = ({ className, count = 1, height = "h-4" }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full", height)} />
      ))}
    </div>
  );
};

export default SkeletonLoader;

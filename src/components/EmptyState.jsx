
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = FileQuestion, 
  title = "Aucune donnée", 
  description = "Il n'y a rien à afficher pour le moment.",
  actionLabel,
  onAction,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200", className)}>
      <div className="bg-white p-3 rounded-full mb-4 shadow-sm">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

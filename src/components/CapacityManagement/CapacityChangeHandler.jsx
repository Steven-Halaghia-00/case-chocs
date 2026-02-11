
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, AlertCircle, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { updateSessionCapacity } from '@/lib/capacityService';

const CapacityChangeHandler = ({ sessionId, currentCapacity, onUpdate, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [capacity, setCapacity] = useState(currentCapacity || 0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setCapacity(currentCapacity || 0);
  }, [currentCapacity]);

  const handleUpdate = async () => {
    // Validation
    const numCapacity = parseInt(capacity, 10);
    if (isNaN(numCapacity) || numCapacity < 0) {
      setStatus('error');
      setMessage('Entier positif requis');
      return;
    }

    if (numCapacity === currentCapacity) {
        setIsEditing(false);
        return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Use the service function instead of direct RPC call
      console.log(`Updating capacity for session ${sessionId} to ${numCapacity}`);
      await updateSessionCapacity(sessionId, numCapacity);

      setStatus('success');
      setMessage('Mise à jour réussie !');
      
      // Notify parent
      if (onUpdate) onUpdate(numCapacity);

      // Close edit mode after short delay
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
        setIsEditing(false);
      }, 1500);

    } catch (err) {
      console.error('Error updating capacity:', err);
      setStatus('error');
      setMessage(err.message || 'Erreur lors de la mise à jour');
      toast({
        variant: "destructive",
        title: "Erreur de mise à jour",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
          {currentCapacity}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(true)}
          className="h-8 w-8 p-0 text-gray-500 hover:text-indigo-600"
          title="Modifier la capacité"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className={cn(
            "w-24 font-mono text-lg h-9",
            status === 'error' ? "border-red-500" : ""
          )}
          min="0"
          disabled={loading}
        />
        <Button 
          onClick={handleUpdate} 
          disabled={loading || capacity === ''} 
          size="sm"
          className="h-9 px-3"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
              setIsEditing(false);
              setCapacity(currentCapacity);
              setStatus('idle');
          }}
          className="h-9 w-9 p-0"
          disabled={loading}
        >
            <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Status Messages */}
      {status === 'success' && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 animate-in fade-in slide-in-from-top-1">
          <Check className="h-3 w-3" /> {message}
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-3 w-3" /> {message}
        </div>
      )}
    </div>
  );
};

export default CapacityChangeHandler;

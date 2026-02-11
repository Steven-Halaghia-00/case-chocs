
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';

const WebhookAlertBanner = () => {
  const [recentErrors, setRecentErrors] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // Use maybeSingle() to safely handle 0 or 1 result while getting the count
        // This avoids PGRST116 errors if we were using .single() on an empty set
        const { count, error } = await supabase
            .from('petzi_webhook_logs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'error')
            .gte('created_at', yesterday.toISOString());

        if (error) {
            // Gracefully handle missing table or other errors
            if (error.code === '42P01') {
                console.warn("WebhookAlertBanner: Table logs missing");
                setTableExists(false);
                return;
            }
            throw error;
        }
        
        setRecentErrors(count || 0);

      } catch (err) {
        console.error("WebhookAlertBanner Error:", err);
        // If table doesn't exist, we just hide the banner logic silently after logging
        if (err.message?.includes('does not exist')) {
            setTableExists(false);
        }
      }
    };

    if (tableExists) {
        fetchErrors();
        
        const channel = supabase
          .channel('webhook_errors')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'petzi_webhook_logs', filter: "status=eq.error" },
            () => {
              setRecentErrors(prev => prev + 1);
              setIsVisible(true);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
    }
  }, [tableExists]);

  if (!isVisible || recentErrors === 0) return null;

  return (
    <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Attention: Erreurs Webhook Détectées
      </AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between">
        <span>
          {recentErrors} erreur{recentErrors > 1 ? 's' : ''} critique{recentErrors > 1 ? 's' : ''} détectée{recentErrors > 1 ? 's' : ''} dans les logs webhook ces dernières 24h.
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-red-200 hover:bg-red-100 text-red-800 dark:border-red-800 dark:hover:bg-red-900/40"
            onClick={() => navigate('/admin')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Voir Admin
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/40"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default WebhookAlertBanner;

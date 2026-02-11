
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { subDays } from 'date-fns';
import { logDatabaseError } from '@/lib/databaseErrorHandler';

const ITEMS_PER_PAGE = 20;

export function useWebhookLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [errorState, setErrorState] = useState(null);
  
  const [filters, setFilters] = useState({
    page: 1,
    level: 'all',
    functionName: 'all',
    searchTerm: '',
    dateRange: '7d',
  });

  const { toast } = useToast();

  const fetchLogs = useCallback(async (newFilters) => {
    const currentFilters = { ...filters, ...newFilters };
    setLoading(true);
    setErrorState(null);

    try {
      let query = supabase
        .from('webhook_logs')
        .select('*', { count: 'exact' });

      // Apply Filters
      if (currentFilters.level !== 'all') {
        // FIXED: Using log_level instead of level
        query = query.eq('log_level', currentFilters.level);
      }
      if (currentFilters.functionName !== 'all') {
        query = query.eq('function_name', currentFilters.functionName);
      }
      if (currentFilters.searchTerm) {
        query = query.ilike('message', `%${currentFilters.searchTerm}%`);
      }
      
      if (currentFilters.dateRange === '24h') {
        query = query.gte('timestamp', subDays(new Date(), 1).toISOString());
      } else if (currentFilters.dateRange === '7d') {
        query = query.gte('timestamp', subDays(new Date(), 7).toISOString());
      } else if (currentFilters.dateRange === '30d') {
        query = query.gte('timestamp', subDays(new Date(), 30).toISOString());
      }

      // Pagination
      const from = (currentFilters.page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // FIXED: using log_level
      const { data, error, count } = await query
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setLogs(data || []);
      setTotalCount(count || 0);

    } catch (e) {
      console.error('[useWebhookLogs] Fetch Exception:', e);
      setErrorState({
          message: e.message || "Unknown error",
          details: e.details || e.hint || "Check console for more info",
      });
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de récupérer les logs webhooks."
      });
      await logDatabaseError('useWebhookLogs', 'error', 'Failed to fetch webhook logs', { error: e.message });
    } finally {
      setLoading(false);
    }
  }, [toast, filters]);

  useEffect(() => {
    fetchLogs();
  }, [filters.page, filters.level, filters.functionName, filters.searchTerm, filters.dateRange]);

  // Real-time Subscription
  useEffect(() => {
    const channel = supabase
      .channel('table-db-changes-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webhook_logs' },
        (payload) => {
          // A simple refetch on the first page is easiest
          if (filters.page === 1) {
            fetchLogs(filters);
            toast({
              title: "Nouveau log reçu",
              description: payload.new.message,
              duration: 2000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters, fetchLogs, toast]);
  
  const updateFilters = (newFilters) => {
      setFilters(prev => ({...prev, ...newFilters, page: 1}));
  };

  const goToPage = (page) => {
      if (page >= 1 && page <= Math.ceil(totalCount / ITEMS_PER_PAGE)) {
        setFilters(prev => ({...prev, page}));
      }
  };


  return {
    logs,
    totalCount,
    loading,
    error: errorState,
    filters,
    updateFilters,
    goToPage,
    refetch: () => fetchLogs(filters)
  };
}

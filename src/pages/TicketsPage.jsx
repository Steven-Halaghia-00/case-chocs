
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import ExportTicketsButton from '@/components/ExportTicketsButton';
import TicketsTable from '@/components/TicketsTable';
import CapacityManagementPage from '@/pages/CapacityManagementPage';
import { supabase } from '@/lib/customSupabaseClient';
import { Search, RefreshCcw, Ticket, AlertCircle, BarChart3, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { retryOperation, getErrorMessage } from '@/lib/networkUtils';
import { useToast } from '@/components/ui/use-toast';

const ITEMS_PER_PAGE = 20;

const TicketsPage = () => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [errorState, setErrorState] = useState(null);

  const [activeTab, setActiveTab] = useState('list');
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchTickets();
    }
  }, [currentPage, searchTerm, statusFilter, categoryFilter, eventFilter, activeTab]);

  const fetchCategories = async () => {
    try {
      await retryOperation(async () => {
        const { data, error } = await supabase.from('petzi_tickets').select('category');
        if (error) throw error;
        if (data) {
          const uniqueCats = [...new Set(data.map(item => item.category).filter(Boolean))];
          setAvailableCategories(uniqueCats);
        }
      });
    } catch (err) {
      console.warn("Failed to fetch categories:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      await retryOperation(async () => {
        const { data, error } = await supabase
          .from('petzi_events')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setAvailableEvents(data || []);
      });
    } catch (err) {
      console.warn("Failed to fetch events:", err);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setErrorState(null);
      console.log("[TicketsPage] Fetching petzi_tickets...");

      await retryOperation(async () => {
        let query = supabase.from('petzi_tickets').select('*', { count: 'exact' });

        if (searchTerm) {
          query = query.or(`ticket_number.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);
        }
        
        if (statusFilter !== 'all') {
          query = query.eq('payment_status', statusFilter);
        }
        
        if (categoryFilter !== 'all') {
          query = query.eq('category', categoryFilter);
        }

        if (eventFilter !== 'all') {
          query = query.eq('event_id', eventFilter);
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        
        console.log(`[TicketsPage] Response received: ${data?.length} tickets`);
        setTickets(data || []);
        setTotalCount(count || 0);
      });

    } catch (error) {
      console.error("[TicketsPage] Exception:", error);
      const friendlyMessage = getErrorMessage(error);
      setErrorState({
        message: friendlyMessage,
        details: error.message || "Check network connection or RLS policies",
        query: "from('petzi_tickets')"
      });
      
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: friendlyMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    if (activeTab === 'list') {
      fetchTickets();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <Helmet>
        <title>Gestion des Billets - Case à Chocs</title>
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Ticket className="h-8 w-8 text-indigo-600" />
            Gestion des Billets
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Suivi des ventes et gestion de la capacité</p>
        </div>
        <div className="flex gap-2">
          <ExportTicketsButton />
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-1 rounded-lg">
           <TabsTrigger value="list" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-300">
              <List className="h-4 w-4 mr-2" /> Liste des Tickets
           </TabsTrigger>
           <TabsTrigger value="capacity" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-300">
              <BarChart3 className="h-4 w-4 mr-2" /> Gestion Capacité
           </TabsTrigger>
        </TabsList>

        {/* TAB 1: TICKET LIST */}
        <TabsContent value="list" className="space-y-4">
          <Card className="dark:bg-slate-900">
            <CardContent className="pt-6">
               {/* Filters */}
               <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                         <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                         <Input 
                           placeholder="Rechercher par n° ticket ou titre..." 
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                           className="pl-8 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                         />
                      </div>
                      
                      <Select value={eventFilter} onValueChange={setEventFilter}>
                         <SelectTrigger className="w-full md:w-[200px] dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                            <SelectValue placeholder="Événement" />
                         </SelectTrigger>
                         <SelectContent className="dark:bg-slate-900 dark:border-slate-700">
                            <SelectItem value="all">Tous les événements</SelectItem>
                            {availableEvents.map(evt => (
                              <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                         <SelectTrigger className="w-full md:w-[180px] dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                            <SelectValue placeholder="Catégorie" />
                         </SelectTrigger>
                         <SelectContent className="dark:bg-slate-900 dark:border-slate-700">
                            <SelectItem value="all">Toutes catégories</SelectItem>
                            {availableCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                         <SelectTrigger className="w-full md:w-[150px] dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                            <SelectValue placeholder="Statut (Paiement)" />
                         </SelectTrigger>
                         <SelectContent className="dark:bg-slate-900 dark:border-slate-700">
                            <SelectItem value="all">Tous statuts</SelectItem>
                            <SelectItem value="paid">Payé</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                            <SelectItem value="refunded">Remboursé</SelectItem>
                         </SelectContent>
                      </Select>
                  </div>
               </div>

               {/* Error & Content */}
               {errorState ? (
                 <div className="rounded-md bg-red-50 dark:bg-red-950 p-6 border border-red-200 dark:border-red-900 text-center">
                    <div className="flex justify-center mb-4">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Erreur de chargement</h3>
                    <p className="text-red-700 dark:text-red-400 mb-4">{errorState.message}</p>
                    <Button variant="default" onClick={fetchTickets} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">
                        Réessayer
                    </Button>
                 </div>
               ) : loading ? (
                 <SkeletonLoader count={10} height="h-12" />
               ) : tickets.length === 0 ? (
                 <EmptyState title="Aucun ticket trouvé" />
               ) : (
                 <TicketsTable tickets={tickets} />
               )}
               
               {/* Pagination */}
               {!errorState && (
                 <div className="flex justify-between items-center mt-4 border-t pt-4 border-gray-200 dark:border-slate-800">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Affichage {tickets.length} sur {totalCount} résultats
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700">Précédent</Button>
                       <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => p+1)} disabled={tickets.length < ITEMS_PER_PAGE} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700">Suivant</Button>
                    </div>
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CAPACITY MANAGEMENT */}
        <TabsContent value="capacity" className="space-y-4">
           {activeTab === 'capacity' && <CapacityManagementPage />}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default TicketsPage;


import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Trash2, Download, Table as TableIcon, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function DatabaseManagementSection() {
  const { toast } = useToast();
  const [tables, setTables] = useState({
    petzi_events: { count: 0, data: [] },
    petzi_sessions: { count: 0, data: [] },
    petzi_tickets: { count: 0, data: [] },
    petzi_webhook_logs: { count: 0, data: [] },
    petzi_webhook_calls: { count: 0, data: [] }
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const tableNames = ['petzi_events', 'petzi_sessions', 'petzi_tickets', 'petzi_webhook_logs', 'petzi_webhook_calls'];
      const newStats = {};

      for (const table of tableNames) {
        // Get Count
        const { count, error: countError } = await supabase.from(table).select('*', { count: 'exact', head: true });
        
        if (countError && countError.code !== '42P01') { // Ignore "relation does not exist" for cleaner logs if table missing
             console.error(`Error counting ${table}:`, countError);
        }

        // Get Sample
        const { data, error: dataError } = await supabase.from(table).select('*').limit(5);

        newStats[table] = {
          count: count || 0,
          data: data || []
        };
      }
      setTables(newStats);
    } catch (err) {
      console.error("DB Stats Error:", err);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les statistiques de la base de données."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExport = (tableName) => {
    // This function handles the single page export sample
    // Kept for compatibility if needed, but handleFetchAllForExport is preferred
    const dataStr = JSON.stringify(tables[tableName].data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${tableName}_sample_export_${new Date().toISOString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleFetchAllForExport = async (tableName) => {
      setActionLoading(true);
      try {
          console.log(`[Export] Exporting ${tableName}...`);
          // Warning: Client-side export limit
          const { data, error } = await supabase.from(tableName).select('*').limit(2000);
          
          if (error) throw error;
          
          const dataStr = JSON.stringify(data, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', `${tableName}_full_export_${new Date().toISOString()}.json`);
          linkElement.click();
          
          toast({
            title: "Export réussi",
            description: `${data.length} entrées exportées pour ${tableName}.`,
            className: "bg-green-50 border-green-200 text-green-800"
          });

      } catch(e) {
          console.error("[Export Error]", e);
          toast({
            variant: "destructive",
            title: "Erreur d'export",
            description: e.message
          });
      } finally {
          setActionLoading(false);
      }
  };

  const handleDeleteAll = async () => {
     if (!confirmDelete) return;
     
     const tableName = confirmDelete;
     setActionLoading(true);
     console.log(`[Delete] Starting purge for table: ${tableName} at ${new Date().toISOString()}`);

     try {
         let query = supabase.from(tableName).delete();
         
         // Supabase requires a filter for delete operations.
         // We construct a "delete all" filter based on likely ID types.
         // petzi_events, petzi_sessions use integer IDs.
         // others use UUIDs.
         
         if (['petzi_events', 'petzi_sessions'].includes(tableName)) {
             // For integer IDs, delete everything greater than -1
             query = query.gt('id', -1);
         } else {
             // For UUIDs, delete everything that is not the nil UUID (or just use not-null check if possible, but neq is standard)
             query = query.neq('id', '00000000-0000-0000-0000-000000000000');
         }

         const { error, count } = await query;
         
         if (error) {
             throw error;
         }

         console.log(`[Delete] Successfully purged ${tableName}.`);

         toast({
            title: "Suppression réussie",
            description: `La table ${tableName} a été vidée avec succès.`,
            className: "bg-green-50 border-green-200 text-green-800",
            duration: 3000
         });
         
         setConfirmDelete(null);
         await fetchStats();

     } catch (e) {
         console.error(`[Delete Error] Failed to purge ${tableName}:`, e);
         toast({
            variant: "destructive",
            title: "Erreur de suppression",
            description: `Impossible de vider la table ${tableName}. Vérifiez les permissions ou les clés étrangères. Détails: ${e.message}`,
         });
     } finally {
         setActionLoading(false);
     }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Gestion Base de Données</h2>
          <Button variant="outline" onClick={fetchStats} disabled={loading || actionLoading}>
             {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Actualiser'}
          </Button>
       </div>

       <div className="grid gap-4">
          {Object.entries(tables).map(([name, stats]) => (
             <Card key={name} className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-slate-900 py-3">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                         <TableIcon className="h-4 w-4 text-gray-500" />
                         <span className="font-mono font-bold text-sm">{name}</span>
                         <Badge variant="secondary">{stats.count} entrées</Badge>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                         <Button 
                            size="xs" 
                            variant="outline" 
                            className="flex-1 sm:flex-none"
                            onClick={() => handleFetchAllForExport(name)} 
                            disabled={actionLoading}
                         >
                            <Download className="h-3 w-3 mr-1" /> JSON
                         </Button>
                         <Button 
                            size="xs" 
                            variant="destructive" 
                            className="flex-1 sm:flex-none"
                            onClick={() => setConfirmDelete(name)} 
                            disabled={actionLoading || stats.count === 0}
                         >
                            <Trash2 className="h-3 w-3 mr-1" /> Vider
                         </Button>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   <Accordion type="single" collapsible>
                      <AccordionItem value="sample" className="border-0">
                         <AccordionTrigger className="px-4 py-2 hover:no-underline text-xs text-gray-500">
                            Voir échantillon (5 dernières entrées)
                         </AccordionTrigger>
                         <AccordionContent>
                            <div className="bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-x-auto max-h-60 mx-4 mb-4 rounded-md">
                               {stats.data.length > 0 
                                 ? JSON.stringify(stats.data, null, 2)
                                 : <span className="text-gray-500 italic">Table vide ou données non disponibles</span>
                               }
                            </div>
                         </AccordionContent>
                      </AccordionItem>
                   </Accordion>
                </CardContent>
             </Card>
          ))}
       </div>

       <Dialog open={!!confirmDelete} onOpenChange={(open) => !actionLoading && setConfirmDelete(open ? confirmDelete : null)}>
          <DialogContent>
             <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                   <AlertTriangle className="h-5 w-5" /> Confirmer la suppression
                </DialogTitle>
                <DialogDescription className="pt-2">
                   Êtes-vous sûr de vouloir supprimer <strong>TOUS</strong> les enregistrements de la table <span className="font-mono font-bold text-red-600">{confirmDelete}</span> ?
                   <br/><br/>
                   <span className="font-semibold text-red-700">Cette action est irréversible.</span>
                   {['petzi_events', 'petzi_sessions'].includes(confirmDelete) && (
                       <p className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                           Note: La suppression d'événements ou de sessions peut entraîner la suppression en cascade des tickets associés.
                       </p>
                   )}
                </DialogDescription>
             </DialogHeader>
             <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={actionLoading}>
                    Annuler
                </Button>
                <Button variant="destructive" onClick={handleDeleteAll} disabled={actionLoading}>
                   {actionLoading ? (
                       <>
                         <Loader2 className="animate-spin h-4 w-4 mr-2" />
                         Suppression en cours...
                       </>
                   ) : (
                       'Supprimer définitivement'
                   )}
                </Button>
             </DialogFooter>
          </DialogContent>
       </Dialog>
    </div>
  );
}

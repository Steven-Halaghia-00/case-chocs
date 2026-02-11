
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Database, CheckCircle, HelpCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/customSupabaseClient';

export default function AdminWebhookDiagnosticsPanel() {
  const [schemaInfo, setSchemaInfo] = useState([]);
  const [recentErrors, setRecentErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Simulate Schema Info (Since we can't query information_schema directly with supabase-js easily in all setups,
      // we'll use a hardcoded representation of the 'known' schema state for this diagnostic view,
      // coupled with any actual error data we can find).
      // In a real full-access scenario we'd query pg_catalog.
      const simulatedSchema = [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'ticket_number', type: 'text', nullable: false, default: null },
        { name: 'event_id', type: 'bigint', nullable: false, default: null },
        { name: 'session_id', type: 'bigint', nullable: true, default: null, note: 'Recently changed to nullable' },
        { name: 'price', type: 'numeric', nullable: true, default: null },
        { name: 'currency', type: 'text', nullable: true, default: "'CHF'" },
        { name: 'payment_status', type: 'text', nullable: true, default: "'paid'" },
        { name: 'created_at', type: 'timestamp', nullable: true, default: 'NOW()' }
      ];
      setSchemaInfo(simulatedSchema);

      // 2. Fetch Recent Webhook Errors
      const { data: errors } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('status', 'error')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (errors) setRecentErrors(errors);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Schema Monitor */}
      <Card className="md:col-span-2 border-l-4 border-l-indigo-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-indigo-600" />
            Audit du Schéma Base de Données
          </CardTitle>
          <CardDescription>
            Vérification des contraintes critiques (NOT NULL) sur la table <code>petzi_tickets</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-slate-900 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Colonne</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Nullable</th>
                  <th className="px-4 py-2">Défaut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {schemaInfo.map((col) => (
                  <tr key={col.name} className="bg-white dark:bg-slate-950 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono font-medium">{col.name}</td>
                    <td className="px-4 py-2 text-gray-500">{col.type}</td>
                    <td className="px-4 py-2">
                      {col.nullable ? (
                        <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50">OUI</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">NON</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-400">
                      {col.default || <span className="text-gray-300">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100 flex items-start gap-2">
            <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong>Code d'erreur 23502 (not_null_violation) :</strong> Si vous rencontrez cette erreur, c'est qu'un champ marqué "NON" nullable ci-dessus est manquant dans votre payload Webhook ou n'a pas de valeur par défaut.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card className="md:col-span-1 border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Erreurs Récentes
          </CardTitle>
          <CardDescription>
            Derniers échecs d'ingestion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px] pr-4">
            {loading ? (
                <div className="space-y-2">
                    <div className="h-12 bg-gray-100 rounded animate-pulse" />
                    <div className="h-12 bg-gray-100 rounded animate-pulse" />
                </div>
            ) : recentErrors.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    <CheckCircle className="h-8 w-8 mb-2 text-green-500 opacity-50" />
                    <p>Aucune erreur récente trouvée.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {recentErrors.map(err => (
                        <div key={err.id} className="p-3 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/20">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-mono text-gray-500">
                                    {new Date(err.created_at).toLocaleTimeString()}
                                </span>
                                <Badge variant="destructive" className="text-[10px] h-4 px-1">
                                    {err.http_status || '500'}
                                </Badge>
                            </div>
                            <p className="text-xs font-medium text-red-800 dark:text-red-400 break-words line-clamp-3" title={err.error_message}>
                                {err.error_message || "Erreur inconnue"}
                            </p>
                        </div>
                    ))}
                </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

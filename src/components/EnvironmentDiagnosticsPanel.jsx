
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, ShieldAlert, Globe, Unplug } from 'lucide-react';

export default function EnvironmentDiagnosticsPanel() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Basic validation regex for URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const endpointUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/petzi-webhook` : 'N/A';
  const isUrlValid = isValidUrl(supabaseUrl);
  const isEndpointValid = isValidUrl(endpointUrl) && endpointUrl !== 'N/A';
  const hasKey = !!anonKey && anonKey !== 'PLACEHOLDER_KEY';

  return (
    <Card className="mb-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Diagnostic Environnement
            </CardTitle>
            <CardDescription>
              Vérification de la configuration locale pour les tests Webhook.
            </CardDescription>
          </div>
          {isUrlValid && hasKey ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Configuration OK</Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Configuration Incomplète</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
        
        {/* URL Configuration */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" />
            VITE_SUPABASE_URL
          </h4>
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
             {isUrlValid ? (
               <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
             ) : (
               <XCircle className="w-5 h-5 text-red-500 shrink-0" />
             )}
             <code className="text-xs font-mono break-all text-slate-600 dark:text-slate-400">
               {supabaseUrl || 'Non défini'}
             </code>
          </div>
          <p className="text-xs text-slate-500 ml-1">
             Doit être une URL valide (https://...)
          </p>
        </div>

        {/* Auth Key Configuration */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            VITE_SUPABASE_ANON_KEY
          </h4>
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
             {hasKey ? (
               <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
             ) : (
               <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
             )}
             <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
               {hasKey ? '✅ Clé configurée (Masquée)' : '❌ Clé manquante ou invalide'}
             </span>
          </div>
           <p className="text-xs text-slate-500 ml-1">
             Ne partagez jamais cette clé publiquement.
          </p>
        </div>

        {/* Endpoint Calculation */}
        <div className="md:col-span-2 space-y-3">
           <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Unplug className="w-4 h-4 text-slate-500" />
            Endpoint Cible (Calculé)
          </h4>
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
             {isEndpointValid ? (
               <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
             ) : (
               <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
             )}
             <code className="text-xs font-mono break-all text-slate-600 dark:text-slate-400">
               {endpointUrl}
             </code>
          </div>
          <p className="text-xs text-slate-500 ml-1">
             C'est l'URL vers laquelle le simulateur enverra les requêtes POST.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

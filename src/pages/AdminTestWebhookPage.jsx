
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, AlertTriangle, AlertCircle, Lock } from 'lucide-react';
import { testWebhookFlow } from '@/lib/webhookTestHelper';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CustomWebhookTestForm from '@/components/Admin/CustomWebhookTestForm';
import EnvironmentDiagnosticsPanel from '@/components/EnvironmentDiagnosticsPanel';
import AdminWebhookDiagnosticsPanel from '@/components/AdminWebhookDiagnosticsPanel';
import TroubleshootingGuide from '@/components/TroubleshootingGuide';

export default function AdminTestWebhookPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const { toast } = useToast();

  const hasEnvVars = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  const runTest = async () => {
    if (!hasEnvVars) {
       toast({ variant: "destructive", title: "Configuration manquante", description: "Impossible de lancer le test sans variables d'environnement." });
       return;
    }

    setIsRunning(true);
    setResult(null);
    setLogs([]);
    
    const logInterceptor = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    try {
      logInterceptor("Démarrage du test de flux...");
      const testResult = await testWebhookFlow();
      setResult(testResult);
      
      if (testResult.success) {
        toast({ title: "Test réussi", description: "Le flux webhook est opérationnel.", className: "bg-green-50 text-green-900 border-green-200" });
        logInterceptor("Test terminé avec SUCCÈS.");
      } else {
        toast({ variant: "destructive", title: "Échec du test", description: "Vérifiez les logs pour plus de détails." });
        logInterceptor("Test terminé avec des ERREURS.");
      }
    } catch (e) {
      logInterceptor(`ERREUR FATALE: ${e.message}`);
      toast({ variant: "destructive", title: "Erreur critique", description: e.message });
      setResult({ success: false, error: e.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test de Flux Webhook</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Simulateur pour vérifier l'intégration complète de bout en bout.</p>
      </div>

      {/* System Diagnostics */}
      <EnvironmentDiagnosticsPanel />
      
      {/* Detailed Webhook Diagnostics (Schema & Logs) */}
      <AdminWebhookDiagnosticsPanel />

      {/* Manual Test Form */}
      <CustomWebhookTestForm />

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-50 dark:bg-slate-950 px-2 text-gray-500">Ou utiliser le scénario automatique</span>
        </div>
      </div>

      {/* Automated Test Scenario */}
      <Card className={!hasEnvVars ? "opacity-60 grayscale pointer-events-none relative" : ""}>
        {!hasEnvVars && (
           <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-[1px]">
             <div className="bg-white p-3 rounded-full shadow-lg">
                <Lock className="w-6 h-6 text-gray-400" />
             </div>
           </div>
        )}

        <CardHeader>
          <CardTitle>Test Automatique Complet</CardTitle>
          <CardDescription>
            Ce test simule l'envoi d'un webhook Petzi valide, vérifie le traitement par la Edge Function, et confirme l'insertion en base.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
             <Button onClick={runTest} disabled={isRunning || !hasEnvVars} variant="outline" size="lg" className="w-full sm:w-auto">
                <Play className={`mr-2 h-5 w-5 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? 'Test en cours...' : 'Lancer le Test Automatique'}
             </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {(result || logs.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4">
           {/* Logs Console */}
           <Card className="md:col-span-2 lg:col-span-1 bg-slate-950 border-slate-900 text-slate-300">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-mono text-slate-400">Console de Test</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="font-mono text-xs space-y-1 h-[300px] overflow-y-auto custom-scrollbar p-2">
                 {logs.map((log, i) => (
                   <div key={i} className="border-b border-slate-800/50 pb-1 last:border-0">{log}</div>
                 ))}
               </div>
             </CardContent>
           </Card>

           {/* Results Summary */}
           <Card className="md:col-span-2 lg:col-span-1">
             <CardHeader className="pb-2">
               <CardTitle className="flex items-center justify-between">
                 Résultat
                 {result && (
                   <span className={`flex items-center text-sm px-3 py-1 rounded-full ${result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {result.success ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                      {result.success ? 'SUCCÈS' : 'ÉCHEC'}
                   </span>
                 )}
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 pt-4">
                {result && result.error && (
                   <div className="p-4 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                      <strong>Erreur:</strong> {result.error}
                   </div>
                )}
             </CardContent>
           </Card>
        </div>
      )}

      <TroubleshootingGuide />
    </div>
  );
}

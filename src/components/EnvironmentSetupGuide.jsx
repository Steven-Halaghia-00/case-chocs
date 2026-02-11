
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, FileText, Settings, Key, RefreshCw } from 'lucide-react';

export default function EnvironmentSetupGuide() {
  return (
    <Card className="w-full border-l-4 border-l-blue-500 bg-blue-50/30 shadow-sm mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-blue-900">Configuration Requise</CardTitle>
            <CardDescription className="text-blue-700">
              Pour utiliser le simulateur de webhook, vous devez connecter l'application à Supabase.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-white border-blue-200 text-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle>Variables d'environnement manquantes</AlertTitle>
          <AlertDescription>
            L'application ne détecte pas <code>VITE_SUPABASE_URL</code> ou <code>VITE_SUPABASE_ANON_KEY</code>.
          </AlertDescription>
        </Alert>

        <div className="bg-white rounded-lg p-6 border border-blue-100 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Guide d'installation étape par étape
          </h3>
          
          <ol className="space-y-4 ml-2 relative border-l-2 border-blue-100 pl-6 pb-2">
            <li className="relative">
              <span className="absolute -left-[33px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white font-bold ring-4 ring-white">1</span>
              <p className="font-medium text-gray-800">Accédez à votre projet Supabase</p>
              <p className="text-sm text-gray-600">Connectez-vous à votre tableau de bord Supabase et sélectionnez votre projet.</p>
            </li>
            
            <li className="relative">
              <span className="absolute -left-[33px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white font-bold ring-4 ring-white">2</span>
              <div className="flex items-start gap-2">
                <Settings className="w-4 h-4 mt-1 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800">Copiez l'URL du projet</p>
                  <p className="text-sm text-gray-600">Allez dans <strong>Project Settings → API</strong>. Copiez la valeur <code>Project URL</code>.</p>
                </div>
              </div>
            </li>

            <li className="relative">
              <span className="absolute -left-[33px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white font-bold ring-4 ring-white">3</span>
              <div className="flex items-start gap-2">
                <Key className="w-4 h-4 mt-1 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800">Copiez la clé Anon</p>
                  <p className="text-sm text-gray-600">Toujours dans <strong>Project Settings → API</strong>, copiez la valeur <code>anon public</code>.</p>
                </div>
              </div>
            </li>

            <li className="relative">
              <span className="absolute -left-[33px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white font-bold ring-4 ring-white">4</span>
              <p className="font-medium text-gray-800">Créez le fichier de configuration</p>
              <p className="text-sm text-gray-600 mb-2">À la racine de votre projet, créez un fichier nommé <code>.env.local</code> et ajoutez-y le contenu suivant :</p>
              <div className="bg-slate-900 text-slate-50 p-3 rounded-md text-xs font-mono overflow-x-auto">
                VITE_SUPABASE_URL=votre_url_projet<br/>
                VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
              </div>
            </li>

            <li className="relative">
              <span className="absolute -left-[33px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white font-bold ring-4 ring-white">5</span>
              <div className="flex items-start gap-2">
                <RefreshCw className="w-4 h-4 mt-1 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800">Redémarrez le serveur</p>
                  <p className="text-sm text-gray-600">Arrêtez le serveur de développement (Ctrl+C) et relancez-le avec <code>npm run dev</code>.</p>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

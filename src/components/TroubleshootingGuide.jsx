
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Server, Globe, Key, RefreshCw } from 'lucide-react';

export default function TroubleshootingGuide() {
  return (
    <Card className="mt-8 border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <RefreshCw className="w-5 h-5 text-orange-500" />
          Guide de Dépannage
        </CardTitle>
        <CardDescription>
          Solutions courantes pour résoudre les problèmes de connexion au Webhook.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          
          <AccordionItem value="item-1">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>1. Vérifier le fichier .env.local</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 dark:text-slate-400 space-y-2">
              <p>
                Assurez-vous que le fichier <code>.env.local</code> existe à la racine du projet (au même niveau que <code>package.json</code>).
                Il ne doit pas être nommé <code>.env</code> ou <code>env.local</code>.
              </p>
              <div className="bg-slate-950 text-slate-300 p-3 rounded-md font-mono text-xs mt-2">
                VITE_SUPABASE_URL=https://votre-projet.supabase.co<br/>
                VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique-longue
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="hover:no-underline">
               <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-500" />
                <span>2. Format de l'URL Supabase</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 dark:text-slate-400">
              <p>
                L'URL doit commencer par <code>https://</code> et ne doit PAS avoir de slash à la fin.
                <br />
                Exemple correct : <code>https://xyzproject.supabase.co</code>
                <br />
                Exemple incorrect : <code>https://xyzproject.supabase.co/</code> (le slash de fin peut parfois causer des doubles slashs dans l'endpoint).
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="hover:no-underline">
               <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-500" />
                <span>3. Clé Anon (Publique)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 dark:text-slate-400">
              <p>
                Utilisez la clé <code>anon</code> (publique), pas la clé <code>service_role</code> (privée).
                La clé anon est conçue pour être exposée dans le frontend. Si vous avez une erreur 401 Unauthorized, vérifiez que la clé est correcte.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="hover:no-underline">
               <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-500" />
                <span>4. Déploiement de l'Edge Function</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 dark:text-slate-400">
              <p>
                Si vous obtenez une erreur 404 ou 500, vérifiez dans votre Dashboard Supabase (Section Edge Functions) que :
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>La fonction nommée <code>petzi-webhook</code> existe.</li>
                <li>Le statut est "Healthy" (vert).</li>
                <li>Si vous venez de la déployer, attendez 1-2 minutes.</li>
                <li>Vérifiez les logs de la fonction dans Supabase pour voir si elle a crashé au démarrage.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="hover:no-underline">
               <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-red-500" />
                <span>5. Redémarrage après changement .env</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 dark:text-slate-400">
              <p>
                Important : Vite charge les variables d'environnement au démarrage. Si vous modifiez <code>.env.local</code>,
                vous DEVEZ arrêter le serveur (Ctrl+C) et relancer <code>npm run dev</code> pour que les changements soient pris en compte.
              </p>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </CardContent>
    </Card>
  );
}

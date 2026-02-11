
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const WebhookLogDetail = ({ log, isOpen, onClose }) => {
  const [showContext, setShowContext] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopy = () => {
    // FIXED: Using 'data' as the column name for payload context
    const dataToCopy = log.data ? JSON.stringify(log.data, null, 2) : '';
    navigator.clipboard.writeText(dataToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Détails du Log 
            <span className="text-xs font-mono font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {log.id.slice(0, 8)}
            </span>
          </DialogTitle>
          <DialogDescription>
             {log.timestamp && format(new Date(log.timestamp), "d MMMM yyyy 'à' HH:mm:ss", { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider mb-1">Source</span>
                  <span className="font-medium">{log.function_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider mb-1">Niveau</span>
                  {/* FIXED: Using log_level instead of level */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                    ${log.log_level === 'error' ? 'bg-red-100 text-red-800' : 
                      log.log_level === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                    {log.log_level || 'info'}
                  </span>
                </div>
             </div>
             <div>
               <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider mb-1">Message</span>
               <p className="text-sm leading-relaxed">{log.message}</p>
             </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 border rounded-lg bg-slate-950">
            <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-900 rounded-t-lg">
              <span className="text-xs font-mono text-slate-400 pl-2">CONTEXT / PAYLOAD</span>
              <div className="flex gap-1">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                   onClick={handleCopy}
                 >
                   {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                 </Button>
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowContext(!showContext)} 
                    className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800 gap-1"
                 >
                    {showContext ? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>}
                    {showContext ? "Masquer" : "Afficher"}
                 </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
               {showContext ? (
                 <pre className="text-xs font-mono text-green-400 leading-relaxed whitespace-pre-wrap break-all">
                   {/* FIXED: Using 'data' instead of 'context' */}
                   {log.data ? JSON.stringify(log.data, null, 2) : "Aucune donnée de contexte."}
                 </pre>
               ) : (
                 <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2">
                    <EyeOff className="h-8 w-8 opacity-50" />
                    <p className="text-sm">Données masquées</p>
                    <Button variant="link" size="sm" onClick={() => setShowContext(true)} className="text-slate-400">
                      Afficher les données brutes
                    </Button>
                 </div>
               )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebhookLogDetail;

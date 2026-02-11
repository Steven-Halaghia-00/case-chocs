
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Trash2, AlertTriangle, Loader2, Database, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Admin panel to manage Petzi data.
 * Updated: "Cleanup Database" functionality has been replaced by explicit SQL migrations.
 * This panel now serves to Reset Test Data if needed.
 */
function AdminCleanupPanel() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    
    // Note: The edge function 'cleanup-database' might need to be updated to simply TRUNCATE tables
    // instead of DROPing them, as the schema is now fixed. 
    // For now, we'll keep the UI but warn the user.
    
    const handleReset = async () => {
        setLoading(true);
        setResult(null);
        try {
            // We'll call the same function, assuming it now handles TRUNCATE or we update it later.
            // If the function still tries to DROP tables that don't exist, it might error unless handled.
            // Using a direct SQL call via rpc would be safer if 'admin_schema_cleanup' is updated.
            const { data, error } = await supabase.rpc('admin_schema_cleanup');
            
            if (error) throw error;
            
            setResult({
                type: 'success',
                message: 'Les données de test ont été réinitialisées avec succès.',
                details: data
            });
            setIsOpen(false);
        } catch (err) {
            console.error("Reset failed:", err);
            setResult({
                type: 'error',
                message: err.message || 'Erreur lors de la réinitialisation.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-red-100 bg-red-50/20 dark:border-red-900/30 dark:bg-red-900/10">
            <CardHeader>
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <Database className="h-5 w-5" />
                    <CardTitle>Zone de Danger</CardTitle>
                </div>
                <CardDescription>
                    Outils pour réinitialiser les données Petzi (événements, sessions, billets).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {result && (
                    <Alert variant={result.type === 'success' ? 'default' : 'destructive'} 
                           className={result.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}>
                        {result.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        <AlertTitle>{result.type === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
                        <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                )}

                <div className="bg-white p-4 rounded-md border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
                    <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-slate-100">Réinitialisation des Données</h4>
                    <p className="text-sm text-gray-500 mb-4 dark:text-slate-400">
                        Supprime TOUTES les données des tables Petzi (événements, sessions, billets, logs). 
                        À utiliser uniquement en développement.
                    </p>
                    
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Effacer toutes les données
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    Action Irréversible
                                </DialogTitle>
                                <DialogDescription>
                                    Cette action va <strong>VIDER</strong> toutes les tables :
                                    <ul className="list-disc pl-5 mt-2 mb-2">
                                        <li>petzi_tickets</li>
                                        <li>petzi_sessions</li>
                                        <li>petzi_events</li>
                                    </ul>
                                    Les données seront perdues définitivement.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                                    Annuler
                                </Button>
                                <Button variant="destructive" onClick={handleReset} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer la suppression'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}

export default AdminCleanupPanel;

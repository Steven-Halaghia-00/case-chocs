
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { retryOperation, getErrorMessage } from '@/lib/networkUtils';

const ExportTicketsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    status: 'all',
  });

  const handleExport = async () => {
    setLoading(true);
    try {
      await retryOperation(async () => {
        let query = supabase.from('petzi_tickets').select('*');
        
        if (filters.date_from) query = query.gte('created_at', filters.date_from);
        if (filters.date_to) query = query.lte('created_at', filters.date_to);
        
        if (filters.status && filters.status !== 'all') query = query.eq('payment_status', filters.status);

        const { data, error } = await query;
        if (error) throw error;

        // Generate CSV Client-Side
        const headers = ['Numéro Ticket', 'Événement', 'Catégorie', 'Prix', 'Devise', 'Acheteur', 'Email', 'Statut', 'Date Création'];
        const rows = data.map(t => {
          let buyerName = '';
          let buyerEmail = t.holder_email || '';

          if (t.buyer) {
               if (t.buyer.firstName && t.buyer.lastName) {
                   buyerName = `${t.buyer.firstName} ${t.buyer.lastName}`;
               } else if (t.buyer.name) {
                   buyerName = t.buyer.name;
               }
               if (!buyerEmail && t.buyer.email) {
                   buyerEmail = t.buyer.email;
               }
          }
          if (!buyerName && t.holder_name) {
              buyerName = t.holder_name;
          }

          return [
              t.ticket_number,
              `"${(t.title || t.event_name || '').replace(/"/g, '""')}"`,
              t.category || '',
              t.price || 0,
              t.currency || '',
              `"${buyerName}"`,
              buyerEmail,
              t.payment_status || t.status || 'pending',
              t.created_at
          ];
        });

        const csvContent = [
          headers.join(','),
          ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tickets_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });

      toast({
        title: "Export réussi",
        description: `L'export a été généré avec succès.`,
        className: "bg-green-50 border-green-200 text-green-900"
      });
      setIsOpen(false);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erreur d'export",
        description: getErrorMessage(e),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exporter les Tickets</DialogTitle>
          <DialogDescription>
            Téléchargez les données filtrées au format CSV.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Du</Label>
              <Input type="date" value={filters.date_from} onChange={e => setFilters({...filters, date_from: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Au</Label>
              <Input type="date" value={filters.date_to} onChange={e => setFilters({...filters, date_to: e.target.value})} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Statut (Paiement)</Label>
            <Select value={filters.status} onValueChange={v => setFilters({...filters, status: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="refunded">Remboursé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Télécharger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportTicketsButton;

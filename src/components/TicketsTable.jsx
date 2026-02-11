
import React, { useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { Ticket, AlertTriangle } from 'lucide-react';
import { logQuery } from '@/lib/queryLogger';
import TicketStatusBadge from '@/components/TicketStatusBadge';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';

function TicketsTableContent({ tickets }) {
  const navigate = useNavigate();

  useEffect(() => {
    logQuery('TicketsTable', 'Receive Data Props', { count: tickets?.length || 0 }, { data: null, error: null });
  }, [tickets]);

  const handleRowClick = (ticket) => {
    if (!ticket || !ticket.id) {
      console.error("[TicketsTable] Error: Cannot navigate, ticket ID is missing", ticket);
      return;
    }
    navigate(`/tickets/${ticket.id}`);
  };

  if (!tickets || tickets.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-gray-50 text-center dark:bg-slate-900 dark:border-slate-800">
            <Ticket className="h-10 w-10 text-gray-300 mb-2 dark:text-slate-600" />
            <p className="text-gray-500 font-medium dark:text-slate-400">Aucun ticket à afficher.</p>
            <p className="text-sm text-gray-400 dark:text-slate-500">Les tickets synchronisés apparaîtront ici.</p>
        </div>
    );
  }

  return (
    <div className="rounded-md border dark:border-slate-800">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro Ticket</TableHead>
            <TableHead>Événement</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Acheteur</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date d'achat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
             try {
               // Handle buyer data structure from JSONB
               let buyerName = 'Inconnu';
               if (ticket.holder_name) {
                   buyerName = ticket.holder_name;
               } else if (ticket.buyer) {
                   if (ticket.buyer.firstName && ticket.buyer.lastName) {
                       buyerName = `${ticket.buyer.firstName} ${ticket.buyer.lastName}`;
                   } else if (ticket.buyer.name) {
                       buyerName = ticket.buyer.name;
                   }
               }
               
               const displayEventName = ticket.title || ticket.event_name || 'Événement inconnu';
               const status = ticket.payment_status || 'pending';

               return (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-gray-50/80 transition-colors dark:hover:bg-slate-800/50"
                  onClick={() => handleRowClick(ticket)}
                >
                  <TableCell className="font-medium text-indigo-600 font-mono dark:text-indigo-400">
                    {ticket.ticket_number || <span className="text-gray-400">N/A</span>}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium dark:text-slate-200">
                      {displayEventName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal dark:border-slate-700 dark:text-slate-300">
                      {ticket.category || 'Standard'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-gray-600 dark:text-slate-400">
                    {buyerName}
                  </TableCell>
                  <TableCell className="font-mono text-xs dark:text-slate-300">
                    {formatCurrency(ticket.price, ticket.currency)}
                  </TableCell>
                  <TableCell>
                    <TicketStatusBadge status={status} />
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm whitespace-nowrap dark:text-slate-500">
                    {ticket.purchase_date ? format(new Date(ticket.purchase_date), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}
                  </TableCell>
                </TableRow>
              );
             } catch (err) {
               console.error("Error rendering ticket row:", err, ticket);
               return (
                 <TableRow key={ticket.id || Math.random()}>
                   <TableCell colSpan={7} className="text-red-500 text-xs">
                     <div className="flex items-center gap-1">
                       <AlertTriangle className="h-3 w-3" />
                       Erreur d'affichage pour ce ticket
                     </div>
                   </TableCell>
                 </TableRow>
               );
             }
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Wrap with Error Boundary for safety
function TicketsTable(props) {
  return (
    <GlobalErrorBoundary>
      <TicketsTableContent {...props} />
    </GlobalErrorBoundary>
  );
}

export default TicketsTable;

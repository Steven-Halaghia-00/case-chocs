
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TicketStatusBadge from '@/components/TicketStatusBadge';

function TicketCard({ ticket, index }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/tickets/${ticket.id}`);
  };

  const status = ticket.payment_status || 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className="hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-slate-700 dark:bg-slate-900"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">{ticket.ticket_number || ticket.ticket_id}</p>
              <p className="font-medium text-gray-900 line-clamp-1 dark:text-slate-100">{ticket.title}</p>
            </div>
            <div className="flex gap-2 ml-2">
              <TicketStatusBadge status={status} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2 dark:text-slate-400">
            {ticket.holder_name || 'Anonyme'} • {format(new Date(ticket.created_at), 'd MMM yyyy', { locale: fr })}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default TicketCard;


import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  CreditCard, 
  User, 
  Tag, 
  AlertCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TicketStatusBadge from '@/components/TicketStatusBadge';

function TicketDetailPage() {
  const { ticket_id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTicket() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('petzi_tickets')
          .select(`
            *,
            petzi_sessions (
              id,
              starts_at,
              doors_at,
              capacity,
              location_name,
              location_street,
              location_city,
              location_postcode,
              petzi_events (
                id,
                name,
                promoter
              )
            )
          `)
          .eq('id', ticket_id)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Ticket introuvable");

        setTicket(data);
      } catch (err) {
        console.error("Ticket fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [ticket_id]);

  if (loading) {
    return <div className="p-8"><Skeleton className="h-10 w-48 mb-8" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-lg font-medium">{error}</p>
        <Button variant="link" onClick={() => navigate('/tickets')}>Retour aux tickets</Button>
      </div>
    );
  }

  const session = ticket.petzi_sessions;
  const event = session?.petzi_events;
  const status = ticket.payment_status || 'pending';

  // Formatting
  const eventName = event?.name || ticket.title || 'Événement Inconnu';
  const promoter = event?.promoter || 'Promoteur Inconnu';
  
  const formattedDate = session?.starts_at 
    ? format(new Date(session.starts_at), "dd.MM.yyyy 'à' HH:mm", { locale: fr })
    : 'Date non définie';
    
  const formattedDoors = session?.doors_at 
    ? format(new Date(session.doors_at), "HH:mm", { locale: fr })
    : null;

  const locationParts = [
    session?.location_name,
    session?.location_street,
    session?.location_postcode && session?.location_city ? `${session.location_postcode} ${session.location_city}` : (session?.location_city)
  ].filter(Boolean);
  const formattedLocation = locationParts.join(', ') || 'Lieu non spécifié';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <Helmet><title>Détail Ticket {ticket.ticket_number} - Case à Chocs</title></Helmet>

      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/tickets')} className="gap-2 pl-0 hover:bg-transparent">
        <ArrowLeft className="h-4 w-4" /> Retour aux tickets
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border shadow-sm dark:bg-slate-900 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <Badge variant="outline" className="font-mono">{ticket.ticket_number}</Badge>
             <TicketStatusBadge status={status} />
          </div>
          <h1 className="text-3xl font-bold">{eventName}</h1>
          <p className="text-indigo-600 font-medium mt-1">{promoter}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Date d'achat</div>
          <div className="font-medium text-lg">
            {/* Explicitly using purchase_date for display as requested */}
            {ticket.purchase_date ? format(new Date(ticket.purchase_date), "dd/MM/yyyy HH:mm", {locale: fr}) : '-'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Session Card */}
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg">Détails de la Session</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
               <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Date & Heure</label>
                  <div className="flex items-center gap-2 mt-1 font-medium">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {formattedDate}
                  </div>
               </div>
               <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Lieu</label>
                  <div className="flex items-start gap-2 mt-1 font-medium">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    {formattedLocation}
                  </div>
               </div>
               {session?.capacity && (
                 <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase">Capacité</label>
                    <div className="mt-1">{session.capacity} places</div>
                 </div>
               )}
               {formattedDoors && (
                 <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase">Ouverture Portes</label>
                    <div className="mt-1">{formattedDoors}</div>
                 </div>
               )}
               {!session && (
                 <div className="col-span-2 text-yellow-600 bg-yellow-50 p-2 rounded text-sm">
                   Session non trouvée ou non liée.
                 </div>
               )}
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader className="pb-3">
               <div className="flex items-center gap-2">
                 <Tag className="h-5 w-5 text-gray-500" />
                 <CardTitle className="text-lg">Info Ticket</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div>
                 <label className="text-xs font-semibold text-gray-400 uppercase">Acheteur</label>
                 <div className="flex items-center gap-2 mt-1 font-medium">
                   <User className="h-4 w-4 text-gray-400" />
                   {ticket.holder_name || 'Anonyme'}
                 </div>
                 <div className="text-sm text-gray-500 ml-6">{ticket.holder_email}</div>
              </div>
              <div>
                 <label className="text-xs font-semibold text-gray-400 uppercase">Prix & Catégorie</label>
                 <div className="flex items-center gap-2 mt-1 font-medium text-lg">
                   <CreditCard className="h-4 w-4 text-gray-400" />
                   {ticket.price} {ticket.currency}
                 </div>
                 <div className="text-sm text-gray-500 ml-6">{ticket.category} ({ticket.ticket_type})</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata Sidebar */}
        <Card className="bg-gray-50 dark:bg-slate-900 border-dashed">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-sm text-gray-600">Métadonnées</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs font-mono space-y-3 text-gray-600 dark:text-gray-400">
             <div>
               <span className="block text-gray-400">UUID Ticket</span>
               <span className="break-all">{ticket.id}</span>
             </div>
             <Separator />
             <div>
                <span className="block text-gray-400">Reçu le (Webhook)</span>
                <span className="break-all">
                  {ticket.received_at 
                    ? format(new Date(ticket.received_at), "dd/MM/yyyy HH:mm", {locale: fr}) 
                    : '-'}
                </span>
             </div>
             <div>
               <span className="block text-gray-400">ID Session</span>
               <span className="break-all">{ticket.session_id || 'NULL'}</span>
             </div>
             <div>
               <span className="block text-gray-400">ID Event</span>
               <span className="break-all">{ticket.event_id || event?.id || 'NULL'}</span>
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default TicketDetailPage;

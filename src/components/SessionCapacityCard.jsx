
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { formatDate, isValidUUID } from '@/lib/utils';
import CapacityManagement from './CapacityManagement';

function SessionCapacityCard({ session, onUpdate }) {
  if (!session) return null;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200 overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="bg-gray-50/50 pb-3 border-b border-gray-100 dark:bg-slate-800/50 dark:border-slate-800">
        <div className="flex justify-between items-start">
          <div>
             <CardTitle className="text-lg font-bold text-gray-900 mb-1 dark:text-slate-100">
               {session.name || session.petzi_events?.name || 'Session'}
             </CardTitle>
             <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-slate-400">
                {session.starts_at && (
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(session.starts_at, 'd MMM yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(session.starts_at, 'HH:mm')}
                        </span>
                    </div>
                )}
                {/* Updated to use 'location' from petzi_events */}
                {session.petzi_events?.location && (
                    <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {session.petzi_events.location}
                    </span>
                )}
             </div>
          </div>
          <Badge variant="outline" className="bg-white dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600">
             {/* Updated to use 'name' instead of 'title' */}
             {session.petzi_events?.name || 'Événement'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 dark:bg-slate-900">
        <CapacityManagement 
            session={{
                ...session,
                event_id: isValidUUID(session.event_id) ? session.event_id : null
            }} 
            onUpdate={onUpdate} 
        />
      </CardContent>
    </Card>
  );
}

export default SessionCapacityCard;

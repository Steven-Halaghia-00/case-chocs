
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
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const WebhookLogsTable = ({ logs, onViewDetail }) => {
  useEffect(() => {
    console.log('WebhookLogsTable rendered with logs:', logs?.length || 0);
  }, [logs]);

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-gray-50">
        <p className="text-gray-500">Aucune donnée à afficher dans le tableau.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Niveau</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="text-right">Détails</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="hover:bg-gray-50/50">
              <TableCell className="font-mono text-xs text-gray-600 whitespace-nowrap">
                {log.timestamp ? format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr }) : '-'}
              </TableCell>
              <TableCell>
                {/* FIXED: Using log_level instead of level for conditional rendering */}
                <Badge 
                  variant="outline" 
                  className={`
                    ${log.log_level === 'error' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                    ${log.log_level === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                    ${log.log_level === 'info' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  `}
                >
                  {log.log_level === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                  {log.log_level === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {log.log_level === 'info' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {log.log_level || 'info'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm font-medium text-gray-700">
                {log.function_name || log.action}
              </TableCell>
              <TableCell className="max-w-[300px]">
                <span className="text-sm text-gray-600 truncate block" title={log.message}>
                  {log.message}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetail(log)}
                >
                  <Eye className="w-4 h-4 text-gray-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WebhookLogsTable;

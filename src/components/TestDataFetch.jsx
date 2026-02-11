
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database } from 'lucide-react';

const TestDataFetch = () => {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    const testFetch = async () => {
      setStatus('loading');
      setMessage('Testing connection to webhook_logs...');
      console.log('🔍 TestDataFetch: Starting basic query...');

      try {
        const { data, error, count } = await supabase
          .from('webhook_logs')
          .select('*', { count: 'exact' })
          .limit(5);

        if (error) {
          console.error('❌ TestDataFetch Error:', error);
          setStatus('error');
          setMessage(`Error: ${error.message} (Code: ${error.code})`);
        } else {
          console.log('✅ TestDataFetch Success:', data);
          setStatus('success');
          setRecordCount(count || 0);
          setMessage(`Successfully fetched ${data.length} records. Total in DB: ${count}`);
        }
      } catch (err) {
        console.error('❌ TestDataFetch Exception:', err);
        setStatus('error');
        setMessage(`Exception: ${err.message}`);
      }
    };

    testFetch();
  }, []);

  if (status === 'idle') return null;

  return (
    <Card className="mb-6 border-l-4 border-l-blue-500 bg-slate-50">
      <CardContent className="pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-slate-500" />
          <div>
            <h4 className="text-sm font-semibold text-slate-900">System Connectivity Test</h4>
            <p className="text-xs text-slate-500 font-mono mt-1">{message}</p>
          </div>
        </div>
        <Badge variant={status === 'success' ? 'default' : 'destructive'} className="ml-4">
            {status === 'success' ? <CheckCircle className="h-3 w-3 mr-1"/> : <AlertCircle className="h-3 w-3 mr-1"/>}
            {status === 'success' ? 'Connected' : 'Error'}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default TestDataFetch;

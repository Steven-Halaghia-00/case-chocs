
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send, AlertCircle, CheckCircle, Terminal, Plug } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { getEventsForTest, getSessionsForTest } from '@/lib/webhookTestService';
import { sendCustomWebhook, testConnectivity } from '@/lib/customWebhookSender';
import EnvironmentSetupGuide from '@/components/EnvironmentSetupGuide';

export default function CustomWebhookTestForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [configError, setConfigError] = useState(false);
  
  // Connectivity Test State
  const [connectivityStatus, setConnectivityStatus] = useState(null); // null, 'testing', 'success', 'error'
  const [connectivityDetails, setConnectivityDetails] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Event Details
    eventId: '', // Empty string means "New Event"
    eventTitle: 'Soirée Test',
    
    // Session Details
    sessionId: '',
    sessionDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    sessionTime: '20:00',
    
    // Ticket Details
    category: 'Prélocation',
    price: '25.00',
    currency: 'CHF',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'), 
    
    // Buyer Details
    firstName: 'Jane',
    lastName: 'Doe',
    postcode: '1234',
    
    // Metadata
    paymentStatus: 'paid',
    numberOfSends: 1
  });

  // Derived state to check if we are creating a new event
  const isNewEvent = formData.eventId === '';

  // Load initial data and Check Environment
  useEffect(() => {
    // 1. Environment Check
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !anonKey) {
      console.error('❌ CRITICAL: Missing environment variables! Please configure your .env.local file.');
      setConfigError(true);
      return; 
    } else {
      setConfigError(false);
    }

    // 2. Load Data (Only if config is valid)
    const loadData = async () => {
      try {
        const [fetchedEvents, fetchedSessions] = await Promise.all([
          getEventsForTest(),
          getSessionsForTest()
        ]);
        setEvents(fetchedEvents);
        setSessions(fetchedSessions);
        
        // Pre-fill if data exists
        if (fetchedEvents.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            eventId: fetchedEvents[0].id, 
            eventTitle: fetchedEvents[0].name 
          }));
        }
      } catch (e) {
        console.error("Failed to load initial test data:", e);
      }
    };
    loadData();
  }, []);

  const handleTestConnectivity = async () => {
    setConnectivityStatus('testing');
    setConnectivityDetails(null);
    try {
      const result = await testConnectivity();
      if (result.success) {
        setConnectivityStatus('success');
        toast({ title: "Connexion réussie", description: "Supabase et Edge Function sont accessibles.", className: "bg-green-50 text-green-900 border-green-200" });
      } else {
        setConnectivityStatus('error');
        setConnectivityDetails(result.error);
        toast({ variant: "destructive", title: "Erreur de connexion", description: result.error });
      }
    } catch (e) {
      setConnectivityStatus('error');
      setConnectivityDetails(e.message);
    }
  };

  // If configuration is missing, show the setup guide instead of the form
  if (configError) {
    return <EnvironmentSetupGuide />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-update title if eventId changes
      if (name === 'eventId') {
        if (value === '') {
          // Reset to default new event title if switching to "New"
          newData.eventTitle = 'Soirée Test';
          newData.sessionId = '20001';
        } else {
          // Find selected event and update title
          const selectedEvent = events.find(ev => ev.id.toString() === value);
          if (selectedEvent) {
            newData.eventTitle = selectedEvent.name;
          }
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLastResult(null);

    console.group('[CustomWebhookForm] Submission Start');
    console.log('--- FORM DATA SNAPSHOT ---');
    console.dir(formData);

    let successCount = 0;
    let failCount = 0;
    const errors = [];
    const count = parseInt(formData.numberOfSends, 10) || 1;
    
    console.log(`Attempting to send ${count} webhook(s)...`);

    try {
      for (let i = 0; i < count; i++) {
        console.log(`Processing webhook ${i + 1}/${count}...`);
        
        const result = await sendCustomWebhook(formData, i);
        
        if (result.success) {
          console.log(`✅ Webhook ${i + 1} SUCCESS`);
          successCount++;
          
          // === Comparison Log ===
          console.group('=== PAYLOAD COMPARISON ===');
          console.log('SENT PAYLOAD:');
          console.dir(result.payload);
          console.log('RECEIVED RESPONSE:');
          console.dir(result.data);
          console.groupEnd();
          
        } else {
          console.error(`❌ Webhook ${i + 1} FAILED:`, result.error);
          failCount++;
          errors.push(`Envoi #${i + 1}: ${result.error}`);
        }
        
        // Small delay between bursts if sending many
        if (count > 5) await new Promise(r => setTimeout(r, 100));
      }

      console.log('--- Final Results ---');
      console.log(`Success: ${successCount}`);
      console.log(`Failed: ${failCount}`);
      
      if (failCount === 0) {
        toast({
          title: "Succès",
          description: `${successCount} webhook(s) envoyé(s) avec succès.`,
          className: "bg-green-50 text-green-900 border-green-200"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Attention",
          description: `${successCount} réussi(s), ${failCount} échoué(s). Voir résultats.`
        });
      }

      setLastResult({ 
        success: failCount === 0, 
        successCount, 
        failCount, 
        errors 
      });

    } catch (error) {
      console.error('❌ Critical Submission Error:', error);
      toast({
        variant: "destructive",
        title: "Erreur critique",
        description: error.message
      });
      setLastResult({
        success: false,
        successCount,
        failCount: count - successCount,
        errors: [error.message]
      });
    } finally {
      console.groupEnd();
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mb-8 border-l-4 border-l-blue-600 shadow-sm">
      <CardHeader className="bg-slate-50/50">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Send className="w-5 h-5 text-blue-600" />
          Simulateur de Webhook
        </CardTitle>
        <CardDescription>
          Générez et envoyez des payloads personnalisés pour tester des scénarios spécifiques (nouveaux événements, erreurs de validation, etc).
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {/* Connectivity Test Section */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Plug className="w-4 h-4 text-slate-500" />
                Vérification Préalable
              </h4>
              <p className="text-xs text-slate-500">
                Testez la connexion à Supabase et à la Edge Function avant d'envoyer.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestConnectivity}
              disabled={connectivityStatus === 'testing'}
              className="w-full sm:w-auto"
            >
              {connectivityStatus === 'testing' ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Test en cours...
                </>
              ) : (
                <>
                  <Plug className="w-3 h-3 mr-2" /> Tester la Connexion
                </>
              )}
            </Button>
          </div>

          {/* Test Feedback Area */}
          {connectivityStatus === 'success' && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 text-green-700 border border-green-200 rounded text-sm animate-in fade-in slide-in-from-top-1">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">✅ Connexion OK - Supabase et Edge Function sont accessibles</span>
            </div>
          )}

          {connectivityStatus === 'error' && (
            <div className="mt-3 flex flex-col gap-1 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4" />
                <span>❌ Erreur de connexion - Vérifiez les logs (F12)</span>
              </div>
              {connectivityDetails && (
                 <p className="text-xs ml-6 opacity-90">{connectivityDetails}</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Event & Session */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">1</span>
              Événement & Session
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="space-y-2">
                <Label htmlFor="eventId">Événement Existant</Label>
                <select 
                  id="eventId" 
                  name="eventId" 
                  value={formData.eventId} 
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- Créer un Nouvel Événement --</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} (ID: {ev.id})</option>
                  ))}
                </select>
              </div>

              {/* Conditional Event Title - Only show if creating NEW event */}
              {isNewEvent && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="eventTitle">Titre de l'événement</Label>
                  <Input 
                    id="eventTitle" 
                    name="eventTitle" 
                    value={formData.eventTitle} 
                    onChange={handleChange} 
                    placeholder="Ex: Concert de Jazz"
                    className="bg-blue-50/30 border-blue-200 focus-visible:ring-blue-400"
                  />
                </div>
              )}

              {/* Conditional Session ID - Only show if creating NEW event */}
              {isNewEvent && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="sessionId">ID Session (Optionnel)</Label>
                  <Input 
                    id="sessionId" 
                    name="sessionId" 
                    value={formData.sessionId} 
                    onChange={handleChange} 
                    placeholder="Ex: 20001"
                    type="number"
                    className="bg-blue-50/30 border-blue-200 focus-visible:ring-blue-400"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sessionDate">Date Session</Label>
                <Input 
                  id="sessionDate" 
                  name="sessionDate" 
                  type="date"
                  value={formData.sessionDate} 
                  onChange={handleChange} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTime">Heure Session</Label>
                <Input 
                  id="sessionTime" 
                  name="sessionTime" 
                  type="time"
                  value={formData.sessionTime} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Ticket & Buyer */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">2</span>
              Billet & Acheteur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input 
                  id="firstName" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleChange} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input 
                  id="lastName" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleChange} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input 
                  id="category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Prix</Label>
                <div className="flex gap-2">
                  <Input 
                    id="price" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleChange} 
                    className="flex-1"
                  />
                  <Input 
                    id="currency" 
                    name="currency" 
                    value={formData.currency} 
                    onChange={handleChange} 
                    className="w-16"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Date d'achat du billet</Label>
                <Input 
                  id="purchaseDate" 
                  name="purchaseDate" 
                  type="date"
                  value={formData.purchaseDate} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Simulation Config */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">3</span>
              Configuration Envoi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfSends">Nombre de billets (Boucle)</Label>
                <Input 
                  id="numberOfSends" 
                  name="numberOfSends" 
                  type="number" 
                  min="1" 
                  max="50"
                  value={formData.numberOfSends} 
                  onChange={handleChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Statut Paiement</Label>
                 <select 
                  id="paymentStatus" 
                  name="paymentStatus" 
                  value={formData.paymentStatus} 
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="paid">Payé (paid)</option>
                  <option value="pending">En attente (pending)</option>
                  <option value="canceled">Annulé (canceled)</option>
                  <option value="refunded">Remboursé (refunded)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Result Display Section */}
          {lastResult && (
            <div className={`rounded-md p-4 animate-in fade-in slide-in-from-top-4 border ${lastResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                {lastResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                
                <div className="flex-1 space-y-2">
                  <h4 className={`font-semibold ${lastResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {lastResult.success ? 'Envoi réussi' : 'Problème lors de l\'envoi'}
                  </h4>
                  
                  <p className={`text-sm ${lastResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {lastResult.successCount} réussi(s), {lastResult.failCount} échoué(s).
                  </p>

                  {lastResult.errors && lastResult.errors.length > 0 && (
                    <div className="bg-white/50 rounded p-2 text-xs font-mono text-red-800 border border-red-100 mt-2">
                      <p className="font-semibold mb-1">Erreurs détaillées :</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {lastResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Troubleshooting Tip */}
                  {!lastResult.success && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 p-2 rounded mt-2">
                      <Terminal className="w-4 h-4" />
                      <span>💡 Conseil: Vérifiez la console du navigateur (F12) pour voir les logs complets.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button type="submit" size="lg" disabled={loading} className="w-full md:w-auto min-w-[200px]">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {loading ? 'Envoi en cours...' : `Envoyer ${formData.numberOfSends} Webhook(s)`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

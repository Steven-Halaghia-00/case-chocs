
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogIn, Loader2, AlertCircle, Mail } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, resendConfirmationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const validateForm = () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsConfirmation(false);

    if (!validateForm()) return;

    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
        setNeedsConfirmation(true);
        setError("Votre adresse email n'a pas encore été confirmée.");
      } else {
        setError(error.message || 'Identifiants invalides');
      }
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    await resendConfirmationEmail(email);
    setResendLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Connexion - Case à Chocs</title>
        <meta name="description" content="Connectez-vous pour accéder à votre tableau de bord" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <LogIn className="h-8 w-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Bienvenue</h1>
              <p className="text-gray-600 mt-2">Connectez-vous à votre compte</p>
            </div>

            {error && (
              <Alert variant={needsConfirmation ? "warning" : "destructive"} className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{needsConfirmation ? "Confirmation requise" : "Erreur"}</AlertTitle>
                <AlertDescription className="mt-2">
                  {error}
                  {needsConfirmation && (
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleResendEmail}
                        disabled={resendLoading}
                        className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800"
                      >
                        {resendLoading ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-3 w-3" />
                            Renvoyer l'email de confirmation
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  disabled={loading}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous n'avez pas de compte ?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Inscrivez-vous ici
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default LoginPage;

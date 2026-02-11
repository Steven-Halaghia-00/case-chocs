
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery token
    const checkToken = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'recovery') {
        setValidToken(true);
      } else {
        setError('Lien de réinitialisation invalide ou expiré');
      }
    };

    checkToken();
  }, []);

  const validateForm = () => {
    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return false;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      setError('Le mot de passe doit inclure majuscule, minuscule et chiffre');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message || 'Échec de la réinitialisation du mot de passe');
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Réinitialisation réussie !</h2>
          <p className="text-gray-600">Votre mot de passe a été réinitialisé avec succès. Redirection...</p>
        </motion.div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertDescription>{error || 'Lien de réinitialisation invalide'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Réinitialiser le mot de passe - Case à Chocs</title>
        <meta name="description" content="Créez un nouveau mot de passe" />
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
                <Lock className="h-8 w-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Réinitialiser le mot de passe</h1>
              <p className="text-gray-600 mt-2">Créez un nouveau mot de passe</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Doit inclure majuscule, minuscule et chiffre
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ressaisissez votre mot de passe"
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Réinitialisation en cours...
                  </>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default ResetPasswordPage;


import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Loader2, MailCheck, ArrowRight, RefreshCw } from 'lucide-react';

function SignupPage() {
  const { signUp, resendConfirmationEmail } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const { email, password, confirmPassword, fullName } = formData;

    if (!email || !password || !confirmPassword || !fullName) {
      setError('Veuillez remplir tous les champs');
      return false;
    }

    if (fullName.length < 2) {
      setError('Le nom complet doit contenir au moins 2 caractères');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
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

    const { error } = await signUp(formData.email, formData.password, {
      data: {
        full_name: formData.fullName,
      },
    });

    if (error) {
      setError(error.message || "Échec de la création du compte");
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    await resendConfirmationEmail(formData.email);
    setResendLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <MailCheck className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vérifiez votre email</h2>
            <p className="text-gray-600 mb-6">
              Un lien de confirmation a été envoyé à <strong>{formData.email}</strong>.
              <br />
              Veuillez cliquer sur ce lien pour activer votre compte avant de vous connecter.
            </p>
            
            <div className="space-y-4">
              <Link to="/login">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Retour à la connexion
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {resendLoading ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3 w-3" />
                )}
                Je n'ai pas reçu l'email
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Inscription - Case à Chocs</title>
        <meta name="description" content="Créez votre compte pour gérer les tickets" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <UserPlus className="h-8 w-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Créer un compte</h1>
              <p className="text-gray-600 mt-2">Rejoignez-nous pour commencer</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
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
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                    Inscription en cours...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link
                  to="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Connectez-vous ici
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default SignupPage;

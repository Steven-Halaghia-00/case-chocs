
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Échec de l'inscription",
        description: error.message || "Une erreur s'est produite",
      });
    }

    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check specifically for email not confirmed error
      // Supabase can return "Email not confirmed" message or specific error codes depending on config
      const isEmailConfirmationError = error.message === "Email not confirmed" || error.code === "email_not_confirmed";

      if (!isEmailConfirmationError) {
        toast({
          variant: "destructive",
          title: "Échec de la connexion",
          description: error.message || "Une erreur s'est produite",
        });
      }
      // We don't toast for email confirmation error here, 
      // allowing the component to handle it with a specific UI action (resend button)
    }

    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Échec de la déconnexion",
        description: error.message || "Une erreur s'est produite",
      });
    } else {
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    }

    return { error };
  }, [toast]);

  const resendConfirmationEmail = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de renvoyer l'email",
      });
    } else {
      toast({
        title: "Email envoyé",
        description: "Veuillez vérifier votre boîte de réception (et vos spams).",
      });
    }

    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resendConfirmationEmail,
  }), [user, session, loading, signUp, signIn, signOut, resendConfirmationEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

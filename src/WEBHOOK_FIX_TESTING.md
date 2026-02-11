
# Guide de Test et Vérification du Correctif Webhook

Ce document détaille la procédure pas-à-pas pour vérifier que le correctif de la contrainte `session_id` et l'amélioration des logs sont fonctionnels.

## 1. Vérification de la Base de Données

### Objectif : Confirmer que `session_id` est nullable.

1.  Connectez-vous à votre interface Supabase (ou utilisez l'onglet SQL si disponible).
2.  Exécutez la requête suivante pour vérifier la structure :
    
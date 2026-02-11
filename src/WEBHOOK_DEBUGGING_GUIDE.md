
# Guide de Débogage Webhook Petzi

Ce guide a pour but de vous aider à résoudre les problèmes courants liés à l'intégration des webhooks Petzi, en particulier les erreurs de base de données.

## Erreur Commune : 23502 (not_null_violation)

Cette erreur survient lorsque le webhook tente d'insérer un ticket dans la base de données, mais qu'un champ obligatoire (NOT NULL) est manquant.

### Champs Obligatoires (petzi_tickets)
La table `petzi_tickets` requiert impérativement les champs suivants :
- `ticket_number` (String) : L'identifiant unique du billet.
- `event_id` (Integer) : L'ID de l'événement.
- `session_id` (Integer) : L'ID de la session (Désormais NULLABLE pour éviter les crashs, mais recommandé).

**Solution :**
1. Vérifiez que votre payload contient bien `details.ticket.number` et `details.ticket.eventId`.
2. Assurez-vous que la migration `20260211_fix_schema_and_logs.sql` a bien été exécutée. Elle rend `session_id` optionnel et ajoute des valeurs par défaut pour `currency` et `payment_status`.

## Outils de Diagnostic

Rendez-vous sur la page **Admin > Webhooks > Test de Flux** (`/admin/test-webhook`).

Vous y trouverez :
1. **Audit du Schéma** : Un tableau montrant les contraintes actuelles de la base de données.
2. **Erreurs Récentes** : Les 5 dernières erreurs capturées avec leur code HTTP et le message détaillé.
3. **Simulateur** : Un formulaire pour envoyer des payloads de test personnalisés.

## Format de Payload Attendu


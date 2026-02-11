-- =================================================================================
-- PETZI DEMO DATA SEED (Supabase / Postgres)
-- Schéma respecté (IDENTITY sur sessions/tickets/capacity => on NE SET PAS les id)
--
-- Objectif:
-- - Plusieurs événements (passé / aujourd’hui / futur)
-- - Plusieurs sessions par événement
-- - Beaucoup de tickets (purchase_date <= maintenant)
-- - Des événements futurs avec sessions strictement > aujourd’hui + 7 jours
-- - Table petzi_session_capacity cohérente avec les tickets "paid"
--
-- À copier-coller dans Supabase > SQL Editor
-- =================================================================================

BEGIN;

SET LOCAL TIME ZONE 'Europe/Zurich';

-- ---------------------------------------------------------
-- DEMO IDs (uniquement pour petzi_events, car pas IDENTITY)
-- ---------------------------------------------------------
-- On seed dans une plage haute pour éviter les collisions.
-- Si tu relances le script, la section CLEANUP supprime uniquement ces IDs.
-- ---------------------------------------------------------

-- =================================================================================
-- SECTION 0: CLEANUP (safe, ne touche qu’aux event_id ci-dessous)
-- =================================================================================
DELETE FROM public.petzi_tickets
WHERE event_id IN (900001,900002,900003,900004,900005,900006,900007,900008);

DELETE FROM public.petzi_session_capacity
WHERE event_id IN (900001,900002,900003,900004,900005,900006,900007,900008);

DELETE FROM public.petzi_sessions
WHERE event_id IN (900001,900002,900003,900004,900005,900006,900007,900008);

DELETE FROM public.petzi_events
WHERE id IN (900001,900002,900003,900004,900005,900006,900007,900008);

-- =================================================================================
-- SECTION 1-5: INSERT EVENTS + SESSIONS + TICKETS + CAPACITY (tout en CTE)
-- =================================================================================
WITH
anchor AS (
  SELECT
    now()                          AS now_ts,
    date_trunc('day', now())       AS today_00
),

-- ---------------------------
-- EVENTS (id explicite OK)
-- ---------------------------
events_seed AS (
  SELECT * FROM (VALUES
    (900001, 'Winter Jazz Festival',      'Jazz Association',        'Case à Chocs, Neuchâtel', 'Soirées jazz & blues, artistes locaux.',                70, 40),
    (900002, 'Indie Rock Night',          'Case à Chocs',            'Case à Chocs, Neuchâtel', 'Guitares, énergie, gros son.',                          35, 20),
    (900003, 'Tech Startups Summit',      'Innovate CH',             'Neuchâtel - Main Hall',   'Rencontres startups, talks, networking.',               10,  1),
    (900004, 'Design Thinking Workshop',  'Product Guild',           'Neuchâtel - Workshop Lab', 'Atelier pratique: ideation, prototypage.',              12,  0),
    (900005, 'Electronic Dreams',         'SynthWave Collective',    'Neuchâtel - Club Stage',  'Nuit electro / synthwave + visuels.',                   20,  5),
    (900006, 'Spring Art Workshop',       'Art & Soul',              'Neuchâtel - Atelier',     'Peinture acrylique, matériel inclus.',                  18,  2),
    (900007, 'Comedy Gala',               'Laugh Out Loud',          'Neuchâtel - Grand Hall',  'Stand-up & invités internationaux.',                    25,  3),
    (900008, 'Outdoor Cinema Night',      'City Culture',            'Neuchâtel - Open Air',    'Projection plein air, food trucks.',                    15,  4)
  ) AS t(id, name, promoter, location, description, created_days_ago, updated_days_ago)
),
upsert_events AS (
  INSERT INTO public.petzi_events (id, name, promoter, location, description, created_at, updated_at)
  SELECT
    e.id, e.name, e.promoter, e.location, e.description,
    a.now_ts - make_interval(days => e.created_days_ago),
    a.now_ts - make_interval(days => e.updated_days_ago)
  FROM events_seed e
  CROSS JOIN anchor a
  ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    promoter    = EXCLUDED.promoter,
    location    = EXCLUDED.location,
    description = EXCLUDED.description,
    updated_at  = now()
  RETURNING id
),

-- ---------------------------
-- SESSIONS
-- id = IDENTITY => on ne le fournit pas
--
-- offset_days:
--  - négatif => passé
--  - 0       => aujourd’hui
--  - futur   => IMPORTANT: > aujourd’hui + 7 jours pour les événements futurs
-- ---------------------------
sessions_seed AS (
  SELECT
    v.event_id,
    v.session_name                                     AS name,
    -- starts_at / doors_at (au fuseau Europe/Zurich via SET LOCAL TIME ZONE)
    (a.today_00 + make_interval(days => v.offset_days, hours => v.start_hour, mins => v.start_min))::timestamptz AS starts_at,
    (a.today_00 + make_interval(days => v.offset_days, hours => v.start_hour, mins => v.start_min)
      - make_interval(mins => v.doors_before_mins))::timestamptz AS doors_at,

    v.capacity,
    'limited'::text                                     AS capacity_mode,

    v.location_name,
    v.location_street,
    v.location_city,
    v.location_postcode,
    jsonb_build_object(
      'name', v.location_name,
      'street', v.location_street,
      'city', v.location_city,
      'postcode', v.location_postcode
    ) AS location,

    -- fenêtre (en jours) pour générer purchase_date (toujours <= now())
    v.purchase_window_days,

    -- plan tickets (Standard)
    v.std_ticket_type,
    v.std_category,
    v.std_price,
    v.std_paid,
    v.std_cancelled,

    -- plan tickets (Student)
    v.student_price,
    v.student_paid,
    v.student_cancelled,

    -- plan tickets (VIP)
    v.vip_price,
    v.vip_paid,
    v.vip_cancelled

  FROM anchor a
  JOIN (
    VALUES
      -- event_id, session_name, offset_days, start_hour, start_min, doors_before_mins, capacity, location_name, street, city, postcode, purchase_window_days,
      -- std_type, std_category, std_price, std_paid, std_cancelled, student_price, student_paid, student_cancelled, vip_price, vip_paid, vip_cancelled

      -- 900001 Winter Jazz (passé)
      (900001,'Opening Night',         -45, 19,  0, 30, 220, 'Case à Chocs', 'Quai Robert-Comtesse 4', 'Neuchâtel', '2000', 120, 'Standard','Standard', 35.00, 140, 10, 20.00, 25, 2, 75.00, 15, 1),
      (900001,'Late Night Jam',        -45, 22,  0, 30, 120, 'Case à Chocs', 'Quai Robert-Comtesse 4', 'Neuchâtel', '2000', 120, 'Standard','General Admission', 25.00, 70,  5, 15.00, 10, 1, 55.00, 10, 0),

      -- 900002 Indie Rock (passé)
      (900002,'Main Stage Show',       -20, 20,  0, 60, 550, 'Case à Chocs', 'Quai Robert-Comtesse 4', 'Neuchâtel', '2000',  90, 'Standard','Standard', 32.00, 360, 20, 18.00, 60, 4, 80.00, 25, 1),

      -- 900003 Tech Summit (hier/aujourd’hui)
      (900003,'Keynote + Panels',       -1, 18, 30, 45, 300, 'Main Hall',    'Rue du Marché 1',        'Neuchâtel', '2000',  30, 'Professional','Professional', 150.00, 160, 6, 50.00, 45, 3, 250.00, 10, 0),
      (900003,'Networking Mixer',        0, 19, 30, 30, 180, 'Lounge Area',  'Rue du Marché 1',        'Neuchâtel', '2000',  30, 'Add-on','Add-on', 20.00, 95, 5,  0.00,  0, 0,  0.00,  0, 0),

      -- 900004 Workshop (aujourd’hui)
      (900004,'Morning Workshop',        0,  9, 30, 15,  30, 'Workshop Lab', 'Av. de la Gare 10',      'Neuchâtel', '2000',  30, 'Standard','Material Included', 60.00, 22, 2, 30.00, 5, 1,  0.00, 0, 0),

      -- 900005 Electronic Dreams (FUTUR > aujourd’hui + 7 jours)
      (900005,'Live Set: DJ Pulse',     14, 22,  0, 60, 420, 'Club Stage',   'Rue de la Nuit 5',       'Neuchâtel', '2000',  45, 'Standard','Phase 1', 29.00, 120, 5, 19.00, 30, 2, 90.00, 15, 1),

      -- 900006 Spring Art (FUTUR > aujourd’hui + 7 jours)
      (900006,'Art Workshop (Morning)', 21, 10,  0, 15,  25, 'Atelier',      'Rue des Beaux-Arts 3',   'Neuchâtel', '2000',  45, 'Standard','Material Included', 70.00, 12, 1, 45.00, 4, 0,  0.00, 0, 0),
      (900006,'Art Workshop (Afternoon)',21,14,  0, 15,  25, 'Atelier',      'Rue des Beaux-Arts 3',   'Neuchâtel', '2000',  45, 'Standard','Material Included', 70.00, 12, 1, 45.00, 4, 0,  0.00, 0, 0),

      -- 900007 Comedy (FUTUR > aujourd’hui + 7 jours)
      (900007,'Gala Night',             60, 20,  0, 60, 650, 'Grand Hall',   'Place Centrale 2',       'Neuchâtel', '2000',  60, 'Standard','Standard', 45.00, 180, 8, 25.00, 30, 2, 120.00, 25, 1),

      -- 900008 Cinema (FUTUR > aujourd’hui + 7 jours)
      (900008,'Open Air Screening',     10, 21, 15, 45, 300, 'Open Air',     'Parc des Rives',         'Neuchâtel', '2000',  45, 'Standard','Standard', 18.00, 80, 3, 12.00, 25, 1, 35.00, 10, 0)

  ) AS v(
    event_id, session_name, offset_days, start_hour, start_min, doors_before_mins, capacity,
    location_name, location_street, location_city, location_postcode,
    purchase_window_days,
    std_ticket_type, std_category, std_price, std_paid, std_cancelled,
    student_price, student_paid, student_cancelled,
    vip_price, vip_paid, vip_cancelled
  ) ON true
),
inserted_sessions AS (
  INSERT INTO public.petzi_sessions (
    event_id, name, starts_at, doors_at, capacity, capacity_mode,
    location_name, location_street, location_city, location_postcode, location,
    created_at, updated_at
  )
  SELECT
    ss.event_id, ss.name, ss.starts_at, ss.doors_at, ss.capacity, ss.capacity_mode,
    ss.location_name, ss.location_street, ss.location_city, ss.location_postcode, ss.location,
    now(), now()
  FROM sessions_seed ss
  RETURNING id, event_id, name, starts_at, capacity
),

-- join seed <-> sessions générées (on retrouve l’id via (event_id, name, starts_at))
session_map AS (
  SELECT
    s.id AS session_id,
    ss.*,
    e.name     AS event_name,
    e.promoter AS event_promoter
  FROM inserted_sessions s
  JOIN sessions_seed ss
    ON ss.event_id = s.event_id
   AND ss.name     = s.name
   AND ss.starts_at = s.starts_at
  JOIN public.petzi_events e
    ON e.id = s.event_id
),

-- 3 lots de tickets par session (Standard/Student/VIP)
ticket_batches AS (
  SELECT
    sm.session_id,
    sm.event_id,
    sm.event_name,
    sm.event_promoter,
    sm.starts_at,
    sm.purchase_window_days,
    'STD'::text AS batch,
    sm.std_ticket_type AS ticket_type,
    sm.std_category    AS category,
    sm.std_price       AS price,
    sm.std_paid        AS paid_count,
    sm.std_cancelled   AS cancelled_count
  FROM session_map sm
  WHERE (sm.std_paid + sm.std_cancelled) > 0

  UNION ALL
  SELECT
    sm.session_id, sm.event_id, sm.event_name, sm.event_promoter, sm.starts_at, sm.purchase_window_days,
    'STU', 'Student', 'Student', sm.student_price, sm.student_paid, sm.student_cancelled
  FROM session_map sm
  WHERE (sm.student_paid + sm.student_cancelled) > 0

  UNION ALL
  SELECT
    sm.session_id, sm.event_id, sm.event_name, sm.event_promoter, sm.starts_at, sm.purchase_window_days,
    'VIP', 'VIP', 'VIP', sm.vip_price, sm.vip_paid, sm.vip_cancelled
  FROM session_map sm
  WHERE (sm.vip_paid + sm.vip_cancelled) > 0
),

names AS (
  SELECT
    ARRAY['Jean','Marie','Lucas','Sofia','Nina','Hugo','Emma','Noah','Lina','Tom','Léa','Max','Sarah','Julien','Camille','Antoine','Chloé','Yanis','Mila','Arthur','Eva','Gabriel','Louise','Théo']::text[] AS first_names,
    ARRAY['Dupont','Martin','Bernard','Dubois','Morel','Rossi','Müller','Meier','Schmid','Keller','Fischer','Weber','Lambert','Mercier','Blanc','Vogel','Berset','Perrin','Nguyen','Diallo','Frei','Girard','Mermoud','Pittet']::text[] AS last_names,
    ARRAY['2000','2012','2034','2068','2072','2300','2400','1000','1200','1700','1800','1950','1007','3000','4000','4051','5000','6000','8000']::text[] AS postcodes
),

inserted_tickets AS (
  INSERT INTO public.petzi_tickets (
    ticket_number, session_id, event_id,
    title, ticket_type, category, price, currency,
    holder_name, holder_email, holder_phone, holder_postcode,
    buyer, promoter,
    payment_status,
    purchase_date, created_at, updated_at, received_at
  )
  SELECT
    -- ticket_number unique
    'TKT-' || b.event_id || '-' || b.session_id || '-' || b.batch || '-' || lpad(gs.n::text, 5, '0') AS ticket_number,

    b.session_id,
    b.event_id,

    b.event_name AS title,
    b.ticket_type,
    b.category,
    b.price,
    'CHF' AS currency,

    (fn || ' ' || ln) AS holder_name,
    lower(fn || '.' || ln || '+' || b.event_id || '.' || b.session_id || '.' || gs.n || '@example.com') AS holder_email,
    '+4179' || lpad(((b.session_id * 7919 + gs.n * 104729) % 10000000)::text, 7, '0') AS holder_phone,
    pc AS holder_postcode,

    jsonb_build_object(
      'firstName', fn,
      'lastName', ln,
      'email', lower(fn || '.' || ln || '@example.com')
    ) AS buyer,

    b.event_promoter AS promoter,

    CASE WHEN gs.n <= b.paid_count THEN 'paid' ELSE 'cancelled' END AS payment_status,

    -- purchase_date <= now() (et pour les sessions passées: avant la session)
    purchase_ts AS purchase_date,
    purchase_ts AS created_at,
    purchase_ts AS updated_at,
    purchase_ts + interval '5 seconds' AS received_at

  FROM anchor a
  JOIN ticket_batches b ON true
  JOIN names n ON true
  JOIN LATERAL generate_series(1, b.paid_count + b.cancelled_count) AS gs(n) ON true
  CROSS JOIN LATERAL (
    SELECT
      n.first_names[((b.session_id + gs.n) % array_length(n.first_names,1)) + 1] AS fn,
      n.last_names[((b.session_id + gs.n * 2) % array_length(n.last_names,1)) + 1] AS ln,
      n.postcodes[((b.session_id + gs.n * 3) % array_length(n.postcodes,1)) + 1] AS pc
  ) pick
CROSS JOIN LATERAL (
  SELECT
    (
      CASE
        WHEN b.starts_at < a.now_ts THEN (b.starts_at - interval '1 hour')
        ELSE a.now_ts
      END
      - (
          (((b.session_id * 7 + gs.n * 3) % b.purchase_window_days)::int) * interval '1 day'
        + (((b.session_id * 5 + gs.n) % 24)::int) * interval '1 hour'
        + (((b.session_id + gs.n * 2) % 60)::int) * interval '1 minute'
        )
    ) AS purchase_ts
) p
  RETURNING session_id, event_id, payment_status
),

-- ---------------------------
-- CAPACITY (upsert par session_id)
-- booked_spots = count(paid)
-- available_spots = capacity - booked_spots
-- ---------------------------
upsert_capacity AS (
  INSERT INTO public.petzi_session_capacity (
    session_id, event_id, capacity, booked_spots, available_spots, notes, created_at, updated_at
  )
  SELECT
    sm.session_id,
    sm.event_id,
    sm.capacity,
    COALESCE(t.paid_count, 0) AS booked_spots,
    GREATEST(sm.capacity - COALESCE(t.paid_count, 0), 0) AS available_spots,
    CASE
      WHEN COALESCE(t.paid_count, 0) = 0 THEN 'Aucune vente encore'
      WHEN COALESCE(t.paid_count, 0) < (sm.capacity * 0.50) THEN 'Ventes en cours'
      WHEN COALESCE(t.paid_count, 0) < (sm.capacity * 0.90) THEN 'Bien rempli'
      ELSE 'Presque complet'
    END AS notes,
    now(), now()
  FROM session_map sm
  LEFT JOIN (
    SELECT
      session_id,
      COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_count
    FROM public.petzi_tickets
    WHERE event_id IN (900001,900002,900003,900004,900005,900006,900007,900008)
    GROUP BY session_id
  ) t ON t.session_id = sm.session_id
  ON CONFLICT (session_id) DO UPDATE SET
    capacity         = EXCLUDED.capacity,
    booked_spots     = EXCLUDED.booked_spots,
    available_spots  = EXCLUDED.available_spots,
    notes            = EXCLUDED.notes,
    updated_at       = EXCLUDED.updated_at
  RETURNING session_id
),

-- ---------------------------
-- (optionnel) quelques logs applicatifs
-- ---------------------------
seed_webhook_logs AS (
  INSERT INTO public.webhook_logs (function_name, log_level, message, data, created_at)
  SELECT
    'petzi_ingest' AS function_name,
    CASE WHEN x.n % 12 = 0 THEN 'ERROR' WHEN x.n % 5 = 0 THEN 'WARN' ELSE 'INFO' END AS log_level,
    CASE WHEN x.n % 12 = 0 THEN 'Webhook processing failed (demo)'
         WHEN x.n % 5  = 0 THEN 'Webhook signature header missing (demo)'
         ELSE 'Webhook processed (demo)'
    END AS message,
    jsonb_build_object('demo', true, 'batch', x.n) AS data,
    a.now_ts - make_interval(hours => (x.n % 96), mins => (x.n % 60)) AS created_at
  FROM anchor a
  JOIN LATERAL generate_series(1, 40) AS x(n) ON true
  RETURNING 1
)

SELECT
  (SELECT COUNT(*) FROM upsert_events)     AS events_upserted,
  (SELECT COUNT(*) FROM inserted_sessions) AS sessions_inserted,
  (SELECT COUNT(*) FROM inserted_tickets)  AS tickets_inserted,
  (SELECT COUNT(*) FROM upsert_capacity)   AS capacities_upserted;

-- =================================================================================
-- SECTION 6: VERIFICATIONS
-- =================================================================================

-- 1) Volumétrie
SELECT 'petzi_events'            AS table_name, COUNT(*) AS count FROM public.petzi_events WHERE id IN (900001,900002,900003,900004,900005,900006,900007,900008)
UNION ALL
SELECT 'petzi_sessions',         COUNT(*) FROM public.petzi_sessions WHERE event_id IN (900001,900002,900003,900004,900005,900006,900007,900008)
UNION ALL
SELECT 'petzi_tickets',          COUNT(*) FROM public.petzi_tickets  WHERE event_id IN (900001,900002,900003,900004,900005,900006,900007,900008)
UNION ALL
SELECT 'petzi_session_capacity', COUNT(*) FROM public.petzi_session_capacity WHERE event_id IN (900001,900002,900003,900004,900005,900006,900007,900008);

-- 2) Répartition des statuts
SELECT payment_status, COUNT(*) AS ticket_count
FROM public.petzi_tickets
WHERE event_id IN (900001,900002,900003,900004,900005,900006,900007,900008)
GROUP BY payment_status
ORDER BY ticket_count DESC;

-- 3) Sessions: Past / Today-ish / Future (> today + 7 days)
WITH a AS (SELECT now() AS now_ts, date_trunc('day', now()) AS today_00)
SELECT
  CASE
    WHEN s.starts_at < a.now_ts THEN 'Past'
    WHEN s.starts_at >= a.today_00 AND s.starts_at < (a.today_00 + interval '1 day') THEN 'Today'
    WHEN s.starts_at > (a.today_00 + interval '7 days') THEN 'Future (> today + 7d)'
    ELSE 'Near future (<= 7d)'
  END AS bucket,
  COUNT(*) AS session_count
FROM public.petzi_sessions s
CROSS JOIN a
WHERE s.event_id IN (900001,900002,900003,900004,900005,900006,900007,900008)
GROUP BY 1
ORDER BY 1;

-- 4) Contrôle capacité vs ventes
SELECT
  s.event_id,
  e.name AS event_name,
  s.id   AS session_id,
  s.name AS session_name,
  s.capacity,
  c.booked_spots,
  c.available_spots
FROM public.petzi_sessions s
JOIN public.petzi_events e ON e.id = s.event_id
JOIN public.petzi_session_capacity c ON c.session_id = s.id
WHERE s.event_id IN (900001,900002,900003,900004,900005,900006,900007,900008)
ORDER BY s.starts_at;

COMMIT;
BEGIN;
SET LOCAL TIME ZONE 'Europe/Zurich';

-- =================================================================================
-- PETZI - ADD DEMO TICKETS + UPDATE CAPACITY (pour sessions déjà existantes)
-- - Insère des tickets réalistes (paid + quelques cancelled)
-- - purchase_date <= now()
-- - Met à jour petzi_session_capacity en cohérence avec les tickets "paid"
-- =================================================================================

WITH
demo_events AS (
  SELECT id
  FROM public.petzi_events
  WHERE id BETWEEN 900000 AND 910000
),
demo_sessions AS (
  SELECT
    s.id         AS session_id,
    s.event_id,
    s.name       AS session_name,
    s.starts_at,
    COALESCE(s.capacity, 0) AS capacity,
    e.name       AS event_name,
    e.promoter   AS event_promoter
  FROM public.petzi_sessions s
  JOIN public.petzi_events e ON e.id = s.event_id
  WHERE s.event_id IN (SELECT id FROM demo_events)
),

-- Nettoyage uniquement sur les events démo (pour pouvoir relancer)
cleanup_tickets AS (
  DELETE FROM public.petzi_tickets
  WHERE event_id IN (SELECT id FROM demo_events)
  RETURNING 1
),

-- Détermine un objectif de remplissage crédible selon la temporalité de la session
targets AS (
  SELECT
    ds.*,
    -- taux de remplissage selon passé/présent/futur
    CASE
      WHEN ds.capacity = 0 THEN 0::numeric
      WHEN ds.starts_at < now() - interval '7 days' THEN (0.80 + random() * 0.15)  -- passé lointain: souvent bien rempli
      WHEN ds.starts_at < now() THEN (0.55 + random() * 0.25)                      -- passé récent: moyen/haut
      WHEN ds.starts_at <= now() + interval '1 day' THEN (0.35 + random() * 0.25)  -- aujourd’hui/demain: moyen
      WHEN ds.starts_at >  now() + interval '7 days' THEN (0.10 + random() * 0.35) -- futur > 7j: bas/moyen
      ELSE (0.20 + random() * 0.30)
    END AS fill_rate
  FROM demo_sessions ds
),

counts AS (
  SELECT
    t.*,
    LEAST(t.capacity, GREATEST(0, floor(t.capacity * t.fill_rate)::int)) AS paid_target,
    GREATEST(0, floor(LEAST(t.capacity, GREATEST(0, floor(t.capacity * t.fill_rate)::int)) * (0.02 + random() * 0.05))::int) AS cancelled_target
  FROM targets t
),

name_pool AS (
  SELECT
    ARRAY['Jean','Marie','Lucas','Sofia','Nina','Hugo','Emma','Noah','Lina','Tom','Léa','Max','Sarah','Julien','Camille','Antoine','Chloé','Yanis','Mila','Arthur','Eva','Gabriel','Louise','Théo']::text[] AS first_names,
    ARRAY['Dupont','Martin','Bernard','Dubois','Morel','Rossi','Müller','Meier','Schmid','Keller','Fischer','Weber','Lambert','Mercier','Blanc','Vogel','Berset','Perrin','Nguyen','Diallo','Frei','Girard','Mermoud','Pittet']::text[] AS last_names,
    ARRAY['2000','2012','2034','2068','2072','2300','2400','1000','1200','1700','1800','1950','1007','3000','4000','4051','5000','6000','8000']::text[] AS postcodes
),

ticket_rows AS (
  SELECT
    c.*,
    gs.n AS n,
    (c.paid_target + c.cancelled_target) AS total_target
  FROM counts c
  JOIN LATERAL generate_series(1, (c.paid_target + c.cancelled_target)) AS gs(n) ON true
),

ticket_enriched AS (
  SELECT
    tr.*,
    -- noms déterministes (pas besoin de random ici)
    np.first_names[(((tr.session_id % 1000)::int + tr.n) % array_length(np.first_names,1)) + 1] AS fn,
    np.last_names [(((tr.session_id % 1000)::int + tr.n * 2) % array_length(np.last_names,1)) + 1]  AS ln,
    np.postcodes  [(((tr.session_id % 1000)::int + tr.n * 3) % array_length(np.postcodes,1)) + 1]   AS pc
  FROM ticket_rows tr
  CROSS JOIN name_pool np
),

ticket_pricing AS (
  SELECT
    te.*,
    -- choix ticket_type / category / price par event_id (cohérent, avec un peu de variété)
    CASE
      WHEN te.event_id = 900003 THEN CASE WHEN random() < 0.30 THEN 'Student' ELSE 'Professional' END
      WHEN te.event_id IN (900001,900002,900007) THEN CASE WHEN random() < 0.08 THEN 'VIP' ELSE 'Standard' END
      WHEN te.event_id IN (900006,900004) THEN CASE WHEN random() < 0.20 THEN 'Student' ELSE 'Standard' END
      ELSE 'Standard'
    END AS ticket_type,

    CASE
      WHEN te.event_id = 900003 THEN CASE WHEN random() < 0.30 THEN 'Student' ELSE 'Professional' END
      WHEN te.event_id = 900005 THEN CASE WHEN random() < 0.50 THEN 'Phase 1' ELSE 'Phase 2' END
      WHEN te.event_id IN (900006,900004) THEN 'Material Included'
      ELSE 'Standard'
    END AS category,

    CASE
      WHEN te.event_id = 900001 THEN CASE WHEN random() < 0.08 THEN 75.00 ELSE 35.00 END
      WHEN te.event_id = 900002 THEN CASE WHEN random() < 0.08 THEN 80.00 ELSE 32.00 END
      WHEN te.event_id = 900003 THEN CASE WHEN random() < 0.30 THEN 50.00 ELSE 150.00 END
      WHEN te.event_id = 900004 THEN CASE WHEN random() < 0.20 THEN 30.00 ELSE 60.00 END
      WHEN te.event_id = 900005 THEN CASE WHEN random() < 0.50 THEN 29.00 ELSE 39.00 END
      WHEN te.event_id = 900006 THEN CASE WHEN random() < 0.20 THEN 45.00 ELSE 70.00 END
      WHEN te.event_id = 900007 THEN CASE WHEN random() < 0.08 THEN 120.00 ELSE 45.00 END
      WHEN te.event_id = 900008 THEN CASE WHEN random() < 0.25 THEN 12.00 ELSE 18.00 END
      ELSE 25.00
    END::numeric AS price
  FROM ticket_enriched te
),

ticket_dates AS (
  SELECT
    tp.*,
    -- purchase_date <= now(); pour les sessions passées: <= starts_at - 5min
    (
      LEAST(
        now(),
        CASE WHEN tp.starts_at < now() THEN (tp.starts_at - interval '5 minutes') ELSE now() END
      )
      - (
          ((random() * 60)::int * interval '1 day') +
          ((random() * 23)::int * interval '1 hour') +
          ((random() * 59)::int * interval '1 minute')
        )
    ) AS purchase_ts
  FROM ticket_pricing tp
),

inserted_tickets AS (
  INSERT INTO public.petzi_tickets (
    ticket_number, session_id, event_id,
    title, ticket_type, category, price, currency,
    holder_name, holder_email, holder_phone, holder_postcode,
    buyer, promoter,
    payment_status,
    purchase_date, created_at, updated_at, received_at
  )
  SELECT
    -- ticket_number unique
    'TKT-' || td.event_id || '-' || td.session_id || '-' || lpad(td.n::text, 5, '0') || '-' || substr(gen_random_uuid()::text, 1, 6) AS ticket_number,
    td.session_id,
    td.event_id,
    td.event_name AS title,
    td.ticket_type,
    td.category,
    td.price,
    'CHF' AS currency,
    (td.fn || ' ' || td.ln) AS holder_name,
    lower(td.fn || '.' || td.ln || '+' || td.event_id || '.' || td.session_id || '.' || td.n || '@example.com') AS holder_email,
    '+4179' || lpad(((td.session_id * 7919 + td.n * 104729) % 10000000)::text, 7, '0') AS holder_phone,
    td.pc AS holder_postcode,
    jsonb_build_object('firstName', td.fn, 'lastName', td.ln, 'email', lower(td.fn || '.' || td.ln || '@example.com')) AS buyer,
    td.event_promoter AS promoter,
    CASE WHEN td.n <= td.paid_target THEN 'paid' ELSE 'cancelled' END AS payment_status,
    td.purchase_ts AS purchase_date,
    td.purchase_ts AS created_at,
    td.purchase_ts AS updated_at,
    td.purchase_ts + interval '3 seconds' AS received_at
  FROM ticket_dates td
  RETURNING session_id, event_id, payment_status
),

upsert_capacity AS (
  INSERT INTO public.petzi_session_capacity (
    session_id, event_id, capacity, available_spots, booked_spots, notes, created_at, updated_at
  )
  SELECT
    ds.session_id,
    ds.event_id,
    ds.capacity,
    GREATEST(ds.capacity - COALESCE(t.paid_count, 0), 0) AS available_spots,
    COALESCE(t.paid_count, 0) AS booked_spots,
    CASE
      WHEN COALESCE(t.paid_count, 0) = 0 THEN 'Aucune vente encore'
      WHEN COALESCE(t.paid_count, 0) < (ds.capacity * 0.50) THEN 'Ventes en cours'
      WHEN COALESCE(t.paid_count, 0) < (ds.capacity * 0.90) THEN 'Bien rempli'
      ELSE 'Presque complet'
    END AS notes,
    now(), now()
  FROM demo_sessions ds
  LEFT JOIN (
    SELECT session_id, COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_count
    FROM public.petzi_tickets
    WHERE event_id IN (SELECT id FROM demo_events)
    GROUP BY session_id
  ) t ON t.session_id = ds.session_id
  ON CONFLICT (session_id) DO UPDATE SET
    capacity        = EXCLUDED.capacity,
    available_spots = EXCLUDED.available_spots,
    booked_spots    = EXCLUDED.booked_spots,
    notes           = EXCLUDED.notes,
    updated_at      = EXCLUDED.updated_at
  RETURNING session_id
)

SELECT
  (SELECT COUNT(*) FROM demo_sessions)    AS sessions_found,
  (SELECT COUNT(*) FROM inserted_tickets) AS tickets_inserted,
  (SELECT COUNT(*) FROM upsert_capacity)  AS capacities_upserted;

COMMIT;
BEGIN;
SET LOCAL TIME ZONE 'Europe/Zurich';

-- =================================================================================
-- ADD "CLOSED" DEMO EVENTS (past sessions) + tickets + capacity
-- - petzi_events.id: on fixe des ids
-- - petzi_sessions.id / petzi_tickets.id / petzi_session_capacity.id : IDENTITY => on ne touche pas
-- - purchase_date <= now() et, pour sessions passées, purchase_date <= starts_at - 5 minutes
-- =================================================================================

-- --------------------------
-- CLEANUP (only these events)
-- --------------------------
DELETE FROM public.petzi_tickets
WHERE event_id IN (900009,900010,900011,900012,900013,900014);

DELETE FROM public.petzi_session_capacity
WHERE event_id IN (900009,900010,900011,900012,900013,900014);

DELETE FROM public.petzi_sessions
WHERE event_id IN (900009,900010,900011,900012,900013,900014);

DELETE FROM public.petzi_events
WHERE id IN (900009,900010,900011,900012,900013,900014);

WITH
anchor AS (
  SELECT now() AS now_ts, date_trunc('day', now()) AS today_00
),

-- --------------------------
-- EVENTS (clôturés)
-- --------------------------
ins_events AS (
  INSERT INTO public.petzi_events (id, name, promoter, location, description, created_at, updated_at)
  SELECT *
  FROM (
    SELECT
      900009::bigint AS id,
      'Autumn Folk Night 2025'::text AS name,
      'Folk Collective'::text AS promoter,
      'Case à Chocs, Neuchâtel'::text AS location,
      'Concert folk intimiste (événement clôturé).'::text AS description,
      (a.now_ts - interval '160 days') AS created_at,
      (a.now_ts - interval '120 days') AS updated_at
    FROM anchor a
    UNION ALL
    SELECT 900010, 'Hard Rock Reunion 2025', 'Rock United', 'Case à Chocs, Neuchâtel',
           'Soirée rock (événement clôturé).', (a.now_ts - interval '220 days'), (a.now_ts - interval '180 days')
    FROM anchor a
    UNION ALL
    SELECT 900011, 'Swiss Startup Demo Day 2025', 'Innovate CH', 'Neuchâtel - Main Hall',
           'Pitchs & networking (événement clôturé).', (a.now_ts - interval '110 days'), (a.now_ts - interval '95 days')
    FROM anchor a
    UNION ALL
    SELECT 900012, 'Winter Theatre Premiere 2025', 'City Culture', 'Neuchâtel - Grand Hall',
           'Première théâtre (événement clôturé).', (a.now_ts - interval '260 days'), (a.now_ts - interval '240 days')
    FROM anchor a
    UNION ALL
    SELECT 900013, 'Photography Masterclass 2025', 'Art & Soul', 'Neuchâtel - Atelier',
           'Masterclass photo (événement clôturé).', (a.now_ts - interval '90 days'), (a.now_ts - interval '75 days')
    FROM anchor a
    UNION ALL
    SELECT 900014, 'Summer Closing Party 2025', 'SynthWave Collective', 'Neuchâtel - Club Stage',
           'Clôture de saison (événement clôturé).', (a.now_ts - interval '320 days'), (a.now_ts - interval '300 days')
    FROM anchor a
  ) x
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    promoter = EXCLUDED.promoter,
    location = EXCLUDED.location,
    description = EXCLUDED.description,
    updated_at = now()
  RETURNING id
),

-- --------------------------
-- SESSIONS (toutes dans le passé)
-- offset_days négatif => passé
-- --------------------------
sessions_seed AS (
  SELECT
    v.event_id,
    v.session_name AS name,
    (a.today_00 + (v.offset_days * interval '1 day') + (v.start_hour * interval '1 hour') + (v.start_min * interval '1 minute'))::timestamptz AS starts_at,
    (a.today_00 + (v.offset_days * interval '1 day') + (v.start_hour * interval '1 hour') + (v.start_min * interval '1 minute') - (v.doors_before_mins * interval '1 minute'))::timestamptz AS doors_at,
    v.capacity,
    'limited'::text AS capacity_mode,
    v.location_name, v.location_street, v.location_city, v.location_postcode,
    jsonb_build_object('name', v.location_name, 'street', v.location_street, 'city', v.location_city, 'postcode', v.location_postcode) AS location
  FROM anchor a
  JOIN (
    VALUES
      -- event_id, session_name, offset_days, start_hour, start_min, doors_before_mins, capacity, location_name, street, city, postcode

      (900009,'Main Concert',            -120, 20,  0, 60, 260, 'Case à Chocs', 'Quai Robert-Comtesse 4', 'Neuchâtel', '2000'),
      (900009,'After Show (Acoustic)',   -120, 22, 30, 30, 120, 'Case à Chocs', 'Quai Robert-Comtesse 4', 'Neuchâtel', '2000'),

      (900010,'Opening Act + Show',      -185, 20, 30, 60, 600, 'Case à Chocs', 'Quai Robert-Comtesse 4', 'Neuchâtel', '2000'),

      (900011,'Pitch Session',            -95, 18, 30, 45, 320, 'Main Hall',    'Rue du Marché 1',        'Neuchâtel', '2000'),
      (900011,'Networking',               -95, 20, 30, 30, 200, 'Lounge Area',  'Rue du Marché 1',        'Neuchâtel', '2000'),

      (900012,'Premiere Night',          -240, 19, 30, 60, 700, 'Grand Hall',   'Place Centrale 2',       'Neuchâtel', '2000'),
      (900012,'Second Night',            -239, 19, 30, 60, 700, 'Grand Hall',   'Place Centrale 2',       'Neuchâtel', '2000'),

      (900013,'Morning Masterclass',      -75, 10,  0, 15,  28, 'Atelier',      'Rue des Beaux-Arts 3',   'Neuchâtel', '2000'),
      (900013,'Afternoon Practice',       -75, 14,  0, 15,  28, 'Atelier',      'Rue des Beaux-Arts 3',   'Neuchâtel', '2000'),

      (900014,'Warm-up DJs',             -300, 21, 30, 60, 450, 'Club Stage',   'Rue de la Nuit 5',       'Neuchâtel', '2000'),
      (900014,'Main Set',                -300, 23, 30, 60, 450, 'Club Stage',   'Rue de la Nuit 5',       'Neuchâtel', '2000')
  ) AS v(event_id, session_name, offset_days, start_hour, start_min, doors_before_mins, capacity, location_name, location_street, location_city, location_postcode)
  ON true
),

inserted_sessions AS (
  INSERT INTO public.petzi_sessions (
    event_id, name, starts_at, doors_at, capacity, capacity_mode,
    location_name, location_street, location_city, location_postcode, location,
    created_at, updated_at
  )
  SELECT
    ss.event_id, ss.name, ss.starts_at, ss.doors_at, ss.capacity, ss.capacity_mode,
    ss.location_name, ss.location_street, ss.location_city, ss.location_postcode, ss.location,
    now(), now()
  FROM sessions_seed ss
  RETURNING id, event_id, name, starts_at, capacity
),

session_map AS (
  SELECT
    s.id AS session_id,
    s.event_id,
    s.name,
    s.starts_at,
    s.capacity,
    e.name AS event_name,
    e.promoter AS event_promoter
  FROM inserted_sessions s
  JOIN public.petzi_events e ON e.id = s.event_id
),

-- --------------------------
-- Ticket generation targets (volumique + crédible)
-- --------------------------
targets AS (
  SELECT
    sm.*,
    CASE
      WHEN sm.capacity <= 30 THEN (0.55 + random() * 0.30)     -- workshops
      ELSE (0.75 + random() * 0.20)                            -- concerts / grands events: plus rempli
    END AS fill_rate
  FROM session_map sm
),

counts AS (
  SELECT
    t.*,
    LEAST(t.capacity, GREATEST(0, floor(t.capacity * t.fill_rate)::int)) AS paid_target,
    GREATEST(1, floor(LEAST(t.capacity, GREATEST(0, floor(t.capacity * t.fill_rate)::int)) * (0.03 + random() * 0.06))::int) AS cancelled_target
  FROM targets t
),

name_pool AS (
  SELECT
    ARRAY['Jean','Marie','Lucas','Sofia','Nina','Hugo','Emma','Noah','Lina','Tom','Léa','Max','Sarah','Julien','Camille','Antoine','Chloé','Yanis','Mila','Arthur','Eva','Gabriel','Louise','Théo']::text[] AS first_names,
    ARRAY['Dupont','Martin','Bernard','Dubois','Morel','Rossi','Müller','Meier','Schmid','Keller','Fischer','Weber','Lambert','Mercier','Blanc','Vogel','Berset','Perrin','Nguyen','Diallo','Frei','Girard','Mermoud','Pittet']::text[] AS last_names,
    ARRAY['2000','2012','2034','2068','2072','2300','2400','1000','1200','1700','1800','1950','1007','3000','4000','4051','5000','6000','8000']::text[] AS postcodes
),

ticket_rows AS (
  SELECT
    c.*,
    gs.n
  FROM counts c
  JOIN LATERAL generate_series(1, (c.paid_target + c.cancelled_target)) AS gs(n) ON true
),

ticket_people AS (
  SELECT
    tr.*,
    np.first_names[(((tr.session_id % 1000)::int + tr.n) % array_length(np.first_names,1)) + 1] AS fn,
    np.last_names [(((tr.session_id % 1000)::int + tr.n * 2) % array_length(np.last_names,1)) + 1]  AS ln,
    np.postcodes  [(((tr.session_id % 1000)::int + tr.n * 3) % array_length(np.postcodes,1)) + 1]   AS pc
  FROM ticket_rows tr
  CROSS JOIN name_pool np
),

ticket_pricing AS (
  SELECT
    tp.*,
    CASE
      WHEN tp.event_id IN (900011) THEN CASE WHEN random() < 0.30 THEN 'Student' ELSE 'Professional' END
      WHEN tp.event_id IN (900013) THEN 'Standard'
      WHEN random() < 0.08 THEN 'VIP'
      ELSE 'Standard'
    END AS ticket_type,

    CASE
      WHEN tp.event_id IN (900011) THEN CASE WHEN random() < 0.30 THEN 'Student' ELSE 'Professional' END
      WHEN tp.event_id IN (900013) THEN 'Material Included'
      WHEN tp.event_id IN (900014) THEN CASE WHEN random() < 0.50 THEN 'Phase 1' ELSE 'Phase 2' END
      ELSE 'Standard'
    END AS category,

    CASE
      WHEN tp.event_id = 900009 THEN CASE WHEN random() < 0.08 THEN 65.00 ELSE 30.00 END
      WHEN tp.event_id = 900010 THEN CASE WHEN random() < 0.08 THEN 95.00 ELSE 35.00 END
      WHEN tp.event_id = 900011 THEN CASE WHEN random() < 0.30 THEN 50.00 ELSE 150.00 END
      WHEN tp.event_id = 900012 THEN CASE WHEN random() < 0.10 THEN 120.00 ELSE 45.00 END
      WHEN tp.event_id = 900013 THEN 75.00
      WHEN tp.event_id = 900014 THEN CASE WHEN random() < 0.50 THEN 28.00 ELSE 38.00 END
      ELSE 25.00
    END::numeric AS price
  FROM ticket_people tp
),

ticket_dates AS (
  SELECT
    tpr.*,
    -- base time: pour sessions passées => starts_at - 5min (on garantit purchase_date <= session)
    (
      (tpr.starts_at - interval '5 minutes')
      - (
          ((1 + (random() * 80)::int) * interval '1 day') +   -- jusqu’à ~80 jours avant la session
          ((random() * 23)::int * interval '1 hour') +
          ((random() * 59)::int * interval '1 minute')
        )
    ) AS purchase_ts
  FROM ticket_pricing tpr
),

inserted_tickets AS (
  INSERT INTO public.petzi_tickets (
    ticket_number, session_id, event_id,
    title, ticket_type, category, price, currency,
    holder_name, holder_email, holder_phone, holder_postcode,
    buyer, promoter,
    payment_status,
    purchase_date, created_at, updated_at, received_at
  )
  SELECT
    'TKT-' || td.event_id || '-' || td.session_id || '-' || lpad(td.n::text, 5, '0') || '-' || substr(gen_random_uuid()::text, 1, 6) AS ticket_number,
    td.session_id,
    td.event_id,
    td.event_name AS title,
    td.ticket_type,
    td.category,
    td.price,
    'CHF' AS currency,
    (td.fn || ' ' || td.ln) AS holder_name,
    lower(td.fn || '.' || td.ln || '+' || td.event_id || '.' || td.session_id || '.' || td.n || '@example.com') AS holder_email,
    '+4179' || lpad(((td.session_id * 7919 + td.n * 104729) % 10000000)::text, 7, '0') AS holder_phone,
    td.pc AS holder_postcode,
    jsonb_build_object('firstName', td.fn, 'lastName', td.ln, 'email', lower(td.fn || '.' || td.ln || '@example.com')) AS buyer,
    td.event_promoter AS promoter,
    CASE WHEN td.n <= td.paid_target THEN 'paid' ELSE 'cancelled' END AS payment_status,
    td.purchase_ts AS purchase_date,
    td.purchase_ts AS created_at,
    td.purchase_ts AS updated_at,
    td.purchase_ts + interval '3 seconds' AS received_at
  FROM ticket_dates td
  WHERE td.purchase_ts <= now()  -- sécurité
  RETURNING session_id, event_id, payment_status
),

-- --------------------------
-- Capacity upsert (based on PAID tickets)
-- --------------------------
upsert_capacity AS (
  INSERT INTO public.petzi_session_capacity (
    session_id, event_id, capacity, available_spots, booked_spots, notes, created_at, updated_at
  )
  SELECT
    sm.session_id,
    sm.event_id,
    sm.capacity,
    GREATEST(sm.capacity - COALESCE(t.paid_count, 0), 0) AS available_spots,
    COALESCE(t.paid_count, 0) AS booked_spots,
    CASE
      WHEN COALESCE(t.paid_count, 0) = 0 THEN 'Aucune vente'
      WHEN COALESCE(t.paid_count, 0) < (sm.capacity * 0.50) THEN 'Ventes faibles'
      WHEN COALESCE(t.paid_count, 0) < (sm.capacity * 0.90) THEN 'Bien rempli'
      ELSE 'Complet / quasi complet'
    END AS notes,
    now(), now()
  FROM session_map sm
  LEFT JOIN (
    SELECT session_id, COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_count
    FROM public.petzi_tickets
    WHERE event_id IN (900009,900010,900011,900012,900013,900014)
    GROUP BY session_id
  ) t ON t.session_id = sm.session_id
  ON CONFLICT (session_id) DO UPDATE SET
    capacity        = EXCLUDED.capacity,
    available_spots = EXCLUDED.available_spots,
    booked_spots    = EXCLUDED.booked_spots,
    notes           = EXCLUDED.notes,
    updated_at      = now()
  RETURNING session_id
)

SELECT
  (SELECT COUNT(*) FROM ins_events)         AS events_added,
  (SELECT COUNT(*) FROM inserted_sessions)  AS sessions_added,
  (SELECT COUNT(*) FROM inserted_tickets)   AS tickets_added,
  (SELECT COUNT(*) FROM upsert_capacity)    AS capacities_upserted;

COMMIT;
BEGIN;
SET LOCAL TIME ZONE 'Europe/Zurich';

-- Pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- IDs des événements clôturés
-- (modifie si besoin)
-- 900009..900014
-- ------------------------------------------------------------

-- Nettoyage (relançable)
DELETE FROM public.petzi_tickets
WHERE event_id = ANY(ARRAY[900009,900010,900011,900012,900013,900014]::bigint[]);

DELETE FROM public.petzi_session_capacity
WHERE event_id = ANY(ARRAY[900009,900010,900011,900012,900013,900014]::bigint[]);

-- Génération tickets + upsert capacity
WITH
sess AS (
  SELECT
    s.id AS session_id,
    s.event_id,
    s.starts_at,
    COALESCE(s.capacity, 0) AS capacity,
    e.name AS event_name,
    e.promoter AS event_promoter
  FROM public.petzi_sessions s
  JOIN public.petzi_events e ON e.id = s.event_id
  WHERE s.event_id = ANY(ARRAY[900009,900010,900011,900012,900013,900014]::bigint[])
),
targets AS (
  SELECT
    se.*,
    CASE
      WHEN se.capacity <= 30 THEN (0.55 + random() * 0.30)  -- petits ateliers
      ELSE (0.75 + random() * 0.20)                         -- concerts / grands events
    END AS fill_rate
  FROM sess se
),
counts AS (
  SELECT
    t.*,
    LEAST(t.capacity, GREATEST(0, floor(t.capacity * t.fill_rate)::int)) AS paid_target,
    GREATEST(0, floor(LEAST(t.capacity, GREATEST(0, floor(t.capacity * t.fill_rate)::int)) * (0.03 + random() * 0.06))::int) AS cancelled_target
  FROM targets t
),
name_pool AS (
  SELECT
    ARRAY['Jean','Marie','Lucas','Sofia','Nina','Hugo','Emma','Noah','Lina','Tom','Léa','Max','Sarah','Julien','Camille','Antoine','Chloé','Yanis','Mila','Arthur','Eva','Gabriel','Louise','Théo']::text[] AS first_names,
    ARRAY['Dupont','Martin','Bernard','Dubois','Morel','Rossi','Müller','Meier','Schmid','Keller','Fischer','Weber','Lambert','Mercier','Blanc','Vogel','Berset','Perrin','Nguyen','Diallo','Frei','Girard','Mermoud','Pittet']::text[] AS last_names,
    ARRAY['2000','2012','2034','2068','2072','2300','2400','1000','1200','1700','1800','1950','1007','3000','4000','4051','5000','6000','8000']::text[] AS postcodes
),
rows AS (
  SELECT
    c.*,
    gs.n
  FROM counts c
  JOIN LATERAL generate_series(1, (c.paid_target + c.cancelled_target)) AS gs(n) ON true
),
people AS (
  SELECT
    r.*,
    np.first_names[(((r.session_id % 1000)::int + r.n) % array_length(np.first_names,1)) + 1] AS fn,
    np.last_names [(((r.session_id % 1000)::int + r.n * 2) % array_length(np.last_names,1)) + 1]  AS ln,
    np.postcodes  [(((r.session_id % 1000)::int + r.n * 3) % array_length(np.postcodes,1)) + 1]   AS pc
  FROM rows r
  CROSS JOIN name_pool np
),
pricing AS (
  SELECT
    p.*,
    CASE
      WHEN p.event_id = 900011 THEN CASE WHEN random() < 0.30 THEN 'Student' ELSE 'Professional' END
      WHEN p.event_id = 900013 THEN 'Standard'
      WHEN random() < 0.08 THEN 'VIP'
      ELSE 'Standard'
    END AS ticket_type,
    CASE
      WHEN p.event_id = 900011 THEN CASE WHEN random() < 0.30 THEN 'Student' ELSE 'Professional' END
      WHEN p.event_id = 900013 THEN 'Material Included'
      WHEN p.event_id = 900014 THEN CASE WHEN random() < 0.50 THEN 'Phase 1' ELSE 'Phase 2' END
      ELSE 'Standard'
    END AS category,
    CASE
      WHEN p.event_id = 900009 THEN CASE WHEN random() < 0.08 THEN 65.00 ELSE 30.00 END
      WHEN p.event_id = 900010 THEN CASE WHEN random() < 0.08 THEN 95.00 ELSE 35.00 END
      WHEN p.event_id = 900011 THEN CASE WHEN random() < 0.30 THEN 50.00 ELSE 150.00 END
      WHEN p.event_id = 900012 THEN CASE WHEN random() < 0.10 THEN 120.00 ELSE 45.00 END
      WHEN p.event_id = 900013 THEN 75.00
      WHEN p.event_id = 900014 THEN CASE WHEN random() < 0.50 THEN 28.00 ELSE 38.00 END
      ELSE 25.00
    END::numeric AS price
  FROM people p
),
dated AS (
  SELECT
    pr.*,
    -- sessions passées => achat avant la session
    (
      (pr.starts_at - interval '5 minutes')
      - (
          ((1 + (random() * 80)::int) * interval '1 day') +
          ((random() * 23)::int * interval '1 hour') +
          ((random() * 59)::int * interval '1 minute')
        )
    ) AS purchase_ts
  FROM pricing pr
),
inserted_tickets AS (
  INSERT INTO public.petzi_tickets (
    ticket_number, session_id, event_id,
    title, ticket_type, category, price, currency,
    holder_name, holder_email, holder_phone, holder_postcode,
    buyer, promoter,
    payment_status,
    purchase_date, created_at, updated_at, received_at
  )
  SELECT
    'TKT-' || d.event_id || '-' || d.session_id || '-' || lpad(d.n::text, 5, '0') || '-' || substr(gen_random_uuid()::text, 1, 6),
    d.session_id,
    d.event_id,
    d.event_name,
    d.ticket_type,
    d.category,
    d.price,
    'CHF',
    (d.fn || ' ' || d.ln),
    lower(d.fn || '.' || d.ln || '+' || d.event_id || '.' || d.session_id || '.' || d.n || '@example.com'),
    '+4179' || lpad(((d.session_id * 7919 + d.n * 104729) % 10000000)::text, 7, '0'),
    d.pc,
    jsonb_build_object('firstName', d.fn, 'lastName', d.ln, 'email', lower(d.fn || '.' || d.ln || '@example.com')),
    d.event_promoter,
    CASE WHEN d.n <= d.paid_target THEN 'paid' ELSE 'cancelled' END,
    d.purchase_ts,
    d.purchase_ts,
    d.purchase_ts,
    d.purchase_ts + interval '3 seconds'
  FROM dated d
  WHERE d.purchase_ts <= now()
  RETURNING session_id, event_id, payment_status
),
upsert_capacity AS (
  INSERT INTO public.petzi_session_capacity (
    session_id, event_id, capacity, available_spots, booked_spots, notes, created_at, updated_at
  )
  SELECT
    s.session_id,
    s.event_id,
    s.capacity,
    GREATEST(s.capacity - COALESCE(t.paid_count, 0), 0),
    COALESCE(t.paid_count, 0),
    CASE
      WHEN COALESCE(t.paid_count, 0) = 0 THEN 'Aucune vente'
      WHEN COALESCE(t.paid_count, 0) < (s.capacity * 0.50) THEN 'Ventes faibles'
      WHEN COALESCE(t.paid_count, 0) < (s.capacity * 0.90) THEN 'Bien rempli'
      ELSE 'Complet / quasi complet'
    END,
    now(), now()
  FROM sess s
  LEFT JOIN (
    SELECT session_id, COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_count
    FROM public.petzi_tickets
    WHERE event_id = ANY(ARRAY[900009,900010,900011,900012,900013,900014]::bigint[])
    GROUP BY session_id
  ) t ON t.session_id = s.session_id
  ON CONFLICT (session_id) DO UPDATE SET
    capacity        = EXCLUDED.capacity,
    available_spots = EXCLUDED.available_spots,
    booked_spots    = EXCLUDED.booked_spots,
    notes           = EXCLUDED.notes,
    updated_at      = now()
  RETURNING session_id
)
SELECT
  (SELECT COUNT(*) FROM sess)            AS sessions_found,
  (SELECT COUNT(*) FROM inserted_tickets) AS tickets_added,
  (SELECT COUNT(*) FROM upsert_capacity)  AS capacities_upserted;

COMMIT;


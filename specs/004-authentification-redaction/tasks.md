---
description: "Task list — Authentification de la rédaction"
---

# Tasks: Authentification de la rédaction

**Input**: Design documents from `/specs/004-authentification-redaction/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: inclus — le plan liste des suites unitaires et e2e, et la feature est
sécuritaire (indistinction des échecs, refus par défaut, révocation). Les portes de qualité
de la constitution se vérifient par tests.

**Organization**: tâches groupées par récit utilisateur (US1→US5), en ordre de priorité.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichiers distincts, aucune dépendance sur une tâche incomplète)
- **[Story]** : US1…US5 (récits de `spec.md`) ; pas de label en Setup / Foundational / Polish
- Chemins de fichiers exacts dans chaque description

## Correspondance récits → exigences

- **US1** Se connecter (P1) : FR-001, FR-004, FR-014, FR-008, FR-018
- **US2** Refus par défaut (P1) : FR-002, FR-005, FR-006, FR-007
- **US3** Erreur indistincte (P2) : FR-003, FR-009, FR-010, FR-011, FR-011a, FR-021
- **US4** Déconnexion (P2) : FR-012, FR-013
- **US5** Session persiste puis expire (P3) : FR-014, FR-015, FR-016, FR-017
- Transverse (Setup/Foundational/Polish) : FR-002 (visuel), FR-003, FR-019, FR-020

---

## Phase 1: Setup (infrastructure partagée)

**Purpose**: installer et configurer la brique de session, poser les sources partagées.

- [X] T001 Ajouter la dépendance `nuxt-auth-utils` (`npm i nuxt-auth-utils`) et vérifier sa présence dans `package.json`
- [X] T002 Déclarer le module `'nuxt-auth-utils'` et configurer `runtimeConfig.session` (`maxAge: 2592000`, `cookie: { httpOnly: true, secure: true, sameSite: 'strict' }`, `name: 'fm_session'`) dans `nuxt.config.ts`
- [X] T003 [P] Créer `shared/utils/roles.ts` (`ROLES = ['redaction'] as const`, `type Role`, `ROLE_PAR_DEFAUT`, schéma Zod `z.enum(ROLES)`)
- [X] T004 [P] Créer `shared/types/session.d.ts` augmentant `#auth-utils` : `interface User { id; identifiant; nomAffichable; role }`
- [X] T005 [P] Documenter les variables dans `.env.example` : `NUXT_SESSION_PASSWORD`, `COMPTE_REDACTION_IDENTIFIANT`, `COMPTE_REDACTION_NOM`, `COMPTE_REDACTION_MOT_DE_PASSE` (sans valeurs réelles)

---

## Phase 2: Foundational (prérequis bloquants)

**Purpose**: schéma, service, gardes et composants dont dépendent tous les récits.

**⚠️ CRITICAL**: aucun récit ne peut aboutir avant la fin de cette phase.

- [X] T006 Ajouter `role String @default("redaction")` au modèle `Compte` dans `prisma/schema.prisma`
- [X] T007 Générer la migration additive + régénérer le client : `npx prisma migrate dev --name compte_role` (garde-fou Prisma 7 : ne pas jouer `reset`)
- [X] T008 Étendre `server/services/comptes.ts` : inclure `role` dans `ComptePublic` ; normaliser l'identifiant (`trim().toLowerCase()`) en lecture et vérification (FR-018) ; exécuter un `argon2.verify` **leurre** quand le compte est inconnu, pour égaliser le temps de réponse (FR-011, research D3)
- [X] T009 [P] Créer `server/utils/session.ts` → `exigerCompte(event)` : `requireUserSession` puis revérifier `compteParIdentifiant(session.user.identifiant)` ; si disparu → `clearUserSession` + 401 (FR-016)
- [X] T010 [P] Créer `app/layouts/nu.vue` : layout autonome (écran centré `.screen`, `min-height:100dvh`, gouttière), sans `AppRail`/`AppTopbar`/`AppFooter` (FR-002)
- [X] T011 [P] Étendre `app/components/ui/AppField.vue` : props optionnelles `type` (`'email' | 'password' | …`) et `autocomplete`, valeurs par défaut inchangées (rétrocompatible)
- [X] T012 [P] Étendre `app/components/ui/AppButton.vue` : prop optionnelle `type` (défaut `'button'`) pour permettre `type="submit"` (rétrocompatible)
- [X] T013 Ajouter `semerLeCompte()` à `prisma/seed.ts` : `upsert` sur identifiant normalisé, empreinte argon2id du mot de passe d'amorçage lu en variable d'environnement, `role = ROLE_PAR_DEFAUT` ; si variable absente → **sauter** avec avertissement, **jamais** de mot de passe par défaut (FR-017, research D7)

**Checkpoint**: fondation prête — les récits peuvent démarrer.

---

## Phase 3: US1 — Un membre de la rédaction se connecte (Priority: P1) 🎯 MVP

**Goal**: la page de connexion admet un membre valide et ouvre l'accès à `/admin` ; la
session persiste d'une page à l'autre.

**Independent Test**: avec les identifiants du compte semé, se connecter et arriver sur
`/admin` ; recharger `/admin` : accès conservé. Identifiant à casse/espaces variés : admis.

### Tests (US1)

- [X] T014 [P] [US1] Étendre `tests/unit/comptes.test.ts` : un identifiant à casse/espaces différents (ex. `  REDACTION@…  `) avec le bon mot de passe est admis (FR-018)
- [X] T015 [P] [US1] Étendre `tests/unit/seed.test.ts` : le seed crée le compte de rédaction (empreinte `$argon2id$`, `role` par défaut, aucun mot de passe en clair) (FR-017)
- [X] T016 [US1] Créer `tests/e2e/connexion.spec.ts` : connexion réussie → arrivée sur `/admin` ; rechargement de `/admin` conserve l'accès

### Implémentation (US1)

- [X] T017 [P] [US1] Créer `server/validation/auth.ts` : `schemaConnexion` Zod (`identifiant` présent, `motDePasse` présent), messages français ; **sans** borne de longueur ni format e-mail bloquant (data-model §4)
- [X] T018 [US1] Créer `server/api/auth/connexion.post.ts` : `readBody` → `valider(schemaConnexion)` → `verifierMotDePasse` (identifiant normalisé) → succès `setUserSession(event, { user })` (200) ; échec → **401** message générique unique ; valider le paramètre `retour` (chemin interne : commence par `/`, pas par `//`, sinon `/admin`) ; **ne jamais journaliser** le corps de requête ni le mot de passe (FR-003/SC-005) (FR-004/FR-007 ; dépend T002, T008, T017)
- [X] T019 [US1] Créer `app/pages/connexion.vue` d'après `docs/design/html/connexion.html` : `definePageMeta({ layout: 'nu' })`, mot-symbole `public/brand/{NOIR,BLANC}.png` (lien accueil, `alt` réel), titre « Connexion », `AppField` e-mail (`type="email"`, `autocomplete="email"`) et mot de passe (`type="password"`, `autocomplete="current-password"`), `AppButton` primaire `type="submit"` « Se connecter » ; redirection vers `/admin` si déjà connecté (FR-008) ; focus visible rétabli (dépend T010, T011, T012, T018)

**Checkpoint**: la connexion fonctionne et la session persiste.

---

## Phase 4: US2 — L'accès à l'administration est refusé à qui n'est pas connecté (Priority: P1)

**Goal**: toute adresse `/admin` non authentifiée renvoie à la connexion ; après connexion,
retour vers l'espace demandé.

**Independent Test**: non connecté, `/admin` et `/admin/x` → `/connexion?retour=…` ; se
connecter → arrivée sur l'espace demandé.

### Tests (US2)

- [X] T020 [US2] Étendre `tests/e2e/connexion.spec.ts` : `/admin` et `/admin/quoi-que-ce-soit` non connecté → redirection `/connexion?retour=…`, aucun contenu d'administration ; connexion → retour vers l'espace demandé

### Implémentation (US2)

- [X] T021 [P] [US2] Créer `app/middleware/admin.global.ts` : sur préfixe `/admin`, si `useUserSession().loggedIn` faux → `navigateTo('/connexion?retour=' + encodeURIComponent(to.fullPath))` (refus par défaut, sans opt-in — FR-005)
- [X] T021a [P] [US2] Poser `Cache-Control: no-store` sur les réponses `/admin/**` (via `routeRules: { '/admin/**': { headers: { 'cache-control': 'no-store' } } }` dans `nuxt.config.ts`) pour empêcher le cache retour-arrière (bfcache/historique) d'exposer une page d'administration après déconnexion (FR-013 ; vérifié par T029)
- [X] T022 [P] [US2] Créer `app/pages/admin/index.vue` : atterrissage minimal (titre « Espace d'administration », texte sobre, sans accent d'initiative) — destination post-connexion, seam du back-office (FR-004/FR-007)
- [X] T023 [US2] Consommer et valider `retour` dans `app/pages/connexion.vue` (chemin interne uniquement, anti-open-redirect) et confirmer la même validation côté `server/api/auth/connexion.post.ts` (FR-007 ; dépend T018, T019)

**Checkpoint**: US1 + US2 forment le MVP livrable (les deux P1).

---

## Phase 5: US3 — Erreur signalée sans culpabiliser ni renseigner (Priority: P2)

**Goal**: identifiant inconnu, mot de passe faux ou champ vide → message unique, indistinct ;
protection contre les tentatives répétées.

**Independent Test**: soumettre un identifiant inconnu, puis un mot de passe faux sur un
identifiant connu, puis un champ vide → message identique, aucun champ désigné ; identifiant
conservé, mot de passe vidé.

### Tests (US3)

- [X] T024 [P] [US3] Créer `tests/unit/limiteDebit.test.ts` : sous le seuil autorisé, au seuil refusé, fenêtre glissante rouvre l'accès, IP distinctes indépendantes (FR-011a)
- [X] T025 [US3] Étendre `tests/e2e/connexion.spec.ts` : trois cas d'échec (inconnu / mauvais mot de passe / champ vide) → **même** message ; identifiant conservé, champ mot de passe vidé ; filet + message en rouge d'erreur, message annoncé (`role="alert"`)

### Implémentation (US3)

- [X] T026 [P] [US3] Créer `server/utils/limiteDebit.ts` : fenêtre glissante en mémoire `Map<ip, number[]>` (seuil ~10 / 15 min, réglable), IP via `getRequestIP(event, { xForwardedFor: true })` (FR-011a, research D6)
- [X] T027 [US3] Intégrer `limiteDebit` en tête de `server/api/auth/connexion.post.ts` : au-delà du seuil → **429** avec le **même** message générique ; garantir l'indistinction 401/429 (FR-009/FR-011/FR-011a ; dépend T018, T026)
- [X] T028 [US3] Confirmer dans `app/pages/connexion.vue` le rendu d'erreur : message unique dans un conteneur `role="alert"`, état erreur sur les champs (pas uniquement la couleur), identifiant conservé, mot de passe vidé (FR-010/FR-021 ; dépend T019)

**Checkpoint**: aucun signal ne distingue les causes d'échec ; force brute grossière écartée.

---

## Phase 6: US4 — Un membre se déconnecte (Priority: P2)

**Goal**: la déconnexion met fin à la session et referme l'accès à l'administration.

**Independent Test**: connecté, se déconnecter, demander `/admin` → renvoi vers la connexion,
y compris via « précédent ».

### Tests (US4)

- [X] T029 [US4] Étendre `tests/e2e/connexion.spec.ts` : après déconnexion, `/admin` → `/connexion` ; bouton « précédent » vers `/admin` → toujours renvoyé (FR-013)

### Implémentation (US4)

- [X] T030 [P] [US4] Créer `server/api/auth/deconnexion.post.ts` : `clearUserSession(event)` → 200 `{ ok: true }`, idempotent (double appel sans erreur) (FR-012)
- [X] T031 [US4] Ajouter l'action « Se déconnecter » dans `app/pages/admin/index.vue` : appelle `/api/auth/deconnexion` puis `navigateTo('/connexion')` (FR-012 ; dépend T022, T030)

**Checkpoint**: le cycle ouvrir / refermer est complet.

---

## Phase 7: US5 — La session persiste raisonnablement puis expire (Priority: P3)

**Goal**: session à terme absolu de 30 jours ; une session dont le compte a disparu est
refusée dès la première demande.

**Independent Test**: la session reste valide après rechargement ; `exigerCompte` refuse
sans session et si le compte est supprimé.

### Tests (US5)

- [X] T032 [P] [US5] Créer `tests/unit/session.test.ts` : `exigerCompte` refuse sans session ; refuse si le compte est supprimé entre l'ouverture et la requête (FR-016)
- [X] T033 [US5] Étendre `tests/e2e/connexion.spec.ts` : la session survit à un rechargement au sein de sa durée de vie (persistance — FR-014)

### Implémentation (US5)

- [X] T034 [US5] Vérifier dans `nuxt.config.ts` que `session.maxAge` vaut 30 j **absolus** et que nuxt-auth-utils ne **rafraîchit pas** l'échéance à chaque requête (terme absolu, non glissant — research D2) ; ajuster la configuration si nécessaire (FR-015)

**Checkpoint**: persistance et expiration conformes ; révocation par disparition du compte.

---

## Phase 8: Polish & transverse

**Purpose**: accessibilité, sobriété, portabilité, validation de bout en bout.

- [X] T035 [P] Ajouter à `tests/e2e/connexion.spec.ts` les contrôles axe (`@axe-core/playwright`) dans les **deux thèmes** et l'absence de défilement horizontal à 375 px (`scrollWidth ≤ clientWidth`) (FR-019, porte 7/8)
- [X] T036 [P] Journaliser au démarrage les limites de `server/utils/limiteDebit.ts` (état en mémoire, par instance, remis à zéro au redémarrage) (research D6)
- [X] T037 Exécuter `npm run verifier` (sobriété + portabilité) et `npm run typecheck` ; corriger tout écart
- [X] T038 Dérouler manuellement les scénarios 1–8 de [quickstart.md](./quickstart.md) dans les deux thèmes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : aucune dépendance — démarre immédiatement.
- **Foundational (Phase 2)** : dépend de Setup — **bloque tous les récits**.
- **US1 / US2 (P1)** : après Foundational. Forment ensemble le MVP (couple connexion / refus).
- **US3 / US4 (P2)** : après Foundational ; s'appuient sur la route et la page de US1.
- **US5 (P3)** : après Foundational ; s'appuie sur `exigerCompte` (T009) et la config (T002).
- **Polish (Phase 8)** : après les récits visés.

### Dépendances inter-récits notables

- US2 T023 dépend de US1 (T018, T019) — validation du `retour`.
- US3 T027 dépend de US1 T018 et de T026 — intégration de la limitation de débit.
- US3 T028 dépend de US1 T019 — rendu d'erreur.
- US4 T031 dépend de US2 T022 et de T030.
- US4 T029 (refus après déconnexion via l'historique) vérifie US2 T021a (`no-store` sur `/admin`).

### Within a story

- Tests d'abord (échouent avant implémentation), puis service → route → page.
- Modèles/utils avant services ; services avant routes ; routes avant pages.

### Parallel Opportunities

- Setup : T003, T004, T005 en parallèle (après T001/T002 pour les types).
- Foundational : T009, T010, T011, T012 en parallèle (fichiers distincts) après T006/T007/T008.
- US1 : T014, T015 en parallèle ; T017 en parallèle de la page.
- Entre récits : une fois la fondation posée, US3/US4/US5 avancent en parallèle par des mains différentes, sauf les dépendances inter-récits ci-dessus.

---

## Parallel Example: Foundational

```bash
# Après T006/T007/T008 (schéma + service), lancer en parallèle :
Task: "Créer server/utils/session.ts exigerCompte"            # T009
Task: "Créer app/layouts/nu.vue"                              # T010
Task: "Étendre AppField.vue (type/autocomplete)"             # T011
Task: "Étendre AppButton.vue (type submit)"                  # T012
```

---

## Implementation Strategy

### MVP (les deux récits P1)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 US1 (connexion fonctionnelle, session persistante).
3. Phase 4 US2 (refus par défaut, retour validé).
4. **STOP et VALIDER** : « qui n'est pas connecté ne voit pas l'admin, qui l'est y accède ».

### Livraison incrémentale

1. Fondation prête.
2. US1 + US2 → MVP (boucle vérifiable minimale) → démo.
3. US3 → indistinction prouvée + limitation de débit → démo.
4. US4 → déconnexion referme l'accès → démo.
5. US5 → persistance/expiration + révocation → démo.
6. Polish → a11y deux thèmes, `verifier`, `typecheck`, quickstart.

---

## Notes

- [P] = fichiers différents, aucune dépendance sur une tâche incomplète.
- Le service `comptes.ts` et le hachage argon2id **préexistent** : T008 les **étend** (rôle, normalisation, leurre de temps), sans réécriture.
- Aucune table `Session` : la session est un cookie scellé (T002) ; l'expiration est le `maxAge` du cookie, la révocation est `exigerCompte` (T009).
- Portabilité : seul ajout en base = `Compte.role` (texte). Rien d'autre n'est persisté (rate-limit en mémoire).
- Commit après chaque tâche ou groupe logique ; s'arrêter à un checkpoint pour valider un récit isolément.

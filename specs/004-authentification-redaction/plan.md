# Implementation Plan: Authentification de la rédaction

**Branch**: `004-authentification-redaction` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-authentification-redaction/spec.md`

## Summary

Établir la frontière connecté / non connecté du site : une **page de connexion** fidèle à
`docs/design/html/connexion.html`, une **session par cookie scellé** (nuxt-auth-utils, terme
absolu 30 jours), un **refus par défaut** de toute adresse et de toute route serveur
d'administration, une **déconnexion**, et le **provisionnement du compte de rédaction par le
seed** (empreinte argon2id, mot de passe d'amorçage fourni par variable d'environnement au
moment du seed uniquement).

L'approche s'appuie sur ce que le socle fournit déjà : le modèle `Compte`
(`identifiant @unique`, `motDePasseHache`), le service `comptes.ts` (hachage **argon2id**,
`verifierMotDePasse` renvoyant un booléen **indistinct** compte-inconnu / mot-de-passe-faux),
la validation Zod (`valider` / `ErreurValidation`), les composants `AppField` / `AppButton`,
le mot-symbole `public/brand/{NOIR,BLANC}.png`, et le harnais SQLite de test. Elle **ajoute**
le strict nécessaire : le module `nuxt-auth-utils` et son secret de session, un champ
`role` additif sur `Compte`, l'amorçage d'un compte au seed, la page de connexion (layout
autonome, sans navigation), deux routes serveur d'écriture (connexion / déconnexion — les
**premières** du projet), un **garde serveur** réutilisable (`exigerCompte`), un **middleware
de route** qui refuse le préfixe `/admin` par défaut, une **limitation de débit par IP** en
mémoire sur la connexion, et une **page d'atterrissage `/admin` minimale** (pas un outil
d'édition — la destination après connexion et l'emplacement de la déconnexion, seam du
back-office à venir).

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js LTS (ESM, `"type": "module"`).

**Primary Dependencies**: Nuxt 4.4 (SSR, Nitro preset node-server), **nuxt-auth-utils 0.5.29**
(session par cookie scellé via `jose`, `setUserSession` / `requireUserSession` /
`useUserSession`), **argon2 0.45** (déjà présent, argon2id), Prisma 7.8 +
`@prisma/adapter-better-sqlite3`, Zod 4.4, Tailwind v4, `@nuxtjs/color-mode`
(`classSuffix: ''`). Pas de TipTap ni de `sanitize-html` dans cette feature (aucun HTML
d'éditeur produit).

**Storage**: SQLite via l'adaptateur Prisma. La **session n'est pas une table** : elle vit
dans un **cookie scellé** (chiffré+signé par `NUXT_SESSION_PASSWORD`). La base ne gagne
qu'un champ texte `Compte.role`. Aucun média, aucune URL — l'interface `Storage` n'est pas
sollicitée.

**Testing**: Vitest (services et utils purs, base SQLite éphémère via `tests/unit/harnais.ts`
— `comptes.test.ts` couvre déjà le hachage/indistinction ; à compléter : normalisation
d'identifiant, garde, limitation de débit, seed du compte), Playwright + `@axe-core/playwright`
(parcours connexion → /admin → déconnexion, refus non authentifié, deux thèmes, a11y),
`npm run verifier` (sobriété + portabilité), `npm run typecheck`.

**Target Platform**: Serveur node-server (Nitro), navigateurs modernes, du mobile (≈390 px)
au grand écran, en clair et en sombre.

**Project Type**: Application web SSR (Nuxt) — un seul projet, `app/` (client) + `server/`
(Nitro) + `shared/` (pur).

**Performance Goals**: Lighthouse ≥ 90 (a11y / SEO / perf) sur la page de connexion. Thème
appliqué avant première peinture (aucun flash), argon2id à coût par défaut (vérification en
dizaines de ms, sans révéler par le temps la cause de l'échec — cf. research).

**Constraints**: Cookie **httpOnly, secure, SameSite=Strict**, terme **absolu 30 jours** ;
mot de passe **jamais en clair** (ni en base, ni en journal, ni dans l'URL, ni réaffiché) ;
message d'échec **unique et indistinct** ; **refus par défaut** de `/admin/**` et des routes
serveur d'administration ; limitation de débit par IP sur la connexion ; sobriété (rayon 0,
sans ombre ni dégradé) ; contrastes AA dans les deux thèmes ; aucun défilement horizontal à
375 px ; français partout.

**Scale/Scope**: 1 page de connexion, 1 page `/admin` d'atterrissage minimale, 1 layout
autonome, 2 routes serveur d'écriture (connexion / déconnexion), 1 middleware de route,
2 utils serveur (garde de session, limitation de débit), 1 delta de schéma (`role`),
1 amorçage de compte au seed. Un seul rôle au MVP.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Portes dérivées de `.specify/memory/constitution.md` v1.2.0.

| # | Porte | Principe | Statut |
|---|---|---|---|
| 1 | Aucun `border-radius` non nul, aucune `box-shadow`, aucun `gradient` | I | **OK** — la page de connexion hérite des tokens ; filets à 0, bouton plein sans ombre. `connexion.html` ne porte aucune de ces propriétés. Contrôlé par `verifier`. |
| 2 | Composant Card unique ; toute variante déclarée dans le composant | I | **N/A** — la connexion et l'atterrissage `/admin` n'emploient aucune Card (écran de formulaire centré, puis page texte minimale). Aucune Card introduite ni modifiée. |
| 3 | Coupe à 3,5° limitée au mot-symbole et au filet de séparation | I | **OK** — seul porteur présent sur la connexion : le mot-symbole `public/brand/*`. Aucune coupe ajoutée. |
| 4 | Chaque occurrence d'accent traçable à `docs/design/html/` ; jamais en fond | III | **OK** — les seuls accents sont ceux de `connexion.html` : filet de champ **au focus** (2 px accent), survol du bouton (fond → accent, seule exception constatée admise sur un bouton par la maquette), `::selection`. Aucun accent inventé ; le rouge d'erreur est hors palette (principe III) et réservé au filet/message d'échec, conforme à la maquette. |
| 5 | Clair + sombre sur chaque écran ; suit l'OS ; choix persistant ; aucun flash | IV | **OK** — mécanisme de thème posé par Fondations (`color-mode`, classe `dark`, sans transition). La connexion et `/admin` passent par les tokens (`bg-paper text-ink`), aucun `dark:` sur les couleurs. Le mot-symbole bascule en CSS (`dark:hidden`/`dark:block`), sans flash. |
| 6 | Contraste AA vérifié **dans les deux thèmes**, accent mesuré deux fois | IV | **OK** — couples réutilisés du socle (ink/paper, muted, accent `#1F35FF`/`#8A97FF`, erreur `#C81E1E`/`#FF6B6B`). Contrôle e2e a11y (axe) sur connexion, dans les deux thèmes. |
| 7 | Aucun défilement horizontal à 375 px | V | **OK** — écran centré `max-width: 400px` + gouttière ; pas de rail. Test e2e : `scrollWidth ≤ clientWidth` à 375 px. |
| 8 | Focus visible partout ; `prefers-reduced-motion` ; `aria-current` juste ; `alt` réel | VIII | **OK** — la maquette pose `outline:none` (défaut VIII) : on rétablit un **repère de focus visible** sur champs, bouton et mot-symbole (repère 2 px du socle + filet accent du champ). Message d'erreur annoncé (`role="alert"`/`aria-describedby`), non porté par la seule couleur. `alt` réel sur le mot-symbole. Aucune animation ajoutée. |
| 9 | Aucune URL de média en base ; accès stockage via l'interface Storage seule | VI | **N/A (respecté par construction)** — cette feature ne touche ni média ni stockage. Aucun accès disque hors interface, car aucun accès du tout. |
| 10 | Schéma sans enum de base, sans JSON, sans liste scalaire, sans auto-increment | VI | **OK** — seul ajout : `Compte.role String @default("redaction")`. **Texte**, validé par Zod (`ROLES`), pas un enum de base. Aucune table `Session` (cookie scellé). `id` en `cuid()`. Migration additive. |
| 11 | HTML d'éditeur assaini côté serveur sur liste blanche avant stockage | VII | **N/A** — aucun HTML d'éditeur produit ni stocké dans cette feature. |
| 12 | Routes d'administration refusées par défaut sans authentification | VII | **OK — cœur de la feature.** Middleware de route refusant `/admin/**` par défaut (redirection vers `/connexion`) **et** garde serveur `exigerCompte(event)` sur toute route serveur d'administration (401 par défaut, autorisation explicite route par route). La page `/admin` d'atterrissage sert de preuve vérifiable. `requireUserSession` ne suffit pas seul : `exigerCompte` revérifie l'existence du compte (FR-016). |
| 13 | Interface et contenus en français, diacritiques corrects | VIII | **OK** — libellés (« Connexion », « E-mail », « Mot de passe », « Se connecter », « Se déconnecter »), message d'échec, messages Zod : français, diacritiques respectés. |

**Verdict** : aucune porte en écart. La section « Complexity Tracking » reste vide.

**Valeurs visuelles** : `docs/design/html/tokens.md` fait foi. **Structure d'écran et
emplacements de l'accent** : `docs/design/html/connexion.html` fait foi. La page `/admin`
d'atterrissage est un **écran non maquetté** : elle reste strictement textuelle et sobre,
**sans usage d'accent de sa propre initiative** (principe III) ; en cas de besoin d'accent à
la construction du back-office, la clause de consultation s'appliquera.

## Project Structure

### Documentation (this feature)

```text
specs/004-authentification-redaction/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — décisions techniques
├── data-model.md        # Phase 1 — modèle Compte (delta) + forme de la session (cookie)
├── quickstart.md        # Phase 1 — guide de validation exécutable
├── contracts/           # Phase 1 — contrats
│   ├── routes-serveur.md    # POST connexion / POST déconnexion / lecture de session
│   └── garde-et-middleware.md  # exigerCompte, middleware /admin, limitation de débit
└── tasks.md             # Phase 2 (/speckit-tasks — NON créé ici)
```

### Source Code (repository root)

```text
app/
├── pages/
│   ├── connexion.vue              # Page de connexion (US1/US3) — layout autonome
│   └── admin/
│       └── index.vue              # Atterrissage /admin minimal (US2/US4) — protégé
├── layouts/
│   └── nu.vue                     # Layout sans navigation (écran centré) pour la connexion
├── middleware/
│   └── admin.global.ts            # Refus par défaut du préfixe /admin (redirige vers /connexion)
└── components/
    └── ui/                        # Réutilisés : AppField (étendu type/autocomplete), AppButton (type submit)

server/
├── api/
│   └── auth/
│       ├── connexion.post.ts      # Vérifie identifiants + rate-limit → setUserSession (US1/US3)
│       └── deconnexion.post.ts    # clearUserSession (US4)
├── services/
│   └── comptes.ts                 # + normalisation casse/espaces (FR-018) ; role dans ComptePublic
└── utils/
    ├── session.ts                 # exigerCompte(event) : requireUserSession + revérif compte (FR-016)
    └── limiteDebit.ts             # Fenêtre glissante par IP, en mémoire (FR-011a)

shared/
├── types/
│   └── session.d.ts               # Augmente #auth-utils : forme du User de session
└── utils/
    └── roles.ts                   # ROLES + type Role + schéma Zod (source unique)

prisma/
├── schema.prisma                  # + Compte.role String @default("redaction")
├── migrations/…                   # Migration additive
└── seed.ts                        # + semerLeCompte() : upsert sur identifiant, hache l'amorçage

tests/
├── unit/
│   ├── comptes.test.ts            # + normalisation d'identifiant (casse/espaces)
│   ├── session.test.ts            # exigerCompte : refus sans session, refus si compte disparu
│   ├── limiteDebit.test.ts        # seuil, fenêtre glissante, refus temporaire
│   └── seed.test.ts               # + le seed crée le compte de rédaction (empreinte, pas de clair)
└── e2e/
    └── connexion.spec.ts          # refus /admin → /connexion ; connexion → /admin ; déconnexion → refus ; deux thèmes ; a11y

nuxt.config.ts                     # + module nuxt-auth-utils ; runtimeConfig.session (maxAge, cookie strict)
.env.example                       # + NUXT_SESSION_PASSWORD, COMPTE_REDACTION_* (amorçage seed)
```

**Structure Decision**: Un seul projet Nuxt, découpage `app/` / `server/` / `shared/` déjà
en place. La feature ajoute : une **page de connexion** et une **page `/admin`
d'atterrissage** (`app/pages/`), un **layout autonome** `nu.vue` (la connexion n'a pas de
navigation — FR-002), un **middleware de route** de refus par défaut (`app/middleware/`),
deux **routes serveur d'écriture** (`server/api/auth/`), un **garde serveur** et une
**limitation de débit** (`server/utils/`), une **source unique de rôles** (`shared/utils/`)
et une **augmentation de type de session** (`shared/types/`), un **delta de schéma minimal**
(`role`) et l'**amorçage du compte** au seed. Le service `comptes.ts` existant est **étendu**
(normalisation d'identifiant, exposition du rôle), non réécrit ; aucun composant de
Fondations n'est modifié au-delà de l'ajout de props rétrocompatibles à `AppField`/`AppButton`.

## Complexity Tracking

> Aucune violation de la Constitution à justifier. Section volontairement vide.

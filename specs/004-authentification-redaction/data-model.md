# Data Model — Authentification de la rédaction (Phase 1)

Portée : un **delta de schéma minimal** sur `Compte`, la **forme de la session** (portée par
un cookie, pas une table), et les **schémas de validation** de la connexion. Conforme au
principe VI : texte pour le rôle (pas d'enum de base), aucun JSON, aucune liste scalaire,
aucun auto-increment, `cuid()` pour l'identité, **aucune table `Session`**.

---

## 1. `Compte` — delta additif

Modèle **existant** (rappel), déjà porteur de l'identité et de l'empreinte :

```prisma
model Compte {
  id              String   @id @default(cuid())
  identifiant     String   @unique   // adresse e-mail, stockée normalisée (trim + minuscule)
  motDePasseHache String              // empreinte argon2id ; jamais retournée par une lecture exposée
  nomAffichable   String
  creeLe          DateTime @default(now())
}
```

**Ajout** de cette feature — un seul champ :

```prisma
  role            String   @default("redaction")   // texte validé par Zod (ROLES) ; pas un enum de base
```

- **`role`** : rôle du compte. Un seul rôle au MVP (`"redaction"`) ; le champ existe pour ne
  pas re-migrer plus tard, **sans** sur-conception (aucune table de rôles, aucune permission
  fine dans ce périmètre). Validé par `shared/utils/roles.ts` (`ROLES = ['redaction']`).
- **Migration** : additive, colonne texte avec valeur par défaut → sûre sur les lignes
  existantes, portable SQLite ↔ PostgreSQL. Créée par `npx prisma migrate dev`.
- **Invariants inchangés** : `identifiant` reste `@unique` (sur la forme **normalisée**, cf.
  research D4) ; `motDePasseHache` n'est **jamais** exposé par une lecture (le type
  `ComptePublic` l'exclut).

### Type exposé `ComptePublic` (déjà défini dans `server/services/comptes.ts`)

`{ id, identifiant, nomAffichable, creeLe }` → **ajouter `role`**. Toujours **sans**
`motDePasseHache`. Ce type gagne à être remonté dans `shared/types/` s'il doit être partagé
app ↔ serveur ; a minima le service l'exporte pour la session.

---

## 2. Session — portée par un cookie scellé (aucune entité en base)

La « Session » de la spec **n'est pas une table**. C'est un **cookie scellé** géré par
nuxt-auth-utils (chiffré + signé, `NUXT_SESSION_PASSWORD`). Contenu applicatif (le `user`),
minimal et non secret :

| Champ | Type | Rôle |
|---|---|---|
| `id` | `string` | Identifiant du compte (`cuid`). |
| `identifiant` | `string` | Adresse e-mail normalisée ; clé de revérification d'existence (FR-016). |
| `nomAffichable` | `string` | Pour un futur affichage back-office. |
| `role` | `string` | Rôle (`"redaction"` au MVP). |

- **Aucun secret** dans le cookie (pas d'empreinte, pas de mot de passe).
- **Terme** : géré par le cookie (`maxAge` = 30 jours **absolus**, cf. research D2) — pas de
  champ d'expiration applicatif à maintenir.
- **Révocation** : obtenue par la revérification d'existence du compte à chaque accès protégé
  (`exigerCompte`, FR-016), non par un registre de sessions.

**Augmentation de type** (`shared/types/session.d.ts`) : déclarer l'interface `User` du module
`#auth-utils` avec les quatre champs ci-dessus, pour typer `setUserSession` / `useUserSession`.

```ts
// shared/types/session.d.ts (forme)
declare module '#auth-utils' {
  interface User {
    id: string
    identifiant: string
    nomAffichable: string
    role: string
  }
  interface UserSession { /* vide : pas de données de session hors user */ }
}
export {}
```

---

## 3. Rôles — source unique `shared/utils/roles.ts`

```ts
// forme
export const ROLES = ['redaction'] as const
export type Role = (typeof ROLES)[number]
export const ROLE_PAR_DEFAUT: Role = 'redaction'
// schéma Zod : z.enum(ROLES) — enum applicatif Zod, jamais un enum porté par la base
```

Importée par le seed (valeur écrite), le service `comptes.ts` (validation) et, au besoin, le
back-office ultérieur. **Un seul** endroit déclare les rôles.

---

## 4. Schémas de validation Zod (connexion)

Style du projet : messages **en français**, via `valider(schema, donnees)` →
`ErreurValidation`. À ajouter (p. ex. dans `server/validation/auth.ts` ou près de la route) :

- **`schemaConnexion`** : `{ identifiant: string, motDePasse: string }`.
  - `identifiant` : `z.string().trim().min(1, 'L'identifiant est requis.')` (normalisation
    casse/espaces appliquée côté service avant comparaison — D4). **Pas** de contrainte de
    format e-mail bloquante (FR : la validité formelle n'est pas un critère d'admission ; un
    identifiant mal formé aboutit au **même** échec générique, pas à un message distinct).
  - `motDePasse` : `z.string().min(1, 'Le mot de passe est requis.')`. **Pas** de borne haute
    de longueur qui révélerait une politique ; la borne ≥ 12 du schéma de **création** ne
    s'applique **pas** à la connexion (un ancien mot de passe plus court doit pouvoir se
    vérifier ; et surtout, toute erreur de saisie retombe sur le message générique unique).
- **Échec de validation** (champ vide/malformé) : traduit en **message d'échec générique
  unique** côté route (jamais le détail Zod par champ), pour ne pas distinguer les causes
  (FR-009/FR-011).

> Nuance importante : la validation Zod sert à **structurer** l'entrée (présence des champs),
> pas à **renseigner l'utilisateur** sur la cause de l'échec d'authentification. Les messages
> Zud par champ restent internes ; l'utilisateur ne voit que le message unique.

---

## 5. Provisionnement (seed) — invariants

- `semerLeCompte()` : `upsert` sur `identifiant` **normalisé** ; `create`/`update` posent
  `motDePasseHache = argon2id(amorçage)`, `nomAffichable`, `role = ROLE_PAR_DEFAUT`.
- **Rejouable** : un second passage ne crée pas de doublon et ne régénère pas d'identité.
- **Aucun mot de passe en clair** persisté ni journalisé ; l'amorçage vient d'une variable
  d'environnement présente au seed uniquement (research D7). Sans variable → compte **non**
  créé + avertissement (jamais de mot de passe par défaut).

---

## Récapitulatif du delta

| Élément | Nature | Portabilité |
|---|---|---|
| `Compte.role String @default("redaction")` | Migration additive | ✅ texte, pas d'enum de base |
| Session | Cookie scellé | ✅ aucune table, aucun état en base |
| `shared/utils/roles.ts` | Source unique de rôles | ✅ enum Zod applicatif |
| `schemaConnexion` (Zod) | Validation d'entrée | ✅ pur, sans base |
| `semerLeCompte()` | Amorçage rejouable | ✅ empreinte en base, secret hors runtime |

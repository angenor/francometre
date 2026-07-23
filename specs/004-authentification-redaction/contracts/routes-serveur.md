# Contrat — Routes serveur d'authentification

Les **premières routes d'écriture** du projet. Toutes valident leur entrée par Zod
(`valider`), renvoient des messages **en français**, et n'exposent **jamais** de mot de passe
ni ne distinguent les causes d'échec d'authentification.

Format de réponse d'erreur : celui du projet (`createError({ statusCode, statusMessage })`,
message français). Le corps de succès est volontairement minimal (la source de vérité de
l'état connecté est le cookie, relu côté client par `useUserSession`).

---

## `POST /api/auth/connexion`

**Fichier** : `server/api/auth/connexion.post.ts`

**Entrée** (`readBody`, validée par `schemaConnexion`) :

```jsonc
{ "identifiant": "prenom@exemple.fr", "motDePasse": "………" }
```

**Déroulé.**
1. **Limitation de débit** (`limiteDebit`) par IP (`getRequestIP(event, { xForwardedFor:
   true })`). Au-delà du seuil dans la fenêtre → **429**, message générique (ci-dessous).
2. `valider(schemaConnexion, body)` — présence des deux champs. Échec de validation →
   traité comme échec d'authentification générique (**401**), **pas** de détail par champ.
3. `verifierMotDePasse(identifiant, motDePasse)` (service `comptes.ts`, identifiant
   **normalisé** trim+minuscule ; `argon2.verify` leurre si compte inconnu — égalisation du
   temps, research D3).
4. **Échec** (inconnu / faux / champ vide) → **401** `{ message: "E-mail ou mot de passe
   incorrect." }`. Identique dans tous les cas.
5. **Succès** → charger `ComptePublic` (avec `role`), `setUserSession(event, { user: { id,
   identifiant, nomAffichable, role } })`, réponse **200** `{ ok: true }`.

**Réponses.**

| Statut | Quand | Corps |
|---|---|---|
| 200 | Identifiants valides | `{ "ok": true }` |
| 401 | Identifiant inconnu, mot de passe faux, ou champ manquant | `{ "message": "E-mail ou mot de passe incorrect." }` |
| 429 | Débit dépassé pour l'IP | `{ "message": "E-mail ou mot de passe incorrect." }` (aucune révélation ; un en-tête `Retry-After` peut accompagner) |

**Invariants.**
- Message **identique** pour 401 et 429 (aucune distinction de cause — FR-009/FR-011/FR-011a).
- Aucune donnée de compte dans la réponse d'échec ; aucun mot de passe nulle part.
- Cookie posé : `httpOnly`, `secure`, `SameSite=Strict`, `maxAge` 30 j **absolus**.

---

## `POST /api/auth/deconnexion`

**Fichier** : `server/api/auth/deconnexion.post.ts`

**Entrée** : aucune (le cookie identifie la session). Idempotente.

**Déroulé.** `clearUserSession(event)` → **200** `{ ok: true }`. Appelée deux fois de suite :
toujours **200**, sans erreur (FR — double déconnexion sans état incohérent).

| Statut | Quand | Corps |
|---|---|---|
| 200 | Toujours (session présente ou non) | `{ "ok": true }` |

---

## Lecture de l'état de session (fournie par le module)

Pas de route à écrire : nuxt-auth-utils expose `GET /api/_auth/session` et le composable
`useUserSession()` (`loggedIn`, `user`, `clear`, `fetch`). Le client s'en sert pour :
- rediriger la page `connexion.vue` vers `/admin` si déjà connecté (FR-008) ;
- alimenter le middleware `admin.global.ts` (refus par défaut) ;
- afficher/masquer la déconnexion sur `/admin`.

Le `user` exposé ne contient que `{ id, identifiant, nomAffichable, role }` — **aucun secret**.

---

## Routes serveur d'administration (à venir) — règle de contrat

Toute future route serveur sous l'administration **doit** appeler `exigerCompte(event)` en
première ligne (garde serveur, cf. `contracts/garde-et-middleware.md`). **Refus par défaut** :
une route d'administration sans cet appel est un défaut de sécurité, pas une route « publique
par oubli ». Cette feature n'ajoute aucune route d'administration métier (elle en pose la
règle et la page `/admin` d'atterrissage, qui lit la session côté page).

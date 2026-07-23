# Contrat — Garde serveur, middleware de route, limitation de débit

Défense en profondeur, **refus par défaut** (principe VII, porte 12). Deux barrières
indépendantes (route côté pages, garde côté serveur) plus une limitation de débit sur la
connexion.

---

## `exigerCompte(event)` — garde serveur

**Fichier** : `server/utils/session.ts`

**Signature** : `exigerCompte(event): Promise<SessionUser>` (lève sinon).

**Contrat.**
1. `const session = await requireUserSession(event)` — si pas de session valide (cookie
   absent/altéré/expiré), le module lève **401** ; on ne le rattrape pas.
2. Revérifier l'existence du compte : `compteParIdentifiant(session.user.identifiant)`. Si
   **null** (compte supprimé/renommé) → `clearUserSession(event)` puis
   `createError({ statusCode: 401 })`. (FR-016.)
3. Retourner le `user` de session (avec `role`).

**Emploi.** Première ligne de **toute** route serveur d'administration. Aucune route
d'administration ne s'exécute sans cet appel (autorisation explicite route par route).

**À tester** (`tests/unit/session.test.ts`) : refus sans session ; refus si le compte a
disparu entre l'ouverture de session et la requête ; succès si compte présent.

---

## `admin.global.ts` — middleware de route (pages)

**Fichier** : `app/middleware/admin.global.ts` (global, s'exécute SSR + client).

**Contrat.**
- Ne s'active que si `to.path === '/admin' || to.path.startsWith('/admin/')`.
- `const { loggedIn } = useUserSession()`.
- Si **non connecté** → `return navigateTo('/connexion?retour=' +
  encodeURIComponent(to.fullPath))`.
- Si connecté → laisser passer.

**Propriétés.**
- **Refus par défaut par préfixe** : toute page `/admin/*` future est protégée **sans opt-in**
  (le refus ne se déduit pas d'une absence d'interdiction — principe VII).
- Barrière d'**affichage** seulement ; la sécurité réelle des données tient au garde serveur.
- Le paramètre `retour` est **reconsommé** par la page de connexion, après **validation**
  stricte (chemin interne : commence par `/`, pas par `//`).

**Page de connexion — sens inverse (FR-008).** `connexion.vue` :
`definePageMeta({ layout: 'nu' })` + garde : si `loggedIn`, `navigateTo('/admin')` (ne pas
revoir le formulaire).

---

## `limiteDebit` — fenêtre glissante par IP

**Fichier** : `server/utils/limiteDebit.ts`

**Signature** : `enregistrerEtVerifier(cle: string): { autorise: boolean; reste: number }`
(ou `verifier`/`incrementer` séparés). `cle` = adresse IP.

**Contrat.**
- État **en mémoire** : `Map<string, number[]>` (horodatages des tentatives). Purge des
  horodatages hors fenêtre à chaque appel.
- Fenêtre **15 min**, seuil **~10 tentatives / IP** (réglages, pas contrat).
- Au-delà du seuil → `autorise: false` ; la route répond **429** avec le **message
  générique** (aucune révélation).
- **Horodatage** : injecté par l'appelant/`Date.now()` au runtime serveur (les utils de test
  passent un temps contrôlé pour tester la fenêtre glissante de façon déterministe).

**Limites assumées** (à `log` au démarrage ou documenter) : état **par instance**, **remis à
zéro au redémarrage**, dépend de la transmission correcte de l'IP client. Suffisant pour le
déploiement mono-instance node-server ; à remplacer par un compteur partagé si multi-instance.
Rien n'est persisté en base (portabilité intacte).

**À tester** (`tests/unit/limiteDebit.test.ts`) : sous le seuil → autorisé ; au seuil →
refusé ; après glissement de la fenêtre → de nouveau autorisé ; IP distinctes indépendantes.

---

## Configuration attendue (nuxt.config.ts / env)

- `modules: [..., 'nuxt-auth-utils']`.
- `runtimeConfig.session` : `maxAge` = 2 592 000 (30 j), `cookie: { httpOnly: true, secure:
  true, sameSite: 'strict' }`, `name` explicite. Secret via **`NUXT_SESSION_PASSWORD`**
  (≥ 32 caractères), jamais commité.
- `.env.example` documente (sans valeurs réelles) : `NUXT_SESSION_PASSWORD`,
  `COMPTE_REDACTION_IDENTIFIANT`, `COMPTE_REDACTION_NOM`, `COMPTE_REDACTION_MOT_DE_PASSE`
  (amorçage du seed, présent au seed uniquement).

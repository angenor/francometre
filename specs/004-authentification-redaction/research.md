# Research — Authentification de la rédaction (Phase 0)

Décisions techniques résolvant les inconnues du plan. Format par point : **Décision /
Rationale / Alternatives écartées**. Les versions ont été vérifiées (`npm view`), non
tirées de mémoire, conformément au CLAUDE.md.

---

## D1 — Brique de session : nuxt-auth-utils, cookie scellé (pas de table)

**Décision.** Employer **`nuxt-auth-utils@0.5.29`** (dernière stable ; dépend de
`@nuxt/kit ^4.3.1` → compatible Nuxt 4.4). La session est un **cookie scellé** (chiffré et
signé via `jose`, secret `NUXT_SESSION_PASSWORD` ≥ 32 caractères). Primitives serveur :
`setUserSession(event, { user })`, `getUserSession(event)`, `requireUserSession(event)`,
`clearUserSession(event)` ; composable client `useUserSession()` (`loggedIn`, `user`,
`clear`, `fetch`). **Aucune table `Session`** : l'entité « Session » de la spec est portée
par le cookie. La forme de `user` est augmentée par déclaration de type (`#auth-utils`).

**Rationale.** Le CLAUDE.md fixe déjà « Auth = nuxt-auth-utils, cookie de session signé ».
Un cookie scellé sans état serveur évite une table (donc aucune contrainte de portabilité
supplémentaire — principe VI), et se prête au terme absolu 30 jours par la durée de vie du
cookie. Les peerDeps du paquet (webauthn, atproto, openid) sont **optionnels** : le cœur
session n'en installe rien de fonctionnel.

**Alternatives écartées.**
- *Table `Session` en base* : ajoute une entité et un nettoyage des sessions expirées, sans
  bénéfice ici (un seul serveur, révocation obtenue autrement — voir D5). Contraire à la
  sobriété du schéma.
- *JWT maison / lucia-auth / sidebase* : réinventer ou introduire une brique non retenue par
  la constitution documentaire ; nuxt-auth-utils est le choix acté.

---

## D2 — Cookie : httpOnly, secure, SameSite=Strict, terme absolu 30 jours

**Décision.** Configurer la session dans `nuxt.config.ts` via `runtimeConfig.session` :
`maxAge` = **2 592 000 s (30 jours)**, `cookie: { httpOnly: true, secure: true,
sameSite: 'strict' }`, `name` explicite (p. ex. `fm_session`). Le secret vient de
`NUXT_SESSION_PASSWORD` (jamais commité ; `.env.example` documente un exemple). Le `maxAge`
donne un **terme absolu** : il est posé à la connexion et **n'est pas repoussé** par
l'activité (conforme à la clarification « durée absolue 30 jours »).

**Rationale.** `httpOnly` soustrait le cookie au JS (anti-XSS d'exfiltration) ; `secure`
impose HTTPS ; `SameSite=Strict` neutralise l'envoi cross-site du cookie (défense CSRF de
premier ordre pour un back-office qui n'a aucun flux cross-site légitime). Le terme absolu
est le plus simple à tester (un seul instant d'expiration déterministe) et correspond au
comportement natif du cookie `maxAge`.

**Point de vérification à l'implémentation.** Confirmer que nuxt-auth-utils **ne rafraîchit
pas** l'échéance à chaque requête avec cette configuration (terme absolu voulu, pas glissant).
Le nom exact des options (`session.maxAge` vs `session.cookie.maxAge`) est fixé au code selon
la version installée ; l'intention prime : cookie strict + 30 j absolus.

**Alternatives écartées.** `SameSite=Lax` (défaut du module) : inutilement permissif ici.
Inactivité glissante : écartée par la clarification.

---

## D3 — Hachage : argon2id, déjà en place ; indistinction préservée

**Décision.** Réutiliser **tel quel** `server/services/comptes.ts` : `argon2.hash(mdp,
{ type: argon2.argon2id })` au provisionnement, `argon2.verify(empreinte, mdp)` à la
connexion, via `verifierMotDePasse(identifiant, motDePasse): Promise<boolean>` qui renvoie
`false` **de façon identique** pour compte inconnu et pour mot de passe faux. Le mot de passe
n'est jamais retourné, ni journalisé, ni réaffiché.

**Rationale.** `argon2@0.45` est déjà installé et testé (`comptes.test.ts` prouve l'empreinte
`$argon2id$`, l'absence de fuite de l'empreinte, et l'indistinction). FR-009/FR-011 sont donc
satisfaits par construction au niveau service.

**Timing.** Pour un identifiant inconnu, aucun `argon2.verify` n'a lieu, ce qui crée un
**écart de temps** potentiellement observable (FR-011 vise aussi le canal temporel). Mesure
retenue : lorsque le compte est introuvable, exécuter un **`argon2.verify` leurre** contre une
empreinte fixe (ou un `hash` à vide) pour égaliser grossièrement le temps de réponse. À
implémenter dans `verifierMotDePasse` (ou son appelant) sans changer sa signature.

**Alternatives écartées.** bcrypt/scrypt : argon2id est l'état de l'art et déjà choisi.
Constante de temps parfaite : hors de portée réaliste ; le leurre argon2 suffit à retirer le
signal grossier « compte connu = plus lent ».

---

## D4 — Normalisation de l'identifiant (FR-018)

**Décision.** Comparer l'identifiant **sans casse ni espaces de bord** : normaliser par
`identifiant.trim().toLowerCase()` **au provisionnement** (création/seed) **et** à la
connexion, de sorte que la valeur stockée et la valeur comparée soient normalisées de la même
façon. `Compte.identifiant` reste `@unique` sur la forme normalisée.

**Rationale.** FR-018 exige qu'une différence typographique ne refuse pas un membre légitime.
Normaliser des deux côtés garantit l'égalité. L'adresse e-mail est traitée comme identifiant
opaque : la partie locale est en pratique insensible à la casse chez les fournisseurs visés,
et la normalisation évite les doublons « Jean@… » / « jean@… ».

**Point d'attention.** Le `comptes.ts` actuel `.trim()` mais **ne met pas en minuscule** ;
c'est l'écart à corriger. Le seed doit écrire l'identifiant **déjà normalisé** pour rester
cohérent avec la comparaison.

**Alternatives écartées.** Normalisation à la lecture seule (sans normaliser le stockage) :
laisserait passer des doublons de casse au provisionnement.

---

## D5 — Refus par défaut : middleware de route + garde serveur, et révocation (FR-016)

**Décision.** Défense en profondeur, refus par défaut :
1. **Middleware de route** `app/middleware/admin.global.ts` : sur toute navigation dont le
   chemin commence par `/admin`, si `useUserSession().loggedIn` est faux → `navigateTo('/
   connexion?retour=<chemin>')`. Global et fondé sur le **préfixe**, donc une page `/admin/*`
   est protégée **sans opt-in** (le refus ne se déduit pas d'une absence d'interdiction —
   principe VII). S'exécute au SSR comme au client.
2. **Garde serveur** `server/utils/session.ts` → `exigerCompte(event)` : appelle
   `requireUserSession(event)` (401 si pas de session valide) **puis revérifie que le compte
   existe encore** via `compteParIdentifiant(session.user.identifiant)` ; s'il a disparu,
   `clearUserSession` + 401. Toute route serveur d'administration **doit** l'appeler
   explicitement en première ligne.

**Rationale.** Le middleware de route protège l'**affichage** (UX + redirection SSR) ; le
garde serveur protège les **données/effets** — la seule barrière qui compte pour la sécurité,
un client pouvant contourner le middleware. La revérification du compte satisfait FR-016
(session dont le compte n'existe plus = non connecté à la première demande) et tient lieu de
révocation sans table de sessions : supprimer/désactiver un compte invalide ses cookies au
prochain accès protégé.

**Alternatives écartées.**
- *Server middleware Nitro global* (`server/middleware/`) qui garderait `/admin` et
  `/api/admin` : s'exécute sur **toutes** les requêtes (coût, risque de sur-blocage des routes
  publiques) ; on préfère un garde **explicite par route** (autorisation route par route,
  principe VII) doublé du middleware de route côté pages.
- *Se fier au seul cookie* : ne détecte pas un compte supprimé (échoue FR-016).

---

## D6 — Limitation de débit par IP (FR-011a)

**Décision.** `server/utils/limiteDebit.ts` : **fenêtre glissante en mémoire**, `Map<ip,
horodatages[]>`. À chaque tentative de connexion, purger les horodatages hors fenêtre, refuser
si le compte des tentatives dépasse le seuil. Valeurs de départ : **fenêtre 15 min, seuil ~10
tentatives par IP**, refus temporaire renvoyant **HTTP 429** avec un **message identique** au
message d'échec d'identifiants (aucune révélation de l'existence d'un compte — FR-011a). IP
lue via `getRequestIP(event, { xForwardedFor: true })`.

**Rationale.** Écarte la force brute grossière sans table ni dépendance. L'état en mémoire
n'est pas persisté : acceptable pour un déploiement **mono-instance** node-server (celui du
projet), et sans impact sur la portabilité du schéma (rien en base).

**Limites assumées (à `log`/documenter).** L'état est **par instance** et **remis à zéro au
redémarrage** ; derrière plusieurs instances ou un proxy mal configuré (IP client non
transmise), l'efficacité chute. Le seuil, la fenêtre et la durée du refus sont des **réglages**
ajustables ; ils ne changent pas le contrat FR-011a. Si le projet passe multi-instance, migrer
vers un compteur partagé (hors périmètre).

**Alternatives écartées.** Verrouillage de compte (écarté par la clarification : ouvre un déni
de service ciblé et suppose un déverrouillage non prévu). Dépendance externe de rate-limiting :
surdimensionnée pour un back-office à un compte.

---

## D7 — Provisionnement du compte : seed rejouable + amorçage par variable d'environnement

**Décision.** Ajouter `semerLeCompte()` à `prisma/seed.ts`, en **`upsert` sur `identifiant`
normalisé**. Le seed lit un **mot de passe d'amorçage** dans une variable d'environnement
(p. ex. `COMPTE_REDACTION_MOT_DE_PASSE`, avec `COMPTE_REDACTION_IDENTIFIANT` et
`COMPTE_REDACTION_NOM`), le **hache en argon2id** et n'écrit que l'**empreinte** en base. Le
mot de passe en clair ne quitte jamais la variable d'environnement (présente au moment du
seed uniquement), n'est jamais journalisé, jamais stocké.

**Rationale.** Concilie la clarification (« compte en base, argon2, via seed rejouable ; pas
de secret en configuration serveur ») et l'entrée de plan (« mot de passe fourni par variable
d'environnement ») : l'empreinte vit en base (portable), le **serveur en fonctionnement** ne
porte **aucun** secret de compte, et l'amorçage n'exige pas de secret en clair dans le dépôt.
`.env.example` documente les variables **sans valeur réelle**.

**Repli sans variable.** Si la variable d'amorçage est absente en développement, le seed
**saute** la création du compte en émettant un avertissement clair (il ne fabrique **pas** de
mot de passe par défaut, qui deviendrait un secret implicite). Un identifiant/nom par défaut
d'exemple peut être prévu, mais **jamais** un mot de passe par défaut.

**Alternatives écartées.** Compte entièrement défini par variables d'environnement au runtime
(Option B de la clarification) : disperse un secret dans la configuration du serveur, écarté.
Mot de passe d'amorçage en clair dans le seed : proscrit (principe Sécurité).

---

## D8 — Page de connexion : layout autonome, composants du styleguide étendus

**Décision.** `app/pages/connexion.vue` avec `definePageMeta({ layout: 'nu' })` — un layout
**`nu.vue`** sans `AppRail`/`AppTopbar`/`AppFooter` (FR-002 : « sans introduire de gabarit de
navigation »), reproduisant `.screen` (flex centré, `min-height:100dvh`, gouttière) de
`connexion.html`. Réutiliser :
- **`AppButton`** en variante `primaire` (bouton noir plein) — **étendre** pour accepter
  `type="submit"` (aujourd'hui figé `type="button"`).
- **`AppField`** pour les deux champs — **étendre** pour exposer `type` HTML
  (`email` / `password`) et `autocomplete` (`email` / `current-password`), qu'il ne porte pas
  encore. Sa gestion d'erreur (`aria-invalid`, `aria-describedby`, filet rouge) est réutilisée.
- **Mot-symbole** en ligne, `public/brand/NOIR.png` / `BLANC.png`, enveloppé d'un
  `NuxtLink to="/"` avec `alt` réel (les `wordmark-*.png` de la maquette n'existent pas).

**Erreur & accessibilité.** Un **message d'échec unique** (« E-mail ou mot de passe
incorrect. ») rendu dans un conteneur `role="alert"` (annonce au lecteur d'écran), en rouge
d'erreur **et** avec le filet des champs en état erreur (pas uniquement la couleur — FR-021).
Après échec : identifiant conservé, mot de passe vidé. La maquette pose `outline:none`
(défaut VIII) : on rétablit le repère de focus du socle sur champs, bouton et mot-symbole.

**Extensions de composants — compatibilité.** `type`/`autocomplete` sur `AppField` et
`type` sur `AppButton` sont des **props optionnelles à valeur par défaut inchangée** : aucun
emploi existant n'est affecté (rétrocompatible).

**Alternatives écartées.** `<input>` natifs sur la page sans passer par `AppField` :
dupliquerait le style de champ et sa gestion d'erreur (viole « composants du styleguide »).
Réécrire `AppField` en profondeur : inutile, l'ajout de props suffit.

---

## D9 — Flux de connexion, redirection de retour et « déjà connecté »

**Décision.**
- **Route** `POST /api/auth/connexion` : `readBody` → `valider(schemaConnexion, …)` (Zod :
  identifiant et mot de passe **présents**, longueurs raisonnables) → limitation de débit →
  `verifierMotDePasse` → succès : `setUserSession(event, { user })` et réponse succès ; échec
  (identifiant vide, mot de passe vide, inconnu, faux, ou 429) : **même** message d'échec
  générique, statut 401 (429 si débit dépassé), **sans** distinguer la cause.
- **Redirection de retour** : le paramètre `retour` (posé par le middleware) est **validé
  comme chemin interne** — il doit commencer par `/` et **pas** par `//` (sinon rejet vers
  `/admin`). Après connexion réussie, `navigateTo(retour ?? '/admin')` (FR-007 : jamais hors
  du site).
- **Déjà connecté** : la page `connexion.vue` redirige vers `/admin` si `loggedIn` (FR-008),
  via un middleware de page ou un garde `onMounted`/SSR.
- **Déconnexion** : `POST /api/auth/deconnexion` → `clearUserSession(event)` ; la page
  `/admin` porte le bouton « Se déconnecter » qui l'appelle puis `navigateTo('/connexion')`.

**Rationale.** Centralise l'indistinction des échecs sur la route serveur (un seul point),
protège contre l'`open redirect` (validation stricte du `retour`), et referme la boucle
vérifiable de la spec.

**Alternatives écartées.** Redirection de retour libre : vecteur d'open redirect, rejetée.
Distinguer 401/404 selon compte connu : fuite d'information, proscrite (FR-011).

# Quickstart — Valider l'authentification de la rédaction

Guide de validation **exécutable** prouvant la boucle vérifiable de la spec : « qui n'est pas
connecté ne voit pas l'administration, qui l'est y accède, se déconnecter la referme ».
Détails de conception dans [plan.md](./plan.md), [research.md](./research.md),
[data-model.md](./data-model.md) et [contracts/](./contracts/).

## Prérequis

- Dépendances installées : `nuxt-auth-utils` ajouté (`npm i nuxt-auth-utils`) et déclaré
  dans `nuxt.config.ts` (`modules`), `argon2` déjà présent.
- Variables d'environnement (fichier `.env`, **non commité** ; voir `.env.example`) :
  ```bash
  NUXT_SESSION_PASSWORD=<chaîne aléatoire ≥ 32 caractères>
  COMPTE_REDACTION_IDENTIFIANT=redaction@francometre.com
  COMPTE_REDACTION_NOM=Rédaction
  COMPTE_REDACTION_MOT_DE_PASSE=<mot de passe d'amorçage, ≥ 12 caractères>
  ```
- Migration appliquée (ajout de `Compte.role`) : `npx prisma migrate dev`.
- Compte semé : `npm run db:seed` (crée le compte de rédaction en `upsert`, empreinte
  argon2id ; **aucun** mot de passe en clair stocké).

## Lancer

```bash
npm run dev
```

## Scénarios de validation

### 1. Refus par défaut de l'administration (US2 / SC-001)

- Non connecté, ouvrir `/admin`.
- **Attendu** : redirection vers `/connexion` (avec `?retour=/admin`), **aucun** contenu
  d'administration affiché.
- Vérifier aussi une adresse plus profonde, p. ex. `/admin/quoi-que-ce-soit` → même
  redirection (refus **par préfixe**, sans opt-in).

### 2. Connexion réussie (US1 / SC-002)

- Sur `/connexion`, saisir `COMPTE_REDACTION_IDENTIFIANT` et `COMPTE_REDACTION_MOT_DE_PASSE`.
- **Attendu** : admission et arrivée sur `/admin` (ou sur le `retour` validé). Recharger
  `/admin` : l'accès **reste ouvert** (session persistée par le cookie).
- Vérifier la casse/les espaces (FR-018) : `  REDACTION@FRANCOMETRE.COM  ` avec le bon mot de
  passe → **admis** (identifiant normalisé).

### 3. Message d'échec unique et indistinct (US3 / SC-004)

- Soumettre un **identifiant inconnu** → message « E-mail ou mot de passe incorrect. ».
- Soumettre l'**identifiant connu** avec un **mauvais mot de passe** → **exactement le même**
  message.
- Laisser un champ **vide** → même message, aucune admission.
- **Attendu** : dans les trois cas, message identique, aucun champ désigné ; l'identifiant
  saisi est **conservé**, le champ mot de passe **vidé** ; filet + message en rouge d'erreur.
- Vérifier qu'aucune réponse ni journal ne contient le mot de passe (SC-005).

### 4. Déconnexion referme l'accès (US4 / SC-003)

- Connecté sur `/admin`, cliquer « Se déconnecter ».
- **Attendu** : retour à un état non connecté. Demander `/admin` → redirection vers
  `/connexion`. Utiliser « précédent » du navigateur vers `/admin` → **toujours** redirigé.

### 5. Déjà connecté (edge case FR-008)

- Connecté, ouvrir `/connexion` → mené directement à `/admin`, sans revoir le formulaire.

### 6. Compte disparu (FR-016)

- Connecté, supprimer le compte en base (`npx prisma studio` ou requête), puis demander une
  action/route protégée → traité comme **non connecté** (401 / redirection). Prouve la
  révocation sans table de sessions.

### 7. Limitation de débit (FR-011a)

- Répéter rapidement des tentatives échouées depuis la même IP au-delà du seuil.
- **Attendu** : réponses **429** au message **générique** (aucune révélation de l'existence
  d'un compte). Après glissement de la fenêtre, les tentatives sont de nouveau acceptées.

### 8. Identité visuelle & accessibilité (SC-007 / porte 8)

- La page `/connexion` reproduit `docs/design/html/connexion.html` : écran centré,
  mot-symbole (`public/brand/*`), titre « Connexion », champs « E-mail » / « Mot de passe »,
  bouton noir plein « Se connecter ».
- **Deux thèmes** : basculer clair/sombre, vérifier les couleurs (tokens, aucun `dark:` sur
  les couleurs) et l'absence de flash à l'ouverture (thème de l'OS respecté).
- **Focus visible** au clavier sur champs, bouton et mot-symbole (la maquette pose
  `outline:none` — corrigé). Message d'erreur annoncé (`role="alert"`), pas seulement coloré.
- **375 px** : aucun défilement horizontal.

## Contrôles automatisés

```bash
npm run test:unit     # comptes (normalisation), session (garde/FR-016), limiteDebit, seed (compte créé)
npm run test:e2e      # connexion.spec : refus → connexion → /admin → déconnexion → refus ; 2 thèmes ; axe a11y
npm run verifier      # sobriété (rayon 0, sans ombre/dégradé) + portabilité (schéma)
npm run typecheck
```

**Critère de clôture** : les huit scénarios manuels passent dans les deux thèmes, les suites
unitaires et e2e sont vertes, `verifier` et `typecheck` ne signalent rien, et aucune porte de
la Constitution n'est en écart (voir la grille du plan).

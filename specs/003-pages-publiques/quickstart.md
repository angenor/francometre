# Quickstart — Valider les Pages publiques

Guide de validation exécutable. Il prouve, de bout en bout, que la feature répond aux
critères de succès de `spec.md`. Il ne contient pas de code d'implémentation : les formes
sont dans `data-model.md` et `contracts/`.

## Prérequis

```bash
npm install
npx prisma migrate dev      # applique la migration couvertureLegende
npm run db:seed             # 8 rubriques + articles d'exemple (dont légendes)
```

> Rappel Prisma 7 : `migrate dev` ne joue PAS le seed ; lancer `db:seed` explicitement.
> Après un `reset`, la base est vide — rejouer le seed.

## Lancer

```bash
npm run dev                 # http://localhost:3000
```

## Scénarios de validation

### 1. Accueil — Une ordonnée 01→05 (SC-001, US1)

- Ouvrir `/`.
- **Attendu** : section « À la une » (eyebrow accent) ; héros marqué **01** avec image,
  titre, chapô ; puis vignettes **02**, **03**, **04**, **05** dans l'ordre du rang (numéros
  en accent). Sous la Une : « Les derniers articles » (grille + « Tout voir » → `/articles`) ;
  puis les sections Environnement, Économie, Culture, chacune avec « Tout voir ».
- **Eyebrow** : sur les cartes de l'accueil, le surtitre est la **rubrique** (le lecteur
  n'est dans aucune).

### 2. Tous les articles & rubrique — grille paginée (SC-002, US1/US3)

- Ouvrir `/articles`, puis `/rubrique/environnement`.
- **Attendu** : en-tête sobre ; grille (≤ 12), du plus récent au plus ancien ; commandes de
  pagination si > 12. Parcourir toutes les pages : aucun doublon, aucun manquant.
- **Hors bornes** : `/rubrique/environnement?page=999` → page « adresse introuvable » (404).
- **Eyebrow** : dans une rubrique, le surtitre devient le **sous-thème** s'il existe.

### 3. Rubrique vide — état dédié (SC-006, US3)

- Ouvrir une rubrique sans article publié (p. ex. dépublier temporairement, ou une rubrique
  non alimentée par le seed).
- **Attendu** : en-tête conservé, **état vide** dédié à la place de la grille — jamais une
  grille vide ni une erreur.

### 4. Article — affichage complet (SC-003, US2)

- Depuis l'accueil, ouvrir un article publié.
- **Attendu** : fil d'Ariane (Accueil → Rubrique → titre) ; rubrique ; titre ; chapô ;
  métadonnées **date · temps de lecture · auteur** (si présent) ; couverture **avec sa
  légende** (distincte du texte alternatif) ; corps en colonne lisible (paragraphes,
  intertitres, listes, citations, liens, images intégrées le cas échéant) ; section « à lire
  aussi » de la même rubrique, article courant exclu.
- **Introuvable** : ouvrir le slug d'un brouillon → 404.

### 5. Pages système (SC-004, US4)

- Ouvrir une URL inconnue, p. ex. `/article/inexistant`.
- **Attendu** : page « adresse introuvable » **dans la charpente**, présentant les derniers
  articles ; statut HTTP **404**.
- Le gabarit « service indisponible » répond en **503**, « erreur serveur » en **500**.

### 6. Diffusion (SC-004, US5)

```bash
curl -i http://localhost:3000/rss.xml       # 200, application/rss+xml, <item> = derniers publiés
curl -i http://localhost:3000/sitemap.xml   # 200, application/xml, accueil + /articles + 8 rubriques + articles publiés
```

- **Attendu** : aucun brouillon ni article non daté ; liens absolus (origine configurée).

### 7. Thèmes & responsive (SC-007, portes 5–7)

- Basculer clair/sombre : toutes les pages basculent sans flash (couleurs par tokens).
- À **375 px** : aucune page ne défile horizontalement ; sur l'accueil, les **sections de
  rubrique** défilent horizontalement **en interne** (carrousel borné).

## Contrôles automatisés

```bash
npm run test:unit    # tempsLecture, presentation (eyebrow/URL/DTO), pagination & hors-bornes, visibilité
npm run test:e2e     # accueil 01→05, rubrique+pagination, état vide, article complet, 404→derniers, rss/sitemap, thèmes, mobile
npm run verifier     # sobriété (3) + portabilité (3) — restent verts
npm run typecheck
```

**Définition de terminé** : les sept scénarios manuels passent dans les deux thèmes, les
quatre commandes ci-dessus sont vertes, et Lighthouse ≥ 90 (perf / SEO / a11y) avec
contrastes AA vérifiés en clair **et** en sombre (SC-008).

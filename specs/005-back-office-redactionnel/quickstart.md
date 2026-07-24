# Quickstart — Valider le back-office rédactionnel

Guide de **validation**, pas d'implémentation. Chaque scénario prouve une exigence de bout en
bout. Prérequis : base initialisée et compte de rédaction (feature 004).

## Préparer

```bash
# Dépendances de la feature (versions épinglées — cf. research.md)
npm i @tiptap/vue-3@3.28.0 @tiptap/starter-kit@3.28.0 \
      @tiptap/extension-link@3.28.0 @tiptap/extension-image@3.28.0 @tiptap/pm@3.28.0 \
      sharp@0.35.3 @formkit/drag-and-drop@0.6.1

npm run db:seed        # 8 rubriques + articles d'exemple (dont 5 à la une) + compte de rédaction
npm run dev            # http://localhost:3000
```

Se connecter sur `/connexion` avec le compte d'exemple → arrivée sur `/admin` (redirige vers
`/admin/articles`).

## Scénario 1 — Parcourir et filtrer (US1, SC-001)

1. Ouvrir `/admin/articles`. **Attendu** : tous les articles, **brouillons compris**, chacun
   avec vignette, titre, rubrique, **état en un mot** (sans pastille), rang « 01 »…« — », date.
2. Filtrer par rubrique, puis par état, puis taper du texte. **Attendu** : restriction cumulée,
   pagination remise à la page 1.
3. Combiner des filtres sans résultat. **Attendu** : « Aucun article ne correspond » (pas d'erreur).

## Scénario 2 — Rédiger, autosave, rouvrir (US2, SC-012)

1. « Nouvel article ». Saisir titre + chapô ; appliquer **gras, italique, H2, H3, liste, liste
   numérotée, citation, lien**. **Attendu** : rendu **identique au site publié** (classe `.corps`).
2. Choisir une rubrique, saisir un **sous-thème**, déposer une **couverture** + texte alternatif.
3. Attendre ~2 s **sans** cliquer. **Attendu** : indicateur « Brouillon enregistré · à l'instant »
   (autosave, D8) ; l'URL devient `/admin/articles/<id>`.
4. Fermer l'onglet, rouvrir l'article depuis la liste. **Attendu** : tout est restitué, mis en
   forme.
5. `annuler`/`rétablir` dans l'éditeur. **Attendu** : l'état revient puis se reprend.

## Scénario 3 — Image du corps, portabilité (SC-002, SC-007)

1. Dans le corps, insérer une **image** via la barre d'outils. **Attendu** : elle s'affiche.
2. Enregistrer. Inspecter le corps stocké :

   ```bash
   npx prisma studio   # Article.corps de l'article édité
   ```

   **Attendu** : `<img src="/medias/…">` — une **adresse d'application**, **jamais** une URL de
   fournisseur (`http(s)://…`, `data:`). Idem pour la couverture (colonne `Media.cle` = clé, pas
   d'URL).
3. Ouvrir `http://localhost:3000/medias/<clé>`. **Attendu** : l'image est servie (route
   `Stockage.get`).

## Scénario 4 — Publier dans les règles (US3, SC-005)

1. Sur un article **sans** couverture, cliquer « Publier ». **Attendu** : refus nommant la
   couverture ; rien n'est publié.
2. Retirer le texte alternatif, réessayer. **Attendu** : refus nommant l'`alt`.
3. Compléter, publier. **Attendu** : l'article devient visible sur le site public.
4. Renseigner une **date future** puis publier. **Attendu** : publié mais **absent** du public
   jusqu'à l'échéance (embargo, FR-014b).
5. Soumettre du balisage interdit (coller `<script>` / `<div style>`), enregistrer.
   **Attendu** : le corps stocké ne garde **que** la liste blanche (SC-004).

## Scénario 5 — Composer la Une → accueil (US4, SC-003, SC-006)

1. `/admin/une`. **Attendu** : 5 emplacements 01–05, le 01 plus grand (héros), articles ou
   « Emplacement libre ».
2. Depuis la colonne droite, **épingler** un article publié sur un emplacement libre.
   **Attendu** : il occupe l'emplacement et quitte la liste des publiables.
3. Épingler sur un rang **occupé**. **Attendu** : l'occupant précédent quitte la Une (éviction),
   jamais deux au même rang.
4. **Réordonner par glisser-déposer**, puis **au clavier** (poignée focalisée, flèches Haut/Bas).
   **Attendu** : décalage/insertion (permutation), annonce `aria-live`.
5. « Enregistrer la Une », ouvrir `/`. **Attendu** : l'accueil affiche l'ordre composé, le rang
   01 en héros. **Avant** d'enregistrer, l'accueil garde l'ordre précédent (FR-027).

## Scénario 6 — Supprimer avec confirmation (US5)

1. « Supprimer » sur une ligne. **Attendu** : dialogue de confirmation (piège de focus, `Échap`
   annule).
2. Confirmer sur un article **non épinglé**. **Attendu** : disparaît définitivement.
3. Sur un article **épinglé** : le retirer de la Une d'abord, puis supprimer. **Attendu** :
   pas d'emplacement orphelin sur l'accueil.

## Scénario 7 — Refus par défaut (SC-011)

```bash
# Non authentifié
curl -i http://localhost:3000/api/admin/articles           # → 401
curl -i -X PUT http://localhost:3000/api/admin/une         # → 401
```

Ouvrir `/admin/articles` en navigation privée (déconnecté). **Attendu** : redirection vers
`/connexion`, aucun contenu d'administration affiché.

## Portes — vérifications automatisées

```bash
npm run test:unit    # services admin : liste filtrée/paginée, reordonnerUne, epingler-qui-publie, assainissement
npm run test:e2e     # parcours complet, upload/affichage image, une→accueil, DnD clavier, 2 thèmes, 375px, axe
npm run verifier     # sobriété (rayon/ombre/dégradé) + portabilité (aucune URL média en base, accès Storage seul)
npm run typecheck
```

**Attendu** : tout passe. En particulier — `scrollWidth ≤ clientWidth` du `body` à **375 px**
sur les trois écrans (D14) ; axe **sans violation** en clair **et** en sombre ; aucune chaîne
d'URL de média dans `Article.corps` ni `Media.cle` (SC-007).

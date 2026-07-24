# Contrat — Composants et écrans UI

Tous les écrans sont sous `/admin`, gardés à l'affichage par `admin.global.ts` (feature 004),
rendus dans le **layout admin** (rail 240 px). Sobriété (rayon 0, sans ombre ni dégradé),
deux thèmes par tokens, focus visible partout, français. **Aucun `dark:` sur les couleurs.**

---

## Layout & navigation

### `layouts/admin.vue`
- Structure des trois `.html` : rail latéral **240 px** à gauche, contenu à droite.
- Fournit `AdminRail`. Distinct de `default.vue` (public, 248 px, topbar, footer).
- Sous **1000 px** (D14) : rail replié (décision Fondations), contenu pleine largeur.

### `AdminRail.vue`
- **Props** : `courant: 'articles' | 'une' | 'medias'`.
- Mot-symbole (`public/brand/*`, bascule CSS) **enveloppé d'un lien vers l'accueil** (porte 8) ;
  liens « Articles », « À la une », « Médias » ; « Déconnexion » en bas.
- L'entrée `courant` porte `aria-current="page"`, `border-left:3px accent` + fond `--surface`
  (seule exception d'accent en fond admise, principe III).
- « Médias » pointe un écran **hors périmètre** (emplacement réservé).

---

## Écran 1 — Liste des articles  (`pages/admin/articles/index.vue`)

- **Données** : `GET /api/admin/articles` (query = filtres + page). SSR + reprise client.
- **En-tête** : titre « Articles » + `AppButton` primaire « Nouvel article » → `/admin/articles/nouveau`.
- **`BarreFiltres.vue`** — **Props** `{ q, rubriqueId, statut }` **Emits** `update` → écrit les
  query params ; recherche (loupe), sélecteur rubrique (les 8 + « Toutes »), sélecteur statut
  (Tous/Brouillon/Publié). Changer un filtre → `page=1`.
- **Table** (grille 7 colonnes) de `LigneTableArticle.vue` :
  - **Props** : `ligne: LigneArticleAdmin`.
  - vignette 64×36 (`background-image`, ou fond `--surface` si pas de couverture) ; titre
    (ellipsis 1 ligne) ; rubrique ; **état en un mot** (`Publié`/`Brouillon`, **sans pastille**) ;
    rang « 01 »…« 05 » (accent) ou « — » ; date ; actions « Modifier » (→ `[id]`), « Supprimer »
    (ouvre `DialogueConfirmation`).
- **`Pagination.vue`** (réutilisé, liens `?page=N`).
- **État vide** (FR-010) : filtres sans résultat → message « Aucun article ne correspond »
  (réutilise l'esprit de `EtatVide.vue` public ; sobre, sans accent).

---

## Écran 2 — Éditeur  (`pages/admin/articles/nouveau.vue` + `[id].vue`)

Deux pages, un même corps d'édition (composable `useEditeurArticle`). `nouveau.vue` crée en
paresseux (D8) puis se comporte comme `[id].vue`.

### `useEditeurArticle(id?)` (composable)
- **État** : `titre, chapo, corpsHtml, sousTheme, auteur, statut, publieLe, rubriqueId, rangUne,
  couverture`, `etatEnregistrement` (`'enregistré'|'en cours'|'échec'`), `dernierEnregistrement`.
- **Autosave** : `watch` débouncé (~1,5 s) → `POST` si pas d'`id` (puis bascule `PATCH`), sinon
  `PATCH`. **Jamais** de publication. 401 → conserver la saisie + rediriger vers connexion.
- **Actions** : `enregistrerBrouillon()` (PATCH immédiat), `publier()` (POST publier, remonte les
  refus de couverture/alt), `depublier()`.

### `EditeurRiche.vue` (enveloppe TipTap 3)
- **Props** : `modelValue: string (HTML)` ; **Emits** : `update:modelValue`.
- Extensions : StarterKit (`heading` levels [2,3]) + Link + Image. **Headless** : la zone
  d'édition porte la classe **`.corps`** (D2) → rendu identique au publié.
- Expose l'état actif des marques/nœuds pour la barre d'outils.

### `BarreOutils.vue`
- **Props** : instance éditeur (ou état actif + commandes). Boutons : **B**, *I*, **H2**, **H3**,
  puces, numéros, citation, lien, image, annuler, rétablir.
- Bouton **actif** en accent (`tb-btn--active`, tracé maquette) ; bouton indisponible grisé.
- Barre **collante** (`position:sticky`). Chaque bouton **focusable**, `title`/`aria-label`.
- « image » → ouvre le sélecteur de fichier → `POST /api/admin/medias` → insère `<img src="/medias/<clé>">`.
- « lien » → invite d'URL → `setLink`.

### `PanneauReglages.vue` (sidebar 320 px)
- **Statut** : segmenté Brouillon/Publié (segment actif en accent).
- **Rubrique** : sélecteur (les 8).
- **Sous-thème** : champ texte facultatif (≤40) **sous** la rubrique, style `set-input` (D16).
- **Date de publication** : champ date — **accepte le futur** (embargo, FR-014b).
- **À la une** : case + segmenté **01–05** (rang) ; cocher publie l'article via `publier` avec
  `aLaUne` (FR-021).
- **`DeposeCouverture.vue`** : zone de dépose (glisser/cliquer) → `POST /medias` → aperçu 16/9 ;
  champ **texte alternatif** (obligatoire à la publication) ; « Remplacer »/« Retirer ».
- **Actions** : `AppButton` secondaire « Enregistrer le brouillon », `AppButton` **primaire**
  « Publier » (survol → `--primaire-survol`, **pas** l'accent — correction de maquette).
- **Indicateur d'autosave** : « Brouillon enregistré · il y a N min » / « Enregistrement… » /
  « Échec — réessayer » ; neutralisé sous `prefers-reduced-motion` (pas de pulsation).

---

## Écran 3 — Composer la Une  (`pages/admin/une.vue`)

- **Données** : `GET /api/admin/une`. **Enregistrer** : `PUT /api/admin/une`.
- **`useCompositionUne`** (composable) : tient l'ordre local des ≤5 `id` ; `reordonner(from,to)`
  (décalage/insertion) ; `epingler(id)` / `retirer(rang)` ; `enregistrer()` → PUT ; état
  « modifié non enregistré » (FR-027 : l'accueil ne bouge qu'au PUT).
- **Colonne gauche** — 5 × `EmplacementUne.vue` :
  - **Props** : `{ emplacement: EmplacementUneDTO, hero: boolean }`.
  - vignette 213×120 (héros 320×180) ; rang 01–05 en accent ; titre 2 lignes ; **poignée**
    focusable, **glisser-déposer (`@formkit/drag-and-drop`) ET clavier** (flèches Haut/Bas),
    `aria-live` annonçant le nouvel ordre (D9) ; état libre = cadre pointillé.
- **Colonne droite** — recherche + liste de `LigneArticlePublie.vue` :
  - **Props** : `{ article: ArticlePubliableDTO }` ; vignette 64×36, titre 14px, eyebrow 10px,
    lien « Épingler » → `epingler(id)` (place sur le premier rang libre, ou à la suite).
- **En-tête** : sous-titre « L'ordre choisi ici est l'ordre affiché sur la page d'accueil » +
  `AppButton` primaire « Enregistrer la Une ».

---

## Transverse — `DialogueConfirmation.vue` (D15)

- **Props** : `{ ouvert, titre, message, libelleConfirmer }` ; **Emits** : `confirmer`, `annuler`.
- `<dialog>` (ou rôle `alertdialog`) : **piège de focus**, **`Échap`** ferme, focus rendu au
  déclencheur. Deux `AppButton` : « Annuler » (secondaire), confirmation (secondaire — **pas** de
  rouge en fond ; le rouge d'erreur reste réservé aux formulaires). Écran **non maquetté** :
  sobre, **sans accent**.

---

## Enregistrement dans `nuxt.config.ts`

- `components: [ …, { path: '~/components/admin', pathPrefix: false } ]` — les composants admin
  s'emploient sans préfixe (`AdminRail`, `EmplacementUne`…), comme `ui`/`layout`/`public`.
- `nitro.externals.external` += `'sharp'` (+ `traceInclude` si nécessaire, D7).
- `routeRules` : `/admin/**` déjà `no-store` (feature 004) — couvre les nouvelles pages.

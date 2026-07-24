---

description: "Liste de tâches — Back-office rédactionnel"
---

# Tasks: Back-office rédactionnel

**Input**: Design documents from `/specs/005-back-office-redactionnel/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: **INCLUS** — le projet est piloté par les tests (Vitest + Playwright + axe) et le
spec exige des vérifications automatisées (SC-004, SC-006, SC-007, SC-011). Les tests d'une
histoire s'écrivent **avant** son implémentation et doivent d'abord échouer.

**Organisation** : par histoire utilisateur, pour une implémentation et un test indépendants.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichiers différents, aucune dépendance sur une tâche inachevée)
- **[Story]** : US1…US5 (histoires du spec)
- Chemins de fichiers **exacts** dans chaque description

## Rappels non négociables (constitution)

- Toute route `/api/admin/**` appelle **`exigerCompte(event)` en première ligne** (porte 12).
- Le corps est **assaini côté serveur avant stockage** — déjà fait par `creerArticle`/`modifierArticle` (porte 11). Ne jamais faire confiance au HTML du client.
- **Aucune URL de média en base** : couverture par **clé**, images du corps en **adresse d'application** `/medias/<clé>` (porte 9). Accès fichier **uniquement** via l'interface `Stockage`.
- **Zéro migration** : le schéma porte déjà tout. Ne pas modifier `prisma/schema.prisma`.
- Sobriété (rayon 0, sans ombre ni dégradé), deux thèmes par tokens, focus visible partout, français.
- Le back-office **n'emploie PAS la Card** : les trois dérivés sont des composants d'`app/components/admin/`.

---

## Phase 1: Setup (infrastructure partagée)

**Objectif** : dépendances et configuration du projet.

- [X] T001 Installer et épingler les dépendances dans `package.json` : `@tiptap/vue-3@3.28.0`, `@tiptap/starter-kit@3.28.0`, `@tiptap/extension-link@3.28.0`, `@tiptap/extension-image@3.28.0`, `@tiptap/pm@3.28.0`, `sharp@0.35.3`, `@formkit/drag-and-drop@0.6.1` (aucune extension TipTap **Pro**).
- [X] T002 Configurer `nuxt.config.ts` : ajouter `{ path: '~/components/admin', pathPrefix: false }` à `components`, et ajouter `'sharp'` à `nitro.externals.external` (+ `traceInclude: [requis.resolve('sharp')]` si le binaire natif n'est pas embarqué — vérifier au `npm run build && npm run preview`).

---

## Phase 2: Foundational (prérequis bloquants)

**Objectif** : charpente admin et service des médias, requis par toutes les histoires.

**⚠️ CRITIQUE** : aucune histoire ne peut commencer avant la fin de cette phase.

- [X] T003 [P] Ajouter les DTO d'administration dans `shared/types/dto.ts` : `LigneArticleAdmin`, `ListeAdminDTO`, `ArticleEditionDTO`, `EmplacementUneDTO`, `ArticlePubliableDTO`, `CompositionUneDTO` (formes de `data-model.md` §3 ; `image` reste `/medias/<clé>`).
- [X] T004 [P] Créer le layout admin `app/layouts/admin.vue` : rail 240 px à gauche + contenu à droite ; repli sous 1000 px (décision Fondations) ; par tokens, sans `dark:` sur les couleurs.
- [X] T005 [P] Créer `app/components/admin/AdminRail.vue` : mot-symbole (`public/brand/*`, bascule CSS) **enveloppé d'un lien vers l'accueil** ; liens « Articles » / « À la une » / « Médias » ; « Déconnexion » ; `aria-current="page"` + `border-left` accent + fond `--surface` sur l'entrée active (prop `courant`).
- [X] T006 [P] Créer la route publique de service des médias `server/routes/medias/[...cle].get.ts` : `Stockage.get(cle)` → octets, **`Content-Type` dérivé de l'extension de la clé** (`.webp`→`image/webp`, `.jpg`/`.jpeg`→`image/jpeg`, `.png`→`image/png`, `.avif`→`image/avif` ; défaut `application/octet-stream` — les téléversements sont en WebP, mais les clés de seed sont en `.jpg`), `Cache-Control: public, max-age=31536000, immutable`, 404 si `null` (D6). **Non gardée** (couvertures publiques).
- [X] T007 Remplacer `app/pages/admin/index.vue` par une redirection vers `/admin/articles`.
- [X] T008 [P] Créer `app/pages/admin/medias.vue` : page placeholder « Médias — à venir » (le rail y renvoie ; écran hors périmètre, sobre, sans accent).

**Checkpoint** : charpente admin prête — les histoires peuvent commencer.

---

## Phase 3: User Story 1 - Parcourir et retrouver les articles (Priority: P1) 🎯 MVP

**Goal** : voir tous les articles (brouillons compris) dans une table dense, filtrer
(texte/rubrique/état), paginer, et atteindre créer/modifier/supprimer.

**Independent Test** : se connecter, ouvrir `/admin/articles`, constater toutes les lignes
(état en un mot, rang 01–05 ou « — »), cumuler les filtres, paginer, voir l'état vide.

### Tests (US1)

- [X] T009 [P] [US1] Test unité `tests/unit/articles-admin.test.ts` : `listerArticlesAdmin`/`compterArticlesAdmin` retournent brouillons **et** futurs, filtrent par `q`/`rubriqueId`/`statut` (cumulables), trient par `modifieLe` desc, paginent.
- [X] T010 [P] [US1] Test e2e `tests/e2e/admin-liste.spec.ts` : liste complète, filtres cumulés + remise à page 1, pagination, état vide, deux thèmes, `scrollWidth ≤ clientWidth` à 375 px.

### Implémentation (US1)

- [X] T011 [US1] Ajouter `schemaFiltresListe` (Zod) dans `server/validation/article.ts` : `q?`, `rubriqueId?`, `statut?` (`brouillon|publie`), `page? ≥1 =1`, `taille? =20`.
- [X] T012 [US1] Ajouter `listerArticlesAdmin(options)` et `compterArticlesAdmin(options)` dans `server/services/articles.ts` : **sans** `filtreVisible`, `include: { couverture: true }`, `orderBy: { modifieLe: 'desc' }`, `skip`/`take`.
- [X] T013 [US1] Ajouter le mappeur `ligneArticleAdminDe(article)` dans `server/utils/presentation.ts` → `LigneArticleAdmin` (`image` = `stockage.url(cle)` si couverture, sinon absent ; `date` = `publieLe` sinon `modifieLe`).
- [X] T014 [US1] Créer `server/api/admin/articles/index.get.ts` : `exigerCompte`, valider la requête (T011), appeler T012, renvoyer `ListeAdminDTO`.
- [X] T015 [P] [US1] Créer `app/components/admin/LigneTableArticle.vue` (dérivé 3) : grille 7 colonnes `64px 1fr 148px 110px 78px 132px 150px` ; vignette 64×36 en `background-image` (fond `--surface` si sans couverture) ; état **en un mot** sans pastille ; rang `t-rang--une` (accent) / `t-rang--non` (« — ») ; liens « Modifier » (→ `/admin/articles/[id]`) et « Supprimer » (émet un événement).
- [X] T016 [P] [US1] Créer `app/components/admin/BarreFiltres.vue` : recherche (loupe), sélecteur rubrique (les 8 + « Toutes »), sélecteur statut (Tous/Brouillon/Publié) ; émet la mise à jour des `query` ; changer un filtre remet `page=1`.
- [X] T017 [US1] Créer `app/pages/admin/articles/index.vue` (layout `admin`) : titre + `AppButton` primaire « Nouvel article » (→ `/admin/articles/nouveau`) ; `BarreFiltres` ; table de `LigneTableArticle` depuis `GET /api/admin/articles` ; `Pagination.vue` réutilisé (liens `?page=N`) ; état vide « Aucun article ne correspond ».

**Checkpoint** : la liste est pleinement fonctionnelle et testable seule (MVP).

---

## Phase 4: User Story 2 - Rédiger un article et enregistrer un brouillon (Priority: P1)

**Goal** : éditeur riche rendu **exactement comme publié**, panneau latéral (statut, rubrique,
sous-thème, date, à la une, couverture + alt), **autosave** + enregistrement explicite,
image de couverture et image du corps déposées et affichées.

**Independent Test** : créer un article, appliquer chaque mise en forme (rendu `.corps`),
déposer une couverture + alt, insérer une image de corps, laisser l'autosave enregistrer,
rouvrir : tout est restitué.

### Tests (US2)

- [X] T018 [P] [US2] Test unité `tests/unit/image.test.ts` : `traiterImage(buffer)` refuse un non-image, convertit en WebP, renvoie largeur/hauteur/poids cohérents, plafonne la largeur.
- [X] T019 [P] [US2] Test e2e `tests/e2e/admin-editeur.spec.ts` : mises en forme rendues comme publié ; dépose couverture + alt ; **image du corps → `<img src="/medias/…">`** dans le corps stocké (jamais d'URL de fournisseur) ; autosave (indicateur + reprise après réouverture) ; deux thèmes ; 375 px sans défilement horizontal.

### Implémentation (US2)

- [X] T020 [P] [US2] Extraire la typographie du corps de `app/components/public/CorpsArticle.vue` vers `app/assets/css/corps.css` (non scopée, valeurs en `var(--…)`), l'importer dans `app/assets/css/main.css`, et faire porter la classe `.corps` par `CorpsArticle` **et** l'éditeur (D2, FR-013).
- [X] T021 [P] [US2] Créer `server/utils/image.ts` — `traiterImage(entree: Buffer)` : `sharp` (type réel, auto-orientation, **sans métadonnées**, plafond ~2000 px, → **WebP**) → `{ buffer, largeur, hauteur, poids, typeMime }`. **Aucun** `node:fs`.
- [X] T022 [P] [US2] Ajouter `articleAdminParId(id)` dans `server/services/articles.ts` (article complet, couverture jointe, brouillon compris) + son mappeur `articleEditionDe` dans `server/utils/presentation.ts` → `ArticleEditionDTO`.
- [X] T023 [US2] Créer `server/api/admin/medias.post.ts` : `exigerCompte`, `readMultipartFormData`, `traiterImage` (T021), clé `cuid.webp`, **`Stockage.put`**, `enregistrerMedia` → `{ id, cle, url }` (`url = /medias/<clé>`). Erreurs 415 (non image) / 413 (trop lourd) / 400.
- [X] T024 [P] [US2] Créer `server/api/admin/articles/index.post.ts` : `exigerCompte`, `creerArticle` (valide → **assainit** → écrit), renvoie `{ id }` + `ArticleEditionDTO` (création paresseuse de l'autosave).
- [X] T025 [US2] Créer `server/api/admin/articles/[id].get.ts` : `exigerCompte`, `articleAdminParId` (T022) → `ArticleEditionDTO`, 404 si inconnu.
- [X] T026 [P] [US2] Créer `server/api/admin/articles/[id].patch.ts` : `exigerCompte`, `modifierArticle` (partiel, **assainit** le corps), **ne publie jamais** ; renvoie `ArticleEditionDTO` (dont `modifieLe`). Un 401 remonte tel quel (session expirée).
- [X] T027 [P] [US2] Créer `app/components/admin/EditeurRiche.vue` : enveloppe TipTap 3 (StarterKit `heading` levels `[2,3]` + `extension-link` + `extension-image`), zone d'édition en classe `.corps` ; `v-model` HTML ; expose l'état actif des marques/nœuds.
- [X] T028 [P] [US2] Créer `app/components/admin/BarreOutils.vue` : B, I, H2, H3, puces, numéros, citation, lien, image, annuler, rétablir ; bouton **actif** en accent, indisponible grisé ; barre `sticky` ; « image » → `POST /api/admin/medias` puis insertion `<img src="/medias/<clé>">` ; « lien » → invite d'URL. **N1** : l'adresse racine-relative `/medias/…` doit **survivre à `assainir`** (une URL relative n'a pas de schéma, donc n'est pas filtrée par `allowedSchemes` ; `allowProtocolRelative` par défaut) — asserté par T019 sur le corps stocké.
- [X] T029 [P] [US2] Créer `app/components/admin/DeposeCouverture.vue` : zone de dépose (glisser/cliquer) → `POST /api/admin/medias` → aperçu 16/9 + champ **texte alternatif** (obligatoire à la publication) + « Remplacer »/« Retirer ».
- [X] T030 [US2] Créer `app/components/admin/PanneauReglages.vue` (dépend de T029) : statut segmenté ; sélecteur rubrique ; **champ sous-thème** facultatif ≤40 sous la rubrique ; **date de publication acceptant le futur** (embargo, FR-014b) ; case « À la une » + segmenté 01–05 ; `DeposeCouverture` ; indicateur d'autosave (neutralisé sous `prefers-reduced-motion`) ; `AppButton` secondaire « Enregistrer le brouillon » et **primaire** « Publier » (survol → `--primaire-survol`, **pas** l'accent).
- [X] T031 [US2] Créer `app/composables/useEditeurArticle.ts` : état d'édition + **autosave débouncé** (~1,5 s) via `PATCH`, **création paresseuse** via `POST` au premier changement puis bascule `PATCH` et remplacement d'URL ; jamais de publication ; 401 → conserver la saisie et rediriger vers `/connexion`.
- [X] T032 [US2] Créer `app/pages/admin/articles/nouveau.vue` (layout `admin`) : éditeur en création (T027, T030, T031).
- [X] T033 [US2] Créer `app/pages/admin/articles/[id].vue` (layout `admin`) : éditeur en édition, chargé par `GET /api/admin/articles/[id]`.

**Checkpoint** : rédiger, enregistrer un brouillon (auto + explicite), déposer/afficher des images fonctionnent.

---

## Phase 5: User Story 3 - Publier un article dans le respect des règles (Priority: P1)

**Goal** : publier n'aboutit qu'avec titre + rubrique + chapô + corps + couverture décrite ;
refus explicite nommant le manquant ; corps assaini ; date future = embargo ; dépublier.

**Independent Test** : tenter de publier sans couverture, puis sans alt, puis sans chapô →
refus nommé à chaque fois ; compléter, publier → visible du public ; date future → invisible
jusqu'à l'échéance ; balisage interdit → corps réduit à la liste blanche.

### Tests (US3)

- [X] T034 [P] [US3] Test unité `tests/unit/epingler.test.ts` : `epinglerArticle` publie un brouillon (couverture + alt requis, refus nommé sinon) **puis** place au rang avec éviction ; refuse un rang hors 1–5.
- [X] T035 [P] [US3] Test e2e `tests/e2e/admin-publier.spec.ts` : refus nommant couverture/alt/chapô ; publication → visible public ; **date future → embargo** (absent du public jusqu'à l'échéance) ; balisage interdit filtré (SC-004).

### Implémentation (US3)

- [X] T036 [US3] Ajouter `epinglerArticle(articleId, rang)` dans `server/services/une.ts` : transaction — si brouillon, gardes de `publierArticle` (couverture + alt) puis `publie`/`publieLe` ; puis éviction + placement (D11).
- [X] T037 [US3] Créer `server/api/admin/articles/[id]/publier.post.ts` : `exigerCompte`, valider `{ publieLe?, aLaUne?: { rang } }` (date **future acceptée**), `publierArticle` (refus nommé si couverture/alt manquants), puis `epinglerArticle` si `aLaUne` ; renvoie `ArticleEditionDTO`.
- [X] T038 [US3] Créer `server/api/admin/articles/[id]/depublier.post.ts` : `exigerCompte`, `depublierArticle` (statut brouillon, **libère `rangUne`**, `publieLe` conservée).
- [X] T039 [US3] Câbler l'éditeur (`app/composables/useEditeurArticle.ts` + `app/components/admin/PanneauReglages.vue`) : bouton « Publier » → `publier` (remonter le **message de refus nommé**) ; case « À la une » + rang → `publier` avec `aLaUne` (FR-021) ; action « dépublier ».

**Checkpoint** : la publication respecte toutes les règles et l'embargo.

---

## Phase 6: User Story 4 - Composer la Une et fixer l'ordre de l'accueil (Priority: P2)

**Goal** : cinq emplacements 01–05 (héros = 01), épingler depuis les articles publiés,
éviction sur rang occupé, réordonnancement **glisser-déposer ET clavier** (décalage/insertion),
« Enregistrer la Une » → ordre de l'accueil.

**Independent Test** : épingler, évincer, réordonner à la souris puis au clavier, enregistrer,
ouvrir `/` et constater l'ordre ; avant enregistrement, l'accueil est inchangé.

### Tests (US4)

- [X] T040 [P] [US4] Test unité `tests/unit/reordonner.test.ts` : `reordonnerUne(ordre)` réassigne les rangs 1..N en une transaction (permutation), refuse un `id` non publié / inconnu / en doublon / une longueur > 5, ne laisse jamais deux articles au même rang.
- [X] T041 [P] [US4] Test e2e `tests/e2e/admin-une.spec.ts` : épinglage, éviction, réordonnancement **souris + clavier** (flèches sur poignée focalisée), enregistrement → accueil recomposé ; sans enregistrer → accueil inchangé ; deux thèmes ; 375 px.

### Implémentation (US4)

- [X] T042 [US4] Créer `server/validation/une.ts` : `schemaOrdreUne` (Zod) — `{ ordre: string[] }`, `id` non vides, **uniques**, longueur **≤ 5**.
- [X] T043 [US4] Ajouter `reordonnerUne(ordre)` dans `server/services/une.ts` : transaction — table rase des rangs puis `rangUne = index+1` ; refus `id` non publié/inconnu/doublon (D10).
- [X] T044 [US4] Créer `server/api/admin/une/index.get.ts` : `exigerCompte`, renvoyer `CompositionUneDTO` (5 emplacements + publiables non épinglés, filtrables par `q`).
- [X] T045 [US4] Créer `server/api/admin/une/index.put.ts` : `exigerCompte`, valider (T042), `reordonnerUne` (T043), renvoyer `CompositionUneDTO`.
- [X] T046 [P] [US4] Créer `app/components/admin/EmplacementUne.vue` (dérivé 1) : vignette 213×120 (**héros 320×180**) ; rang 01–05 en accent (`Archivo` 800, 32 px) ; titre 18 px (héros 22) sur **2 lignes** ; poignée focusable ; état libre = cadre pointillé « Emplacement libre ».
- [X] T047 [P] [US4] Créer `app/components/admin/LigneArticlePublie.vue` (dérivé 2) : vignette 64×36, titre 14 px (2 lignes), eyebrow **10 px**, lien « Épingler ».
- [X] T048 [US4] Créer `app/composables/useCompositionUne.ts` : ordre local des ≤5 `id`, `reordonner` en **décalage/insertion**, `epingler`/`retirer`, `enregistrer` (`PUT`), état « modifié non enregistré » (FR-027).
- [X] T049 [US4] Créer `app/pages/admin/une.vue` (layout `admin`) : deux colonnes ; **glisser-déposer via `@formkit/drag-and-drop` + clavier** (flèches Haut/Bas sur poignée, `aria-live` annonçant l'ordre) ; recherche des publiables ; `AppButton` primaire « Enregistrer la Une ».

**Checkpoint** : composer la Une réordonne bien l'accueil, souris et clavier.

---

## Phase 7: User Story 5 - Supprimer un article avec confirmation (Priority: P3)

**Goal** : suppression définitive après confirmation ; un article épinglé quitte la Une
(dépinglage préalable) plutôt que de laisser un trou.

**Independent Test** : supprimer un article non épinglé après confirmation → disparu ;
supprimer un épinglé → le dépingler d'abord, pas d'emplacement orphelin sur l'accueil.

### Tests (US5)

- [X] T050 [P] [US5] Test e2e `tests/e2e/admin-suppression.spec.ts` : dialogue de confirmation (piège de focus, `Échap` annule) ; suppression d'un non épinglé ; suppression d'un **épinglé** → il est **retiré de la Une au passage** puis effacé, l'accueil ne présentant **aucun emplacement orphelin** (FR-029/US5 sc.4).

### Implémentation (US5)

- [X] T051 [US5] Créer `server/api/admin/articles/[id].delete.ts` : `exigerCompte` ; si l'article occupe un rang de la Une, **`retirerDeLaUne(id)` puis** `supprimerArticle(id)` (retrait de la Une **au passage**, FR-029/US5 sc.4) — sinon `supprimerArticle(id)` directement ; 204 au succès, 404 si inconnu. `supprimerArticle` (002) refuse seul un épinglé : c'est **la route** qui orchestre le dépinglage.
- [X] T052 [P] [US5] Créer `app/components/admin/DialogueConfirmation.vue` : `<dialog>`/`alertdialog`, **piège de focus**, `Échap` ferme, focus rendu au déclencheur ; deux `AppButton` (secondaires, **pas** de rouge en fond) ; sobre, **sans accent** (non maquetté).
- [X] T053 [US5] Câbler la suppression dans `app/pages/admin/articles/index.vue` (+ événement de `app/components/admin/LigneTableArticle.vue`) : ouvrir `DialogueConfirmation` → `DELETE` ; au succès, retirer la ligne (la route ayant dépinglé au passage, aucun geste manuel préalable ; l'accueil reste sans emplacement orphelin).

**Checkpoint** : toutes les histoires sont indépendamment fonctionnelles.

---

## Phase 8: Polish & préoccupations transverses

- [X] T054 [P] Balayage accessibilité (étendre `tests/e2e/a11y.spec.ts`) : axe **sans violation** sur les 3 écrans + éditeur, **dans les deux thèmes** ; focus visible sur barre d'outils, poignées, segments, sélecteurs, dépose, dialogue ; `prefers-reduced-motion` neutralise l'indicateur d'autosave et les transitions de DnD ; `aria-current` sur la page réellement affichée.
- [X] T055 [P] Petit écran (étendre `tests/e2e/responsive.spec.ts`) : `scrollWidth ≤ clientWidth` du `body` à 375 px sur liste, éditeur et composer ; colonnes empilées, table dense en `overflow-x` dans son conteneur (D14).
- [X] T056 [P] (Optionnel) Semer des **fichiers image** d'exemple pour les clés d'`prisma/seed.ts` via **`Stockage.put`** (afin que les couvertures semées s'affichent en back-office et sur le site) — via l'interface `Stockage` uniquement, jamais d'accès disque direct.
- [X] T057 Exécuter `npm run verifier` : sobriété (aucun rayon/ombre/dégradé dans le diff) **et** portabilité (aucune URL de média en base — vérifier que `Article.corps` ne contient que des `/medias/…`, aucun accès `node:fs` hors `stockage.ts`).
- [X] T058 Exécuter `npm run typecheck` (les trois contextes TS) et corriger les types.
- [X] T059 Dérouler `quickstart.md` (7 scénarios) de bout en bout, dans les deux thèmes.
- [X] T060 Amender `.specify/memory/constitution.md` en **v1.3.0** : refermer l'arbitrage 2 (le back-office n'emploie pas la Card ; trois dérivés déclarés), avec rapport de synchronisation ; propager aux gabarits `.specify/templates/` si nécessaire.
- [X] T061 [P] Test e2e de refus par défaut `tests/e2e/admin-refus.spec.ts` (SC-011, porte 12) : **sans session**, `GET /api/admin/articles`, `POST /api/admin/medias`, `POST /api/admin/articles/[id]/publier`, `PUT /api/admin/une` et `DELETE /api/admin/articles/[id]` répondent **401 sans effet** ; l'ouverture d'un écran `/admin/*` **redirige vers `/connexion`** sans afficher de contenu d'administration.

---

## Dependencies & Execution Order

### Dépendances de phase

- **Setup (Phase 1)** : aucune dépendance.
- **Foundational (Phase 2)** : dépend du Setup — **bloque toutes les histoires**.
- **Histoires (Phases 3–7)** : dépendent de Foundational. US1 est le MVP. US3 dépend de US2 (l'éditeur existe avant de publier depuis lui). US4 et US5 dépendent de Foundational et des données de US2/US3 mais restent testables seules (données d'exemple).
- **Polish (Phase 8)** : après les histoires visées.

### Dépendances entre histoires

- **US1 (P1)** : après Foundational. Indépendante (le bouton « Supprimer » n'émet qu'un événement ; son câblage complet est en US5).
- **US2 (P1)** : après Foundational.
- **US3 (P1)** : après **US2** (publie depuis l'éditeur ; réutilise `PanneauReglages`/composable).
- **US4 (P2)** : après Foundational ; consomme des articles publiés (US3 ou seed).
- **US5 (P3)** : après **US1** (câble la suppression dans la liste).

### Au sein d'une histoire

- Tests d'abord (échouent), puis implémentation.
- Validation Zod et services avant les routes ; routes avant les pages ; composants avant les pages qui les assemblent.

### Opportunités parallèles

- Setup : T001 puis T002.
- Foundational : T003–T006, T008 en parallèle ([P]) ; T007 ensuite.
- US1 : T009/T010 en parallèle ; T015/T016 en parallèle ; T011→T012→T013→T014 en séquence ; T017 en dernier.
- US2 : T020/T021/T022/T024/T026/T027/T028/T029 largement parallèles ; T023 après T021 ; T025 après T022 ; T030 après T029 ; T031 après T024/T026 ; T032/T033 après T027+T030+T031.
- US4 : T046/T047 en parallèle ; T042→T043→T044/T045 ; T048 après les routes ; T049 en dernier.

---

## Parallel Example: User Story 1

```bash
# Tests de US1 en parallèle :
Task: "T009 Test unité listerArticlesAdmin/compterArticlesAdmin dans tests/unit/articles-admin.test.ts"
Task: "T010 Test e2e de la liste dans tests/e2e/admin-liste.spec.ts"

# Composants de US1 en parallèle :
Task: "T015 LigneTableArticle.vue dans app/components/admin/LigneTableArticle.vue"
Task: "T016 BarreFiltres.vue dans app/components/admin/BarreFiltres.vue"
```

---

## Implementation Strategy

### MVP d'abord (US1)

1. Phase 1 Setup → Phase 2 Foundational → Phase 3 US1.
2. **STOP et VALIDER** : la liste fonctionne seule (filtres, pagination, état vide), deux thèmes, 375 px.

### Livraison incrémentale

1. Setup + Foundational → charpente prête.
2. US1 (liste) → tester → démo (MVP).
3. US2 (éditeur + autosave + images) → tester → démo.
4. US3 (publier + embargo) → tester → démo.
5. US4 (composer la Une) → tester → démo.
6. US5 (supprimer) → tester → démo.
7. Polish (a11y, responsive, verifier, typecheck, quickstart, amendement constitution).

---

## Notes

- `[P]` = fichiers différents, aucune dépendance ; `[Story]` = traçabilité vers le spec.
- Les services `creerArticle`, `modifierArticle`, `supprimerArticle`, `publierArticle`, `depublierArticle`, `placerALaUne`, `retirerDeLaUne`, `enregistrerMedia` **existent déjà** (feature 002) : les histoires les **réutilisent**, elles ne les réécrivent pas.
- **Aucune migration** — ne pas toucher `prisma/schema.prisma`.
- Vérifier que les tests échouent avant d'implémenter ; commiter après chaque tâche ou groupe logique.
- Ne **pas** reproduire le survol du bouton primaire vers l'accent de `back-office-articles.html` (défaut de maquette) : réutiliser `AppButton` primaire.

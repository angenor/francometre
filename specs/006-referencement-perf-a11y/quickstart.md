# Quickstart — vérifier « Référencement, performance, accessibilité »

Guide de validation de bout en bout. Détail normatif : `contracts/seo.md`,
`contracts/performance.md`. Formes des objets : `data-model.md`. Décisions : `research.md`.

## Prérequis

```bash
npm install                 # dont les nouveaux devDeps : playwright-lighthouse, lighthouse
npx prisma migrate dev      # (aucune migration nouvelle ici) régénère le client au besoin
npm run db:seed             # 8 rubriques + articles d'exemple
```

**Image de partage par défaut (US3 / SC-002)** — non bloquante : elle est **composée** depuis
le mot-symbole existant vers `public/brand/partage-defaut.png` (1200 × 630) par
`node scripts/partage-defaut.mjs` (D7). Rejouer le script régénère l'actif committé.

## A. Trouvable (US1, US3)

Build de production (les métadonnées et le cache se vérifient sur le rendu réel) :

```bash
npm run build && npm run preview   # sert sur http://localhost:3000
```

1. **Titres et descriptions** (SC-005) — pour `/`, `/rubrique/environnement`, `/articles`,
   `/article/le-retour-du-lynx-dans-le-jura` : la source contient un `<title>` propre marqué
   « Francomètre » et une `<meta name="description">` non vide.
2. **Canonique** (SC-004) — chaque page porte `<link rel="canonical">` absolu sur l'apex ;
   `/rubrique/environnement?page=2` se déclare canonique **d'elle-même**.
3. **Redirection `www`** (SC-004) —
   `curl -sI -H "Host: www.francometre.com" http://localhost:3000/` renvoie **301** vers
   `https://francometre.com/`.
4. **Aperçu de partage** (SC-002) — sur un article **avec** couverture : `og:title`,
   `og:description`, `og:image` (absolu) présents ; sur un article **sans** couverture :
   `og:image` = `…/brand/partage-defaut.png`.
5. **Données structurées** (SC-007) — la page article contient un
   `<script type="application/ld+json">` `NewsArticle` valide (titre, `datePublished`,
   `articleSection`, `author`, `image`). Contrôler sur le validateur Rich Results de Google.
6. **noindex** — `/connexion`, une page 404 et `/admin/**` signalent `noindex`
   (`meta` ou en-tête `X-Robots-Tag`).
7. **Diffusion déclarée** — `GET /robots.txt` déclare `Sitemap: https://francometre.com/sitemap.xml`
   et `Disallow: /admin` ; toute page porte `<link rel="alternate" type="application/rss+xml">`.

## B. Rapide (US4)

1. **Cache `swr`** (SC-009) — ouvrir `/`, publier un article via `/admin/une` ou
   `/admin/articles`, recharger `/` : le changement apparaît en **< 60 s** sans purge.
2. **Images paresseuses** (SC-008) — au moniteur réseau, à l'ouverture de `/`, seules les
   images proches de l'écran sont requises ; le défilement déclenche les suivantes. Le héros
   de l'accueil et la couverture d'article sont chargés **immédiatement** (`eager`).
3. **Dimensionnement** (SC-001 perf) — les `<NuxtImg>` servent un `srcset` webp ; aucune image
   ne transporte plus large que son affichage.

## C. Utilisable par tous (US2)

```bash
npm run test:e2e            # axe (2 thèmes) + clavier + repères SEO dans le DOM + responsive
```

1. **Clavier** (SC-003) — `tests/e2e/clavier.spec.ts` parcourt `/`, un article, une rubrique,
   `/connexion` et le back-office à la seule tabulation : chaque interactif se reçoit, ordre
   logique, focus visible. Inclut deux points durs de l'administration : l'**éditeur TipTap**
   (barre d'outils atteignable et opérable au clavier) et le **réordonnancement de la Une**
   (focus poignée → flèches Haut/Bas → ordre changé, annonce `aria-live`, focus rendu).
2. **Contraste AA deux thèmes** (SC-006) — `tests/e2e/a11y.spec.ts` (axe) passe sans violation
   en clair **et** en sombre, sur les pages publiques (dont `/articles`, `/connexion`,
   pages système) et l'administration.
3. **Structure sémantique** (SC-010) — chaque page a **un seul** `h1` et des repères nommés
   (`nav`, `main`, `contentinfo`), vérifiés par axe et un contrôle dédié.

## D. Audit ≥ 90 (SC-001)

```bash
npm run build && npm run preview      # dans un terminal
npm run audit                         # Lighthouse via playwright-lighthouse
```

`tests/e2e/audit.spec.ts` échoue si **performance**, **référencement** ou **accessibilité**
tombe sous **90**, pour `/` et une page `/article/**`, sur profils **mobile** et **bureau**.
Équivalent manuel : Lighthouse (onglet Chrome DevTools) sur les deux pages, profils mobile et
bureau, dans chaque thème.

## E. Non-régression du socle

```bash
npm run verifier           # 6 contrôles : porte 9 (pas d'URL en base, node:fs confiné) reste verte
npm run typecheck          # SeoArticleDTO, urlAbsolue, mappeur SEO typés
npm run test:unit          # urlAbsolue, metaSeoArticleDe, jsonldArticle
```

## Definition of Done

- [ ] A, B, C passent ; D atteint ≥ 90 sur les deux pages, deux profils, deux thèmes.
- [ ] `npm run verifier`, `typecheck`, `test:unit`, `test:e2e` verts.
- [ ] `public/brand/partage-defaut.png` généré (`scripts/partage-defaut.mjs`) et committé.
- [ ] Aucune migration, aucune URL de média en base, aucun accès stockage hors interface.

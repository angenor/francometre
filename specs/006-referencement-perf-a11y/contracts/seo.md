# Contrat — Référencement (métadonnées, canonique, redirection, robots)

Normatif. Toute URL absolue est bâtie sur `useRuntimeConfig().public.siteUrl`
(= `https://francometre.com`, apex), **jamais** sur l'en-tête `Host`. Complète le contrat
`003-pages-publiques/contracts/diffusion.md` (qui régit `rss.xml` et `sitemap.xml`).

## 1. Balises `<head>` communes (globales, `app.head`)

Présentes sur **toute** page :

- `<html lang="fr">` (existant).
- `<meta name="description">` par défaut (surchargée par page).
- `<meta property="og:site_name" content="Francomètre">`.
- `<meta name="twitter:card" content="summary_large_image">`.
- `<link rel="alternate" type="application/rss+xml" title="Francomètre" href="{siteUrl}/rss.xml">`.

## 2. Par page

| Page | Titre (exact) | Description | `<link rel="canonical">` | `robots` |
|---|---|---|---|---|
| `/` | `Francomètre — L'actualité, mesurée.` | propre, non vide | `{siteUrl}/` | index (défaut) |
| `/rubrique/{id}` | `{Libellé} — Francomètre` | propre | `{siteUrl}/rubrique/{id}` (+`?page=N` si N>1) | index |
| `/articles` | `Tous les articles — Francomètre` | propre | `{siteUrl}/articles` (+`?page=N` si N>1) | index |
| `/article/{slug}` | `{Titre} — Francomètre` | `= chapô` (tronqué proprement ≤ ~160) | `seo.canonical` | index |
| `/connexion` | `Connexion — Francomètre` | propre | `{siteUrl}/connexion` | **`noindex, follow`** |
| `error.vue` (404/503) | selon l'état | propre | — | **`noindex, follow`** |
| `/admin/**` | interface | — | — | en-tête **`X-Robots-Tag: noindex`** |

Règles :
- La marque s'écrit **« Francomètre »** (accent) dans **tout** titre.
- Le **titre est nu** : aucun préfixe de sous-thème n'entre dans `title`, `og:title`,
  `headline`.
- Canonique **absolue**, normalisée : pas de barre finale superflue ; le paramètre `?page=N`
  (N>1) **fait partie** de la canonique (pagination indexable, D5) ; aucun autre paramètre
  (suivi, casse) n'entre dans la canonique.

## 3. Open Graph / Twitter — page article

Depuis `ArticlePageDTO.seo` :

```
og:type            = article
og:title           = {Titre}                      (nu)
og:description     = {chapô}
og:url             = seo.canonical
og:image           = seo.imageAbsolue ?? {siteUrl}/brand/partage-defaut.png
article:published_time = seo.publieISO
article:modified_time  = seo.modifieISO
article:section        = seo.section
article:author         = seo.auteur               (omis si null)
twitter:title / twitter:description / twitter:image  = miroirs des og:*
```

Pages **non-article** : `og:image` = image de partage par défaut ; `og:type = website`.

## 4. Données structurées — page article

Un `<script type="application/ld+json">` par page article, objet `NewsArticle` produit par
`shared/utils/jsonldArticle.ts` (forme et replis : `data-model.md` §3). Doit être un JSON
valide, unique, présent uniquement sur les pages d'article publiées.

## 5. Redirection `www` → apex (middleware Nitro)

- **Entrée** : requête dont l'en-tête `Host` commence par `www.`.
- **Sortie** : **301** vers `{siteUrl}{event.path}` (query comprise).
- **Cible** : toujours la `siteUrl` configurée — `Host` ne sert qu'à **détecter** la variante.
- Aucun effet quand `Host` n'est pas en `www.` (local, tests, apex).

## 6. `robots.txt` (route dynamique `GET /robots.txt`)

```
User-agent: *
Allow: /
Disallow: /admin
Sitemap: {siteUrl}/sitemap.xml
```

`Content-Type: text/plain; charset=utf-8`. `{siteUrl}` = valeur d'exécution (surcharge
`NUXT_PUBLIC_SITE_URL` respectée).

## 7. Critères de vérification (mappés aux SC)

- **SC-004** : `GET /` sous `Host: www.francometre.com` → 301 vers l'apex ; chaque page porte
  sa canonique.
- **SC-005** : titre + description non vides sur chaque page, marque « Francomètre ».
- **SC-007** : la page article porte un `NewsArticle` valide (titre, date, section, auteur,
  image).
- **SC-002** : `og:image` d'un article **sans** couverture = image de partage par défaut.

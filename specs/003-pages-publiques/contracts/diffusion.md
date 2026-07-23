# Contrat — Diffusion (flux & plan du site)

Deux routes Nitro servant du XML. Toutes deux : n'incluent **que** des articles publiés et
datés (FR-025), ordonnent du plus récent au plus ancien, et produisent des liens **absolus**
préfixés par l'origine `runtimeConfig.public.siteUrl` (défaut `https://francometre.com`).
Aucune URL de média n'est stockée : les URL éventuelles sont calculées via `stockage.url`
puis rendues absolues (research D6).

---

## GET /rss.xml

Flux RSS 2.0 des derniers articles publiés (US5).

- **Sortie** `200`, `Content-Type: application/rss+xml; charset=utf-8`.
- **Enveloppe** `<rss version="2.0"><channel>` :
  - `<title>` Francomètre · `<link>` origine · `<description>` (accroche du site) ·
    `<language>fr</language>`.
- **`<item>`** par article (borné aux derniers publiés) :

  | Élément | Source |
  |---|---|
  | `<title>` | `titre` (échappé) |
  | `<link>` / `<guid isPermaLink="true">` | `{origine}/article/{slug}` |
  | `<pubDate>` | `publieLe` au format RFC 822 |
  | `<description>` | `chapo` (échappé) |
  | `<category>` | libellé de rubrique |

- **Source** : `listerArticlesPublics({ limite })`. Tri `publieLe desc`.
- **Échappement** : toutes les valeurs texte sont échappées XML (`& < > " '`).

---

## GET /sitemap.xml

Plan du site (US5).

- **Sortie** `200`, `Content-Type: application/xml; charset=utf-8`.
- **Enveloppe** `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`.
- **`<url>`** pour :
  1. l'accueil `{origine}/`
  2. `{origine}/articles`
  3. les **8** rubriques `{origine}/rubrique/{id}` (`listerRubriques()`)
  4. chaque **article publié et daté** `{origine}/article/{slug}`, `<lastmod>` =
     `modifieLe` (ou `publieLe`) au format `YYYY-MM-DD`.
- **Sources** : `listerRubriques()`, `listerArticlesPublics({})` (tous les visibles).
- **Exclusion** : aucun brouillon, aucun article non encore daté (FR-025).

---

## Origine du site

- Configurée par `runtimeConfig.public.siteUrl` (via variable d'environnement en production,
  `https://francometre.com` par défaut). Aucune origine en dur, aucune dérivation depuis
  l'en-tête `Host` (non fiable, casse la reproductibilité des tests).
- Le flux et le plan du site sont les **seuls** endroits produisant des URL absolues ; ils
  composent `origine + chemin`, le chemin restant relatif partout ailleurs.

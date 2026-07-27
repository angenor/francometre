import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

// Chemin ABSOLU du fournisseur d'images `medias` (résolu tel quel par
// @nuxt/image, sans ambiguïté d'alias).
const FOURNISSEUR_MEDIAS = fileURLToPath(new URL('./providers/medias.ts', import.meta.url))

// `traceInclude` attend des CHEMINS DE FICHIERS, pas des noms de paquets : un
// nom nu est résolu relativement à la racine du projet et provoque
// « File …/better-sqlite3 does not exist » à la compilation. research.md D15
// donne la recette sous forme de nom — elle est à traduire avant usage.
const requis = createRequire(import.meta.url)

// Origine absolue du site — une SEULE source, partagée par `runtimeConfig` (que
// lisent les routes serveur `rss.xml`/`sitemap.xml`/`robots.txt`) et par les
// défauts `app.head` (lien du flux RSS, FR-005). Surchargeable par
// `NUXT_PUBLIC_SITE_URL` ; jamais dérivée de l'en-tête `Host`, qui n'est pas
// fiable et casserait la reproductibilité des tests (research D2).
const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL ?? 'https://francometre.com'

// Description de repli commune à toute page sans description propre (FR-002).
// Chaque page la SURCHARGE via `useSeoMeta` ; celle-ci ne s'affiche que là où
// rien n'a été posé.
const DESCRIPTION_DEFAUT
  = 'Francomètre — l\'actualité française, mesurée : huit rubriques, une Une '
    + 'éditorialisée, des analyses sobres et vérifiées.'

// Francomètre — configuration du socle.
// Tailwind v4 est raccordé par son plugin Vite : ni `@nuxtjs/tailwindcss`,
// ni `tailwind.config.js`. Toute la configuration des styles tient dans
// `app/assets/css/main.css` (voir research.md D1 et D2).
export default defineNuxtConfig({
  compatibilityDate: '2026-07-18',

  // Les outils de développement injectent une surcouche flottante dans la page.
  // Elle intercepte le survol, s'ajoute à l'arbre d'accessibilité analysé par
  // axe-core, et fausse donc précisément ce que cette feature doit prouver.
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/color-mode',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/icon',
    'nuxt-auth-utils',
  ],

  css: ['~/assets/css/main.css'],

  // `/admin/**` ne se met JAMAIS en cache : sans cela, le cache de l'historique
  // (bfcache) réafficherait une page d'administration après déconnexion, via le
  // bouton « précédent » (FR-013). `no-store` la force à être redemandée — le
  // middleware de refus par défaut s'exécute alors et renvoie à la connexion.
  // Pages de LISTE : cache `swr` (stale-while-revalidate), servi instantanément
  // et revalidé en arrière-plan, borné à 30 s (< 60 s pour SC-009). Contenu
  // PUBLIC, aucune donnée par visiteur → cache partagé sûr ; la HTML est
  // agnostique au thème (la classe `.dark` est posée côté client avant peinture,
  // aucun flash — porte 5). L'administration, elle, ne se met JAMAIS en cache et
  // n'est jamais indexée : `X-Robots-Tag: noindex` convient à une administration
  // rendue côté client, sans toucher au refus par défaut (FR-006, porte 12).
  routeRules: {
    '/': { swr: 30 },
    '/articles': { swr: 30 },
    '/articles/**': { swr: 30 },
    '/rubrique/**': { swr: 30 },
    '/admin': { headers: { 'cache-control': 'no-store', 'X-Robots-Tag': 'noindex' } },
    '/admin/**': { headers: { 'cache-control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  },

  // `AppShell`, `RubriqueIcon`… plutôt que `LayoutAppShell`, `UiRubriqueIcon` :
  // les deux dossiers séparent la charpente des composants qu'elle emploie,
  // ils n'ont pas à alourdir les noms d'usage. Les composants publics des pages
  // (Une, grille, pagination, fil d'Ariane…) suivent la même règle sans préfixe.
  components: [
    { path: '~/components/layout', pathPrefix: false },
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/public', pathPrefix: false },
    { path: '~/components/admin', pathPrefix: false },
  ],

  // Origine absolue du site — seul le flux RSS et le plan du site en composent
  // des URL absolues (contrats/diffusion, research D6). Surchargeable en
  // production par `NUXT_PUBLIC_SITE_URL` ; jamais dérivée de l'en-tête `Host`,
  // qui n'est pas fiable et casserait la reproductibilité des tests.
  runtimeConfig: {
    // Session de nuxt-auth-utils — cookie scellé, AUCUNE table (research D1/D2).
    // Le secret vient de `NUXT_SESSION_PASSWORD` (≥ 32 caractères, jamais
    // commité) : le module le lit seul, il n'a pas à figurer ici.
    //
    // `maxAge` = 30 jours en secondes, terme ABSOLU : posé à la connexion, il
    // n'est PAS repoussé par l'activité (clarification « durée absolue 30 j »,
    // research D2). Cookie durci : `httpOnly` (hors de portée du JS, anti-XSS),
    // `secure` (HTTPS seul), `sameSite: 'strict'` (aucun envoi cross-site — un
    // back-office n'a aucun flux cross-site légitime, défense CSRF de fond).
    session: {
      maxAge: 2_592_000,
      name: 'fm_session',
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      },
    },

    public: {
      siteUrl: SITE_URL,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  // `better-sqlite3` et `sharp` sont des modules natifs qui localisent leur
  // binaire `.node` par une résolution dynamique que l'analyse statique rate
  // régulièrement — le symptôme (`Could not locate the bindings file`) apparaît
  // au DÉMARRAGE du serveur compilé, pas à la compilation (research.md D15/D7).
  // `sharp` est importé directement par `server/utils/image.ts` (téléversement) :
  // le tracer garantit que son binaire est embarqué au bundle.
  //
  // Interface de nitropack 2.13.4, vérifiée dans node_modules : `inline`,
  // `external`, `traceInclude`. Les `noExternals` et `traceDeps` que documente
  // nitro.build relèvent de Nitro v3 et n'existent pas ici.
  nitro: {
    // Pré-compresse les assets statiques (JS, CSS, polices) au build : le serveur
    // node les sert alors en gzip/brotli sans dépendre d'un proxy amont — le JS
    // du socle (~231 Ko) tombe à ~70 Ko, ce qui débloque le FCP/LCP sur réseau
    // lent (SC-001, profil mobile). Portable : aucune dépendance externe.
    compressPublicAssets: { gzip: true, brotli: true },

    externals: {
      external: ['better-sqlite3', '@prisma/adapter-better-sqlite3', 'sharp'],
      traceInclude: [requis.resolve('better-sqlite3'), requis.resolve('sharp')],
    },

    // Le troisième contexte de types. `typescript.tsConfig` et
    // `typescript.sharedTsConfig` couvrent l'application et `shared/` ; le
    // tsconfig du serveur est produit par Nitro et se règle ici. Voir le bloc
    // `typescript` plus bas pour la raison de l'option.
    typescript: {
      tsConfig: {
        compilerOptions: { allowImportingTsExtensions: true },
      },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        // Défauts de référencement (research D1). Chaque page les surcharge par
        // `useSeoMeta` (`description`, `og:*` d'article) ; ceux-ci sont les
        // valeurs de repli communes.
        { name: 'description', content: DESCRIPTION_DEFAUT },
        { property: 'og:site_name', content: 'Francomètre' },
        { name: 'twitter:card', content: 'summary_large_image' },
        // Aperçu de partage par défaut (FR-010). La page article SURCHARGE
        // `og:image` (sa couverture) et `og:type` (`article`) — unhead déduplique
        // par propriété, il ne reste alors qu'une seule balise de chaque.
        { property: 'og:image', content: `${SITE_URL}/brand/partage-defaut.png` },
        { property: 'og:type', content: 'website' },
      ],
      link: [
        // Icône de navigateur — le « F » du mot-symbole, composé par
        // `scripts/favicon.mjs`. Les deux premières lignes ne sont pas
        // redondantes : le SVG passe en tête parce qu'il est net à toute taille
        // ET qu'il suit le thème du système ; l'ICO reste pour ce qui ne lit
        // pas le SVG, et c'est aussi lui que réclament les agents qui
        // demandent `/favicon.ico` sans regarder l'en-tête.
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', sizes: '48x48', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        // Flux RSS déclaré dans l'en-tête de TOUTE page (FR-005). URL absolue
        // bâtie sur `siteUrl`, jamais sur l'en-tête `Host`.
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'Francomètre',
          href: `${SITE_URL}/rss.xml`,
        },
      ],
    },
  },

  // `classSuffix: ''` n'est pas un confort : sans lui `<html>` porte `dark-mode`,
  // et ni les tokens ni `@custom-variant dark` ne s'appliquent (research.md D5).
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'francometre-theme',
  },

  // Polices auto-hébergées : aucun CDN, aucune requête tierce au premier rendu.
  // Graisses limitées à ce que `tokens.md` §2 déclare (research.md D11).
  fonts: {
    families: [
      { name: 'Archivo', provider: 'google', weights: [400, 500, 600, 700, 800] },
      { name: 'Instrument Sans', provider: 'google', weights: [400, 500, 600] },
    ],
  },

  // Fournisseur d'images `medias` (research D10). Les couvertures ne sont PAS
  // des fichiers de `public/` : elles sont servies par la route
  // `server/routes/medias/[...cle]` — donc par l'interface `Stockage` (porte 9),
  // qui produit AUSSI les variantes redimensionnées en ligne (`?w=&f=&q=`). Le
  // fournisseur compose ces adresses ; aucun service tiers, aucune requête que le
  // serveur s'adresserait à lui-même. Le jour du passage à S3, rien ne change :
  // la route sert alors depuis S3. `screens` alimente le `srcset` de `<NuxtImg>`.
  image: {
    quality: 80,
    format: ['webp'],
    screens: { xs: 375, sm: 640, md: 768, socle: 1000, lg: 1024, xl: 1280, xxl: 1440 },
    provider: 'medias',
    providers: {
      medias: { provider: FOURNISSEUR_MEDIAS },
    },
  },

  // Les huit pictogrammes de rubrique sont les tracés des maquettes, servis
  // comme collection locale — pas remplacés par une bibliothèque générique.
  //
  // Les pictogrammes des liens « Suivre » sont dessinés au même trait (1,75,
  // extrémités rondes, `currentColor`) et servis de la même façon : locale, donc
  // aucune requête vers l'API Iconify au chargement d'une page.
  icon: {
    customCollections: [
      { prefix: 'rubrique', dir: './app/assets/icones/rubriques' },
      { prefix: 'reseau', dir: './app/assets/icones/reseaux' },
    ],
  },

  typescript: {
    strict: true,
    typeCheck: false,
    // `shared/utils/eyebrow.ts` importe `./rubriques.ts` avec son extension
    // réelle, parce qu'il est aussi chargé par
    // `node --experimental-strip-types` (scripts/essai-eyebrow.ts) et par le
    // seed, qui exigent le chemin exact là où Vite tolère l'omission. Sans
    // cette option, TypeScript refuse l'extension que Node réclame.
    //
    // L'option doit être posée sur CHAQUE contexte : Nuxt 4 génère un tsconfig
    // par périmètre (app, shared, node), et `tsConfig` seul ne couvre que
    // l'application. Sans effet à l'émission — le projet est en `noEmit`.
    tsConfig: {
      compilerOptions: { allowImportingTsExtensions: true },
    },
    sharedTsConfig: {
      compilerOptions: { allowImportingTsExtensions: true },
    },
  },
})

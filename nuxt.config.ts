import tailwindcss from '@tailwindcss/vite'

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
  ],

  css: ['~/assets/css/main.css'],

  // `AppShell`, `RubriqueIcon`… plutôt que `LayoutAppShell`, `UiRubriqueIcon` :
  // les deux dossiers séparent la charpente des composants qu'elle emploie,
  // ils n'ont pas à alourdir les noms d'usage.
  components: [
    { path: '~/components/layout', pathPrefix: false },
    { path: '~/components/ui', pathPrefix: false },
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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

  // Configuré ici, exploité par les features de contenu (research.md D11).
  image: {
    quality: 80,
    format: ['webp'],
    screens: { xs: 375, sm: 640, md: 768, socle: 1000, lg: 1024, xl: 1280, xxl: 1440 },
  },

  // Les huit pictogrammes de rubrique sont les tracés des maquettes, servis
  // comme collection locale — pas remplacés par une bibliothèque générique.
  icon: {
    customCollections: [
      { prefix: 'rubrique', dir: './app/assets/icones/rubriques' },
    ],
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})

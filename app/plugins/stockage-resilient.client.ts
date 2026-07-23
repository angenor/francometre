// Résilience du stockage — le site reste utilisable même sans `localStorage`.
//
// Certains navigateurs (mode privé strict, cookies bloqués) font JETER le seul
// accès à `window.localStorage`. Le plugin client de nuxt-auth-utils lit
// `localStorage` inconditionnellement au démarrage : sans garde, cet accès
// planterait l'hydratation et figerait toute la page — y compris la bascule de
// thème (constitution, principe IV ; `tests/e2e/theme.spec.ts` « Stockage
// indisponible »).
//
// Ce garde s'exécute AVANT les autres plugins (`enforce: 'pre'`). En
// fonctionnement normal il ne fait RIEN : l'accès ne jette pas. Quand il jette,
// il installe un repli EN MÉMOIRE — le site reste utilisable, seule la
// persistance entre visites est perdue (exactement le contrat attendu).

export default defineNuxtPlugin({
  name: 'stockage-resilient',
  enforce: 'pre',
  setup() {
    try {
      // L'accès lui-même déclenche l'accesseur : c'est lui qui peut jeter.
      void window.localStorage
      return
    }
    catch {
      // Stockage refusé : on pose un substitut mémoire, non persistant.
    }

    const memoire = new Map<string, string>()
    const substitut: Storage = {
      getItem: (cle) => (memoire.has(cle) ? memoire.get(cle)! : null),
      setItem: (cle, valeur) => {
        memoire.set(cle, String(valeur))
      },
      removeItem: (cle) => {
        memoire.delete(cle)
      },
      clear: () => {
        memoire.clear()
      },
      key: (index) => [...memoire.keys()][index] ?? null,
      get length() {
        return memoire.size
      },
    }

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => substitut,
    })
  },
})

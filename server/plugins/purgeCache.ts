// Purge le cache de rendu des pages publiques dès qu'une écriture
// d'administration aboutit.
//
// POURQUOI : `routeRules` met `/`, `/articles/**` et `/rubrique/**` en `swr`
// (nuxt.config.ts). Passé la fraîcheur, Nitro sert quand même l'entrée PÉRIMÉE
// et ne revalide qu'en arrière-plan : sur un site peu fréquenté, la première
// visite d'une rubrique après une suppression ou une publication rend l'état
// D'AVANT — parfois vieux de plusieurs heures. La rédaction voyait ainsi
// réapparaître des articles supprimés.
//
// La purge est GLOBALE et non ciblée : un article touche l'accueil, sa page, sa
// rubrique et la pagination des trois. Recalculer quelques pages coûte moins
// cher que raisonner sur les dépendances — et ne peut pas se tromper.
//
// PAR INSTANCE, comme le cache lui-même (mémoire du processus Nitro) : à revoir
// si le projet passe multi-instance, avec un stockage de cache partagé.

const METHODES_ECRITURE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Les deux familles de clés qu'une page `swr` laisse dans le stockage `cache` —
// RELEVÉES sur le serveur, pas déduites : une route rule passe par le groupe
// `nitro/routes` (et NON `nitro/handlers`, réservé aux `defineCachedEventHandler`
// explicites), et Nuxt garde à côté le payload SSR de la page.
//
// `nuxt:icon:*` vit dans le même stockage et n'est PAS purgé : les icônes ne
// dépendent pas du contenu, et les regénérer coûterait cher pour rien.
const PREFIXES_PAGES = ['nitro:routes', 'nuxt:payload']

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event) => {
    if (!event.path.startsWith('/api/admin/')) return
    if (!METHODES_ECRITURE.has(event.method)) return
    // Une écriture refusée (401, 422…) n'a rien changé : garder le cache.
    if (getResponseStatus(event) >= 400) return

    try {
      // Énumérer puis retirer une à une, plutôt que `clear(préfixe)` : sur le
      // stockage de cache par défaut, `clear` préfixé ne retire rien (vérifié
      // en préversion de production, le cache survivait à la purge).
      const cache = useStorage('cache')
      const cles = await cache.getKeys()
      await Promise.all(
        cles
          .filter(cle => PREFIXES_PAGES.some(prefixe => cle.startsWith(prefixe)))
          .map(cle => cache.removeItem(cle, { removeMeta: true })),
      )
    }
    catch (erreur) {
      // Un cache non purgé est une gêne, pas une panne : l'écriture est déjà
      // faite et la réponse part quand même.
      console.error('[purgeCache] Purge du cache des pages impossible.', erreur)
    }
  })
})

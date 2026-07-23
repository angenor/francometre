// Refus par défaut du préfixe /admin — barrière d'AFFICHAGE.
//
// Global et fondé sur le PRÉFIXE : toute page `/admin/*`, présente ou à venir,
// est protégée SANS opt-in. Le refus ne se déduit pas d'une absence
// d'interdiction (principe VII, porte 12). S'exécute au SSR comme au client.
//
// Ce middleware protège ce qui s'AFFICHE ; la sécurité réelle des données tient
// au garde serveur `exigerCompte` (server/utils/session.ts), qu'un client ne
// peut pas contourner. Les deux sont nécessaires, aucun ne suffit seul.

export default defineNuxtRouteMiddleware((to) => {
  const surAdmin = to.path === '/admin' || to.path.startsWith('/admin/')
  if (!surAdmin) return

  const { loggedIn } = useUserSession()
  if (loggedIn.value) return

  // Non connecté : vers la connexion, en mémorisant la destination pour y
  // revenir après (le serveur la revalidera comme chemin interne).
  return navigateTo('/connexion?retour=' + encodeURIComponent(to.fullPath))
})

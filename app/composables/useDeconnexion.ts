// La déconnexion — un seul geste, partagé par le rail et la barre repliée.
//
// Efface la session côté serveur (POST), rafraîchit l'état de session côté
// client, puis renvoie à la connexion. Réutilisé pour ne pas dupliquer la
// séquence (et ses trois `await` dans le bon ordre) à deux endroits.

export function useDeconnexion() {
  const { fetch: rafraichirSession } = useUserSession()

  async function seDeconnecter() {
    await $fetch('/api/auth/deconnexion', { method: 'POST' })
    await rafraichirSession()
    await navigateTo('/connexion')
  }

  return { seDeconnecter }
}

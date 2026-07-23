import { LIMITE_FENETRE_MS, LIMITE_SEUIL } from '../utils/limiteDebit'

// Rend VISIBLES, au démarrage, les limites assumées de la limitation de débit
// (research D6) : l'état est en MÉMOIRE, PAR INSTANCE, REMIS À ZÉRO au
// redémarrage, et suppose l'IP client correctement transmise. Ce n'est pas un
// compteur partagé — à remplacer si le projet passe multi-instance.

export default defineNitroPlugin(() => {
  const minutes = Math.round(LIMITE_FENETRE_MS / 60000)
  console.log(
    `[limiteDebit] Connexion : ${LIMITE_SEUIL} tentatives / ${minutes} min par IP — `
    + 'état en mémoire, par instance, remis à zéro au redémarrage.',
  )
})

import { ErreurValidation } from '../validation/erreurs'

// Frontière métier → HTTP.
//
// Les services et la validation lèvent `ErreurValidation` — un refus dont le
// message est déjà en français et destiné à être lu. Cette frontière le
// convertit en **400** avec ce message, une seule fois, plutôt que de répéter le
// même `try/catch` dans chaque route `/api/admin/**` (contrat routes-serveur :
// « 400 avec un message français explicite, jamais l'erreur Prisma brute »).
//
// Toute AUTRE erreur — le 401 d'`exigerCompte`, une panne — traverse telle
// quelle : elle n'est pas un refus métier et ne doit pas être maquillée en 400.

/**
 * Exécute une opération de service/validation et mappe son refus métier en 400.
 * `exigerCompte` s'appelle EN DEHORS de ce wrapper (son 401 doit rester un 401).
 */
export async function traiterMetier<T>(operation: () => Promise<T> | T): Promise<T> {
  try {
    return await operation()
  }
  catch (erreur) {
    if (erreur instanceof ErreurValidation) {
      throw createError({ statusCode: 400, statusMessage: erreur.message })
    }
    throw erreur
  }
}

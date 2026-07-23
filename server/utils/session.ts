import type { H3Event } from 'h3'
import { compteParIdentifiant } from '../services/comptes'

// Garde serveur — la barrière qui compte pour la SÉCURITÉ.
//
// Le middleware de route (`app/middleware/admin.global.ts`) protège l'AFFICHAGE ;
// un client peut le contourner. Ce garde protège les DONNÉES et les EFFETS :
// toute route serveur d'administration DOIT l'appeler en première ligne. Une
// route d'administration sans cet appel est un défaut de sécurité, pas une
// route « publique par oubli » (principe VII, refus par défaut).

/**
 * Exige une session valide ET un compte qui existe encore.
 *
 * 1. `requireUserSession` lève 401 si le cookie est absent, altéré ou expiré —
 *    on ne rattrape pas.
 * 2. Le compte est REVÉRIFIÉ en base : une session dont le compte a été
 *    supprimé ou renommé n'est plus une session (FR-016). C'est ce qui tient
 *    lieu de révocation SANS table de sessions : effacer un compte invalide ses
 *    cookies au prochain accès protégé.
 *
 * Retourne le `user` de session (avec `role`).
 */
export async function exigerCompte(event: H3Event) {
  const session = await requireUserSession(event)

  const compte = await compteParIdentifiant(session.user.identifiant)
  if (!compte) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Session invalide.' })
  }

  return session.user
}

// Déconnexion — efface la session. IDEMPOTENTE : appelée sans session, ou deux
// fois de suite, elle répond toujours 200 sans état incohérent (FR-012).
//
// `clearUserSession` remplace le cookie par un cookie vide et expiré : le
// prochain accès à `/admin` retombe sur le refus par défaut du middleware.

export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { ok: true }
})

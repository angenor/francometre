import { prisma } from '../utils/db'

// Fermeture propre de la connexion à l'arrêt du serveur.
//
// L'enjeu est MINCE avec SQLite en processus : il n'y a pas de pool distant à
// drainer. Le hook est branché quand même, par hygiène, et parce que
// PostgreSQL — la cible du principe VI — en tirera parti sans qu'on ait à y
// repenser le jour de la migration.
//
// Note de version : l'issue nitro#4015 (« node-server n'appelle jamais
// `close` ») concerne Nitro v3. En nitropack 2.13.4, `setupGracefulShutdown`
// appelle bien le hook `close` sur SIGTERM et SIGINT (research.md D16).

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('close', async () => {
    await prisma.$disconnect()
  })
})

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../prisma/generated/client'

// LE client unique du projet. Auto-importé par Nitro, qui parcourt
// `server/utils/` récursivement — raison pour laquelle le client GÉNÉRÉ vit
// sous `prisma/generated/` et surtout pas ici (research.md D2).
//
// Rien n'appelle Prisma en dehors de `server/services/` : c'est la seule
// garantie des quatre invariants que le schéma ne sait pas exprimer — rang dans
// 1–5, à la Une ⇒ publié, publié ⇒ couverture, éviction atomique (research.md D13).

function creerClient() {
  // En Prisma 7, `new PrismaClient()` SANS adaptateur échoue : ce n'est pas un
  // réglage, c'est le nouveau contrat. La classe s'écrit `PrismaBetterSqlite3`,
  // avec `Sqlite` et non `SQLite` (research.md D3).
  //
  // `timestampFormat` est figé dès maintenant : SQLite n'a pas de type date
  // natif, et laisser la valeur par défaut implicite rendrait une base relue
  // après migration ambiguë. Le format ISO se lit à l'œil nu dans un client SQL.
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
    timestampFormat: 'iso8601',
  })
  return new PrismaClient({ adapter })
}

// Le rechargement à chaud réévalue les modules serveur et créerait un client par
// rechargement, chacun gardant sa connexion ouverte. `import.meta.dev` plutôt
// que `process.env.NODE_ENV` : Nuxt le remplace statiquement, donc la branche
// disparaît entièrement du bundle de production (research.md D16).
const global_ = globalThis as unknown as { prisma?: ReturnType<typeof creerClient> }

export const prisma = global_.prisma ?? creerClient()

if (import.meta.dev) global_.prisma = prisma

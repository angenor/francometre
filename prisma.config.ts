// Prisma 7 ne charge plus `.env` implicitement : sans cette première ligne,
// `DATABASE_URL` est indéfinie et l'échec survient loin de sa cause (research.md D4).
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// L'import vient de `prisma/config`, pas de `@prisma/config` : le sous-chemin
// réexporte `defineConfig` et `env`, ce qui évite une dépendance directe de plus
// à garder alignée sur la version du CLI.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // La clé `prisma.seed` de package.json n'est plus lue en Prisma 7.
    seed: 'node --experimental-strip-types prisma/seed.ts',
  },
  datasource: { url: env('DATABASE_URL') },
})

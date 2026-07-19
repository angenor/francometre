import { defineConfig } from 'vitest/config'

// Les tests unitaires tournent en Node, sur une base SQLite éphémère par
// fichier (research.md D14). `tests/e2e/` est exclu explicitement : Playwright
// et Vitest emploient tous deux `test` et `expect`, et se marcheraient dessus.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    // Le harnais s'exécute AVANT le fichier de test, donc avant que
    // `server/utils/db.ts` ne lise `DATABASE_URL`. L'ordre est le mécanisme,
    // pas un détail de configuration.
    setupFiles: ['tests/unit/harnais.ts'],
  },
})

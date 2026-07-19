// Harnais des tests unitaires — une base SQLite éphémère par fichier de test.
//
// Ce fichier est déclaré en `setupFiles` de `vitest.config.ts`, et l'ordre
// compte : il s'exécute AVANT que le fichier de test — et donc avant que
// `server/utils/db.ts` — ne soit évalué. C'est ce qui permet de poser
// `DATABASE_URL` sur la base temporaire alors que le client Prisma est un
// singleton de module, sans que le code métier ait à recevoir un client injecté.
//
// `:memory:` est inutilisable ici, pour une raison rédhibitoire : le
// constructeur de l'adaptateur ne prend qu'une URL, jamais une connexion déjà
// ouverte. Chaque ouverture de `:memory:` crée une base privée et distincte, il
// n'existe donc aucun moyen d'y appliquer le schéma puis d'y brancher Prisma
// (research.md D14). D'où le fichier temporaire.

import Database from 'better-sqlite3'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach } from 'vitest'

const MIGRATIONS = join(process.cwd(), 'prisma', 'migrations')

const dossier = mkdtempSync(join(tmpdir(), 'francometre-test-'))
const fichierBase = join(dossier, 'test.db')

// Posé AVANT tout import du code métier : `server/utils/db.ts` lit cette
// variable à l'instanciation.
process.env.DATABASE_URL = `file:${fichierBase}`

/**
 * Le schéma s'applique par CONCATÉNATION des migrations, dans l'ordre lexical —
 * qui est l'ordre chronologique. C'est exactement ce que `migrate deploy`
 * appliquerait en production.
 *
 * `migrate diff --from-empty` a été écarté délibérément : il dérive le SQL du
 * *datamodel* et non des migrations, et divergerait silencieusement le jour où
 * une migration contiendrait du SQL édité à la main. Tester contre un schéma qui
 * n'est pas celui de production est pire que ne pas tester (research.md D14).
 */
function sqlDesMigrations(): string {
  return readdirSync(MIGRATIONS)
    .filter((entree) => !entree.startsWith('.') && entree !== 'migration_lock.toml')
    .sort()
    .map((entree) => readFileSync(join(MIGRATIONS, entree, 'migration.sql'), 'utf8'))
    .join('\n')
}

const base = new Database(fichierBase)
base.exec(sqlDesMigrations())

/** Les tables du schéma, hors tables internes de SQLite. */
const TABLES: string[] = base
  .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'`)
  .all()
  .map((ligne) => (ligne as { name: string }).name)

/**
 * Nettoyage entre tests par `DELETE`, contraintes désactivées le temps de
 * l'opération pour s'affranchir de l'ordre des tables.
 *
 * Le rollback par transaction a été écarté : Prisma n'expose pas de
 * `$rollback`, et le motif obligerait tout le code métier à accepter un client
 * transactionnel injecté (research.md D14).
 */
export function viderLaBase(): void {
  base.pragma('foreign_keys = OFF')
  for (const table of TABLES) base.prepare(`DELETE FROM "${table}"`).run()
  base.pragma('foreign_keys = ON')
}

/**
 * Joue le VRAI script de seed, en sous-processus, sur la base de test.
 *
 * Réimplémenter sa logique dans le harnais aurait rendu les tests de
 * rejouabilité (SC-002) sans valeur : ils auraient prouvé qu'une copie est
 * rejouable, pas le script que `prisma migrate reset` exécute réellement.
 */
export function jouerLeSeed(): void {
  execFileSync('node', ['--experimental-strip-types', 'prisma/seed.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: `file:${fichierBase}` },
    stdio: 'pipe',
  })
}

/**
 * Sème les huit rubriques SEULES, sans les articles d'exemple.
 *
 * C'est ce dont les tests de service ont besoin : des cibles de clés
 * étrangères, sur une table d'articles vide où leurs propres assertions de
 * comptage gardent un sens. `jouerLeSeed()` reste réservé aux tests qui portent
 * sur le seed lui-même.
 *
 * Le passage par le vrai script plutôt que par une liste recopiée est
 * délibéré : une seconde liste de rubriques dans les tests dériverait de la
 * première, et c'est précisément ce que `shared/utils/rubriques.ts` évite.
 */
export function semerRubriques(): void {
  jouerLeSeed()
  base.pragma('foreign_keys = OFF')
  base.prepare('DELETE FROM "Article"').run()
  base.prepare('DELETE FROM "Media"').run()
  base.pragma('foreign_keys = ON')
}

afterEach(() => {
  viderLaBase()
})

afterAll(() => {
  base.close()
  rmSync(dossier, { recursive: true, force: true })
})

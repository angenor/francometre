// Sauvegarde SQLite COHÉRENTE via l'API `.backup` de better-sqlite3.
//
// Une simple copie de fichier peut capturer une base en cours d'écriture (ou un
// WAL non fusionné) ; l'API de sauvegarde en ligne de SQLite produit, elle, un
// instantané intègre pendant que l'application tourne. Exécuté dans le conteneur
// par `deploy.sh backup` : `node /app/deploy/backup-db.mjs <fichier-cible>`.
import Database from 'better-sqlite3'

const source = process.env.DATABASE_FILE ?? '/data/db/francometre.db'
const cible = process.argv[2]

if (!cible) {
  console.error('Usage : node backup-db.mjs <fichier-cible>')
  process.exit(1)
}

const db = new Database(source, { readonly: true, fileMustExist: true })
await db.backup(cible)
db.close()
console.log(`Sauvegarde écrite : ${cible}`)

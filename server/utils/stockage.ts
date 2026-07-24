// L'interface UNIQUE vers le stockage des médias — porte 9 de la constitution.
//
// Ce fichier est le SEUL du projet autorisé à importer `node:fs`, et un contrôle
// de `scripts/verifier.mjs` le vérifie. Il est aussi le seul autorisé à produire
// une URL de média : toute autre construction d'adresse — concaténation,
// gabarit, préfixe en dur — est un défaut au sens de la porte 9.
//
// L'interface est posée maintenant, alors que rien ne téléverse encore, parce
// que l'objectif « migrer disque → S3 sans toucher au code métier » se tient à
// tout moment : une interface ajoutée après coup ne rattraperait jamais les
// appels directs déjà écrits (contracts/stockage.md).

import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export interface Stockage {
  /** Écrit ou remplace le contenu rangé sous cette clé. */
  put: (cle: string, contenu: Buffer, typeMime: string) => Promise<void>
  /** Lit le contenu rangé sous cette clé, ou `null` s'il n'existe pas. */
  get: (cle: string) => Promise<Buffer | null>
  /** Efface le contenu rangé sous cette clé. */
  delete: (cle: string) => Promise<void>
  /**
   * Calcule l'adresse d'affichage. PURE et SYNCHRONE : elle calcule, elle
   * n'interroge rien — c'est ce qui permet de l'appeler au rendu sans coût.
   */
  url: (cle: string) => string
  /**
   * Calcule l'adresse ABSOLUE d'affichage — la seule fabrique légitime d'URL
   * absolue de média (Open Graph, JSON-LD ; porte 9, research D6).
   *
   * Sur disque, `url` est relative : on la préfixe de l'`origine`. Le jour du
   * passage à S3, `url` sera DÉJÀ absolue et l'`origine` sera ignorée — cette
   * différence est encapsulée ICI, jamais par une concaténation ailleurs (qui
   * produirait un double préfixe le jour venu). PURE et SYNCHRONE comme `url`.
   */
  urlAbsolue: (cle: string, origine: string) => string
}

/** Racine locale des médias, hors du code. Le préfixe public la reflète. */
const RACINE_DISQUE = 'stockage/medias'
const PREFIXE_PUBLIC = '/medias'

/**
 * Les clés sont opaques pour l'appelant : il les reçoit et les rend. Elles ne
 * doivent en revanche jamais permettre de sortir de la racine — une clé
 * remontante transformerait l'interface en lecture arbitraire du disque.
 */
function cheminDe(cle: string): string {
  const propre = cle.replace(/^\/+/, '')
  if (propre.split('/').includes('..')) {
    throw new Error(`Clé de stockage invalide : « ${cle} » sort de la racine.`)
  }
  return join(RACINE_DISQUE, propre)
}

const stockageDisque: Stockage = {
  async put(cle, contenu) {
    const chemin = cheminDe(cle)
    await mkdir(dirname(chemin), { recursive: true })
    await writeFile(chemin, contenu)
  },

  async get(cle) {
    try {
      return await readFile(cheminDe(cle))
    }
    catch {
      // Absence de fichier et erreur de lecture se répondent pareil : `null`.
      // Distinguer les deux renseignerait un appelant sur ce qui existe.
      return null
    }
  },

  async delete(cle) {
    try {
      await unlink(cheminDe(cle))
    }
    catch {
      // Effacer ce qui n'existe pas n'est pas une erreur.
    }
  },

  url(cle) {
    return `${PREFIXE_PUBLIC}/${cle.replace(/^\/+/, '')}`
  },

  urlAbsolue(cle, origine) {
    // `origine` sans barre finale, `url(cle)` commence par « / » : la jonction
    // ne double jamais le séparateur.
    return origine.replace(/\/+$/, '') + this.url(cle)
  },
}

/**
 * Une variable d'environnement, une implémentation. Cette feature n'en livre
 * qu'une : `s3` est anticipée par l'interface, rien ne l'implémente. Déclarer la
 * valeur sans l'implémenter serait une promesse creuse — d'où le refus explicite
 * plutôt qu'un repli silencieux sur le disque.
 */
export function creerStockage(): Stockage {
  const choix = process.env.STOCKAGE ?? 'disque'
  if (choix === 'disque') return stockageDisque
  throw new Error(
    `Implémentation de stockage « ${choix} » inconnue. Seule « disque » est livrée `
    + `(contracts/stockage.md §3).`,
  )
}

export const stockage: Stockage = creerStockage()

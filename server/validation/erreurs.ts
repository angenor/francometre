import type { ZodType } from 'zod'

// Le refus est un livrable, pas un accident.
//
// SC-007 demande que 100 % des écritures refusent une entrée invalide par une
// erreur EXPLICITE. Deux échecs sont donc à éviter avec autant de soin l'un que
// l'autre : l'enregistrement silencieusement corrigé, et l'erreur technique
// brute — « Invalid `prisma.article.create()` invocation » ne dit rien à qui
// devra le lire.

/**
 * Un refus de validation ou d'invariant métier. Se distingue d'une panne : ce
 * qui est refusé ici l'est parce que la demande est invalide, pas parce que
 * quelque chose est cassé.
 */
export class ErreurValidation extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ErreurValidation'
  }
}

/**
 * Valide par Zod, ou lève une `ErreurValidation` dont le message est en
 * français — les messages par défaut de la bibliothèque sont en anglais.
 *
 * Les messages de plusieurs champs invalides sont réunis : refuser un
 * formulaire un champ à la fois ferait autant d'allers-retours que d'erreurs.
 */
export function valider<T>(schema: ZodType<T>, donnees: unknown): T {
  const resultat = schema.safeParse(donnees)
  if (resultat.success) return resultat.data

  const messages = resultat.error.issues.map((souci) => {
    const chemin = souci.path.join('.')
    return chemin === '' ? souci.message : `${chemin} : ${souci.message}`
  })

  throw new ErreurValidation(messages.join(' '))
}

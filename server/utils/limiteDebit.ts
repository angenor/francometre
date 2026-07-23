// Limitation de débit par IP — fenêtre glissante, EN MÉMOIRE.
//
// Écarte la force brute grossière sans table ni dépendance (FR-011a, research
// D6). L'état n'est pas persisté : `Map<clé, horodatages[]>`. Un refus renvoie
// le MÊME message générique que l'échec d'identifiants — aucune révélation.
//
// Limites ASSUMÉES : l'état est PAR INSTANCE et REMIS À ZÉRO au redémarrage, et
// dépend de la transmission correcte de l'IP client. Suffisant pour le
// déploiement mono-instance node-server du projet ; à remplacer par un compteur
// partagé si l'on passe multi-instance. Rien n'est persisté en base — la
// portabilité reste intacte.

/** Seuil de tentatives par clé dans la fenêtre. Réglage, pas contrat. */
export const LIMITE_SEUIL = Number(process.env.LIMITE_DEBIT_SEUIL ?? 10)

/** Largeur de la fenêtre glissante, en millisecondes (15 min par défaut). */
export const LIMITE_FENETRE_MS = Number(process.env.LIMITE_DEBIT_FENETRE_MS ?? 15 * 60 * 1000)

/** Horodatages des tentatives, par clé (l'IP). Purgés à chaque appel. */
const tentatives = new Map<string, number[]>()

/**
 * Enregistre une tentative pour `cle` et dit si elle est autorisée.
 *
 * Purge d'abord les horodatages hors fenêtre (c'est ce qui fait « glisser » la
 * fenêtre et rouvre l'accès avec le temps). Si le compte restant atteint déjà le
 * seuil → refus, sans rien enregistrer de plus. Sinon → la tentative est comptée
 * et autorisée.
 *
 * `maintenant` est injectable pour que les tests éprouvent la fenêtre de façon
 * déterministe (le runtime passe `Date.now()`).
 */
export function enregistrerEtVerifier(
  cle: string,
  maintenant: number = Date.now(),
): { autorise: boolean, reste: number } {
  const debutFenetre = maintenant - LIMITE_FENETRE_MS
  const recentes = (tentatives.get(cle) ?? []).filter((t) => t > debutFenetre)

  if (recentes.length >= LIMITE_SEUIL) {
    tentatives.set(cle, recentes)
    return { autorise: false, reste: 0 }
  }

  recentes.push(maintenant)
  tentatives.set(cle, recentes)
  return { autorise: true, reste: LIMITE_SEUIL - recentes.length }
}

/** Remet l'état à zéro. Réservé aux tests (l'état est un singleton de module). */
export function reinitialiserLimiteDebit(): void {
  tentatives.clear()
}

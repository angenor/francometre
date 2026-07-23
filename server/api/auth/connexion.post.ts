import { compteParIdentifiant, verifierMotDePasse } from '../../services/comptes'
import { valider } from '../../validation/erreurs'
import { cheminDeRetourSur, MESSAGE_ECHEC, schemaConnexion } from '../../validation/auth'
import { enregistrerEtVerifier, LIMITE_FENETRE_MS } from '../../utils/limiteDebit'

// Connexion — l'une des deux premières routes d'ÉCRITURE du projet.
//
// Tout ce qui suit converge vers un principe : AUCUN signal ne distingue les
// causes d'échec. Identifiant inconnu, mot de passe faux, champ vide → même
// statut, même message (FR-009/FR-011). Le mot de passe n'est ni journalisé, ni
// réaffiché, ni renvoyé — nulle part (FR-003/SC-005). La limitation de débit
// (429, même message) s'ajoute en tête en Phase 5 (T027).

/** Échec d'authentification — toujours le même, quelle qu'en soit la cause. */
function echec() {
  return createError({ statusCode: 401, statusMessage: MESSAGE_ECHEC })
}

export default defineEventHandler(async (event) => {
  // 1. Limitation de débit par IP — en tête. Au-delà du seuil dans la fenêtre :
  //    429 avec le MÊME message générique (aucune révélation — FR-011a). Le
  //    signal reste indistinct d'un simple échec d'identifiants.
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'inconnue'
  const { autorise } = enregistrerEtVerifier(ip)
  if (!autorise) {
    setResponseHeader(event, 'retry-after', Math.ceil(LIMITE_FENETRE_MS / 1000))
    throw createError({ statusCode: 429, statusMessage: MESSAGE_ECHEC })
  }

  const body = await readBody(event)

  // La validation ne fait que STRUCTURER l'entrée (présence des champs). Son
  // échec ne se raconte pas par champ : il retombe sur l'échec générique, comme
  // un mauvais mot de passe.
  let donnees
  try {
    donnees = valider(schemaConnexion, body)
  }
  catch {
    throw echec()
  }

  const admis = await verifierMotDePasse(donnees.identifiant, donnees.motDePasse)
  if (!admis) throw echec()

  // Le compte existe forcément si la vérification a réussi ; on le relit pour
  // charger l'identité de session (id, nom, rôle) — jamais l'empreinte.
  const compte = await compteParIdentifiant(donnees.identifiant)
  if (!compte) throw echec()

  await setUserSession(event, {
    user: {
      id: compte.id,
      identifiant: compte.identifiant,
      nomAffichable: compte.nomAffichable,
      role: compte.role,
    },
  })

  // Destination post-connexion : le `retour` validé côté serveur (chemin interne
  // uniquement, anti-open-redirect), sinon `/admin`. Le client s'y rend.
  return { ok: true, redirection: cheminDeRetourSur(body?.retour) }
})

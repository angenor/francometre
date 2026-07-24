import type { ArticleEditionDTO } from '#shared/types/dto'
import type { RubriqueId } from '#shared/utils/rubriques'

// L'état d'édition d'un article + l'AUTOSAVE (research.md D8).
//
// Un seul composable pour la création (`nouveau.vue`) et l'édition (`[id].vue`) :
//   · CRÉATION PARESSEUSE — sans `id`, le premier enregistrement fait un POST
//     qui crée le brouillon, récupère l'`id`, puis remplace l'URL sans recharger
//     (History API : la page reste montée, l'éditeur garde son état) ;
//   · AUTOSAVE débouncé (~1,5 s) via PATCH, TOUJOURS à l'état brouillon ;
//   · un échec n'efface JAMAIS la saisie ; un 401 (session expirée) conserve la
//     saisie et renvoie à la connexion.
//
// L'autosave ne publie jamais : `publier`/`depublier` sont des actions séparées,
// gardées côté serveur par leurs routes dédiées.

const DELAI_AUTOSAVE = 1500

/** ISO → `YYYY-MM-DD` pour le champ date ; chaîne vide si absent/illisible. */
function versDateInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

function messageServeur(erreur: unknown, defaut: string): string {
  const data = (erreur as { data?: { statusMessage?: string, message?: string } })?.data
  return data?.statusMessage || data?.message || defaut
}
function estExpiree(erreur: unknown): boolean {
  return (erreur as { statusCode?: number })?.statusCode === 401
}

export function useEditeurArticle(initial?: ArticleEditionDTO) {
  const id = ref<string | null>(initial?.id ?? null)

  // — Contenu principal —
  const titre = ref(initial?.titre ?? '')
  const chapo = ref(initial?.chapo ?? '')
  const corpsHtml = ref(initial?.corpsHtml ?? '')

  // — Réglages —
  const sousTheme = ref(initial?.sousTheme ?? '')
  const rubriqueId = ref<RubriqueId>(initial?.rubriqueId ?? RUBRIQUES[0]!.id)
  const couverture = ref<{ id: string, url: string } | null>(
    initial?.couverture ? { id: initial.couverture.id, url: initial.couverture.url } : null,
  )
  const couvertureAlt = ref(initial?.couverture?.alt ?? '')
  const datePublication = ref(versDateInput(initial?.publieLe ?? null))
  const aLaUne = ref(initial?.rangUne != null)
  const rangUne = ref<number | null>(initial?.rangUne ?? null)

  // — État —
  const statut = ref<'brouillon' | 'publie'>(initial?.statut ?? 'brouillon')
  const etatEnregistrement = ref<'enregistre' | 'en-cours' | 'echec'>('enregistre')
  const dernierEnregistrement = ref<string | null>(initial?.modifieLe ?? null)
  const messagePublication = ref<string | null>(null)

  /**
   * Prêt à enregistrer : un titre suffit (un brouillon peut être incomplet ; la
   * rubrique est toujours définie, le chapô et le corps peuvent rester vides).
   * Tant que le titre manque, on ne crée rien — l'autosave patiente, la saisie
   * n'a pas encore d'identité.
   */
  const pretAEnregistrer = computed(() => titre.value.trim() !== '')

  /** Les champs éditables — jamais `statut`/`publieLe`/`rangUne` (pas de publication). */
  function chargeUtile() {
    return {
      titre: titre.value,
      chapo: chapo.value,
      corps: corpsHtml.value,
      rubriqueId: rubriqueId.value,
      sousTheme: sousTheme.value.trim(),
      couvertureId: couverture.value?.id ?? null,
      couvertureAlt: couverture.value ? couvertureAlt.value.trim() : null,
    }
  }

  /** Recale l'état local depuis une réponse serveur (après save, publish, etc.). */
  function appliquer(dto: ArticleEditionDTO) {
    id.value = dto.id
    statut.value = dto.statut
    rangUne.value = dto.rangUne
    aLaUne.value = dto.rangUne != null
    datePublication.value = versDateInput(dto.publieLe)
    couverture.value = dto.couverture
      ? { id: dto.couverture.id, url: dto.couverture.url }
      : null
    couvertureAlt.value = dto.couverture?.alt ?? ''
    dernierEnregistrement.value = dto.modifieLe
  }

  async function redirigerConnexion() {
    const retour = id.value ? `/admin/articles/${id.value}` : '/admin/articles/nouveau'
    await navigateTo('/connexion?retour=' + encodeURIComponent(retour))
  }

  // — Enregistrement (cœur partagé par l'autosave et le bouton explicite) —
  let minuteur: ReturnType<typeof setTimeout> | undefined

  async function enregistrer() {
    if (!pretAEnregistrer.value) return
    clearTimeout(minuteur)
    etatEnregistrement.value = 'en-cours'
    try {
      if (id.value === null) {
        const dto = await $fetch<ArticleEditionDTO>('/api/admin/articles', {
          method: 'POST',
          body: chargeUtile(),
        })
        appliquer(dto)
        // Remplacement d'URL SANS navigation : la page reste montée, l'éditeur
        // garde son état ; un rechargement chargerait alors `[id].vue`.
        if (import.meta.client) {
          window.history.replaceState(window.history.state, '', `/admin/articles/${dto.id}`)
        }
      }
      else {
        const dto = await $fetch<ArticleEditionDTO>(`/api/admin/articles/${id.value}`, {
          method: 'PATCH',
          body: chargeUtile(),
        })
        dernierEnregistrement.value = dto.modifieLe
      }
      etatEnregistrement.value = 'enregistre'
    }
    catch (erreur) {
      if (estExpiree(erreur)) {
        await redirigerConnexion()
        return
      }
      // La saisie n'est PAS perdue : seul l'indicateur signale l'échec.
      etatEnregistrement.value = 'echec'
    }
  }

  function planifierAutosave() {
    clearTimeout(minuteur)
    minuteur = setTimeout(enregistrer, DELAI_AUTOSAVE)
  }

  // Toute modification de contenu ou de réglage NON-publication déclenche
  // l'autosave débouncé. `statut`/`rangUne`/`datePublication` en sont exclus :
  // ils ne passent que par la publication.
  watch(
    [titre, chapo, corpsHtml, sousTheme, rubriqueId, couverture, couvertureAlt],
    planifierAutosave,
  )

  onScopeDispose(() => clearTimeout(minuteur))

  // — Actions explicites —

  /** Enregistre immédiatement le brouillon (bouton « Enregistrer le brouillon »). */
  async function enregistrerBrouillon() {
    await enregistrer()
  }

  /**
   * Publie (FR-017/021/025). Enregistre d'abord (l'article doit exister et être
   * à jour), puis POST `publier` avec une date éventuelle (le FUTUR est accepté,
   * embargo) et un rang éventuel. Un refus nommé (couverture/alt/chapô/corps
   * manquant) remonte dans `messagePublication`.
   */
  async function publier() {
    messagePublication.value = null
    await enregistrer()
    if (id.value === null) {
      messagePublication.value = 'Renseignez au moins un titre et un chapô avant de publier.'
      return false
    }
    try {
      const dto = await $fetch<ArticleEditionDTO>(`/api/admin/articles/${id.value}/publier`, {
        method: 'POST',
        body: {
          publieLe: datePublication.value
            ? new Date(datePublication.value).toISOString()
            : undefined,
          aLaUne: aLaUne.value && rangUne.value ? { rang: rangUne.value } : undefined,
        },
      })
      appliquer(dto)
      return true
    }
    catch (erreur) {
      if (estExpiree(erreur)) {
        await redirigerConnexion()
        return false
      }
      messagePublication.value = messageServeur(erreur, 'La publication a échoué.')
      return false
    }
  }

  /** Repasse en brouillon (FR-017) : libère le rang de Une, conserve `publieLe`. */
  async function depublier() {
    if (id.value === null) return
    messagePublication.value = null
    try {
      const dto = await $fetch<ArticleEditionDTO>(`/api/admin/articles/${id.value}/depublier`, {
        method: 'POST',
      })
      appliquer(dto)
    }
    catch (erreur) {
      if (estExpiree(erreur)) {
        await redirigerConnexion()
        return
      }
      messagePublication.value = messageServeur(erreur, 'La dépublication a échoué.')
    }
  }

  return {
    id,
    titre,
    chapo,
    corpsHtml,
    sousTheme,
    rubriqueId,
    couverture,
    couvertureAlt,
    datePublication,
    aLaUne,
    rangUne,
    statut,
    etatEnregistrement,
    dernierEnregistrement,
    messagePublication,
    pretAEnregistrer,
    enregistrerBrouillon,
    publier,
    depublier,
  }
}

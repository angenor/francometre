import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
import type { ArticlePubliableDTO, CompositionUneDTO } from '#shared/types/dto'

// L'état de « Composer la Une » (FR-024/026/027, D9/D10).
//
// L'ordre local des ≤ 5 articles épinglés est tenu par `@formkit/drag-and-drop`
// (`ordre`, réactif au glisser-déposer POINTEUR). Le clavier est traité par la
// page (flèches sur la poignée), qui appelle `monter`/`descendre`. L'accueil ne
// bouge qu'à `enregistrer` (PUT) : tant qu'on n'enregistre pas, `modifie` signale
// une composition non validée (FR-027).

/** Un article de la Une : même forme épinglé (emplacement) ou publiable. */
type ArticleUne = ArticlePubliableDTO

/**
 * L'état de l'enregistrement, pour que l'écran DISE ce qu'il fait (porte 8).
 * Sans lui, un glisser-déposer restait local sans que rien ne le signale : la
 * composition semblait « ne pas persister » alors qu'elle n'avait jamais été
 * envoyée. `modifie` dit « il reste quelque chose à enregistrer », ceci dit
 * « voilà où en est l'envoi ».
 */
type EtatEnregistrement = 'inactif' | 'en-cours' | 'enregistre' | 'echec'

function messageServeur(erreur: unknown, defaut: string): string {
  const data = (erreur as { data?: { statusMessage?: string, message?: string } })?.data
  return data?.statusMessage || data?.message || defaut
}
function estExpiree(erreur: unknown): boolean {
  return (erreur as { statusCode?: number })?.statusCode === 401
}

export function useCompositionUne(initial: CompositionUneDTO) {
  const epinglesInitiaux = initial.emplacements
    .filter((e) => e.article)
    .map((e) => e.article as ArticleUne)

  const modifie = ref(false)
  const etatEnregistrement = ref<EtatEnregistrement>('inactif')
  const messageErreur = ref<string | null>(null)

  // Une nouvelle retouche efface la confirmation précédente : « enregistré »
  // ne doit jamais rester affiché au-dessus d'un ordre qui a rebougé depuis.
  watch(modifie, (aChange) => {
    if (aChange && etatEnregistrement.value !== 'en-cours') {
      etatEnregistrement.value = 'inactif'
      messageErreur.value = null
    }
  })

  // La poignée `.js-poignee` seule initie le glisser ; un tri au pointeur marque
  // la composition comme modifiée.
  const [conteneurUne, ordre] = useDragAndDrop<ArticleUne>(epinglesInitiaux, {
    dragHandle: '.js-poignee',
    onSort: () => {
      modifie.value = true
    },
  })

  const publiables = ref<ArticleUne[]>([...initial.publiables])
  const rechercheEnCours = ref('')

  /** Épingle un article publiable au premier rang libre (au plus cinq). */
  function epingler(article: ArticleUne) {
    if (ordre.value.length >= 5) return
    ordre.value = [...ordre.value, article]
    publiables.value = publiables.value.filter((a) => a.id !== article.id)
    modifie.value = true
  }

  /** Retire l'emplacement d'index donné ; l'article redevient publiable. */
  function retirer(index: number) {
    const retire = ordre.value[index]
    ordre.value = ordre.value.filter((_, i) => i !== index)
    if (retire) publiables.value = [retire, ...publiables.value]
    modifie.value = true
  }

  /** Décalage clavier — monte l'emplacement d'un rang (permutation). */
  function monter(index: number) {
    if (index <= 0) return
    const copie = [...ordre.value]
    ;[copie[index - 1], copie[index]] = [copie[index]!, copie[index - 1]!]
    ordre.value = copie
    modifie.value = true
  }

  /** Décalage clavier — descend l'emplacement d'un rang. */
  function descendre(index: number) {
    if (index >= ordre.value.length - 1) return
    const copie = [...ordre.value]
    ;[copie[index], copie[index + 1]] = [copie[index + 1]!, copie[index]!]
    ordre.value = copie
    modifie.value = true
  }

  /** Recharge les publiables depuis le serveur, filtrés par titre. */
  async function rechercher(q: string) {
    rechercheEnCours.value = q
    const dto = await $fetch<CompositionUneDTO>('/api/admin/une', {
      query: q ? { q } : undefined,
    })
    // On ne retient que les publiables absents de l'ordre courant (non enregistré).
    const epingles = new Set(ordre.value.map((a) => a.id))
    publiables.value = dto.publiables.filter((a) => !epingles.has(a.id))
  }

  /**
   * Enregistre l'ordre — c'est cette action, et elle seule, qui fixe l'accueil.
   *
   * L'échec ne se perd plus : il repassait en exception nue, avalée par le
   * gestionnaire de clic, et l'écran restait muet pendant que la composition
   * n'était pas partie. La composition locale est CONSERVÉE en cas d'échec :
   * l'utilisateur retente sans avoir à refaire son classement.
   */
  async function enregistrer() {
    etatEnregistrement.value = 'en-cours'
    messageErreur.value = null
    try {
      const dto = await $fetch<CompositionUneDTO>('/api/admin/une', {
        method: 'PUT',
        body: { ordre: ordre.value.map((a) => a.id) },
      })
      ordre.value = dto.emplacements.filter((e) => e.article).map((e) => e.article as ArticleUne)
      publiables.value = [...dto.publiables]
      modifie.value = false
      etatEnregistrement.value = 'enregistre'
      return true
    }
    catch (erreur) {
      if (estExpiree(erreur)) {
        await navigateTo('/connexion?retour=' + encodeURIComponent('/admin/une'))
        return false
      }
      etatEnregistrement.value = 'echec'
      messageErreur.value = messageServeur(erreur, 'L’enregistrement de la Une a échoué.')
      return false
    }
  }

  /** Les cinq emplacements affichés : l'article à cette position, ou `null`. */
  const emplacements = computed(() =>
    [1, 2, 3, 4, 5].map((rang) => ({
      rang,
      article: ordre.value[rang - 1] ?? null,
    })),
  )

  return {
    conteneurUne,
    ordre,
    publiables,
    emplacements,
    modifie,
    etatEnregistrement,
    messageErreur,
    epingler,
    retirer,
    monter,
    descendre,
    rechercher,
    enregistrer,
  }
}

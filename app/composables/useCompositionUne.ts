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

export function useCompositionUne(initial: CompositionUneDTO) {
  const epinglesInitiaux = initial.emplacements
    .filter((e) => e.article)
    .map((e) => e.article as ArticleUne)

  const modifie = ref(false)

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

  /** Enregistre l'ordre — c'est cette action, et elle seule, qui fixe l'accueil. */
  async function enregistrer() {
    const dto = await $fetch<CompositionUneDTO>('/api/admin/une', {
      method: 'PUT',
      body: { ordre: ordre.value.map((a) => a.id) },
    })
    ordre.value = dto.emplacements.filter((e) => e.article).map((e) => e.article as ArticleUne)
    publiables.value = [...dto.publiables]
    modifie.value = false
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
    epingler,
    retirer,
    monter,
    descendre,
    rechercher,
    enregistrer,
  }
}

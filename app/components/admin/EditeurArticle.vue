<script setup lang="ts">
import type { ArticleEditionDTO } from '#shared/types/dto'

/**
 * Le corps de l'éditeur (structure de `back-office-editeur.html`) — partagé par
 * la création (`nouveau.vue`) et l'édition (`[id].vue`), pour n'écrire qu'une
 * fois la mise en page à deux colonnes : la colonne d'édition (titre, chapô,
 * corps riche) et le panneau de réglages (320 px). Sous 1000 px, les colonnes
 * s'empilent (D14).
 *
 * L'état, l'autosave et la publication vivent dans `useEditeurArticle` ; ce
 * composant n'est que la vue.
 */
const props = defineProps<{ initial?: ArticleEditionDTO }>()

const edition = useEditeurArticle(props.initial)
const {
  titre, chapo, corpsHtml,
  sousTheme, rubriqueId, couverture, couvertureAlt,
  datePublication, aLaUne, rangUne, statut,
  etatEnregistrement, dernierEnregistrement, messagePublication,
  enregistrerBrouillon, publier, depublier,
} = edition

// Indicateur d'autosave — le temps relatif se rafraîchit côté client (une
// horloge qui avance), et l'indicateur est rendu en `ClientOnly` pour éviter
// tout écart d'hydratation sur « il y a N min ».
const maintenant = ref(Date.now())
let horloge: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  horloge = setInterval(() => (maintenant.value = Date.now()), 30_000)
})
onBeforeUnmount(() => clearInterval(horloge))

function tempsRelatif(iso: string): string {
  const minutes = Math.floor((maintenant.value - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  return `il y a ${Math.floor(minutes / 60)} h`
}

const indicateur = computed(() => {
  if (etatEnregistrement.value === 'en-cours') return { texte: 'Enregistrement…', erreur: false, actif: true }
  if (etatEnregistrement.value === 'echec') return { texte: 'Échec — réessayer', erreur: true, actif: false }
  if (dernierEnregistrement.value) {
    return { texte: `Brouillon enregistré · ${tempsRelatif(dernierEnregistrement.value)}`, erreur: false, actif: false }
  }
  return { texte: 'Brouillon non enregistré', erreur: false, actif: false }
})
</script>

<template>
  <div class="flex min-w-0 flex-col socle:flex-row socle:items-stretch">
    <!-- Colonne d'édition -->
    <section class="min-w-0 flex-1 px-(--gouttiere-mobile) py-8 socle:px-14 socle:pt-8 socle:pb-16">
      <div class="flex items-center justify-between gap-6">
        <NuxtLink
          to="/admin/articles"
          class="inline-flex items-center gap-2 text-meta text-muted hover:underline hover:underline-offset-2"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          Tous les articles
        </NuxtLink>

        <ClientOnly>
          <div
            data-testid="indicateur-autosave"
            class="flex items-center gap-2 text-meta [font-variant-numeric:tabular-nums]"
            :class="indicateur.erreur ? 'text-erreur' : 'text-muted'"
            role="status"
            aria-live="polite"
          >
            <span
              class="size-1.5 shrink-0"
              :class="[indicateur.erreur ? 'bg-erreur' : 'bg-muted', indicateur.actif && 'animate-pulse']"
              aria-hidden="true"
            />
            {{ indicateur.texte }}
          </div>
        </ClientOnly>
      </div>

      <div class="mt-8 max-w-[800px]">
        <textarea
          v-model="titre"
          rows="1"
          maxlength="160"
          aria-label="Titre de l'article"
          placeholder="Titre de l'article"
          class="w-full resize-none bg-transparent font-titre text-titre-maquette-admin leading-[1.08] font-extra-grasse tracking-titre text-ink placeholder:text-muted [field-sizing:content]"
        />
        <textarea
          v-model="chapo"
          rows="2"
          maxlength="300"
          aria-label="Chapô"
          placeholder="Chapô — une phrase de présentation."
          class="mt-5 w-full resize-none bg-transparent font-corps text-chapo leading-corps-serre text-muted placeholder:text-muted [field-sizing:content]"
        />

        <div class="mt-7">
          <EditeurRiche v-model="corpsHtml" />
        </div>
      </div>
    </section>

    <!-- Panneau de réglages -->
    <PanneauReglages
      v-model:statut="statut"
      v-model:sous-theme="sousTheme"
      v-model:rubrique-id="rubriqueId"
      v-model:date-publication="datePublication"
      v-model:a-la-une="aLaUne"
      v-model:rang-une="rangUne"
      v-model:couverture="couverture"
      v-model:couverture-alt="couvertureAlt"
      :message-publication="messagePublication"
      @enregistrer-brouillon="enregistrerBrouillon"
      @publier="publier"
      @depublier="depublier"
    />
  </div>
</template>

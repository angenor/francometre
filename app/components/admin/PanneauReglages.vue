<script setup lang="ts">
import type { RubriqueId } from '#shared/utils/rubriques'

/**
 * Le panneau de réglages de l'éditeur (structure de `back-office-editeur.html`,
 * sidebar 320 px). Statut, rubrique, SOUS-THÈME (ajout D16, sous la rubrique),
 * date de publication (le FUTUR est accepté — embargo, FR-014b), « À la une » +
 * rang 01–05, dépose de couverture.
 *
 * Le segment ACTIF prend l'accent (tracé maquette). Les actions réutilisent
 * `AppButton` : « Publier » est PRIMAIRE (survol → `--primaire-survol`, jamais
 * l'accent — correction du défaut de maquette, porte 4).
 */
const statut = defineModel<'brouillon' | 'publie'>('statut', { required: true })
const sousTheme = defineModel<string>('sousTheme', { required: true })
const rubriqueId = defineModel<RubriqueId>('rubriqueId', { required: true })
const datePublication = defineModel<string>('datePublication', { required: true })
const aLaUne = defineModel<boolean>('aLaUne', { required: true })
const rangUne = defineModel<number | null>('rangUne', { required: true })
const couverture = defineModel<{ id: string, url: string } | null>('couverture', {
  required: true,
})
const couvertureAlt = defineModel<string>('couvertureAlt', { required: true })

defineProps<{ messagePublication: string | null }>()

const emit = defineEmits<{
  enregistrerBrouillon: []
  publier: []
  depublier: []
}>()

const RANGS = [1, 2, 3, 4, 5]

const LABEL = 'mb-3 block font-titre text-label-admin font-demi-grasse tracking-eyebrow uppercase text-muted'
const SEG = 'h-11 cursor-pointer border-b-2 border-transparent text-interface font-moyenne text-muted'
const SEG_ACTIF = 'border-accent font-demi-grasse text-accent'

/** Cocher/décocher « À la une » ; à la première coche, on propose le rang 1. */
function basculerUne(valeur: boolean) {
  aLaUne.value = valeur
  if (valeur && !rangUne.value) rangUne.value = 1
}
function choisirRang(rang: number) {
  aLaUne.value = true
  rangUne.value = rang
}
</script>

<template>
  <aside class="flex w-full shrink-0 flex-col border-t border-line px-7 pt-8 pb-7 socle:w-(--sidebar-reglages) socle:border-t-0 socle:border-l">
    <div class="flex flex-col gap-8">
      <!-- Statut -->
      <div>
        <span :class="LABEL">Statut</span>
        <div class="grid grid-cols-2 border border-line">
          <button
            type="button"
            :class="[SEG, statut === 'brouillon' && SEG_ACTIF]"
            @click="emit('depublier')"
          >
            Brouillon
          </button>
          <button
            type="button"
            :class="[SEG, 'border-l border-l-line', statut === 'publie' && SEG_ACTIF]"
            @click="emit('publier')"
          >
            Publié
          </button>
        </div>
      </div>

      <!-- Rubrique -->
      <div>
        <span :class="LABEL">Rubrique</span>
        <div class="relative border-b border-line">
          <select
            v-model="rubriqueId"
            aria-label="Rubrique"
            class="w-full cursor-pointer appearance-none bg-transparent py-2 pr-6 text-saisie-admin text-ink"
          >
            <option v-for="rubrique in RUBRIQUES" :key="rubrique.id" :value="rubrique.id">
              {{ rubrique.libelle }}
            </option>
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-muted" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>

      <!-- Sous-thème (D16) — facultatif, ≤ 40, sans ornement -->
      <div>
        <span :class="LABEL">Sous-thème</span>
        <input
          v-model="sousTheme"
          type="text"
          maxlength="40"
          aria-label="Sous-thème"
          placeholder="Facultatif"
          class="w-full border-b border-line bg-transparent py-2 text-saisie-admin text-ink placeholder:text-muted"
        >
      </div>

      <!-- Date de publication — accepte le futur (embargo) -->
      <div>
        <span :class="LABEL">Date de publication</span>
        <input
          v-model="datePublication"
          type="date"
          aria-label="Date de publication"
          class="w-full border-b border-line bg-transparent py-2 text-saisie-admin text-ink [font-variant-numeric:tabular-nums]"
        >
      </div>

      <!-- À la une + rang -->
      <div>
        <label class="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            :checked="aLaUne"
            class="size-4.5 shrink-0 accent-accent"
            @change="basculerUne(($event.target as HTMLInputElement).checked)"
          >
          <span class="text-saisie-admin text-ink">À la une</span>
        </label>

        <template v-if="aLaUne">
          <span class="mt-4 mb-2 block text-label-admin text-muted">Rang dans le classement</span>
          <div class="grid grid-cols-5 border border-line [font-variant-numeric:tabular-nums]">
            <button
              v-for="(rang, index) in RANGS"
              :key="rang"
              type="button"
              class="h-[38px] cursor-pointer border-b-2 border-transparent font-titre text-meta font-demi-grasse text-muted"
              :class="[index > 0 && 'border-l border-l-line', rangUne === rang && SEG_ACTIF]"
              @click="choisirRang(rang)"
            >
              {{ String(rang).padStart(2, '0') }}
            </button>
          </div>
        </template>
      </div>

      <!-- Couverture + texte alternatif -->
      <DeposeCouverture v-model:couverture="couverture" v-model:alt="couvertureAlt" />
    </div>

    <!-- Actions — poussées en bas -->
    <div class="mt-auto pt-7">
      <div class="mb-5 h-px bg-line" />

      <p v-if="messagePublication" role="alert" class="mb-4 text-meta text-erreur">
        {{ messagePublication }}
      </p>

      <div class="flex flex-col gap-3">
        <AppButton variante="secondaire" class="w-full" @click="emit('enregistrerBrouillon')">
          Enregistrer le brouillon
        </AppButton>
        <AppButton variante="primaire" class="w-full" @click="emit('publier')">
          Publier
        </AppButton>
      </div>
    </div>
  </aside>
</template>

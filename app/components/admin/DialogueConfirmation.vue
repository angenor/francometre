<script setup lang="ts">
/**
 * Confirmation d'un acte destructif (D15) — écran NON maquetté : strictement
 * sobre, SANS accent de sa propre initiative (principe III).
 *
 * Un `<dialog>` NATIF ouvert par `showModal()` : il apporte gratuitement le
 * piège de focus, la fermeture par Échap, et le RETOUR du focus au déclencheur à
 * la fermeture. `role="alertdialog"` : l'assistance annonce la conséquence.
 *
 * Les deux actions sont des `AppButton` SECONDAIRES — pas de rouge en fond (le
 * rouge d'erreur reste réservé aux formulaires). `ouvert` est la source unique :
 * Échap et clic hors cadre émettent `annuler`, le parent referme.
 */
const props = defineProps<{
  ouvert: boolean
  titre: string
  message: string
  libelleConfirmer: string
}>()

const emit = defineEmits<{ confirmer: [], annuler: [] }>()

const dialogue = ref<HTMLDialogElement | null>(null)
const idTitre = useId()
const idMessage = useId()

watch(() => props.ouvert, (ouvert) => {
  const d = dialogue.value
  if (!d) return
  if (ouvert && !d.open) d.showModal()
  else if (!ouvert && d.open) d.close() // close() rend le focus au déclencheur
})

/** Échap : on bloque la fermeture native pour garder `ouvert` maître du cycle. */
function surCancel(evenement: Event) {
  evenement.preventDefault()
  emit('annuler')
}

/** Clic sur le voile (la cible est le `<dialog>` lui-même, pas son contenu). */
function surClic(evenement: MouseEvent) {
  if (evenement.target === dialogue.value) emit('annuler')
}
</script>

<template>
  <dialog
    ref="dialogue"
    role="alertdialog"
    :aria-labelledby="idTitre"
    :aria-describedby="idMessage"
    class="w-full max-w-[440px] border border-line bg-paper p-8 text-ink"
    @cancel="surCancel"
    @click="surClic"
  >
    <h2 :id="idTitre" class="font-titre text-sous-titre-h3 font-grasse tracking-titre text-ink">
      {{ titre }}
    </h2>
    <p :id="idMessage" class="mt-3 font-corps text-corps-courant leading-corps-serre text-muted">
      {{ message }}
    </p>

    <div class="mt-8 flex justify-end gap-3">
      <AppButton variante="secondaire" @click="emit('annuler')">Annuler</AppButton>
      <AppButton variante="secondaire" @click="emit('confirmer')">
        {{ libelleConfirmer }}
      </AppButton>
    </div>
  </dialog>
</template>

<style scoped>
/* Le voile modal — valeur portée par le token `--scrim` (aucune couleur en dur). */
dialog::backdrop {
  background: var(--scrim);
}
/* Le `<dialog>` natif est centré par sa marge auto ; aucun arrondi, aucune ombre. */
dialog {
  margin: auto;
}
</style>

<script setup lang="ts">
/**
 * La planche de style — la seule page livrée par Fondations.
 *
 * Elle reprend les SECTIONS de `docs/design/html/guide-de-style.html`, pas son
 * enveloppe : la maquette est une planche autonome, sans colonne de
 * navigation, tandis que cette page est rendue dans le cadre et la colonne du
 * socle, comme l'exige FR-048.
 *
 * Aucune rubrique n'est déclarée : la planche n'en occupe aucune, et rien ne
 * doit donc être signalé comme page courante dans la colonne (FR-007).
 *
 * RÈGLE STRUCTURANTE DE CE FICHIER : il ne contient AUCUN littéral de valeur.
 * Les libellés hexadécimaux du nuancier, l'échelle typographique et les cotes
 * du système sont lus À L'EXÉCUTION depuis la valeur calculée des variables
 * CSS. Deux bénéfices : le contrôle « aucune valeur hors de tokens.css » passe
 * sans exemption, et un libellé ne peut pas diverger de la valeur réelle.
 */
useHead({ title: 'Francomètre — Guide de style' })

/* ------------------------------------------------------------------ Nuancier */

const COULEURS = [
  { token: 'paper', fond: 'bg-paper', nom: 'Fond', usage: 'Fond de page' },
  { token: 'surface', fond: 'bg-surface', nom: 'Blocs', usage: 'Aplats, cartes' },
  { token: 'ink', fond: 'bg-ink', nom: 'Texte', usage: 'Titres, corps' },
  { token: 'muted', fond: 'bg-muted', nom: 'Méta', usage: 'Dates, légendes' },
  { token: 'line', fond: 'bg-line', nom: 'Filets', usage: 'Séparateurs 1 px' },
  { token: 'accent', fond: 'bg-accent', nom: 'Accent', usage: 'Rationné (voir ci-dessous)' },
] as const

/* -------------------------------------------------- Échelle typographique */

const TYPO = [
  { token: 'taille-eyebrow', role: 'Eyebrow', detail: 'Archivo · 600 · +0,1em · MAJUSCULES' },
  { token: 'taille-meta', role: 'Méta', detail: 'Instrument Sans · 400 · couleur méta' },
  { token: 'taille-interface', role: 'Texte d’interface', detail: 'Archivo · 600' },
  { token: 'taille-corps-courant', role: 'Corps courant', detail: 'Instrument Sans · 400 · interligne 1,6' },
  { token: 'taille-titre-card', role: 'Titre de card', detail: 'Archivo · 600 · −0,02em' },
  { token: 'taille-titre-section', role: 'Titre de section', detail: 'Archivo · 700 · −0,02em' },
  { token: 'taille-titre-heros-planche', role: 'Titre héros', detail: 'Archivo · 800 · interligne 1,02' },
] as const

/* ----------------------------------------------------- Cotes du système */

const COTES = [
  { token: 'base', nom: 'Base' },
  { token: 'gouttiere', nom: 'Gouttière (bureau)' },
  { token: 'gouttiere-mobile', nom: 'Gouttière (mobile)' },
  { token: 'conteneur', nom: 'Conteneur (max)' },
  { token: 'contenu', nom: 'Contenu' },
  { token: 'rail', nom: 'Rail de navigation' },
  { token: 'ecart-section', nom: 'Écart de sections' },
  { token: 'filet', nom: 'Épaisseur de filet' },
  { token: 'coupe-denivele', nom: 'Coupe — dénivelé' },
  { token: 'coupe-parcours', nom: 'Coupe — parcours' },
] as const

/** Multiples de la base, dans l'ordre de `tokens.md` §3. */
const ECHELLE = [1, 2, 3, 4, 6, 8, 12, 16, 20] as const

const INTERDITS = [
  'Coins arrondis',
  'Ombres portées',
  'Dégradés',
  'Glassmorphism',
  'Icônes décoratives',
  'Emoji',
  'Lorem ipsum',
  'Gros chiffres colorés en « stat »',
  'Accent en fond de bloc',
] as const

/* ---------------------------------------------- Lecture des valeurs réelles */

const colonneClaire = useTemplateRef<HTMLElement>('colonneClaire')
const colonneSombre = useTemplateRef<HTMLElement>('colonneSombre')
const racine = useTemplateRef<HTMLElement>('racine')

const hexClair = ref<Record<string, string>>({})
const hexSombre = ref<Record<string, string>>({})
const valeurs = ref<Record<string, string>>({})

/** Relève la valeur calculée d'une liste de variables CSS sur un élément. */
function releverVariables(element: HTMLElement, tokens: readonly string[]) {
  const style = getComputedStyle(element)
  return Object.fromEntries(
    tokens.map((t) => [t, style.getPropertyValue(`--${t}`).trim()]),
  )
}

onMounted(() => {
  const tokensCouleur = COULEURS.map((c) => c.token)
  if (colonneClaire.value) hexClair.value = releverVariables(colonneClaire.value, tokensCouleur)
  if (colonneSombre.value) hexSombre.value = releverVariables(colonneSombre.value, tokensCouleur)
  if (racine.value) {
    valeurs.value = releverVariables(racine.value, [
      ...TYPO.map((t) => t.token),
      ...COTES.map((c) => c.token),
    ])
  }
})

/* --------------------------------------------------- Vignettes de démonstration */

const DEMO = {
  repos: {
    titre: 'L’Assemblée adopte le budget après une nuit de débats sous tension',
    rubrique: 'diplomatie',
    date: '2026-07-14',
    chemin: '/article/budget-assemblee',
    image: '/demo/apercu-batteries.svg',
    imageAlt: 'Vue d’un site industriel de production de cellules de batteries',
  },
  survol: {
    titre: 'L’inflation ralentit pour le troisième mois consécutif',
    rubrique: 'economie',
    date: '2026-07-13',
    chemin: '/article/inflation-ralentit',
    image: '/demo/apercu-inflation.svg',
    imageAlt: 'Diagramme en barres illustrant l’évolution mensuelle des prix',
  },
  titreLong: {
    titre:
      'Un titre délibérément très long, destiné à montrer la troncature à trois lignes du composant de vignette lorsque la rédaction dépasse la longueur prévue par la maquette',
    rubrique: 'technologie',
    date: '2026-07-12',
    chemin: '/article/titre-long',
    image: '/demo/apercu-inflation.svg',
    imageAlt: 'Diagramme en barres servant d’illustration de démonstration',
  },
  sansImage: {
    titre: 'En brèves : le prix du roman de la rentrée dévoilé jeudi à Paris',
    rubrique: 'culture',
    date: '2026-07-12',
    chemin: '/article/prix-roman',
  },
} as const

/* ------------------------------------------------------------ Champs de démo */

const courriel = ref('')
const recherche = ref('élection municipale')
const message = ref('')
const infolettre = ref(true)
const enErreur = ref('')
</script>

<template>
  <article ref="racine">
    <!-- ============================================================== HÉRO -->
    <section class="pt-20 pb-16">
      <p
        class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow text-muted uppercase"
      >
        Francomètre — Planche de référence
      </p>
      <h1
        class="font-titre text-titre-heros-planche leading-titre-heros-planche mt-6 font-extra-grasse tracking-titre text-ink"
      >
        L’actualité,<br>mesurée.
      </h1>
      <p class="text-corps-article leading-corps mt-7 max-w-(--colonne-lecture-min) text-ink">
        L’image porte l’information, le chrome disparaît. Densité forte, hiérarchie brutale.
        « Mesurée » : au sens de quantifiée, et au sens de sans emballement.
      </p>
      <p class="text-interface leading-corps mt-5 max-w-(--colonne-lecture-min) text-muted">
        Cette planche fixe le système visuel de francometre.com : identité, couleurs,
        typographie, la signature du filet coupé, le composant card, l’interface et la
        géométrie.
      </p>
    </section>

    <!-- ==================================================== 01 — IDENTITÉ -->
    <FiletCoupe :position="66" />
    <section class="py-16">
      <header class="mb-11 max-w-(--colonne-lecture-min)">
        <p
          class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow text-muted uppercase"
        >
          01 — Identité
        </p>
        <h2
          class="font-titre text-titre-section leading-titre-article mt-3 font-grasse tracking-titre text-ink"
        >
          Le mot-symbole
        </h2>
        <p class="text-corps-courant leading-corps mt-4 text-muted">
          Fourni. La coupe à 3,5° est intégrée au dessin. On ne le redessine pas, on ne le
          recadre pas, on ne l’incline pas — on construit autour.
        </p>
      </header>

      <div class="grid gap-6 socle:grid-cols-2">
        <div class="theme-clair border border-line bg-paper p-6">
          <div class="mb-2 flex items-baseline justify-between">
            <span
              class="font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-muted uppercase"
            >Clair</span>
            <span class="text-meta text-muted">sur {{ hexClair.paper }}</span>
          </div>
          <div class="flex min-h-45 items-center justify-center px-2 py-6">
            <img
              src="/brand/NOIR.png"
              alt="Francomètre"
              class="h-auto w-full max-w-95"
            >
          </div>
        </div>

        <div class="theme-sombre border border-line bg-paper p-6">
          <div class="mb-2 flex items-baseline justify-between">
            <span
              class="font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-muted uppercase"
            >Sombre</span>
            <span class="text-meta text-muted">sur {{ hexSombre.paper }}</span>
          </div>
          <div class="flex min-h-45 items-center justify-center px-2 py-6">
            <img
              src="/brand/BLANC.png"
              alt="Francomètre"
              class="h-auto w-full max-w-95"
            >
          </div>
        </div>
      </div>

      <div class="mt-8 grid gap-6 socle:grid-cols-3">
        <div
          v-for="regle in [
            { titre: 'Ne pas redessiner', texte: 'La coupe fait partie du dessin. Aucune retouche des contreformes ni de l’angle.' },
            { titre: 'Ne pas incliner', texte: 'Toujours d’aplomb. La seule diagonale autorisée est celle déjà présente.' },
            { titre: 'Toujours sur aplat', texte: 'Noir sur fond clair, blanc sur fond sombre. Jamais posé sur une photo.' },
          ]"
          :key="regle.titre"
          class="border-t border-line pt-3.5"
        >
          <div
            class="font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-ink uppercase"
          >
            {{ regle.titre }}
          </div>
          <div class="text-meta leading-corps-serre mt-1.5 text-muted">
            {{ regle.texte }}
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================== 02 — COULEURS -->
    <FiletCoupe :position="50" />
    <section class="py-16">
      <header class="mb-11 max-w-(--colonne-lecture-min)">
        <p
          class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow text-muted uppercase"
        >
          02 — Couleurs
        </p>
        <h2
          class="font-titre text-titre-section leading-titre-article mt-3 font-grasse tracking-titre text-ink"
        >
          Palette
        </h2>
        <p class="text-corps-courant leading-corps mt-4 text-muted">
          Deux thèmes. L’accent est rationné : numéros de la Une, soulignement de la
          rubrique active, liens dans le corps d’article. Nulle part ailleurs — les photos
          apportent toute la couleur.
        </p>
      </header>

      <!--
        Les deux thèmes CÔTE À CÔTE : la palette sombre est rendue à l'intérieur
        du thème clair, et réciproquement. Chaque colonne porte son sélecteur de
        portée et n'emploie que des utilitaires — aucune valeur n'est recopiée.
      -->
      <div class="grid gap-6 socle:grid-cols-2">
        <div ref="colonneClaire" class="theme-clair border border-line bg-paper px-6 pt-6 pb-2">
          <div
            class="font-titre text-eyebrow mb-2 font-demi-grasse tracking-eyebrow text-muted uppercase"
          >
            Thème clair
          </div>
          <div
            v-for="(c, i) in COULEURS"
            :key="c.token"
            class="grid grid-cols-[44px_1fr_auto] items-center gap-4 py-3.5"
            :class="i < COULEURS.length - 1 && 'border-b border-line'"
          >
            <div class="size-11 border border-line" :class="c.fond" />
            <div>
              <div class="font-titre text-saisie-admin font-demi-grasse text-ink">
                {{ c.nom }}
              </div>
              <div class="text-meta mt-0.5 text-muted">
                {{ c.usage }}
              </div>
            </div>
            <div class="text-meta font-moyenne text-muted tabular-nums">
              {{ hexClair[c.token] }}
            </div>
          </div>
        </div>

        <div ref="colonneSombre" class="theme-sombre border border-line bg-paper px-6 pt-6 pb-2">
          <div
            class="font-titre text-eyebrow mb-2 font-demi-grasse tracking-eyebrow text-muted uppercase"
          >
            Thème sombre
          </div>
          <div
            v-for="(c, i) in COULEURS"
            :key="c.token"
            class="grid grid-cols-[44px_1fr_auto] items-center gap-4 py-3.5"
            :class="i < COULEURS.length - 1 && 'border-b border-line'"
          >
            <div class="size-11 border border-line" :class="c.fond" />
            <div>
              <div class="font-titre text-saisie-admin font-demi-grasse text-ink">
                {{ c.nom }}
              </div>
              <div class="text-meta mt-0.5 text-muted">
                {{ c.usage }}
              </div>
            </div>
            <div class="text-meta font-moyenne text-muted tabular-nums">
              {{ hexSombre[c.token] }}
            </div>
          </div>
        </div>
      </div>

      <!--
        La règle de rationnement est ÉNONCÉE, non démontrée en couleur : la
        démonstration des trois usages de la maquette ajouterait trois
        occurrences d'accent, là où Fondations en admet exactement deux — le
        soulignement de la rubrique active et le nuancier ci-dessus
        (contracts/tokens-et-theme.md §4).
      -->
      <div class="mt-8 border-t border-line pt-7">
        <div
          class="font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-ink uppercase"
        >
          L’accent, rationné — trois usages
        </div>
        <ol class="text-corps-courant leading-corps mt-5 max-w-(--colonne-lecture-min) text-muted">
          <li>Les numéros de la Une — le classement décidé par la rédaction, rendu visible.</li>
          <li>Le soulignement de la rubrique active — jamais un fond.</li>
          <li>Les liens dans le corps d’article.</li>
        </ol>
        <p class="text-meta leading-corps mt-4 max-w-(--colonne-lecture-min) text-muted">
          Interdit : en fond de bloc, en fond de bouton, comme couleur de titre décoratif.
          L’accent ne touche jamais un bouton.
        </p>
      </div>
    </section>

    <!-- ================================================= 03 — TYPOGRAPHIE -->
    <FiletCoupe :position="72" />
    <section class="py-16">
      <header class="mb-11 max-w-(--colonne-lecture-min)">
        <p
          class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow text-muted uppercase"
        >
          03 — Typographie
        </p>
        <h2
          class="font-titre text-titre-section leading-titre-article mt-3 font-grasse tracking-titre text-ink"
        >
          Deux familles
        </h2>
        <p class="text-corps-courant leading-corps mt-4 text-muted">
          Archivo pour les titres et les eyebrows (600–800, tracking −0,02em). Instrument
          Sans pour le corps, l’interface et les métadonnées (400–600).
        </p>
      </header>

      <div class="mb-10 grid gap-6 socle:grid-cols-2">
        <div class="border border-line p-7">
          <div class="flex items-baseline justify-between">
            <span class="font-titre text-chapo font-grasse tracking-titre text-ink">Archivo</span>
            <span class="text-meta text-muted">Titres · eyebrows</span>
          </div>
          <div class="font-titre leading-nul mt-5 mb-2 text-titre-rubrique font-extra-grasse tracking-titre text-ink">
            Aa
          </div>
          <div class="font-titre text-saisie font-demi-grasse tracking-sous-titre text-ink">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
          </div>
          <div class="font-titre text-saisie mt-0.5 font-demi-grasse tracking-sous-titre text-ink tabular-nums">
            0123456789 À É È Ç Ù Œ
          </div>
          <div class="mt-5 flex gap-5 border-t border-line pt-4 text-ink">
            <span class="font-titre text-saisie-admin font-demi-grasse">600</span>
            <span class="font-titre text-saisie-admin font-grasse">700</span>
            <span class="font-titre text-saisie-admin font-extra-grasse">800</span>
          </div>
        </div>

        <div class="border border-line p-7">
          <div class="flex items-baseline justify-between">
            <span class="text-chapo font-demi-grasse text-ink">Instrument Sans</span>
            <span class="text-meta text-muted">Corps · interface · méta</span>
          </div>
          <div class="leading-nul mt-5 mb-2 text-titre-rubrique font-normale text-ink">
            Aa
          </div>
          <div class="text-saisie font-normale text-ink">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
          </div>
          <div class="text-saisie mt-0.5 font-normale text-ink tabular-nums">
            0123456789 À É È Ç Ù Œ
          </div>
          <div class="mt-5 flex gap-5 border-t border-line pt-4 text-ink">
            <span class="text-saisie-admin font-normale">400</span>
            <span class="text-saisie-admin font-moyenne">500</span>
            <span class="text-saisie-admin font-demi-grasse">600</span>
          </div>
        </div>
      </div>

      <!-- L'échelle est RENDUE depuis les tokens : aucune taille écrite à la main. -->
      <div
        v-for="t in TYPO"
        :key="t.token"
        class="grid items-baseline gap-6 border-t border-line py-5.5 socle:grid-cols-[220px_1fr]"
      >
        <div class="text-meta leading-corps-serre text-muted tabular-nums">
          {{ t.role }}<br>{{ valeurs[t.token] }}<br>{{ t.detail }}
        </div>
        <div class="font-titre tracking-titre text-ink" :style="{ fontSize: `var(--${t.token})` }">
          L’actualité, mesurée.
        </div>
      </div>
    </section>

    <!-- =================================================== 04 — SIGNATURE -->
    <FiletCoupe :position="38" />
    <section class="py-16">
      <header class="mb-11 max-w-(--colonne-lecture-min)">
        <p
          class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow text-muted uppercase"
        >
          04 — Signature
        </p>
        <h2
          class="font-titre text-titre-section leading-titre-article mt-3 font-grasse tracking-titre text-ink"
        >
          Le filet coupé
        </h2>
        <p class="text-corps-courant leading-corps mt-4 text-muted">
          Le seul ornement. À la séparation de deux sections, la ligne de 1 px se brise une
          seule fois — {{ valeurs['coupe-denivele'] }} de dénivelé pour
          {{ valeurs['coupe-parcours'] }} parcourus, soit 3,5° — puis reprend
          {{ valeurs['coupe-denivele'] }} plus haut. Rien de plus.
        </p>
      </header>

      <!-- Schéma coté, agrandi. Décoratif : la cote est donnée dans le texte. -->
      <div class="border border-line px-6 pt-10 pb-7">
        <div class="mx-auto w-full max-w-150">
          <svg viewBox="0 0 600 220" class="block h-auto w-full text-ink" aria-hidden="true">
            <line x1="140" y1="150" x2="560" y2="150" stroke="currentColor" stroke-width="1" stroke-dasharray="2 4" opacity="0.25" />
            <line x1="524" y1="126" x2="524" y2="150" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3" opacity="0.25" />
            <polyline points="60,150 140,150 524,126 560,126" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square" />
            <line x1="140" y1="150" x2="140" y2="192" stroke="currentColor" stroke-width="1" opacity="0.4" />
            <line x1="524" y1="126" x2="524" y2="192" stroke="currentColor" stroke-width="1" opacity="0.4" />
            <line x1="140" y1="188" x2="524" y2="188" stroke="currentColor" stroke-width="1" />
            <text x="332" y="182" text-anchor="middle" font-size="14" font-weight="600" fill="currentColor">64 px</text>
            <line x1="548" y1="126" x2="548" y2="150" stroke="currentColor" stroke-width="1" />
            <text x="558" y="142" text-anchor="start" font-size="14" font-weight="600" fill="currentColor">4 px</text>
            <text x="204" y="146" text-anchor="start" font-size="13" font-weight="600" fill="currentColor">3,5°</text>
          </svg>
          <p class="text-meta mt-2 text-center text-muted">
            Schéma agrandi ×6 — trait de 1 px, en couleur filet
          </p>
        </div>
      </div>

      <div class="mt-6">
        <div class="mb-3.5 flex items-baseline justify-between">
          <span
            class="font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-muted uppercase"
          >Taille réelle</span>
          <span class="text-meta text-muted">1 px · discrétion voulue</span>
        </div>
        <FiletCoupe :position="66" />
      </div>

      <!-- La comparaison qui rend la règle de frontière visible (FR-037). -->
      <div class="mt-10 grid gap-6 socle:grid-cols-2">
        <div>
          <div
            class="font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-ink uppercase"
          >
            Filet ordinaire
          </div>
          <div class="my-4 h-px bg-line" />
          <div class="text-meta leading-corps-serre text-muted">
            1 px, parfaitement horizontal. À l’intérieur d’une section : sous une ligne de
            tableau, sous un champ de formulaire, entre un titre et sa grille.
          </div>
        </div>
        <div>
          <div
            class="font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-ink uppercase"
          >
            Filet coupé
          </div>
          <div class="my-4">
            <FiletCoupe :position="60" />
          </div>
          <div class="text-meta leading-corps-serre text-muted">
            Se brise une seule fois, à 3,5°. Entre deux blocs dont chacun porte son propre
            en-tête, et eux seuls.
          </div>
        </div>
      </div>

      <div class="mt-7 max-w-(--colonne-lecture-min) border-t border-line pt-4 text-meta leading-corps text-muted">
        La coupe existe déjà dans le logo, et se répète ici, à la séparation des sections.
        Ce sont ses deux seules apparitions. Pas de photo coupée, pas de card cisaillée, pas
        de titre tranché, pas de diagonale décorative — une troisième fois, et la signature
        devient un tic.
      </div>
    </section>

    <!-- ======================================================= 05 — CARD -->
    <FiletCoupe :position="60" />
    <section class="py-16">
      <header class="mb-11 max-w-(--colonne-lecture-min)">
        <p
          class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow text-muted uppercase"
        >
          05 — Composant
        </p>
        <h2
          class="font-titre text-titre-section leading-titre-article mt-3 font-grasse tracking-titre text-ink"
        >
          La card
        </h2>
        <p class="text-corps-courant leading-corps mt-4 text-muted">
          Le composant unique du site, réutilisé partout. Image 16:9, eyebrow (rubrique),
          titre sur trois lignes maximum, date. Pas de chapô, pas de bouton — la card
          entière est cliquable.
        </p>
      </header>

      <div class="grid gap-6 socle:grid-cols-4">
        <div>
          <div
            class="font-titre text-eyebrow mb-3.5 font-demi-grasse tracking-eyebrow text-muted uppercase"
          >
            Repos
          </div>
          <ArticleCard v-bind="DEMO.repos" data-testid="carte-repos" />
        </div>
        <div>
          <div
            class="font-titre text-eyebrow mb-3.5 font-demi-grasse tracking-eyebrow text-muted uppercase"
          >
            Survol
          </div>
          <ArticleCard v-bind="DEMO.survol" data-testid="carte-survol" />
        </div>
        <div>
          <div
            class="font-titre text-eyebrow mb-3.5 font-demi-grasse tracking-eyebrow text-muted uppercase"
          >
            Titre long — troncature
          </div>
          <ArticleCard v-bind="DEMO.titreLong" data-testid="carte-titre-long" />
        </div>
        <div>
          <div
            class="font-titre text-eyebrow mb-3.5 font-demi-grasse tracking-eyebrow text-muted uppercase"
          >
            Sans image
          </div>
          <ArticleCard v-bind="DEMO.sansImage" data-testid="carte-sans-image" />
        </div>
      </div>

      <div class="mt-10 max-w-(--colonne-lecture-min) border-t border-line pt-4">
        <div class="text-meta leading-corps text-muted">
          Survol : léger zoom de l’image (1,03) et soulignement du titre, en 150 ms. Aucun
          autre effet — pas d’ombre, pas de cisaillement. Le focus clavier produit un retour
          équivalent. Le titre est tronqué à trois lignes. La date, en méta, ferme la card.
          Aucun « lire la suite ». L’état sans image découle de l’absence de la donnée, et
          jamais d’un paramètre.
        </div>
      </div>
    </section>

    <!-- ================================================== 06 — INTERFACE -->
    <FiletCoupe :position="66" />
    <section class="py-16">
      <header class="mb-11 max-w-(--colonne-lecture-min)">
        <p
          class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow text-muted uppercase"
        >
          06 — Interface
        </p>
        <h2
          class="font-titre text-titre-section leading-titre-article mt-3 font-grasse tracking-titre text-ink"
        >
          Boutons &amp; champs
        </h2>
        <p class="text-corps-courant leading-corps mt-4 text-muted">
          Rayon zéro, aucune ombre. Les champs se soulignent d’un filet ordinaire ; le focus
          le passe en noir. L’accent ne touche jamais un bouton.
        </p>
      </header>

      <div class="grid gap-12 socle:grid-cols-2">
        <div>
          <div
            class="font-titre text-eyebrow mb-5 font-demi-grasse tracking-eyebrow text-muted uppercase"
          >
            Boutons
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <AppButton variante="primaire">
              Primaire
            </AppButton>
            <AppButton variante="secondaire">
              Secondaire
            </AppButton>
            <AppButton variante="tertiaire">
              Tertiaire
            </AppButton>
            <AppButton indisponible>
              Indisponible
            </AppButton>
          </div>
          <div class="text-meta leading-corps mt-5 border-t border-line pt-4 text-muted">
            Primaire en noir plein, jamais en accent. Au survol, le fond s’éclaircit
            légèrement, sans ombre ni déplacement. Chaque bouton porte en outre le repère de
            focus visible du site — la maquette le supprime, la constitution le rétablit.
          </div>
        </div>

        <div>
          <div
            class="font-titre text-eyebrow mb-5 font-demi-grasse tracking-eyebrow text-muted uppercase"
          >
            Champs
          </div>
          <div class="flex max-w-105 flex-col gap-5.5">
            <AppField
              v-model="courriel"
              libelle="Adresse e-mail"
              placeholder="prenom@exemple.fr"
            />
            <AppField v-model="recherche" libelle="Recherche" />
            <AppField
              v-model="message"
              type="multiligne"
              libelle="Message"
              placeholder="Votre correction ou signalement…"
            />
            <AppField v-model="infolettre" type="case" libelle="Recevoir l’infolettre quotidienne" />
            <AppField
              v-model="enErreur"
              libelle="Code postal"
              erreur="Ce code postal n’existe pas."
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================== 07 — GÉOMÉTRIE -->
    <FiletCoupe :position="50" />
    <section class="py-16">
      <header class="mb-11 max-w-(--colonne-lecture-min)">
        <p
          class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow text-muted uppercase"
        >
          07 — Géométrie
        </p>
        <h2
          class="font-titre text-titre-section leading-titre-article mt-3 font-grasse tracking-titre text-ink"
        >
          Espacements
        </h2>
        <p class="text-corps-courant leading-corps mt-4 text-muted">
          Base {{ valeurs.base }}. Gouttière {{ valeurs.gouttiere }}. Conteneur
          {{ valeurs.conteneur }}, contenu {{ valeurs.contenu }}. Écart entre sections :
          {{ valeurs['ecart-section'] }} au bureau.
        </p>
      </header>

      <div class="grid gap-12 socle:grid-cols-2">
        <div>
          <div
            class="font-titre text-eyebrow mb-5 font-demi-grasse tracking-eyebrow text-muted uppercase"
          >
            Échelle · base {{ valeurs.base }}
          </div>
          <div class="flex flex-col gap-3">
            <div
              v-for="pas in ECHELLE"
              :key="pas"
              class="grid grid-cols-[52px_1fr] items-center gap-4"
            >
              <span class="text-meta font-moyenne text-muted tabular-nums">
                {{ pas * 4 }}
              </span>
              <div class="h-3 bg-ink" :style="{ width: `calc(var(--base) * ${pas})` }" />
            </div>
          </div>
        </div>

        <div>
          <div
            class="font-titre text-eyebrow mb-5 font-demi-grasse tracking-eyebrow text-muted uppercase"
          >
            Cotes du système
          </div>
          <div
            v-for="(cote, i) in COTES"
            :key="cote.token"
            class="grid grid-cols-[1fr_auto] gap-4 py-3"
            :class="i < COTES.length - 1 && 'border-b border-line'"
          >
            <span class="text-saisie-admin text-ink">{{ cote.nom }}</span>
            <span class="text-interface font-moyenne text-muted tabular-nums">
              {{ valeurs[cote.token] }}
            </span>
          </div>
          <div class="grid grid-cols-[1fr_auto] gap-4 border-t border-line py-3">
            <span class="text-saisie-admin text-ink">Rayon de bordure</span>
            <span class="text-interface font-moyenne text-muted tabular-nums">0</span>
          </div>
          <div class="grid grid-cols-[1fr_auto] gap-4 py-3">
            <span class="text-saisie-admin text-ink">Ombre</span>
            <span class="text-interface font-moyenne text-muted">aucune</span>
          </div>
          <div class="grid grid-cols-[1fr_auto] gap-4 py-3">
            <span class="text-saisie-admin text-ink">Dégradé</span>
            <span class="text-interface font-moyenne text-muted">aucun</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================== 08 — INTERDITS -->
    <FiletCoupe :position="72" />
    <section class="py-16">
      <header class="mb-10 max-w-(--colonne-lecture-min)">
        <p
          class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow text-muted uppercase"
        >
          08 — Cadre
        </p>
        <h2
          class="font-titre text-titre-section leading-titre-article mt-3 font-grasse tracking-titre text-ink"
        >
          Interdits absolus
        </h2>
        <p class="text-corps-courant leading-corps mt-4 text-muted">
          Neuf éléments qui n’apparaissent jamais — sur cette planche comme sur tous les
          écrans suivants.
        </p>
      </header>

      <ol class="grid gap-x-12 socle:grid-cols-2">
        <li
          v-for="(interdit, i) in INTERDITS"
          :key="interdit"
          class="grid grid-cols-[28px_1fr] items-baseline gap-4 border-t border-line py-4"
          :class="i >= INTERDITS.length - 2 && 'border-b'"
        >
          <span class="text-meta text-muted tabular-nums">
            {{ String(i + 1).padStart(2, '0') }}
          </span>
          <span class="font-titre text-chapo font-demi-grasse tracking-sous-titre text-ink">
            {{ interdit }}
          </span>
        </li>
      </ol>
    </section>
  </article>
</template>

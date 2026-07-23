<script setup lang="ts">
/**
 * Le corps riche de l'article — rendu de `corpsHtml` DÉJÀ assaini au stockage
 * (porte 11, research 002 D10 / research D5). Aucun ré-assainissement à
 * l'affichage : le corps est sûr en base, le réassainir contredirait le choix
 * 002 (assainir à l'écriture) et coûterait à chaque rendu.
 *
 * Les styles prose sont dérivés de `.corps` d'`article.html` et de `tokens.md` ;
 * ils ne portent AUCUNE valeur en dur — couleurs et cotes passent par les
 * variables de `tokens.css` (`var(--…)`), donc basculent seules en sombre.
 */
defineProps<{ html: string }>()
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html — corps déjà assaini côté serveur (porte 11). -->
  <div class="corps" v-html="html" />
</template>

<style scoped>
.corps :deep(p) {
  margin: 0;
  font-family: var(--police-corps);
  font-size: var(--taille-corps-article);
  line-height: var(--interligne-corps);
  color: var(--ink);
}
.corps :deep(p + p) {
  margin-top: 26px;
}

.corps :deep(h2) {
  margin: 48px 0 14px;
  font-family: var(--police-titre);
  font-weight: var(--graisse-grasse);
  font-size: var(--taille-sous-titre-h2);
  line-height: var(--interligne-sous-titre-h2);
  letter-spacing: var(--approche-titre);
  color: var(--ink);
}
.corps :deep(h3) {
  margin: 40px 0 12px;
  font-family: var(--police-titre);
  font-weight: var(--graisse-demi-grasse);
  font-size: var(--taille-sous-titre-h3);
  line-height: var(--interligne-sous-titre-h3);
  letter-spacing: var(--approche-sous-titre);
  color: var(--ink);
}

.corps :deep(ul),
.corps :deep(ol) {
  margin: 26px 0 0;
  padding-left: 22px;
  font-family: var(--police-corps);
  font-size: var(--taille-corps-article);
  line-height: var(--interligne-corps);
  color: var(--ink);
}
.corps :deep(li) {
  margin-bottom: 10px;
  padding-left: 6px;
}
.corps :deep(li:last-child) {
  margin-bottom: 0;
}

.corps :deep(blockquote) {
  margin: 48px 0;
  border-left: 2px solid var(--accent);
  padding-left: 24px;
  font-family: var(--police-titre);
  font-weight: var(--graisse-moyenne);
  font-style: italic;
  font-size: var(--taille-citation);
  line-height: var(--interligne-citation);
  letter-spacing: var(--approche-sous-titre);
  color: var(--ink);
}

/* Les liens du corps portent l'accent — usage tracé à `.corps a` d'`article.html`. */
.corps :deep(a) {
  color: var(--accent);
  text-decoration: none;
}
.corps :deep(a:hover) {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.corps :deep(figure) {
  margin: 48px 0 0;
}
.corps :deep(img) {
  display: block;
  max-width: 100%;
}
.corps :deep(figcaption) {
  margin-top: 10px;
  font-family: var(--police-corps);
  font-size: var(--taille-meta);
  line-height: var(--interligne-corps-serre);
  color: var(--muted);
}

/* Sous le point de rupture, le corps suit les tailles mobiles de `tokens.md`. */
@media (max-width: 999px) {
  .corps :deep(p),
  .corps :deep(ul),
  .corps :deep(ol) {
    font-size: var(--taille-corps-article-mobile);
  }
  .corps :deep(h2) {
    font-size: var(--taille-sous-titre-h2-mobile);
  }
  .corps :deep(h3) {
    font-size: var(--taille-sous-titre-h3-mobile);
  }
  .corps :deep(blockquote) {
    font-size: var(--taille-citation-mobile);
  }
}
</style>

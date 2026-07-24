# Research — Back-office rédactionnel

Décisions techniques de la feature 005. Chaque entrée : **Décision**, **Raison**,
**Alternatives écartées**. Les versions ont été vérifiées par `npm view` le 2026-07-23.

---

## D1 — Éditeur riche : TipTap 3, headless, StarterKit + Link + Image

**Décision.** `@tiptap/vue-3` **3.28.0** (MIT), avec `@tiptap/starter-kit` **3.28.0**,
`@tiptap/extension-link` **3.28.0**, `@tiptap/extension-image` **3.28.0** et le pair
obligatoire `@tiptap/pm` **3.28.0**. **Aucune** extension Pro (payantes, hors périmètre).
Les commandes de la barre d'outils (FR-012) se couvrent ainsi :

| Commande | Extension |
|---|---|
| gras, italique | StarterKit (`bold`, `italic`) |
| intertitre H2 / H3 | StarterKit (`heading`, configuré `levels: [2, 3]`) |
| liste à puces, liste numérotée | StarterKit (`bulletList`, `orderedList`) |
| citation | StarterKit (`blockquote`) |
| annuler / rétablir | StarterKit (`history` → `undo`/`redo`) |
| lien | `extension-link` |
| image intégrée | `extension-image` |

`heading` est **borné à [2, 3]** : `h1` est le titre de la page (principe VIII, liste blanche
sans `h1`). Le paragraphe, `strong`, `em`, les listes et `blockquote` de StarterKit
correspondent exactement à la liste blanche de `assainir.ts` — l'éditeur ne peut produire que
ce que le serveur garde.

**Raison.** TipTap 3 est **headless** : il n'impose aucun style, il adopte notre typographie
(D2). Bindings Vue 3 officiels, MIT, sans extension Pro (conforme à la consigne).

**Alternatives.** *ProseMirror nu* : plus de code d'échafaudage pour le même résultat.
*Éditeur `contenteditable` maison* : sous-estime la sérialisation HTML propre et l'historique.
*Quill / CKEditor* : produisent leur propre HTML et leurs classes, à contre-courant du rendu
« exactement comme publié ».

---

## D2 — Rendu identique au publié : extraire `.corps` en feuille partagée

**Décision.** Extraire les règles typographiques du corps — aujourd'hui **scopées** dans
`app/components/public/CorpsArticle.vue` (`.corps :deep(p|h2|h3|ul|ol|li|blockquote|a|figure|img|figcaption)`,
toutes en `var(--…)` de `tokens.css`) — vers une feuille **non scopée**
`app/assets/css/corps.css`, importée par `main.css`. `CorpsArticle.vue` **et** la zone
d'édition TipTap portent la **même** classe `.corps`. FR-013 (« exactement comme il paraîtra
publié ») devient alors vrai **par construction**, sans duplication.

**Raison.** Une seule source de vérité pour la typographie du corps. Toute dérive future
(taille de citation, marge d'intertitre) se corrige à un seul endroit et se voit
simultanément à l'édition et à la lecture. Les valeurs restent des tokens → bascule
clair/sombre automatique (porte 5).

**Alternatives.** *Recopier les styles dans l'éditeur* : deux sources qui divergeront ; viole
l'esprit du principe II. *Rendre un aperçu séparé côté publié* : casse le « pendant la
frappe » de FR-013.

---

## D3 — Chaîne de sûreté : assainir au serveur, avant stockage (inchangée)

**Décision.** L'éditeur produit du HTML côté client ; à l'enregistrement (création, autosave,
enregistrement explicite), la route serveur passe le corps à `assainir()` **avant** l'écriture.
`creerArticle`/`modifierArticle` le font **déjà** (feature 002) : la feature 005 n'y touche
pas, elle en dépend. La liste blanche existante
(`p, br, blockquote, ul, ol, li, h2, h3, strong, em, a, figure, figcaption, img` ;
`a[href,title]`, `img[src,alt]` ; schémas `http/https/mailto` ; **aucun** `style`, **aucun**
attribut d'événement, scripts supprimés avec leur contenu) **correspond exactement** à la
consigne. Elle est **déjà** commentée « alignée sur ce que TipTap produira ».

**Raison.** Porte 11, principe VII : le HTML du client n'est **jamais** digne de confiance ; la
base ne contient que du HTML déjà sûr. Un assainissement client (TipTap) est un confort
d'affichage, jamais une mesure de sécurité.

**Alternatives.** *Assainir à l'affichage* : laisserait du HTML hostile en base pour le premier
consommateur négligent (flux, export). Écarté par la 002, on ne le rouvre pas.

---

## D4 — Images du corps : adresse d'application `/medias/<clé>`, jamais une URL de fournisseur

**Décision.** Une image insérée dans le corps est d'abord **téléversée** (D5) ; la réponse
donne une **clé**, et l'éditeur insère `<img src="/medias/<clé>">`. Le corps **stocké** ne
contient donc qu'une **adresse relative d'application** (`/medias/…`), servie par la route
`/medias/[...cle]` (D6) quel que soit le back-end de stockage. `sanitize-html` **laisse passer
les URL relatives** (elles n'ont pas de schéma, seul un schéma hors liste est rejeté) : aucune
configuration nouvelle. Le vérifieur (`RESSEMBLE_A_UNE_URL = /^(https?:)?\/\/|^data:|^scheme:\/\//`)
**ne matche pas** `/medias/…` (pas de `//` en tête, pas de schéma) → portabilité tenue jusque
**dans le corps**.

**Raison.** Clarification de spec : « adresse interne résolue à la lecture ». Principe VI (non
négociable) : aucune URL de fournisseur en base. Migrer disque → S3 ne change pas `/medias/<clé>` :
la route d'application reste l'indirection stable ; c'est elle qui, en interne, passe par
`Stockage.get`.

**Alternatives.** *URL absolue du fournisseur dans le corps* : romprait à la migration
(principe VI). *Stocker la clé nue et réécrire `src` au rendu* : imposerait un post-traitement
HTML à chaque affichage ; l'adresse d'application obtient le même résultat sans réécriture.

---

## D5 — Téléversement : multipart → `sharp` → `Stockage.put`, une clé canonique

**Décision.** Route `POST /api/admin/medias` (gardée `exigerCompte`). Lecture par
`readMultipartFormData(event)` (h3). Le buffer reçu passe à **`sharp` 0.35.3** (Apache-2.0) via
un util **`server/utils/image.ts`** : validation du type réel (magic bytes, jamais l'extension
cliente), auto-orientation EXIF, **retrait des métadonnées**, plafond de dimension (≈ 2000 px
de large), **conversion en WebP** (format moderne, cohérent avec `@nuxt/image.format:['webp']`).
On obtient un **buffer canonique** + ses dimensions réelles + son poids. On génère une **clé**
opaque (`cuid` + `.webp`), on écrit par **`Stockage.put(cle, buffer, 'image/webp')`**, puis on
enregistre **un** `Media` via `enregistrerMedia({ cle, largeur, hauteur, poids })`. La réponse
porte `{ id, cle, url }` (`url = stockage.url(cle) = /medias/<clé>`).

Les **variantes responsives** (« quelques largeurs » de la consigne) sont produites **au
rendu** par `@nuxt/image` (déjà configuré : `screens`, `format:['webp']`) au-dessus de la
source `/medias/<clé>` — **pas** persistées en lignes séparées.

**Portée assumée (résolution de la consigne « quelques largeurs »).** Le téléversement écrit
**une seule** image canonique (WebP, plafonnée) par média : c'est la seule forme portable — le
modèle `Media` n'a qu'une clé (principe VI interdit une liste scalaire), et fabriquer une clé
par largeur construirait des URL hors `stockage.url` (porte 9). La délivrance en plusieurs
largeurs relève donc du **rendu**, par `@nuxt/image`, sur les **grandes couvertures publiques**
(déjà en place, feature 003). Dans le **back-office**, les vignettes sont en **dimensions
fixes** (64×36, 213×120…) : pas de `srcset`. **Cette feature n'ajoute donc aucune tâche de
génération de variantes multi-largeurs** — l'écart relevé (U1) est fermé par cette portée.

**Raison.** Le modèle `Media` porte **une** clé (principe VI : pas de liste scalaire). Stocker
une image canonique + laisser `@nuxt/image` dériver les largeurs au rendu garde le schéma
**inchangé** et **`stockage.url` seul producteur d'URL** (porte 9). `sharp` en mémoire :
**aucun** accès disque hors `Stockage`.

**Alternatives.** *Pré-générer N clés de largeurs* : imposerait soit une liste scalaire en base
(interdite), soit une construction d'URL par largeur hors `stockage.url` (viole la porte 9).
*Servir l'original tel quel* : renonce au format moderne et au plafond de taille demandés.

---

## D6 — Route de service des médias : `/medias/[...cle]`, adossée à `Stockage.get`, publique

**Décision.** `server/routes/medias/[...cle].get.ts` : reconstruit la clé depuis le chemin,
lit par **`Stockage.get(cle)`**, répond avec un `Content-Type` **dérivé de l'extension de la
clé** (`.webp`→`image/webp`, `.jpg`/`.jpeg`→`image/jpeg`, `.png`→`image/png`,
`.avif`→`image/avif` ; défaut `application/octet-stream`) et un cache long
(`Cache-Control: public, max-age=31536000, immutable` — les clés sont immuables). **Publique**
(non gardée) : les couvertures d'articles publiés sont publiques, et c'est cette route que
`stockage.url()` (disque) désigne déjà (`PREFIXE_PUBLIC = '/medias'`).

**Raison.** Rien ne sert `/medias/*` aujourd'hui (le téléversement n'existait pas avant cette
feature). Une route d'application adossée à `Stockage.get` rend le service **portable** : pour
S3, `stockage.url` pourra renvoyer l'URL S3 pour les couvertures, tandis que la route continue
de servir les images du corps via `Stockage.get`. Clés opaques (`cuid`) → non énumérables.

**Alternatives.** *Montage statique de `stockage/medias`* : contourne l'interface `Stockage`
(porte 9) et ne survit pas à un back-end objet. *Route gardée* : casserait l'affichage public
des couvertures.

---

## D7 — `sharp` natif : externaliser au build Nitro

**Décision.** Ajouter `sharp` aux **externals** Nitro et **tracer son binaire**, comme
`better-sqlite3` : `nitro.externals.external: [..., 'sharp']` et, si le binaire `.node`
n'est pas embarqué, `traceInclude: [requis.resolve('better-sqlite3'), requis.resolve('sharp')]`.
Vérifier au **démarrage du serveur compilé** (`npm run build && npm run preview`) qu'aucun
« Could not locate the bindings file » n'apparaît — le symptôme des modules natifs mal tracés
est au démarrage, pas à la compilation (cf. note CLAUDE.md).

**Raison.** `sharp` est un module natif à résolution dynamique, comme `better-sqlite3` déjà
traité dans `nuxt.config.ts`. `@nuxt/image` l'embarque déjà côté serveur, mais notre **import
direct** dans `server/utils/image.ts` doit être garanti au bundle.

**Alternatives.** *S'en remettre à la présence transitive via `@nuxt/image`* : fragile, non
garanti par contrat.

---

## D8 — Autosave : débounce client, création paresseuse, jamais publier

**Décision.** Le composable `useEditeurArticle` déclenche un enregistrement **débouncé**
(≈ 1,5 s d'inactivité) qui envoie un **`PATCH /api/admin/articles/[id]`** avec l'état courant,
**toujours à l'état brouillon**. Sur un **article neuf** (page `nouveau.vue`) sans `id`, le
premier enregistrement (auto ou explicite) fait un **`POST`** qui crée le brouillon, récupère
l'`id`, puis bascule en `PATCH` (**création paresseuse**) et remplace l'URL par `/admin/articles/<id>`
sans rechargement. L'indicateur d'état (« Brouillon enregistré · il y a N min ») reflète le
dernier enregistrement, **auto ou explicite**. Un **échec** (réseau, 401 session expirée)
**n'efface pas** la saisie : l'indicateur signale l'échec ; un 401 renvoie vers la connexion
(FR-016a, edge « session expirée »). L'autosave **ne publie jamais** (`publier` est une route
distincte).

**Raison.** Clarification de spec : autosave retenu. Le `PATCH` réutilise `modifierArticle`
(validation + assainissement), donc l'autosave hérite gratuitement de la chaîne de sûreté.

**Alternatives.** *Autosave par WebSocket / temps réel* : sur-conception pour un back-office
mono-rédacteur. *`localStorage` seul* : ne survit pas au changement de poste et n'assainit rien.

---

## D9 — Glisser-déposer de la Une : `@formkit/drag-and-drop`, clavier de première classe

**Décision.** `@formkit/drag-and-drop` **0.6.1** (MIT), adaptateur Vue, pour réordonner les
cinq emplacements par **décalage/insertion** (clarification de spec — permutation, pas échange).
La **navigabilité clavier est une exigence dure** (porte 8) : les poignées sont **focusables**
et exposent un déplacement au clavier (flèches Haut/Bas pour monter/descendre l'emplacement
focalisé), avec repère de focus visible et annonce du nouvel ordre (`aria-live`). Si le support
clavier natif de la librairie se révèle insuffisant à l'e2e, on **complète** par nos propres
gestionnaires `keydown` sur les poignées (5 items, coût faible) — la librairie ne sert alors
que le pointeur.

**Raison.** La consigne demande « une librairie de dnd pour Vue, accessible au clavier ».
`@formkit/drag-and-drop` est MIT, léger, à jour, avec adaptateur Vue et une histoire clavier.
Le nombre d'items (5) rend un repli clavier maison trivial si nécessaire — l'accessibilité
prime (principe VIII), la librairie ne peut pas la mettre en défaut.

**Alternatives.** *`vuedraggable`/`SortableJS`* : pas de clavier natif — inacceptable seul sous
porte 8. *DnD HTML5 nu* : gestion du pointeur verbeuse et inégale entre navigateurs.
*Pas de DnD, seulement des boutons monter/descendre* : irait, mais s'écarte de la maquette
(poignées) sans nécessité.

---

## D10 — Réattribution des rangs : `reordonnerUne`, une seule transaction

**Décision.** Nouveau service `reordonnerUne(ordre: string[])` dans `server/services/une.ts`.
Entrée : la liste **ordonnée** (≤ 5) des `id` d'articles composant la Une. En **une**
transaction : (1) **libérer** tous les rangs (`updateMany rangUne:null` sur les épinglés
absents de la liste **et** sur ceux de la liste, pour repartir d'une table propre) ; (2)
**réassigner** `rangUne = index+1` à chaque `id` de la liste, dans l'ordre. La contrainte
`@unique(rangUne)` rend impossible tout doublon ; l'ordre du tableau **est** l'ordre de
l'accueil (FR-027). Le service **refuse** un `id` non publié (à la Une ⇒ publié, FR-017), un
`id` inconnu, un doublon, ou une longueur > 5. Zod (`server/validation/une.ts`) valide la forme
en amont.

**Raison.** La consigne : « réattribution des rangs 1..5 transactionnelle côté serveur ». Une
transaction supprime tout état intermédiaire à deux articles au même rang, comme `placerALaUne`
le fait déjà pour l'éviction unitaire.

**Alternatives.** *N appels `placerALaUne` successifs* : plusieurs transactions, fenêtres
d'incohérence, et l'éviction unitaire ne modélise pas un **réordonnancement** complet.

---

## D11 — Épingler qui publie : `epinglerArticle` pour le chemin éditeur

**Décision.** Depuis **l'éditeur** (FR-021 : cocher « À la une » + rang sur un brouillon), la
mise à la une **publie d'abord**. Nouveau service `epinglerArticle(articleId, rang)` : dans une
transaction, si l'article est brouillon, applique les **mêmes gardes que `publierArticle`**
(couverture + `alt` requis) puis passe `publie`, ensuite exécute l'éviction de `placerALaUne`.
Depuis **Composer la Une** (FR-023/FR-024), la liste ne propose **que des publiés** : l'épinglage
y est un simple placement, committé par `reordonnerUne` à l'enregistrement.

**Raison.** FR-025 « épingler un non publié le publie d'abord » ne peut aboutir sans couverture
décrite : réutiliser les gardes de `publierArticle` évite une Une avec un article non publiable.

**Alternatives.** *Orchestrer publier puis placer dans la route* (deux transactions) : fenêtre
où l'article est publié mais non placé si la seconde échoue. La transaction unique l'évite.

---

## D12 — Liste d'administration : nouveau chemin de lecture, brouillons compris

**Décision.** `listerArticlesAdmin(options)` et `compterArticlesAdmin(options)` dans
`server/services/articles.ts`, **distincts** des lectures publiques : ils **n'appliquent PAS**
`filtreVisible` (l'admin voit brouillons et articles à venir). Filtres : `q` (sous-chaîne du
titre, insensible à la casse), `rubriqueId`, `statut` (`brouillon`/`publie`) — tous cumulables,
**appliqués côté serveur**. Tri par `modifieLe` décroissant (les plus récemment touchés en
tête). Pagination `page`/`taille` (taille ≈ 20). La couverture est jointe (`include: couverture`)
pour la vignette de table. Un DTO d'administration (`LigneArticleAdmin`) porte
`{ id, titre, rubrique, statut, rangUne, date, image? }` — jamais une forme brute Prisma.

Le composant public **`Pagination.vue`** (liens `?page=N`, conserve les autres paramètres) est
**réutilisé** tel quel : il n'est pas une Card et respecte déjà la sobriété. Changer de filtre
**réinitialise `page` à 1** (edge case du spec).

**Raison.** FR-005/FR-007/FR-008. Les lectures publiques existantes **ne peuvent pas** montrer
un brouillon (aucun paramètre pour désactiver `filtreVisible`, par sécurité 002) — l'admin a
donc son propre contrat, fermé par défaut (`exigerCompte`).

**Alternatives.** *Ajouter un drapeau « voir brouillons » aux lectures publiques* : rouvrirait la
fuite que la 002 a fermée délibérément. Un chemin séparé et gardé est plus sûr.

---

## D13 — Layout admin & rail : distinct, cohérent, `AppButton` réutilisé

**Décision.** `app/layouts/admin.vue` : structure des trois `.html` de back-office — rail
latéral **240 px** (`AdminRail.vue` : mot-symbole → accueil, liens « Articles / À la une /
Médias », déconnexion en bas), contenu à droite. Distinct du `default.vue` public (rail 248 px,
topbar, footer) mais taillé dans les **mêmes tokens**. Les boutons primaires (« Nouvel
article », « Publier », « Enregistrer la Une ») réutilisent **`AppButton` primaire** — dont le
survol va vers `--primaire-survol`, **pas** l'accent. L'entrée de rail active porte
`aria-current="page"`, `border-left` accent **+** fond `--surface` (seule exception admise,
principe III). Le lien **« Médias »** pointe un écran ultérieur **hors périmètre** : emplacement
réservé (page minimale « à venir »), non développé ici.

**Raison.** Principe I (rail latéral, jamais barre horizontale ; 240 px back-office). Correction
du défaut d'accent de `back-office-articles.html` (survol bouton → accent), la constitution et
`AppButton` primant.

**Alternatives.** *Un seul layout paramétré public/admin* : mélange deux charpentes très
différentes (topbar, footer, largeurs). Deux layouts sont plus lisibles.

---

## D14 — Petit écran du back-office : replier, empiler, faire défiler dans le conteneur

**Décision.** Sous le point de rupture du socle (**1000 px**, `tokens.md` §7) : le rail se
replie selon la décision **Fondations** (barre minimale : marque + menu + bascule de thème) ;
l'éditeur (3 colonnes) et le composer (2 colonnes) **s'empilent** verticalement ; la **table
dense** est enveloppée dans un conteneur `overflow-x:auto` — **elle** défile, jamais la page.
Cible : `scrollWidth ≤ clientWidth` du `body` à 375 px (porte 7).

**Raison.** Principe V : les maquettes sont desktop only, le petit écran **se conçoit**. La
table à sept colonnes ne peut pas rétrécir sans devenir illisible ; la faire défiler dans son
cadre est la seule issue sobre.

**Alternatives.** *Reflow de la table en cartes empilées* : réintroduirait des « cards »
d'administration non maquettées, contre la sobriété. Le défilement encadré est plus honnête.

---

## D15 — Confirmation destructive : dialogue client sobre, focus piégé

**Décision.** La suppression ouvre un **dialogue** (`DialogueConfirmation.vue`, `<dialog>` natif
ou équivalent ARIA) : titre, phrase de conséquence, deux boutons (« Annuler » secondaire,
« Supprimer » — libellé explicite). **Piège de focus**, fermeture par **`Échap`** et par clic
hors cadre, focus rendu au déclencheur à la fermeture. Écran **non maquetté** → sobre,
**sans accent** (principe III) ; le bouton de suppression n'emploie **pas** le rouge d'erreur en
fond (le rouge est réservé aux erreurs de formulaire). La suppression n'est envoyée
(`DELETE`) **qu'après** confirmation.

**Raison.** FR-028. La constitution range « confirmation de suppression » parmi les écrans à
concevoir : sobriété et accessibilité priment, pas d'accent de sa propre initiative.

**Alternatives.** *`window.confirm`* : non stylable, hors identité, a11y pauvre. *Suppression
optimiste avec annulation* : plus risqué pour un acte définitif.

---

## D16 — Champ sous-thème : sous le sélecteur de rubrique, style des autres champs

**Décision.** Le panneau de réglages ajoute un champ **sous-thème** (texte, facultatif, ≤ 40)
**sous** le sélecteur de rubrique, dans le **même style** que les autres champs du panneau
(`set-input` de la maquette). Aucune référence visuelle → aucun accent, aucun ornement.
Validation Zod déjà présente (`sousTheme.max(40)`).

**Raison.** Point ouvert de la constitution et FR-014a. Placement dicté par la consigne.

**Alternatives.** *Le mettre dans le corps de l'éditeur* : le sous-thème est une métadonnée, pas
du contenu ; sa place est le panneau.

---

## Synthèse des dépendances à épingler

| Paquet | Version | Licence | Rôle |
|---|---|---|---|
| `@tiptap/vue-3` | 3.28.0 | MIT | Éditeur riche (bindings Vue 3) |
| `@tiptap/starter-kit` | 3.28.0 | MIT | Gras, italique, H2/H3, listes, citation, historique |
| `@tiptap/extension-link` | 3.28.0 | MIT | Lien |
| `@tiptap/extension-image` | 3.28.0 | MIT | Image intégrée |
| `@tiptap/pm` | 3.28.0 | MIT | Pair ProseMirror obligatoire |
| `sharp` | 0.35.3 | Apache-2.0 | Traitement d'image au téléversement |
| `@formkit/drag-and-drop` | 0.6.1 | MIT | Glisser-déposer de la Une (clavier) |

Aucune extension TipTap **Pro**. `sanitize-html` et `@nuxt/image` sont **déjà** installés.

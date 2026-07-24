# syntax=docker/dockerfile:1

# Francomètre — image de production.
#
# Deux étapes. La « builder » compile les modules natifs et produit le bundle
# Nitro autonome (`.output`). La « runtime » n'embarque que ce qui sert à
# TOURNER : le bundle, plus la boîte à outils Prisma (migrations + seed) et la
# source qu'ils importent. Aucun binaire natif du poste de dev n'entre ici :
# `better-sqlite3` et `sharp` sont recompilés / téléchargés pour Linux.

# ---------- Étape 1 : construction ----------
FROM node:24-bookworm-slim AS builder

# `better-sqlite3` se compile depuis les sources : chaîne C++ + Python requise.
# `sharp` récupère un binaire prébâti (libvips inclus) — pas de -dev à installer.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Le postinstall lance `prisma generate`, qui charge `prisma.config.ts` ; or
# `env('DATABASE_URL')` y EXIGE la variable, même sans aucune connexion. Valeur
# FACTICE, valable au seul temps de build : la vraie URL vient de l'environnement
# d'exécution (Compose env_file). Aucune base n'est touchée ici.
ENV DATABASE_URL=file:/tmp/build-placeholder.db

# `npm ci` déclenche le postinstall (`prisma generate && nuxt prepare`), qui a
# besoin de TOUT le projet : on copie la source avant d'installer.
COPY . .

RUN npm ci
RUN npm run build

# ---------- Étape 2 : exécution ----------
FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    PORT=3000

# `curl` pour le healthcheck ; `tini` comme PID 1 (signaux + zombies propres).
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl tini ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# L'application ne sert que `.output`. Migrer et semer exigent, eux, la boîte à
# outils complète (CLI Prisma, client généré, seed, modules natifs) — d'où
# `node_modules` + la source importée par le seed (`shared/`, `server/`).
COPY --from=builder /app/.output          ./.output
COPY --from=builder /app/node_modules     ./node_modules
COPY --from=builder /app/prisma           ./prisma
COPY --from=builder /app/shared           ./shared
COPY --from=builder /app/server           ./server
COPY --from=builder /app/deploy           ./deploy
COPY --from=builder /app/package.json /app/package-lock.json /app/prisma.config.ts ./

# Répertoires persistés (montés par volumes au run). Créés et attribués à `node`
# pour que les volumes nommés héritent du bon propriétaire à l'initialisation.
RUN mkdir -p /app/stockage/medias /data/db \
 && chmod +x /app/deploy/docker-entrypoint.sh \
 && chown -R node:node /app /data

USER node
EXPOSE 3000

# `/robots.txt` ne touche pas la base : sonde fiable même base non encore semée.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/robots.txt || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/deploy/docker-entrypoint.sh"]

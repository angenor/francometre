#!/usr/bin/env bash
# Point d'entrée du conteneur Francomètre.
#
# À CHAQUE démarrage : applique les migrations en attente (idempotent).
# UNE fois, à la demande (FRANCOMETRE_SEED=1) : amorce la base — les 8 rubriques
# (indispensables : les articles y font clé étrangère), le compte de rédaction
# et le contenu d'exemple. Le seed est rejouable, mais il retraite les images
# d'exemple à chaque appel : on ne le laisse donc PAS tourner à chaque boot.
set -euo pipefail

echo "[francometre] Migrations Prisma (migrate deploy)…"
npx prisma migrate deploy

if [ "${FRANCOMETRE_SEED:-0}" = "1" ]; then
  echo "[francometre] Amorçage de la base (seed)…"
  npm run db:seed
fi

echo "[francometre] Démarrage du serveur Nitro sur le port ${PORT:-3000}."
exec node .output/server/index.mjs

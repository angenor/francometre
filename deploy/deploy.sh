#!/bin/bash

# ===========================================
# Francomètre — script de déploiement
# Déploiement Docker sur le MÊME VPS qu'africans, DERRIÈRE son nginx.
#
# Francomètre tourne en conteneur applicatif seul (aucun port publié). La porte
# d'entrée HTTPS reste le nginx d'africans : il rejoint le réseau partagé
# `francometre_net` et proxifie francometre.com vers ce conteneur.
# ===========================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Répertoire du script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- Configuration serveur -------------------------------------------------
REMOTE_USER="root"
REMOTE_HOST="161.97.92.63"
REMOTE_DIR="/opt/francometre"
REPO_URL="https://github.com/angenor/francometre.git"

# --- Configuration domaine -------------------------------------------------
DOMAIN="francometre.com"

# --- Intégration avec le déploiement africans (porte d'entrée HTTPS) --------
# Réseau Docker partagé qui relie le nginx d'africans au conteneur francometre.
SHARED_NETWORK="francometre_net"
# Déploiement africans sur ce VPS (pour y déposer le certificat francometre).
AFRICANS_DIR="/opt/uafricas"
# Nom du conteneur nginx d'africans (celui qui tient les ports 80/443).
AFRICANS_NGINX="uafricas_nginx"

COMPOSE="docker compose -f docker-compose.prod.yml"

echo -e "${GREEN}=== Francomètre — Déploiement ===${NC}"
echo -e "Serveur : ${BLUE}${REMOTE_USER}@${REMOTE_HOST}${NC}  —  Domaine : ${BLUE}${DOMAIN}${NC}"

# --- Fonctions SSH (auth par clé) ------------------------------------------
ssh_cmd() {
    ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" "$@"
}
scp_cmd() {
    scp -o StrictHostKeyChecking=no "$@"
}
ssh_heredoc() {
    ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}"
}

# Crée le réseau partagé s'il manque et y attache le nginx d'africans.
assurer_reseau() {
    ssh_heredoc <<ENDSSH
        docker network inspect ${SHARED_NETWORK} >/dev/null 2>&1 \
          || { echo "Création du réseau partagé ${SHARED_NETWORK}…"; docker network create ${SHARED_NETWORK}; }

        if docker ps -a --format '{{.Names}}' | grep -qx "${AFRICANS_NGINX}"; then
            docker network connect ${SHARED_NETWORK} ${AFRICANS_NGINX} 2>/dev/null \
              && echo "Nginx d'africans (${AFRICANS_NGINX}) attaché à ${SHARED_NETWORK}." \
              || echo "Nginx d'africans déjà attaché à ${SHARED_NETWORK} (ou attache impossible)."
        else
            echo "AVERTISSEMENT : conteneur ${AFRICANS_NGINX} introuvable."
            echo "  Attache-le au réseau une fois africans démarré :"
            echo "  docker network connect ${SHARED_NETWORK} ${AFRICANS_NGINX}"
        fi
ENDSSH
}

# ========================================
# SETUP — Installation initiale
# ========================================
setup() {
    echo -e "${GREEN}[1/6] Vérification de la connexion SSH…${NC}"
    ssh_cmd "echo 'Connexion SSH réussie.'"

    echo -e "${GREEN}[2/6] Vérification de Docker / Git…${NC}"
    ssh_heredoc <<'ENDSSH'
        if ! command -v docker &> /dev/null; then
            echo "Installation de Docker…"
            curl -fsSL https://get.docker.com | sh
            systemctl enable docker && systemctl start docker
        fi
        docker compose version &> /dev/null || { apt-get update && apt-get install -y docker-compose-plugin; }
        command -v git &> /dev/null || { apt-get update && apt-get install -y git; }
        echo "Docker : $(docker --version)"
        echo "Compose: $(docker compose version | head -1)"
        echo "Git    : $(git --version)"
ENDSSH

    echo -e "${GREEN}[3/6] Clonage / mise à jour du dépôt…${NC}"
    ssh_heredoc <<ENDSSH
        set -e
        if [ ! -d "${REMOTE_DIR}/.git" ]; then
            echo "Clonage dans ${REMOTE_DIR}…"
            rm -rf "${REMOTE_DIR}"
            git clone ${REPO_URL} "${REMOTE_DIR}"
        else
            echo "Dépôt déjà présent, mise à jour…"
            cd "${REMOTE_DIR}"
            git fetch origin && git reset --hard origin/main
        fi
ENDSSH

    echo -e "${GREEN}[4/6] Réseau partagé + attache du nginx d'africans…${NC}"
    assurer_reseau

    echo -e "${GREEN}[5/6] Génération des secrets et du fichier .env…${NC}"
    ssh_heredoc <<'ENDSSH'
        cd /opt/francometre
        if [ -f ".env" ]; then
            echo "Fichier .env existant conservé."
        else
            SESSION_PWD=$(openssl rand -base64 48)
            REDACTION_PWD=$(openssl rand -base64 18)
            cat > .env <<ENVEOF
# Généré par deploy.sh — ne pas commiter.
DATABASE_URL=file:/data/db/francometre.db
STOCKAGE=disque
NUXT_SESSION_PASSWORD=${SESSION_PWD}
NUXT_PUBLIC_SITE_URL=https://francometre.com
COMPTE_REDACTION_IDENTIFIANT=redaction@francometre.com
COMPTE_REDACTION_NOM=Rédaction
COMPTE_REDACTION_MOT_DE_PASSE=${REDACTION_PWD}
FRANCOMETRE_SEED=0
ENVEOF
            echo ""
            echo "Secrets générés (À CONSERVER) :"
            echo "  Connexion rédaction : redaction@francometre.com"
            echo "  Mot de passe        : ${REDACTION_PWD}"
            echo ""
        fi
ENDSSH

    echo -e "${GREEN}[6/6] Setup terminé.${NC}"
    echo ""
    echo -e "${YELLOW}Prochaines étapes :${NC}"
    echo "  1. Repointer le DNS de ${DOMAIN} (apex + www) vers ${REMOTE_HOST}."
    echo "  2. ./deploy.sh deploy      # construire et démarrer le conteneur"
    echo "  3. ./deploy.sh ssl         # certificat Let's Encrypt (apex + www)"
    echo "  4. Greffer deploy/nginx/francometre.conf sur le nginx d'africans,"
    echo "     puis recharger : docker exec ${AFRICANS_NGINX} nginx -s reload"
    echo "  5. ./deploy.sh seed        # 8 rubriques + compte + exemples (1 fois)"
}

# ========================================
# DEPLOY — Déploiement complet
# ========================================
deploy() {
    echo -e "${GREEN}[1/4] Récupération du code depuis GitHub…${NC}"
    ssh_heredoc <<ENDSSH
        set -e
        cd "${REMOTE_DIR}"
        git fetch origin && git reset --hard origin/main
ENDSSH

    echo -e "${GREEN}[2/4] Réseau partagé + attache du nginx d'africans…${NC}"
    assurer_reseau

    echo -e "${GREEN}[3/4] Build et démarrage du conteneur…${NC}"
    ssh_heredoc <<ENDSSH
        set -e
        cd "${REMOTE_DIR}"
        [ -f ".env" ] || { echo "ERREUR : .env introuvable. Lance d'abord : ./deploy.sh setup"; exit 1; }
        ${COMPOSE} down || true
        ${COMPOSE} build
        ${COMPOSE} up -d
        docker image prune -f
ENDSSH

    echo -e "${GREEN}[4/4] Vérification…${NC}"
    ssh_heredoc <<ENDSSH
        cd "${REMOTE_DIR}"
        ${COMPOSE} ps
        echo ""
        echo "Attente du démarrage (migrations + serveur)…"
        sleep 15
        ${COMPOSE} exec -T francometre curl -fsS http://127.0.0.1:3000/robots.txt >/dev/null \
          && echo " - Francomètre OK (SSR répond)" \
          || echo " - Francomètre pas encore prêt — voir : ./deploy.sh logs"
ENDSSH

    echo ""
    echo -e "${GREEN}=== Déploiement terminé ===${NC}"
    echo -e "${YELLOW}Si c'est le premier déploiement :${NC} ./deploy.sh ssl, greffe du vhost nginx, puis ./deploy.sh seed"
}

# ========================================
# UPDATE — Mise à jour rapide
# ========================================
update() {
    echo -e "${GREEN}Mise à jour rapide…${NC}"
    ssh_heredoc <<ENDSSH
        set -e
        cd "${REMOTE_DIR}"
        git fetch origin && git reset --hard origin/main
        ${COMPOSE} build
        ${COMPOSE} up -d
        docker image prune -f
        ${COMPOSE} ps
ENDSSH
    echo -e "${GREEN}Mise à jour terminée.${NC}"
}

# ========================================
# SEED — Amorçage de la base (1 fois)
# ========================================
seed() {
    echo -e "${GREEN}Amorçage : 8 rubriques + compte de rédaction + contenu d'exemple…${NC}"
    ssh_cmd "cd ${REMOTE_DIR} && ${COMPOSE} exec -T francometre npm run db:seed"
    echo -e "${GREEN}Amorçage terminé.${NC}"
    echo "Connexion : voir COMPTE_REDACTION_IDENTIFIANT dans ${REMOTE_DIR}/.env"
}

# ========================================
# SSL — Certificat Let's Encrypt (apex + www)
# ========================================
ssl() {
    echo -e "${GREEN}Certificat SSL pour ${DOMAIN} et www.${DOMAIN}…${NC}"
    echo -e "${YELLOW}Note : le nginx d'africans est arrêté ~quelques secondes (port 80 libéré).${NC}"
    ssh_heredoc <<ENDSSH
        set -e
        command -v certbot &> /dev/null || { apt-get update && apt-get install -y certbot; }

        # Libère le port 80, tenu par le nginx d'africans.
        docker stop ${AFRICANS_NGINX} || true

        certbot certonly --standalone \
          -d ${DOMAIN} -d www.${DOMAIN} \
          --non-interactive --agree-tos --email admin@${DOMAIN} \
          --deploy-hook 'cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ${AFRICANS_DIR}/nginx/ssl/francometre-fullchain.pem && cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ${AFRICANS_DIR}/nginx/ssl/francometre-privkey.pem && (docker exec ${AFRICANS_NGINX} nginx -s reload || true)'

        # Copie INITIALE (le deploy-hook ne se déclenche qu'aux renouvellements).
        mkdir -p ${AFRICANS_DIR}/nginx/ssl
        cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ${AFRICANS_DIR}/nginx/ssl/francometre-fullchain.pem
        cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem   ${AFRICANS_DIR}/nginx/ssl/francometre-privkey.pem

        # Redémarre le nginx d'africans.
        docker start ${AFRICANS_NGINX} || true
ENDSSH
    echo ""
    echo -e "${GREEN}Certificat installé.${NC} Chemins dans le nginx d'africans :"
    echo "  /etc/nginx/ssl/francometre-fullchain.pem"
    echo "  /etc/nginx/ssl/francometre-privkey.pem"
    echo -e "${YELLOW}Renouvellement :${NC} pris en charge par le cron 'certbot renew' déjà"
    echo "  installé par africans ; le deploy-hook recopie les certificats et recharge nginx."
    echo -e "${YELLOW}Reste à faire :${NC} greffer deploy/nginx/francometre.conf sur le nginx d'africans"
    echo "  (dépôt africans), puis : docker exec ${AFRICANS_NGINX} nginx -s reload"
}

# ========================================
# BACKUP — Sauvegarde SQLite cohérente
# ========================================
backup() {
    mkdir -p "${SCRIPT_DIR}/backups"
    TS=$(date +%Y%m%d_%H%M%S)
    REMOTE_TMP="/tmp/francometre-${TS}.db"
    LOCAL="${SCRIPT_DIR}/backups/francometre-${TS}.db"
    echo -e "${GREEN}Sauvegarde de la base (instantané .backup)…${NC}"
    ssh_heredoc <<ENDSSH
        set -e
        cd "${REMOTE_DIR}"
        ${COMPOSE} exec -T francometre node /app/deploy/backup-db.mjs /data/db/snapshot-${TS}.db
        docker cp francometre_app:/data/db/snapshot-${TS}.db ${REMOTE_TMP}
        ${COMPOSE} exec -T francometre rm -f /data/db/snapshot-${TS}.db || true
ENDSSH
    scp_cmd "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_TMP}" "${LOCAL}"
    ssh_cmd "rm -f ${REMOTE_TMP}"
    echo -e "${GREEN}Sauvegarde : ${LOCAL}${NC} ($(du -h "${LOCAL}" | cut -f1))"
    echo "Note : les médias vivent dans le volume 'francometre_medias' (sauvegarde à part si besoin)."
}

# ========================================
# LOGS / RESTART / STOP / STATUS / CONNECT / REBUILD
# ========================================
logs() {
    ssh_cmd "cd ${REMOTE_DIR} && ${COMPOSE} logs -f --tail=100 francometre"
}

restart() {
    echo -e "${GREEN}Redémarrage du conteneur francometre…${NC}"
    ssh_cmd "cd ${REMOTE_DIR} && ${COMPOSE} restart francometre"
    echo -e "${GREEN}Fait.${NC}"
}

stop() {
    echo -e "${YELLOW}Arrêt du conteneur francometre…${NC}"
    ssh_cmd "cd ${REMOTE_DIR} && ${COMPOSE} down"
    echo -e "${GREEN}Arrêté.${NC}"
}

status() {
    ssh_heredoc <<ENDSSH
        cd "${REMOTE_DIR}"
        echo "=== Conteneur ==="
        ${COMPOSE} ps
        echo ""
        echo "=== Dernier commit ==="
        git log -1 --oneline
        echo ""
        echo "=== Disque / Mémoire ==="
        df -h / | tail -1
        free -h | head -2
        echo ""
        echo "=== Santé (SSR) ==="
        ${COMPOSE} exec -T francometre curl -fsS http://127.0.0.1:3000/robots.txt >/dev/null \
          && echo " - Francomètre OK" || echo " - Francomètre KO"
        echo ""
        echo "=== Réseau partagé ==="
        docker network inspect ${SHARED_NETWORK} -f '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null \
          || echo "Réseau ${SHARED_NETWORK} absent."
ENDSSH
}

connect() {
    echo -e "${GREEN}Connexion au serveur (${REMOTE_DIR})…${NC}"
    ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" -t "cd ${REMOTE_DIR} && bash"
}

rebuild() {
    echo -e "${YELLOW}Rebuild complet sans cache…${NC}"
    ssh_heredoc <<ENDSSH
        set -e
        cd "${REMOTE_DIR}"
        ${COMPOSE} down
        ${COMPOSE} build --no-cache
        ${COMPOSE} up -d
        docker image prune -f
        ${COMPOSE} ps
ENDSSH
    echo -e "${GREEN}Rebuild terminé.${NC}"
}

# ========================================
# MENU
# ========================================
case "$1" in
    setup)   setup ;;
    deploy)  deploy ;;
    update)  update ;;
    seed)    seed ;;
    ssl)     ssl ;;
    backup)  backup ;;
    logs)    logs ;;
    restart) restart ;;
    stop)    stop ;;
    status)  status ;;
    connect) connect ;;
    rebuild) rebuild ;;
    *)
        echo -e "${GREEN}Francomètre — Déploiement${NC}"
        echo ""
        echo "Usage : $0 {commande}"
        echo ""
        echo -e "${BLUE}Installation :${NC}"
        echo "  setup     Installation initiale (dépôt, réseau partagé, .env)"
        echo ""
        echo -e "${BLUE}Déploiement :${NC}"
        echo "  deploy    Déploiement complet (pull + build + up)"
        echo "  update    Mise à jour rapide (pull + build + up)"
        echo "  rebuild   Rebuild sans cache"
        echo "  seed      Amorcer la base (8 rubriques + compte + exemples) — 1 fois"
        echo ""
        echo -e "${BLUE}Réseau / TLS :${NC}"
        echo "  ssl       Certificat Let's Encrypt (apex + www) pour le nginx d'africans"
        echo ""
        echo -e "${BLUE}Exploitation :${NC}"
        echo "  status    État du conteneur, ressources, réseau, santé"
        echo "  logs      Journaux en continu"
        echo "  restart   Redémarrer le conteneur"
        echo "  stop      Arrêter le conteneur"
        echo "  backup    Sauvegarde SQLite cohérente (rapatriée en local)"
        echo "  connect   SSH direct vers ${REMOTE_DIR}"
        echo ""
        echo -e "${BLUE}Premier déploiement, dans l'ordre :${NC}"
        echo "  DNS ${DOMAIN} → ${REMOTE_HOST}  puis  setup → deploy → ssl → (vhost nginx) → seed"
        exit 1
        ;;
esac

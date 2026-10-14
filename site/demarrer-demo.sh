#!/usr/bin/env bash
# Amène le site étudiant ENTIER et affiche son ADRESSE FIXE.
#
# Depuis le 2026-10-14, l'adresse publique est fournie par Tailscale Funnel : elle NE CHANGE PAS,
# même après un redémarrage du serveur, et elle ne demande ni domaine à acheter ni ouverture de
# port (le tunnel est sortant). L'ancien tunnel Cloudflare donnait une adresse ALÉATOIRE à chaque
# démarrage : il n'est plus utilisé, un lien envoyé aux invités serait devenu mort.
#
# Usage : demarrer-demo.sh [start|stop|lien|etat]
set -u
RACINE=/root/site-etudiant-v2
JOURNAUX=/root/site-logs
ADRESSE_FIXE="https://memo-demo.tail3d410f.ts.net"
mkdir -p "$JOURNAUX"

arreter() {
  local pid
  # On tue par PID (jamais par motif large : un motif peut viser la commande appelante elle-même).
  pid=$(ss -ltnp 2>/dev/null | grep ":4000 " | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2)
  [ -n "$pid" ] && kill "$pid" 2>/dev/null
  pid=$(ss -ltnp 2>/dev/null | grep ":5173 " | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2)
  [ -n "$pid" ] && kill "$pid" 2>/dev/null
  sleep 2
}

attendre_port() {
  local port=$1 i
  for i in $(seq 1 45); do
    curl -s -o /dev/null -m 2 "http://127.0.0.1:${port}/" && return 0
    sleep 2
  done
  return 1
}

demarrer() {
  cd "$RACINE"
  (cd backend && nohup npx tsx watch src/index.ts >"$JOURNAUX/backend.log" 2>&1 &)
  # Le site PUBLIC est servi en version CONSTRUITE (`vite preview`) : une poignée de fichiers
  # minifiés au lieu des centaines de modules du mode développement — indispensable pour un
  # étudiant sur un réseau faible. On construit si le dossier manque.
  if [ ! -f frontend/dist/index.html ]; then
    npm run build -w frontend >"$JOURNAUX/build.log" 2>&1 || echo "  ! la construction a échoué"
  fi
  (cd frontend && nohup npx vite preview --host 127.0.0.1 --port 5173 >"$JOURNAUX/frontend.log" 2>&1 &)
  attendre_port 4000 || echo "  ! le backend n'a pas répondu dans les temps"
  attendre_port 5173 || echo "  ! le frontend n'a pas répondu dans les temps"
  # L'adresse fixe : le service a déjà été configuré une fois (`tailscale funnel --bg 5173`) et il
  # est rechargé au démarrage. On le repose au cas où, sans échouer si c'est déjà en place.
  tailscale funnel --bg 5173 >/dev/null 2>&1 || true
  echo "ADRESSE FIXE : $ADRESSE_FIXE"
  tailscale funnel status 2>/dev/null | head -4
}

case "${1:-start}" in
  start) arreter; demarrer ;;
  stop)  arreter ;;
  lien)  echo "$ADRESSE_FIXE" ;;
  etat)  curl -s -o /dev/null -w "site -> %{http_code}\n" -m 20 "$ADRESSE_FIXE"
         curl -s -m 20 "$ADRESSE_FIXE/api/agents" | head -c 160; echo ;;
  *) echo "usage: $0 [start|stop|lien|etat]"; exit 2 ;;
esac

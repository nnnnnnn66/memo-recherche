#!/usr/bin/env bash
# ==============================================================================
# Script de sauvegarde MySQL quotidienne automatisée — Plateforme Mémoire de Recherche
# Politique Zéro Perte : export complet structuré, horodaté et compressé avec rotation
# ==============================================================================
set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/memoire-recherche}"
DB_NAME="${DB_NAME:-memoire_recherche}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root_dev_password}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

DATE_TAG=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/dump_${DB_NAME}_${DATE_TAG}.sql.gz"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Début de la sauvegarde de ${DB_NAME}..."

# Export consistant : single-transaction pour InnoDB, routines, triggers
mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --password="${DB_PASSWORD}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date -Iseconds)] Sauvegarde réussie : ${BACKUP_FILE} (${FILE_SIZE})"

# Rotation des sauvegardes : suppression uniquement des dumps de plus de N jours
echo "[$(date -Iseconds)] Nettoyage des sauvegardes antérieures à ${RETENTION_DAYS} jours..."
find "${BACKUP_DIR}" -name "dump_${DB_NAME}_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date -Iseconds)] Opération terminée avec succès."

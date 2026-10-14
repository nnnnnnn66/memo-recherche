import { Prisma, PrismaClient } from '@prisma/client';
import { config } from '../config.js';

/**
 * Modèles soumis à la politique ZÉRO PERTE (colonne deleted_at).
 * MethodologyStep est un référentiel : il n'est jamais supprimé.
 */
const SOFT_DELETE_MODELS = new Set<string>([
  'User',
  'ResearchProject',
  'StepWorkspace',
  'ConsultationSession',
  'ConsultationMessage',
]);

const base = new PrismaClient({
  log: config.isProd ? ['error'] : ['warn', 'error'],
});

function delegate(model: string) {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return (base as unknown as Record<string, any>)[key];
}

/** Ajoute `deletedAt: null` sauf si l'appelant filtre déjà explicitement sur deletedAt. */
function withAlive(where: Record<string, unknown> | undefined) {
  if (where && Object.prototype.hasOwnProperty.call(where, 'deletedAt')) return where;
  return { ...where, deletedAt: null };
}

/**
 * Client Prisma étendu :
 *  - delete / deleteMany sont convertis en UPDATE deleted_at = NOW()
 *  - les lectures excluent automatiquement les lignes supprimées
 * Une seconde barrière existe en base : des triggers MySQL refusent tout DELETE.
 */
export const prisma = base.$extends({
  name: 'zero-loss-soft-delete',
  query: {
    $allModels: {
      async delete({ model, args }: { model: string; args: { where: any } }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          throw new Error(`Suppression physique interdite sur ${model}`);
        }
        return delegate(model).update({ where: args.where, data: { deletedAt: new Date() } });
      },
      async deleteMany({ model, args }: { model: string; args: { where?: any } }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          throw new Error(`Suppression physique interdite sur ${model}`);
        }
        return delegate(model).updateMany({ where: withAlive(args.where), data: { deletedAt: new Date() } });
      },
      async findMany({ model, args, query }: { model: string; args: { where?: any }; query: (args: any) => Promise<any> }) {
        if (SOFT_DELETE_MODELS.has(model)) args.where = withAlive(args.where);
        return query(args);
      },
      async findFirst({ model, args, query }: { model: string; args: { where?: any }; query: (args: any) => Promise<any> }) {
        if (SOFT_DELETE_MODELS.has(model)) args.where = withAlive(args.where);
        return query(args);
      },
      async findUnique({ model, args, query }: { model: string; args: { where?: any }; query: (args: any) => Promise<any> }) {
        if (SOFT_DELETE_MODELS.has(model)) args.where = withAlive(args.where);
        return query(args);
      },
      async count({ model, args, query }: { model: string; args: { where?: any }; query: (args: any) => Promise<any> }) {
        if (SOFT_DELETE_MODELS.has(model)) args.where = withAlive(args.where);
        return query(args);
      },
    },
  },
});

export type AppPrisma = typeof prisma;
export { Prisma };

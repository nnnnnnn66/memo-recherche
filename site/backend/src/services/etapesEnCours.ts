/**
 * SUIVI DES LANCEMENTS D'ÉTAPE — pourquoi ce module existe
 *
 * Un lancement d'étape dure 20 s à 25 min (l'étape « Revue de littérature » télécharge et lit des
 * PDF). Tant qu'il était fait dans la requête HTTP, l'étudiante restait devant un écran d'attente
 * pendant tout ce temps, et le lien public COUPAIT la requête au bout de ~2 minutes (HTTP 524 mesuré
 * à 125 s) alors que l'agent continuait de travailler côté serveur — donc : un échec affiché pour un
 * travail réellement effectué, et une analyse consommée pour rien.
 *
 * D'où la règle : **la requête rend la main TOUT DE SUITE**, le travail continue en arrière-plan, et
 * le site INTERROGE l'avancement. La coupure du tunnel ne peut plus faire échouer une étape.
 *
 * Deuxième garde-fou : un seul lancement à la fois par mémoire. Un élève qui clique deux fois (ou
 * recharge) ne déclenche pas un second appel d'agent — l'analyse est facturée, on ne la paie pas deux
 * fois pour rien.
 */

export type EtatSuivi = 'en_cours' | 'termine' | 'echec';

export interface SuiviEtape {
  etat: EtatSuivi;
  /** Numéro de l'étape lancée (indication ; la plateforme reste seule décisionnaire). */
  etape?: number;
  debut: number;
  fin?: number;
  /** Sortie de la plateforme, telle quelle, quand l'étape a abouti. */
  resultat?: unknown;
  /** Conversation où la production a été enregistrée (le site s'y rend pour la lire). */
  sessionId?: string | null;
  /** Message destiné à l'étudiant quand l'étape a échoué. */
  erreur?: string;
}

/** Durée de conservation d'un état terminé : le site peut interroger l'avancement en retard. */
const MEMOIRE_MS = 6 * 60 * 60 * 1000;

const suivis = new Map<string, SuiviEtape>();

export function cleSuivi(etudiant: string, session: string): string {
  return `${etudiant}::${session}`;
}

export function suivi(cle: string): SuiviEtape | undefined {
  const courant = suivis.get(cle);
  if (!courant) return undefined;
  if (courant.etat !== 'en_cours' && courant.fin && Date.now() - courant.fin > MEMOIRE_MS) {
    suivis.delete(cle);
    return undefined;
  }
  return courant;
}

export interface Lancement {
  /** `true` si CE appel a réellement démarré le travail (donc consommé une analyse). */
  demarre: boolean;
  suivi: SuiviEtape;
}

/**
 * Démarre le travail si, et seulement si, aucun lancement n'est en cours pour ce mémoire.
 *
 * `tache` est exécutée SANS être attendue par l'appelant : c'est tout l'intérêt. Son résultat (ou
 * son échec) est consigné dans le suivi, que le site interroge ensuite.
 */
export function demarrer(cle: string, etape: number | undefined, tache: () => Promise<unknown>): Lancement {
  const courant = suivi(cle);
  if (courant && courant.etat === 'en_cours') {
    // Déjà en route : on renvoie l'état EXISTANT sans rien relancer (pas de double analyse).
    return { demarre: false, suivi: courant };
  }

  const enregistrement: SuiviEtape = { etat: 'en_cours', etape, debut: Date.now() };
  suivis.set(cle, enregistrement);

  void (async () => {
    try {
      const sortie = (await tache()) as
        | { resultat?: unknown; sessionId?: string | null }
        | undefined;
      enregistrement.etat = 'termine';
      enregistrement.resultat = sortie?.resultat;
      enregistrement.sessionId = sortie?.sessionId ?? null;
      enregistrement.etape =
        (sortie?.resultat as { etape?: number } | undefined)?.etape ?? enregistrement.etape;
    } catch (err: unknown) {
      enregistrement.etat = 'echec';
      enregistrement.erreur =
        err instanceof Error ? err.message : "L'étape n'a pas pu aboutir sur la plateforme.";
    } finally {
      enregistrement.fin = Date.now();
    }
  })();

  return { demarre: true, suivi: enregistrement };
}

/** Vue transmissible au site : jamais d'objet interne, jamais de fonction. */
export function vuDeLExterieur(entree: SuiviEtape) {
  return {
    etat: entree.etat,
    etape: entree.etape ?? null,
    duree_s: Math.round(((entree.fin ?? Date.now()) - entree.debut) / 1000),
    resultat: entree.etat === 'termine' ? entree.resultat : undefined,
    sessionId: entree.etat === 'termine' ? entree.sessionId ?? null : null,
    erreur: entree.etat === 'echec' ? entree.erreur : undefined,
  };
}

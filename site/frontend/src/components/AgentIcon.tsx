import React from 'react';
import {
  Compass,
  Search,
  BookOpen,
  Layers,
  HelpCircle,
  Target,
  Lightbulb,
  Scale,
  MapPin,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  type LucideProps,
} from 'lucide-react';

export type AgentIconName =
  | 'Compass'
  | 'Search'
  | 'BookOpen'
  | 'Layers'
  | 'HelpCircle'
  | 'Target'
  | 'Lightbulb'
  | 'Scale'
  | 'MapPin'
  | 'BarChart3'
  | 'ShieldCheck'
  | 'GraduationCap';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Compass,
  Search,
  BookOpen,
  Layers,
  HelpCircle,
  Target,
  Lightbulb,
  Scale,
  MapPin,
  BarChart3,
  ShieldCheck,
  GraduationCap,
};

// Correspondance par ID d'agent (1 à 12) pour un fallback garanti
const AGENT_ID_ICON_MAP: Record<number, React.ComponentType<LucideProps>> = {
  1: Compass,        // 1. Sujet du mémoire
  2: Search,         // 2. Problème de recherche
  3: BookOpen,       // 3. Revue de littérature
  4: Layers,         // 4. Problématique
  5: HelpCircle,     // 5. Question de recherche
  6: Target,         // 6. Objectifs de recherche
  7: Lightbulb,      // 7. Hypothèses de recherche
  8: Scale,          // 8. Diagnostic méthodologique
  9: MapPin,         // 9. Méthodologie & Terrain
  10: BarChart3,     // 10. Analyse des résultats
  11: ShieldCheck,   // 11. Vérificateur de cohérence
  12: GraduationCap, // 12. Conclusion & Perspectives
};

interface AgentIconProps extends LucideProps {
  name?: string;
  agentId?: number;
}

export const AgentIcon: React.FC<AgentIconProps> = ({ name, agentId, ...props }) => {
  let IconComponent: React.ComponentType<LucideProps> | undefined;

  if (name && ICON_MAP[name]) {
    IconComponent = ICON_MAP[name];
  } else if (agentId && AGENT_ID_ICON_MAP[agentId]) {
    IconComponent = AGENT_ID_ICON_MAP[agentId];
  } else {
    IconComponent = Compass;
  }

  return <IconComponent {...props} />;
};

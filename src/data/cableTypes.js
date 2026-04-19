/**
 * Types de câblage pour le suivi hospitalier
 * Chaque type a un identifiant, un nom, une icône et une couleur associée
 */

export const CABLE_TYPES = [
  {
    id: 'informatique_machine',
    name: 'Informatique Machine',
    shortName: 'Machine',
    icon: 'Monitor',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
  },
  {
    id: 'informatique_wifi',
    name: 'Informatique Wi-Fi',
    shortName: 'Wi-Fi',
    icon: 'Wifi',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
  },
  {
    id: 'informatique_bureau',
    name: 'Informatique Bureau',
    shortName: 'Bureau',
    icon: 'Laptop',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  },
  {
    id: 'tv',
    name: 'Câblage TV',
    shortName: 'TV',
    icon: 'Tv',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  },
  {
    id: 'camera',
    name: 'Câblage Caméra',
    shortName: 'Caméra',
    icon: 'Camera',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
  },
  {
    id: 'appel_malade',
    name: 'Appel Malade',
    shortName: 'Appel',
    icon: 'Bell',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
  },
  {
    id: 'incendie',
    name: 'Câblage Incendie',
    shortName: 'Incendie',
    icon: 'Flame',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #fb923c)',
  },
  {
    id: 'controle_acces',
    name: 'Contrôle d\'Accès',
    shortName: 'Accès',
    icon: 'Lock',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
  },
];

/**
 * Statuts possibles pour chaque câblage
 */
export const STATUS = {
  NOT_STARTED: { id: 'not_started', label: 'Non démarré', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.15)' },
  IN_PROGRESS: { id: 'in_progress', label: 'En cours', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
  COMPLETED: { id: 'completed', label: 'Terminé', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  ISSUE: { id: 'issue', label: 'Problème', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
};

/**
 * Définition des étages
 */
export const FLOORS = [
  { id: 0, name: 'RDC', fullName: 'Rez-de-Chaussée', icon: 'Building' },
  { id: 1, name: '1er', fullName: '1er Étage', icon: 'Building2' },
  { id: 2, name: '2ème', fullName: '2ème Étage', icon: 'Building2' },
  { id: 3, name: '3ème', fullName: '3ème Étage', icon: 'Building2' },
  { id: 4, name: '4ème', fullName: '4ème Étage', icon: 'Building2' },
];

/**
 * Nombre de blocs par étage
 */
export const BLOCKS_PER_FLOOR = 11;

/**
 * Génère les blocs pour un étage donné
 */
export const getBlocksForFloor = (floorId) => {
  return Array.from({ length: BLOCKS_PER_FLOOR }, (_, i) => ({
    id: `floor_${floorId}_block_${i + 1}`,
    number: i + 1,
    name: `Bloc ${i + 1}`,
    floorId,
  }));
};

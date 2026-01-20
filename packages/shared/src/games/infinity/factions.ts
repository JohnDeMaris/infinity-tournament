import type { Faction } from '../types';

/**
 * Infinity: The Game - Factions
 *
 * Includes all main factions and their sectorials for N5 (5th Edition)
 */

export const INFINITY_FACTIONS: Faction[] = [
  // PanOceania
  {
    id: 'panoceania',
    name: 'PanOceania',
    aliases: ['PanO', 'Pan Oceania', 'Pan-Oceania'],
    logo: '/games/infinity/factions/panoceania.svg',
  },
  {
    id: 'nca',
    name: 'Neoterran Capitaline Army',
    aliases: ['NCA', 'Neoterra'],
    parentId: 'panoceania',
    isSectorial: true,
  },
  {
    id: 'saa',
    name: 'Svalarheima\'s Winter Force',
    aliases: ['SAA', 'Svalarheima', 'Winter Force'],
    parentId: 'panoceania',
    isSectorial: true,
  },
  {
    id: 'military-orders',
    name: 'Military Orders',
    aliases: ['MO', 'Knights'],
    parentId: 'panoceania',
    isSectorial: true,
  },
  {
    id: 'varuna',
    name: 'Varuna Immediate Reaction Division',
    aliases: ['Varuna', 'VIRD'],
    parentId: 'panoceania',
    isSectorial: true,
  },

  // Yu Jing
  {
    id: 'yujing',
    name: 'Yu Jing',
    aliases: ['YJ'],
    logo: '/games/infinity/factions/yujing.svg',
  },
  {
    id: 'isa',
    name: 'Invincible Army',
    aliases: ['IA', 'ISA', 'Invincibles'],
    parentId: 'yujing',
    isSectorial: true,
  },
  {
    id: 'white-banner',
    name: 'White Banner',
    aliases: ['WB'],
    parentId: 'yujing',
    isSectorial: true,
  },

  // Ariadna
  {
    id: 'ariadna',
    name: 'Ariadna',
    aliases: [],
    logo: '/games/infinity/factions/ariadna.svg',
  },
  {
    id: 'usariadna',
    name: 'USAriadna Ranger Force',
    aliases: ['USA', 'USARF', 'USAriadna'],
    parentId: 'ariadna',
    isSectorial: true,
  },
  {
    id: 'caledonia',
    name: 'Caledonian Highlander Army',
    aliases: ['CHA', 'Caledonians', 'Scots'],
    parentId: 'ariadna',
    isSectorial: true,
  },
  {
    id: 'tartary',
    name: 'Tartary Army Corps',
    aliases: ['TAK', 'Tartary'],
    parentId: 'ariadna',
    isSectorial: true,
  },
  {
    id: 'kosmoflot',
    name: 'Kosmoflot',
    aliases: ['Kosmo'],
    parentId: 'ariadna',
    isSectorial: true,
  },

  // Haqqislam
  {
    id: 'haqqislam',
    name: 'Haqqislam',
    aliases: ['Haqq'],
    logo: '/games/infinity/factions/haqqislam.svg',
  },
  {
    id: 'hassassin',
    name: 'Hassassin Bahram',
    aliases: ['Hassassins', 'Bahram'],
    parentId: 'haqqislam',
    isSectorial: true,
  },
  {
    id: 'ramah',
    name: 'Ramah Taskforce',
    aliases: ['RTF', 'Ramah'],
    parentId: 'haqqislam',
    isSectorial: true,
  },
  {
    id: 'qapu-khalqi',
    name: 'Qapu Khalqi',
    aliases: ['QK'],
    parentId: 'haqqislam',
    isSectorial: true,
  },

  // Nomads
  {
    id: 'nomads',
    name: 'Nomads',
    aliases: [],
    logo: '/games/infinity/factions/nomads.svg',
  },
  {
    id: 'corregidor',
    name: 'Jurisdictional Command of Corregidor',
    aliases: ['Corregidor', 'CJC'],
    parentId: 'nomads',
    isSectorial: true,
  },
  {
    id: 'bakunin',
    name: 'Jurisdictional Command of Bakunin',
    aliases: ['Bakunin'],
    parentId: 'nomads',
    isSectorial: true,
  },
  {
    id: 'tunguska',
    name: 'Jurisdictional Command of Tunguska',
    aliases: ['Tunguska'],
    parentId: 'nomads',
    isSectorial: true,
  },

  // Combined Army
  {
    id: 'combined',
    name: 'Combined Army',
    aliases: ['CA', 'Combined'],
    logo: '/games/infinity/factions/combined.svg',
  },
  {
    id: 'morat',
    name: 'Morat Aggression Force',
    aliases: ['MAF', 'Morats'],
    parentId: 'combined',
    isSectorial: true,
  },
  {
    id: 'shasvastii',
    name: 'Shasvastii Expeditionary Force',
    aliases: ['Shas', 'SEF'],
    parentId: 'combined',
    isSectorial: true,
  },
  {
    id: 'onyx',
    name: 'Onyx Contact Force',
    aliases: ['Onyx', 'OCF'],
    parentId: 'combined',
    isSectorial: true,
  },

  // ALEPH
  {
    id: 'aleph',
    name: 'ALEPH',
    aliases: [],
    logo: '/games/infinity/factions/aleph.svg',
  },
  {
    id: 'steel-phalanx',
    name: 'Steel Phalanx',
    aliases: ['SP', 'Phalanx', 'Greeks'],
    parentId: 'aleph',
    isSectorial: true,
  },
  {
    id: 'operations-subsection',
    name: 'Operations Subsection',
    aliases: ['OSS', 'OperS'],
    parentId: 'aleph',
    isSectorial: true,
  },

  // O-12
  {
    id: 'o12',
    name: 'O-12',
    aliases: ['O12'],
    logo: '/games/infinity/factions/o12.svg',
  },
  {
    id: 'starmada',
    name: 'Starmada',
    aliases: [],
    parentId: 'o12',
    isSectorial: true,
  },
  {
    id: 'torchlight',
    name: 'Torchlight Brigade',
    aliases: ['Torchlight'],
    parentId: 'o12',
    isSectorial: true,
  },

  // NA2 (Non-Aligned Armies)
  {
    id: 'na2',
    name: 'Non-Aligned Armies',
    aliases: ['NA2', 'Mercenaries'],
    logo: '/games/infinity/factions/na2.svg',
  },
  {
    id: 'dahshat',
    name: 'Dahshat Company',
    aliases: ['Dahshat'],
    parentId: 'na2',
    isSectorial: true,
  },
  {
    id: 'druze',
    name: 'Druze Bayram Security',
    aliases: ['Druze', 'DBS'],
    parentId: 'na2',
    isSectorial: true,
  },
  {
    id: 'ikari',
    name: 'Ikari Company',
    aliases: ['Ikari'],
    parentId: 'na2',
    isSectorial: true,
  },
  {
    id: 'starco',
    name: 'StarCo',
    aliases: ['Star Company'],
    parentId: 'na2',
    isSectorial: true,
  },
  {
    id: 'spiral',
    name: 'Spiral Corps',
    aliases: ['Spiral', 'Tohaa'],
    parentId: 'na2',
    isSectorial: true,
  },
  {
    id: 'white-company',
    name: 'White Company',
    aliases: ['White Co'],
    parentId: 'na2',
    isSectorial: true,
  },
  {
    id: 'foreign-company',
    name: 'Foreign Company',
    aliases: ['ForCo', 'FC'],
    parentId: 'na2',
    isSectorial: true,
  },
  {
    id: 'japanese-secessionist',
    name: 'Japanese Secessionist Army',
    aliases: ['JSA', 'Japanese'],
    parentId: 'na2',
    isSectorial: true,
  },
];

/**
 * Get faction by ID or alias
 */
export function findFaction(input: string): Faction | undefined {
  const normalized = input.toLowerCase().trim();

  return INFINITY_FACTIONS.find(
    (f) =>
      f.id.toLowerCase() === normalized ||
      f.name.toLowerCase() === normalized ||
      f.aliases?.some((a) => a.toLowerCase() === normalized)
  );
}

/**
 * Get all main factions (not sectorials)
 */
export function getMainFactions(): Faction[] {
  return INFINITY_FACTIONS.filter((f) => !f.isSectorial);
}

/**
 * Get sectorials for a parent faction
 */
export function getSectorials(parentId: string): Faction[] {
  return INFINITY_FACTIONS.filter((f) => f.parentId === parentId);
}

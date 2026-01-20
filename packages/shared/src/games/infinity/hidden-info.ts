import type { HiddenInfoConfig, HiddenInfoType } from '../types';

/**
 * ITS Classified Objectives
 *
 * These are the secret objectives players can select in ITS missions.
 * Updated for ITS Season 15 / N5.
 */
export const CLASSIFIED_OBJECTIVES = [
  { id: 'hva', name: 'HVT: Designation' },
  { id: 'hvi', name: 'HVT: Inoculation' },
  { id: 'hvr', name: 'HVT: Retroengineering' },
  { id: 'hve', name: 'HVT: Espionage' },
  { id: 'test-run', name: 'Test Run' },
  { id: 'telemetry', name: 'Telemetry' },
  { id: 'net-undermine', name: 'Net-Undermine' },
  { id: 'follow-up', name: 'Follow Up' },
  { id: 'mapping', name: 'Mapping' },
  { id: 'data-scan', name: 'Data Scan' },
  { id: 'sabotage', name: 'Sabotage' },
  { id: 'capture', name: 'Capture' },
  { id: 'extreme-prejudice', name: 'Extreme Prejudice' },
  { id: 'nanoespionage', name: 'Nanoespionage' },
  { id: 'predator', name: 'Predator' },
  { id: 'rescue', name: 'Rescue' },
  { id: 'experimental-drug', name: 'Experimental Drug' },
  { id: 'in-extremis-recovery', name: 'In Extremis Recovery' },
] as const;

/**
 * Hidden Information Types for Infinity
 */
export const INFINITY_HIDDEN_INFO_TYPES: HiddenInfoType[] = [
  {
    id: 'classified',
    name: 'Classified Objectives',
    description: 'Secret objectives selected from the classified deck',
    maxPerPlayer: 2,
    options: CLASSIFIED_OBJECTIVES.map((c) => ({ id: c.id, name: c.name })),
  },
  {
    id: 'hidden-deployment',
    name: 'Hidden Deployment',
    description: 'Units deployed face-down, revealed when discovered or activated',
    maxPerPlayer: null, // Unlimited based on army
  },
  {
    id: 'data-tracker',
    name: 'Data Tracker',
    description: 'Designated specialist for scenario objectives',
    maxPerPlayer: 1,
  },
  {
    id: 'command-tokens',
    name: 'Command Tokens',
    description: 'Track command token usage and reserves',
    maxPerPlayer: 4, // Standard starting amount
  },
  {
    id: 'lieutenant',
    name: 'Lieutenant',
    description: 'Hidden lieutenant designation',
    maxPerPlayer: 1,
  },
];

/**
 * Infinity Hidden Information Configuration
 */
export const INFINITY_HIDDEN_INFO: HiddenInfoConfig = {
  types: INFINITY_HIDDEN_INFO_TYPES,
};

/**
 * Get classified objective by ID
 */
export function getClassifiedById(
  id: string
): (typeof CLASSIFIED_OBJECTIVES)[number] | undefined {
  return CLASSIFIED_OBJECTIVES.find((c) => c.id === id);
}

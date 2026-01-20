// Game System Types
export type {
  GameSystem,
  GameRegistry,
  ScoreField,
  ScoringConfig,
  MatchScores,
  Faction,
  ParsedList,
  ValidationResult,
  TournamentRules,
  ListConfig,
  HiddenInfoType,
  HiddenInfoConfig,
  UIConfig,
} from './types';

// Registry
export {
  gameRegistry,
  getGameSystem,
  isGameRegistered,
  getRegisteredGameIds,
} from './registry';

// Infinity Game System
export { infinityGame } from './infinity';
export {
  INFINITY_FACTIONS,
  findFaction,
  getMainFactions,
  getSectorials,
} from './infinity/factions';
export {
  CLASSIFIED_OBJECTIVES,
  INFINITY_HIDDEN_INFO,
  INFINITY_HIDDEN_INFO_TYPES,
  getClassifiedById,
} from './infinity/hidden-info';
export type {
  MatchState,
  PlayerHiddenState,
  StateHistoryEntry,
  StateAction,
  ClassifiedState,
  HiddenDeploymentState,
  DataTrackerState,
  LieutenantState,
} from './infinity/match-state';
export {
  createEmptyMatchState,
  createEmptyPlayerState,
  createHistoryEntry,
  appendHistory,
  isMatchState,
  parseMatchState,
} from './infinity/match-state';
export {
  parseInfinityArmyCode,
  validateInfinityList,
  detectFaction,
  extractPoints,
} from './infinity/parser';

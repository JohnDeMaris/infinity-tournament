import type { GameSystem, GameRegistry } from './types';
import { infinityGame } from './infinity';

/**
 * Game System Registry
 *
 * Central registry for all supported game systems.
 * New games are registered here and become available throughout the app.
 */

const games = new Map<string, GameSystem>();

// Register default games
games.set(infinityGame.id, infinityGame);

/**
 * Game Registry Implementation
 */
export const gameRegistry: GameRegistry = {
  /**
   * Get a game system by ID
   */
  get(id: string): GameSystem | undefined {
    return games.get(id);
  },

  /**
   * Get all registered game systems
   */
  getAll(): GameSystem[] {
    return Array.from(games.values());
  },

  /**
   * Register a new game system
   */
  register(game: GameSystem): void {
    if (games.has(game.id)) {
      console.warn(`Game system '${game.id}' is already registered. Overwriting.`);
    }
    games.set(game.id, game);
  },

  /**
   * Get the default game system (Infinity)
   */
  getDefault(): GameSystem {
    return infinityGame;
  },
};

/**
 * Get a game system by ID, or the default if not found
 */
export function getGameSystem(id?: string | null): GameSystem {
  if (!id) {
    return gameRegistry.getDefault();
  }
  return gameRegistry.get(id) ?? gameRegistry.getDefault();
}

/**
 * Check if a game system is registered
 */
export function isGameRegistered(id: string): boolean {
  return games.has(id);
}

/**
 * Get all registered game IDs
 */
export function getRegisteredGameIds(): string[] {
  return Array.from(games.keys());
}

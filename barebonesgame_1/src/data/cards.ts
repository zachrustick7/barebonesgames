import { Card, MiniGame } from '../types/game';

// Mini-game definitions
export const miniGames: Record<string, MiniGame> = {
  popTheLock: {
    id: 'popTheLock',
    name: 'Pop the Lock',
    description: 'Click when the ticker hits the green area',
    duration: 5000,
    type: 'precision'
  },
  lightningTiming: {
    id: 'lightningTiming',
    name: 'Lightning Timing',
    description: 'Hit spacebar on the electric pulse',
    duration: 4000,
    type: 'precision'
  },
  mathProblem: {
    id: 'mathProblem',
    name: 'Quick Math',
    description: 'Solve the math problem quickly',
    duration: 3000,
    type: 'precision'
  }
  // Removed other mini-games until they're implemented
};

// Initial card deck - only cards with implemented mini-games
export const initialCards: Card[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    miniGameId: 'popTheLock',
    rarity: 'common',
    element: 'fire',
    cooldown: 2000,
    lastUsed: 0,
    manaCost: 10
  },
  {
    id: 'lightning',
    name: 'Lightning',
    miniGameId: 'mathProblem',
    rarity: 'common',
    element: 'lightning',
    cooldown: 150, // Very fast primary attacks
    lastUsed: 0,
    manaCost: 8
  }
  // Removed other cards until their mini-games are implemented
];

// Spell casting effects based on mini-game performance
export const getSpellPower = (baseCard: Card, performance: number): number => {
  const baseMultiplier = getRarityMultiplier(baseCard.rarity);
  const performanceMultiplier = 0.5 + (performance / 100) * 1.5; // 0.5x to 2x based on performance
  return baseMultiplier * performanceMultiplier;
};

export const getRarityMultiplier = (rarity: Card['rarity']): number => {
  switch (rarity) {
    case 'common': return 1.0;
    case 'rare': return 1.3;
    case 'epic': return 1.7;
    case 'legendary': return 2.2;
  }
};

export const getElementColor = (element?: Card['element']): string => {
  switch (element) {
    case 'fire': return '#ff4444';
    case 'ice': return '#44aaff';
    case 'lightning': return '#ffff44';
    case 'earth': return '#88aa44';
    case 'arcane': return '#aa44ff';
    default: return '#666666';
  }
}; 
// Core game types for MiniMage

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  position: Position;
  health: number;
  maxHealth: number;
  speed: number;
  size: number;
  hasSpecialCharge: boolean;
  lastPrimaryShot: number;
  lastSpecialAttempt: number;
}

export interface Enemy {
  id: string;
  position: Position;
  targetPosition?: Position; // Where they're trying to move to
  health: number;
  maxHealth: number;
  speed: number;
  size: number;
  projectilePattern: string;
  lastShotTime: number;
  shotCooldown: number;
  hitFlash?: number; // Timestamp when last hit
  // AI properties
  state: 'entering' | 'hunting' | 'positioning' | 'shooting';
  accuracy: number; // 0.0 to 1.0 - how good their aim is
  reactionTime: number; // ms delay before reacting to player movement
  aggression: number; // 0.0 to 1.0 - how likely to advance vs hang back
  lastPlayerPosition?: Position; // Last known player position
  lastReactionTime: number; // When they last reacted to player
  personalSpace: number; // Min distance from other enemies
  // Knockback properties
  knockbackVelocity?: Position; // Current knockback movement
  knockbackEndTime?: number; // When knockback effect ends
  // Stun properties
  stunEndTime?: number; // When stun effect ends
}

export interface Projectile {
  id: string;
  position: Position;
  velocity: Position;
  size: number;
  damage: number;
  isPlayerProjectile: boolean;
  gravity?: number;
  bounce?: boolean;
  groundLevel?: number; // Where this projectile should land (launcher's foot level)
}

export interface Card {
  id: string;
  name: string;
  miniGameId: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  element?: 'fire' | 'ice' | 'lightning' | 'earth' | 'arcane';
  cooldown: number;
  lastUsed: number;
  manaCost: number;
}

export interface MiniGameResult {
  score: number; // 0-100
  completed: boolean;
}

export interface MiniGame {
  id: string;
  name: string;
  description: string;
  duration: number; // milliseconds
  type: 'memory' | 'reaction' | 'precision' | 'sequence';
}

export interface Spell {
  id: string;
  name: string;
  damage: number;
  effect: string;
  position: Position;
  velocity: Position;
  size: number;
  duration: number;
  createdAt: number;
  gravity?: number;
  isSuper?: boolean;
  groundLevel?: number; // Where this spell should land (launcher's foot level)
}

export interface Particle {
  id: string;
  position: Position;
  velocity: Position;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'fire' | 'spark' | 'explosion';
}

export interface Effect {
  id: string;
  type: 'explosion' | 'hit' | 'ground_impact' | 'lightning' | 'chain_lightning';
  position: Position;
  startTime: number;
  duration: number;
  size: number;
  // Lightning-specific properties
  targetPosition?: Position; // End point for lightning
  chainPositions?: Position[]; // Multiple positions for chain lightning
  segments?: number;
  jitterAmount?: number;
  width?: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  spells: Spell[];
  particles: Particle[];
  effects: Effect[];
  cards: Card[];
  gameStatus: 'playing' | 'paused' | 'gameOver' | 'victory';
  score: number;
  wave: number;
  activeMiniGame: string | null;
  screenShake: number;
  lastEnemySpawn: number; // Timestamp of last enemy spawn for door effect
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  playerStartPosition: Position;
  enemySpawnArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
} 
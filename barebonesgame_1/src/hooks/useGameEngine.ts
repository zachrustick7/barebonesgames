import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameConfig, Enemy, Projectile, Spell, Particle, Effect, Position } from '../types/game';
import { initialCards, getSpellPower } from '../data/cards';
import { PROJECTILE_CONFIG } from '../data/projectileConfig';

// Shared boundary calculations to ensure consistency
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

// Enemy spawn passage configuration
const PASSAGE_CONFIG = {
  width: 8,
  height: 100,
  x: CANVAS_WIDTH - 8, // Flush with right edge
  y: (CANVAS_HEIGHT - 100) / 2, // Centered vertically
  get centerX() { return this.x + this.width / 2; },
  get centerY() { return this.y + this.height / 2; }
};

// Character dimensions (matching what's used in boundary calculations)
const CHARACTER_SIZE = 20;
const CHARACTER_WIDTH = CHARACTER_SIZE * 1.2; // 24px
const CHARACTER_HEIGHT = CHARACTER_SIZE * 2; // 40px  
const HEAD_SIZE = CHARACTER_WIDTH * 0.6; // ~14px
const HAT_HEIGHT = 18;

// Boundary calculations
const HALF_WIDTH = CHARACTER_WIDTH / 2;
const TOP_MARGIN = CHARACTER_HEIGHT / 2 + HEAD_SIZE * 0.8 + HAT_HEIGHT; // space needed above center
const BOTTOM_MARGIN = CHARACTER_HEIGHT / 2 + 60; // conservative bottom margin

const PLAY_AREA = {
  minY: TOP_MARGIN + 5, // top boundary
  maxY: CANVAS_HEIGHT - BOTTOM_MARGIN, // bottom boundary
  minX: HALF_WIDTH + 5, // left boundary  
  maxX: 420 - HALF_WIDTH, // right boundary (player area)
  enemyMinX: 550, // enemy area start
  enemyMaxX: CANVAS_WIDTH - HALF_WIDTH - 5 // enemy right boundary
};

const gameConfig: GameConfig = {
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  playerStartPosition: { 
    x: 100, 
    y: Math.min(300, PLAY_AREA.maxY - 50) // Ensure player starts within bounds
  },
  enemySpawnArea: { 
    x: PLAY_AREA.enemyMinX, 
    y: PLAY_AREA.minY, 
    width: PLAY_AREA.enemyMaxX - PLAY_AREA.enemyMinX, 
    height: PLAY_AREA.maxY - PLAY_AREA.minY 
  }
};

// Current active spell index
let activeSpellIndex = 0;

const createInitialGameState = (): GameState => ({
  player: {
    position: { ...gameConfig.playerStartPosition },
    health: 100,
    maxHealth: 100,
    speed: 2.5, // Slower, more tactical wizard movement
    size: 20,
    hasSpecialCharge: false,
    lastPrimaryShot: 0,
    lastSpecialAttempt: 0
  },
  enemies: [],
  projectiles: [],
  spells: [],
  particles: [],
  effects: [],
  cards: [...initialCards],
  gameStatus: 'playing',
  score: 0,
  wave: 1,
  activeMiniGame: null,
  screenShake: 0,
  lastEnemySpawn: 0
});

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  // Key handling
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    setKeys(prev => new Set([...Array.from(prev), key]));
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setKeys(prev => {
      const newKeys = new Set(Array.from(prev));
      newKeys.delete(event.key.toLowerCase());
      return newKeys;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);



  // Player movement
  const updatePlayerPosition = useCallback((deltaTime: number) => {
    setGameState(prev => {
      if (prev.gameStatus !== 'playing') return prev;

      const newPosition = { ...prev.player.position };
      const speed = prev.player.speed * (deltaTime / 16); // Normalize to 60fps

      if (keys.has('w') || keys.has('arrowup')) newPosition.y -= speed;
      if (keys.has('s') || keys.has('arrowdown')) newPosition.y += speed;
      if (keys.has('a') || keys.has('arrowleft')) newPosition.x -= speed;
      if (keys.has('d') || keys.has('arrowright')) newPosition.x += speed;

      // Keep player in bounds using shared boundary calculations
      newPosition.x = Math.max(PLAY_AREA.minX, Math.min(PLAY_AREA.maxX, newPosition.x));
      newPosition.y = Math.max(PLAY_AREA.minY, Math.min(PLAY_AREA.maxY, newPosition.y));

      return {
        ...prev,
        player: { ...prev.player, position: newPosition }
      };
    });
  }, [keys]);

  // Enemy spawning with AI
  const spawnEnemy = useCallback(() => {
    const aiConfig = PROJECTILE_CONFIG.enemyAI;
    
    // Random AI stats
    const accuracy = aiConfig.combat.accuracy.min + Math.random() * (aiConfig.combat.accuracy.max - aiConfig.combat.accuracy.min);
    const reactionTime = aiConfig.combat.reactionTime.min + Math.random() * (aiConfig.combat.reactionTime.max - aiConfig.combat.reactionTime.min);
    const aggression = aiConfig.combat.aggression.min + Math.random() * (aiConfig.combat.aggression.max - aiConfig.combat.aggression.min);
    const personalSpace = aiConfig.combat.personalSpace.min + Math.random() * (aiConfig.combat.personalSpace.max - aiConfig.combat.personalSpace.min);
    const speedMultiplier = 1 + (Math.random() - 0.5) * aiConfig.movement.speedVariance;
    
    // Spawn from the passage with slight variation
    const passageVariance = 10; // Small random offset around passage
    const spawnX = PASSAGE_CONFIG.centerX + (Math.random() - 0.5) * passageVariance;
    const spawnY = PASSAGE_CONFIG.centerY + (Math.random() - 0.5) * passageVariance;
    
    // Target position in enemy zone
    const targetX = PLAY_AREA.enemyMinX + Math.random() * (PLAY_AREA.enemyMaxX - PLAY_AREA.enemyMinX) * 0.4;
    const targetY = PLAY_AREA.minY + Math.random() * (PLAY_AREA.maxY - PLAY_AREA.minY);
    
    const newEnemy: Enemy = {
      id: Date.now().toString(),
      position: {
        x: spawnX, // Spawn from door
        y: spawnY
      },
      targetPosition: {
        x: targetX, // Enter to front part of enemy zone
        y: targetY
      },
      health: 50,
      maxHealth: 50,
      speed: (aiConfig.movement.baseSpeed * speedMultiplier),
      size: 15,
      projectilePattern: 'straight',
      lastShotTime: 0,
      shotCooldown: 2000 + Math.random() * 1000,
      // AI properties
      state: 'entering',
      accuracy,
      reactionTime,
      aggression,
      lastReactionTime: 0,
      personalSpace
    };

    setGameState(prev => ({
      ...prev,
      enemies: [...prev.enemies, newEnemy],
      lastEnemySpawn: Date.now() // Track spawn time for door effect
    }));
  }, []);

    // Helper functions for enemy AI
  const getDistanceToPlayer = useCallback((enemy: Enemy, playerPos: Position) => {
    return Math.sqrt(
      (enemy.position.x - playerPos.x) ** 2 + 
      (enemy.position.y - playerPos.y) ** 2
    );
  }, []);

  const findOptimalPosition = useCallback((enemy: Enemy, playerPos: Position, otherEnemies: Enemy[]) => {
    const aiConfig = PROJECTILE_CONFIG.enemyAI;
    const combatRange = aiConfig.combat.preferredRange;
    
    // Calculate ideal distance from player
    const currentDistance = getDistanceToPlayer(enemy, playerPos);
    const idealDistance = combatRange.min + (combatRange.max - combatRange.min) * (1 - enemy.aggression);
    
    // Direction toward player
    const toPlayer = {
      x: playerPos.x - enemy.position.x,
      y: playerPos.y - enemy.position.y
    };
    const magnitude = Math.sqrt(toPlayer.x ** 2 + toPlayer.y ** 2);
    const normalized = magnitude > 0 ? { x: toPlayer.x / magnitude, y: toPlayer.y / magnitude } : { x: 0, y: 0 };
    
    // Calculate target position at ideal distance
    let targetPosition = {
      x: playerPos.x - normalized.x * idealDistance,
      y: playerPos.y - normalized.y * idealDistance
    };
    
    // Keep in enemy bounds
    targetPosition.x = Math.max(PLAY_AREA.enemyMinX, Math.min(PLAY_AREA.enemyMaxX, targetPosition.x));
    targetPosition.y = Math.max(PLAY_AREA.minY, Math.min(PLAY_AREA.maxY, targetPosition.y));
    
    // Avoid other enemies (collision avoidance)
    for (const other of otherEnemies) {
      if (other.id !== enemy.id) {
        const distToOther = Math.sqrt(
          (targetPosition.x - other.position.x) ** 2 + 
          (targetPosition.y - other.position.y) ** 2
        );
        
        if (distToOther < enemy.personalSpace) {
          // Move away from other enemy
          const awayFromOther = {
            x: targetPosition.x - other.position.x,
            y: targetPosition.y - other.position.y
          };
          const awayMagnitude = Math.sqrt(awayFromOther.x ** 2 + awayFromOther.y ** 2);
          if (awayMagnitude > 0) {
            const awayNormalized = { x: awayFromOther.x / awayMagnitude, y: awayFromOther.y / awayMagnitude };
            targetPosition.x += awayNormalized.x * (enemy.personalSpace - distToOther);
            targetPosition.y += awayNormalized.y * (enemy.personalSpace - distToOther);
          }
        }
      }
    }
    
    // Keep in bounds after collision avoidance
    targetPosition.x = Math.max(PLAY_AREA.enemyMinX, Math.min(PLAY_AREA.enemyMaxX, targetPosition.x));
    targetPosition.y = Math.max(PLAY_AREA.minY, Math.min(PLAY_AREA.maxY, targetPosition.y));
    
    return targetPosition;
  }, [getDistanceToPlayer]);

  // Enemy AI and movement system
  const updateEnemies = useCallback((currentTime: number) => {
    setGameState(prev => {
      const aiConfig = PROJECTILE_CONFIG.enemyAI;
      
      const updatedEnemies = prev.enemies.map(enemy => {
        let updatedEnemy = { ...enemy };
        
        // Handle stun - enemies can't move or act while stunned
        if (enemy.stunEndTime && currentTime < enemy.stunEndTime) {
          // Just update appearance, no movement or actions
          return updatedEnemy;
        } else if (enemy.stunEndTime && currentTime >= enemy.stunEndTime) {
          // Clear stun when it expires
          updatedEnemy.stunEndTime = undefined;
        }

        // Handle knockback physics
        if (enemy.knockbackVelocity && enemy.knockbackEndTime && currentTime < enemy.knockbackEndTime) {
          // Apply knockback movement
          const knockbackDecay = 0.9; // Knockback slows down over time
          updatedEnemy.position = {
            x: Math.max(PLAY_AREA.enemyMinX, Math.min(PLAY_AREA.enemyMaxX, 
              enemy.position.x + enemy.knockbackVelocity.x)),
            y: Math.max(PLAY_AREA.minY, Math.min(PLAY_AREA.maxY, 
              enemy.position.y + enemy.knockbackVelocity.y))
          };
          
          // Decay knockback velocity
          updatedEnemy.knockbackVelocity = {
            x: enemy.knockbackVelocity.x * knockbackDecay,
            y: enemy.knockbackVelocity.y * knockbackDecay
          };
          
          // Skip normal AI movement while being knocked back
          return updatedEnemy;
        } else if (enemy.knockbackEndTime && currentTime >= enemy.knockbackEndTime) {
          // Clear knockback when it expires
          updatedEnemy.knockbackVelocity = undefined;
          updatedEnemy.knockbackEndTime = undefined;
        }
        
        // AI State Machine (only runs if not being knocked back)
        switch (enemy.state) {
          case 'entering':
            // Move toward initial target position
            if (enemy.targetPosition) {
              const distToTarget = Math.sqrt(
                (enemy.position.x - enemy.targetPosition.x) ** 2 + 
                (enemy.position.y - enemy.targetPosition.y) ** 2
              );
              
              if (distToTarget > aiConfig.movement.stoppingDistance) {
                // Move toward target
                const direction = {
                  x: enemy.targetPosition.x - enemy.position.x,
                  y: enemy.targetPosition.y - enemy.position.y
                };
                const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
                const normalized = { x: direction.x / magnitude, y: direction.y / magnitude };
                
                updatedEnemy.position = {
                  x: enemy.position.x + normalized.x * aiConfig.entry.walkInSpeed,
                  y: enemy.position.y + normalized.y * aiConfig.entry.walkInSpeed
                };
              } else {
                // Reached initial position, start hunting
                updatedEnemy.state = 'hunting';
                updatedEnemy.lastReactionTime = currentTime;
              }
            }
            break;
            
          case 'hunting':
            // React to player movement with delay
            if (currentTime - enemy.lastReactionTime > enemy.reactionTime) {
              const newTarget = findOptimalPosition(enemy, prev.player.position, prev.enemies);
              updatedEnemy.targetPosition = newTarget;
              updatedEnemy.lastPlayerPosition = { ...prev.player.position };
              updatedEnemy.lastReactionTime = currentTime;
              updatedEnemy.state = 'positioning';
            }
            break;
            
          case 'positioning':
            // Move toward optimal position
            if (enemy.targetPosition) {
              const distToTarget = Math.sqrt(
                (enemy.position.x - enemy.targetPosition.x) ** 2 + 
                (enemy.position.y - enemy.targetPosition.y) ** 2
              );
              
              if (distToTarget > aiConfig.movement.stoppingDistance) {
                // Move toward target
                const direction = {
                  x: enemy.targetPosition.x - enemy.position.x,
                  y: enemy.targetPosition.y - enemy.position.y
                };
                const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
                const normalized = { x: direction.x / magnitude, y: direction.y / magnitude };
                
                updatedEnemy.position = {
                  x: enemy.position.x + normalized.x * enemy.speed,
                  y: enemy.position.y + normalized.y * enemy.speed
                };
              } else {
                // Reached position, ready to shoot
                updatedEnemy.state = 'shooting';
              }
            }
            break;
            
          case 'shooting':
            // Try to shoot at player, then go back to hunting
            if (currentTime - enemy.lastShotTime > enemy.shotCooldown) {
              // Apply accuracy to aim
              let targetPos = { ...prev.player.position };
              const accuracyOffset = (1 - enemy.accuracy) * 100; // Max 40px offset for worst accuracy
              targetPos.x += (Math.random() - 0.5) * accuracyOffset;
              targetPos.y += (Math.random() - 0.5) * accuracyOffset;
              
              const direction = {
                x: targetPos.x - enemy.position.x,
                y: targetPos.y - enemy.position.y
              };
              const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
              const normalizedDirection = {
                x: direction.x / magnitude,
                y: direction.y / magnitude
              };

              // Calculate enemy launch position
              const enemyHeight = enemy.size * 1.8;
              const enemyHandLevel = enemy.position.y - enemyHeight * 0.3;
              const enemyFootLevel = enemy.position.y + enemyHeight / 2;

              const newProjectile: Projectile = {
                id: `${enemy.id}-${currentTime}`,
                position: { 
                  x: enemy.position.x, 
                  y: enemyHandLevel
                },
                velocity: {
                  x: normalizedDirection.x * PROJECTILE_CONFIG.enemy.velocity.base,
                  y: normalizedDirection.y * PROJECTILE_CONFIG.enemy.velocity.base + PROJECTILE_CONFIG.enemy.velocity.upwardArc
                },
                size: PROJECTILE_CONFIG.enemy.size,
                damage: PROJECTILE_CONFIG.enemy.damage,
                isPlayerProjectile: false,
                gravity: PROJECTILE_CONFIG.enemy.gravity,
                groundLevel: enemyFootLevel
              };

              prev.projectiles.push(newProjectile);
              updatedEnemy.lastShotTime = currentTime;
              updatedEnemy.state = 'hunting'; // Go back to hunting after shooting
            }
            break;
        }
        
        return updatedEnemy;
      });

      return { ...prev, enemies: updatedEnemies };
    });
  }, [findOptimalPosition, getDistanceToPlayer]);

  // Particle helper function (defined early for use in updateProjectiles)
  const createGroundSparks = useCallback((position: Position) => {
    const particles: Particle[] = [];
    const count = 5;
    
    for (let i = 0; i < count; i++) {
      particles.push({
        id: `spark-${Date.now()}-${i}`,
        position: { ...position },
        velocity: {
          x: (Math.random() - 0.5) * 8,
          y: -(Math.random() * 6 + 2)
        },
        size: 1 + Math.random(),
        color: '#ffff88',
        life: 0,
        maxLife: 20 + Math.random() * 15,
        type: 'spark'
      });
    }
    
    return particles;
  }, []);

  // Projectile and spell movement
  const updateProjectiles = useCallback(() => {
    setGameState(prev => {
      const currentTime = Date.now();
      
      // Update projectiles
      const newParticles = [...prev.particles];
      
      const updatedProjectiles = prev.projectiles
        .map(projectile => {
          // Apply gravity if the projectile has it
          const newVelocity = projectile.gravity ? {
            x: projectile.velocity.x,
            y: projectile.velocity.y + projectile.gravity
          } : projectile.velocity;
          
          const newPosition = {
            x: projectile.position.x + newVelocity.x,
            y: projectile.position.y + newVelocity.y
          };
          
          // Check ground collision for projectiles with gravity
          // Use the stored ground level (launcher's foot level)
          const groundLevel = projectile.groundLevel || gameConfig.canvasHeight * 0.8; // Fallback if not set
          if (projectile.gravity && newPosition.y >= groundLevel) {
            // Create ground sparks at ground level
            newParticles.push(...createGroundSparks({ x: newPosition.x, y: groundLevel }));
            return null; // Remove projectile
          }
          
          return {
            ...projectile,
            position: newPosition,
            velocity: newVelocity
          };
        })
        .filter(projectile => 
          projectile !== null &&
          projectile.position.x > -50 && 
          projectile.position.x < gameConfig.canvasWidth + 50 &&
          projectile.position.y > -50 && 
          projectile.position.y < gameConfig.canvasHeight + 50
        ) as Projectile[];

      // Update spells
      const updatedSpells = prev.spells
        .map(spell => ({
          ...spell,
          position: {
            x: spell.position.x + spell.velocity.x,
            y: spell.position.y + spell.velocity.y
          }
        }))
        .filter(spell => 
          currentTime - spell.createdAt < spell.duration &&
          spell.position.x > -50 && 
          spell.position.x < gameConfig.canvasWidth + 50 &&
          spell.position.y > -50 && 
          spell.position.y < gameConfig.canvasHeight + 50
        );

      return { 
        ...prev, 
        projectiles: updatedProjectiles,
        spells: updatedSpells,
        particles: newParticles
      };
    });
  }, [createGroundSparks, gameConfig]);

  // Particle system functions
  const createFireParticles = useCallback((position: Position, velocity: Position, isSuper: boolean = false) => {
    const particles: Particle[] = [];
    const config = isSuper ? PROJECTILE_CONFIG.playerSuper : PROJECTILE_CONFIG.playerPrimary;
    const count = config.particles.count;
    
    for (let i = 0; i < count; i++) {
      particles.push({
        id: `fire-${Date.now()}-${i}`,
        position: { 
          x: position.x + (Math.random() - 0.5) * 10,
          y: position.y + (Math.random() - 0.5) * 10
        },
        velocity: {
          x: velocity.x * 0.5 + (Math.random() - 0.5) * 4,
          y: velocity.y * 0.5 + (Math.random() - 0.5) * 4
        },
        size: isSuper ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#ff6644' : '#ffaa22',
        life: 0,
        maxLife: 30 + Math.random() * 20,
        type: 'fire'
      });
    }
    return particles;
  }, []);

  const createExplosionEffect = useCallback((position: Position, size: number, isSuper: boolean = false) => {
    const particles: Particle[] = [];
    const count = isSuper ? 20 : 10;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = isSuper ? 6 + Math.random() * 4 : 3 + Math.random() * 3;
      
      particles.push({
        id: `explosion-${Date.now()}-${i}`,
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        size: isSuper ? 3 + Math.random() * 4 : 2 + Math.random() * 2,
        color: Math.random() > 0.3 ? '#ff4444' : '#ffaa00',
        life: 0,
        maxLife: 40 + Math.random() * 20,
        type: 'explosion'
      });
    }
    
    return particles;
  }, []);

  // Update particles
  const updateParticles = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      particles: prev.particles
        .map(particle => ({
          ...particle,
          position: {
            x: particle.position.x + particle.velocity.x,
            y: particle.position.y + particle.velocity.y
          },
          velocity: {
            x: particle.velocity.x * 0.98, // Air resistance
            y: particle.velocity.y + (particle.type === 'spark' ? 0.2 : 0.1) // Gravity
          },
          life: particle.life + 1
        }))
        .filter(particle => particle.life < particle.maxLife)
    }));
  }, []);

  // Update spells with physics
  const updateSpells = useCallback(() => {
    setGameState(prev => {
      const newParticles = [...prev.particles];
      const newEffects = [...prev.effects];
      let newScreenShake = Math.max(0, prev.screenShake - 0.5);
      
      const updatedSpells = prev.spells
        .map(spell => {
          // Add fire particles - modest for primary, spectacular for super
          const config = spell.isSuper ? PROJECTILE_CONFIG.playerSuper : PROJECTILE_CONFIG.playerPrimary;
          if (Math.random() < config.particles.chance) {
            newParticles.push(...createFireParticles(spell.position, spell.velocity, spell.isSuper));
          }
          
          // Apply gravity
          const newVelocity = {
            x: spell.velocity.x,
            y: spell.velocity.y + (spell.gravity || 0)
          };
          
          const newPosition = {
            x: spell.position.x + newVelocity.x,
            y: spell.position.y + newVelocity.y
          };
          
          // Check ground collision
          // Use the stored ground level (launcher's foot level)
          const groundLevel = spell.groundLevel || gameConfig.canvasHeight * 0.8; // Fallback if not set
          if (newPosition.y >= groundLevel) {
            // Create ground impact effect at ground level
            newParticles.push(...createGroundSparks({ x: newPosition.x, y: groundLevel }));
            newEffects.push({
              id: `ground-impact-${Date.now()}`,
              type: 'ground_impact',
              position: { x: newPosition.x, y: groundLevel },
              startTime: Date.now(),
              duration: 300,
              size: spell.size
            });
            return null; // Remove spell
          }
          
          // Remove if out of bounds or expired
          if (newPosition.x > gameConfig.canvasWidth + 50 || 
              newPosition.x < -50 ||
              Date.now() - spell.createdAt > spell.duration) {
            return null;
          }
          
          return {
            ...spell,
            position: newPosition,
            velocity: newVelocity
          };
        })
        .filter(spell => spell !== null) as Spell[];
      
      return {
        ...prev,
        spells: updatedSpells,
        particles: newParticles,
        effects: newEffects,
        screenShake: newScreenShake
      };
    });
  }, [createFireParticles, createGroundSparks, gameConfig]);

  // Update effects
  const updateEffects = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      effects: prev.effects.filter(effect => 
        Date.now() - effect.startTime < effect.duration
      )
    }));
  }, []);

  // Collision detection
  const checkCollisions = useCallback(() => {
    setGameState(prev => {
      let newState = { ...prev };

      // Player vs enemy projectiles
      prev.projectiles
        .filter(p => !p.isPlayerProjectile)
        .forEach(projectile => {
          const distance = Math.sqrt(
            (projectile.position.x - prev.player.position.x) ** 2 +
            (projectile.position.y - prev.player.position.y) ** 2
          );

          if (distance < prev.player.size) {
            newState.player.health -= projectile.damage;
            newState.projectiles = newState.projectiles.filter(p => p.id !== projectile.id);

            if (newState.player.health <= 0) {
              newState.gameStatus = 'gameOver';
            }
          }
        });

      // Player spells vs enemies
      prev.spells.forEach(spell => {
        let spellHitSomething = false;
        
        prev.enemies.forEach(enemy => {
          const distance = Math.sqrt(
            (spell.position.x - enemy.position.x) ** 2 +
            (spell.position.y - enemy.position.y) ** 2
          );

                      // Calculate hit radius based on spell type
            const hitRadius = spell.isSuper 
              ? enemy.size + spell.size * PROJECTILE_CONFIG.playerSuper.areaOfEffect.radiusMultiplier
              : enemy.size + spell.size; // Normal radius for primary

          if (distance < hitRadius) {
            if (!spellHitSomething) {
              // Create explosion effect (only once per spell)
              newState.particles.push(...createExplosionEffect(spell.position, spell.size, spell.isSuper));
              
              // Create hit effect
              newState.effects.push({
                id: `hit-${Date.now()}`,
                type: 'hit',
                position: { ...spell.position },
                startTime: Date.now(),
                duration: 200,
                size: spell.size
              });
              
              // Screen shake for super fireballs
              if (spell.isSuper) {
                newState.screenShake = Math.max(newState.screenShake, 8);
                
                // SUPER FIREBALL SPECIAL: Explode into a fan of mini-fireballs!
                const baseDirection = { x: 1, y: 0 }; // Forward direction
                const fanConfig = PROJECTILE_CONFIG.playerSuper.miniFan;
                
                // Create fan of mini-fireballs
                fanConfig.angles.forEach((angle, index) => {
                  setTimeout(() => {
                    // Convert angle to radians and apply to base direction
                    const radians = (angle * Math.PI) / 180;
                    const direction = {
                      x: baseDirection.x * Math.cos(radians) - baseDirection.y * Math.sin(radians),
                      y: baseDirection.x * Math.sin(radians) + baseDirection.y * Math.cos(radians)
                    };
                    
                    const miniFireball: Spell = {
                      id: `mini-fireball-${Date.now()}-${index}`,
                      name: 'Mini Fireball',
                      damage: fanConfig.damage,
                      effect: 'fire',
                      position: { ...spell.position },
                      velocity: {
                        x: direction.x * fanConfig.velocity,
                        y: direction.y * fanConfig.velocity - 0.5 // Slight upward arc
                      },
                      size: fanConfig.size,
                      duration: 2000,
                      createdAt: Date.now(),
                      gravity: fanConfig.gravity,
                      isSuper: false,
                      groundLevel: spell.groundLevel
                    };
                    
                    setGameState(prevState => ({
                      ...prevState,
                      spells: [...prevState.spells, miniFireball]
                    }));
                  }, index * fanConfig.staggerDelay); // Stagger timing from config
                });
              }
              
              spellHitSomething = true;
            }

            // Calculate knockback direction based on projectile's trajectory
            const projectileDirection = {
              x: spell.velocity.x,
              y: spell.velocity.y
            };
            const projectileMagnitude = Math.sqrt(projectileDirection.x ** 2 + projectileDirection.y ** 2);
            const normalizedKnockback = projectileMagnitude > 0 ? {
              x: projectileDirection.x / projectileMagnitude,
              y: projectileDirection.y / projectileMagnitude
            } : { x: 1, y: 0 }; // Default to right if no direction
            
            // Get knockback settings from spell config
            let knockbackConfig: { force: number; duration: number };
            if (spell.name === 'Mini Fireball') {
              knockbackConfig = PROJECTILE_CONFIG.playerSuper.miniFan.knockback;
            } else {
              knockbackConfig = spell.isSuper ? PROJECTILE_CONFIG.playerSuper.knockback : PROJECTILE_CONFIG.playerPrimary.knockback;
            }

            // Apply damage and knockback to this enemy
            newState.enemies = newState.enemies.map(e => 
              e.id === enemy.id 
                ? { 
                    ...e, 
                    health: e.health - spell.damage, 
                    hitFlash: Date.now(),
                    knockbackVelocity: {
                      x: normalizedKnockback.x * knockbackConfig.force,
                      y: normalizedKnockback.y * knockbackConfig.force
                    },
                    knockbackEndTime: Date.now() + knockbackConfig.duration
                  }
                : e
            ).filter(e => e.health > 0);

            newState.score += 10;
          }
        });
        
        // Remove spell if it hit something
        if (spellHitSomething) {
          newState.spells = newState.spells.filter(s => s.id !== spell.id);
        }
      });

      return newState;
    });
  }, []);



  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    updatePlayerPosition(deltaTime);
    updateEnemies(currentTime);
    updateProjectiles();
    updateSpells();
    updateParticles();
    updateEffects();
    checkCollisions();

    // Spawn enemies periodically
    if (Math.random() < 0.01 && gameState.enemies.length < 5) {
      spawnEnemy();
    }

    if (gameState.gameStatus === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [updatePlayerPosition, updateEnemies, updateProjectiles, updateSpells, updateParticles, updateEffects, checkCollisions, spawnEnemy, gameState.enemies.length, gameState.gameStatus]);

  // Start game loop
  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop, gameState.gameStatus]);

  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
  }, []);

  const startMiniGame = useCallback((cardId: string) => {
    setGameState(prev => ({
      ...prev,
      activeMiniGame: cardId,
      gameStatus: 'paused'
    }));
  }, []);

  // Create electric particles along lightning path
  const createElectricParticles = useCallback((startPos: Position, endPos: Position) => {
    const particles: Particle[] = [];
    const config = PROJECTILE_CONFIG.particles.electric;
    
    // Create particles along the lightning path
    for (let i = 0; i < config.count; i++) {
      const progress = i / config.count;
      const basePos = {
        x: startPos.x + (endPos.x - startPos.x) * progress,
        y: startPos.y + (endPos.y - startPos.y) * progress
      };
      
      particles.push({
        id: `electric-${Date.now()}-${i}`,
        position: {
          x: basePos.x + (Math.random() - 0.5) * 20,
          y: basePos.y + (Math.random() - 0.5) * 20
        },
        velocity: {
          x: (Math.random() - 0.5) * config.speed.max,
          y: (Math.random() - 0.5) * config.speed.max
        },
        size: 1 + Math.random() * 2,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        life: 0,
        maxLife: config.maxLife.min + Math.random() * (config.maxLife.max - config.maxLife.min),
        type: 'spark'
      });
    }
    
    return particles;
  }, []);

  // Creeping chain lightning sequence
  const startCreepingLightning = useCallback((gameState: any, startPosition: Position, targets: any[], currentTime: number) => {
    const superConfig = PROJECTILE_CONFIG.lightningSuper;
    let currentPosition = startPosition;
    
    // Chain through targets with delays
    targets.forEach((target, index) => {
      setTimeout(() => {
        // Create lightning bolt from current position to this target
        const lightningEffect = {
          id: `creeping-lightning-${currentTime}-${index}`,
          type: 'lightning' as const,
          position: { ...currentPosition },
          targetPosition: { ...target.position },
          startTime: Date.now(),
          duration: superConfig.visual.pathFadeTime,
          size: 0,
          segments: superConfig.visual.segments,
          jitterAmount: superConfig.visual.jitterAmount,
          width: superConfig.visual.width
        };

        // Create electric particles along this lightning path
        const electricParticles = createElectricParticles(currentPosition, target.position);

        // Add the lightning effect and damage the enemy
        setGameState(prevState => {
          const updatedEnemies = prevState.enemies.map((enemy: any) => 
            enemy.id === target.id 
              ? { 
                  ...enemy, 
                  health: enemy.health - superConfig.damage,
                  hitFlash: Date.now(),
                  stunEndTime: Date.now() + superConfig.stunDuration
                }
              : enemy
          ).filter((e: any) => e.health > 0);

          return {
            ...prevState,
            enemies: updatedEnemies,
            effects: [...prevState.effects, lightningEffect],
            particles: [...prevState.particles, ...electricParticles],
            score: prevState.score + 15
          };
        });

        // Update current position for next chain
        currentPosition = target.position;
      }, index * superConfig.visual.creepSpeed);
    });
  }, []);

  // Lightning attack handler
  const handleLightningAttack = useCallback((gameState: any, card: any, isSpecial: boolean, currentTime: number) => {
    const config = isSpecial ? PROJECTILE_CONFIG.lightningSuper : PROJECTILE_CONFIG.lightningPrimary;
    const superConfig = PROJECTILE_CONFIG.lightningSuper; // For accessing chain-specific properties
    
    // Find target enemy (nearest in front of player)
    const targetEnemy = gameState.enemies
      .filter((enemy: any) => enemy.position.x > gameState.player.position.x) // Only enemies to the right
      .reduce((closest: any, enemy: any) => {
        if (!closest) return enemy;
        const enemyDist = Math.abs(enemy.position.x - gameState.player.position.x) + 
                         Math.abs(enemy.position.y - gameState.player.position.y);
        const closestDist = Math.abs(closest.position.x - gameState.player.position.x) + 
                           Math.abs(closest.position.y - gameState.player.position.y);
        return enemyDist < closestDist ? enemy : closest;
      }, null);

    if (!targetEnemy) return gameState; // No target found

    // Calculate player hand position
    const playerHeight = gameState.player.size * 2;
    const handPosition = {
      x: gameState.player.position.x,
      y: gameState.player.position.y - playerHeight * 0.3
    };

    if (isSpecial) {
      // Chain Lightning - creeping effect across the screen
      const chainTargets = gameState.enemies.slice(0, superConfig.chainCount);
      
      // Start the creeping chain lightning sequence
      startCreepingLightning(gameState, handPosition, chainTargets, currentTime);
      
      return {
        ...gameState,
        player: {
          ...gameState.player,
          lastPrimaryShot: currentTime,
          hasSpecialCharge: false
        }
      };
    } else {
      // Primary Lightning - single target
      const lightningEffect = {
        id: `lightning-${currentTime}`,
        type: 'lightning' as const,
        position: handPosition,
        targetPosition: targetEnemy.position,
        startTime: currentTime,
        duration: config.visual.flashDuration,
        size: 0,
        segments: config.visual.segments,
        jitterAmount: config.visual.jitterAmount,
        width: config.visual.width
      };

      // Apply damage to target enemy
      const updatedEnemies = gameState.enemies.map((enemy: any) => 
        enemy.id === targetEnemy.id 
          ? { ...enemy, health: enemy.health - config.damage, hitFlash: currentTime }
          : enemy
      ).filter((e: any) => e.health > 0);

      return {
        ...gameState,
        enemies: updatedEnemies,
        effects: [...gameState.effects, lightningEffect],
        player: {
          ...gameState.player,
          lastPrimaryShot: currentTime
        },
        score: gameState.score + 10
      };
    }
  }, []);

  // Primary fire function (spacebar)
  const firePrimary = useCallback((cardId: string = 'fireball') => {
    const currentTime = Date.now();
    const card = gameState.cards.find(c => c.id === cardId);
    const primaryCooldown = card?.cooldown || 800;
    
    setGameState(prev => {
      if (prev.gameStatus !== 'playing') return prev;
      if (currentTime - prev.player.lastPrimaryShot < primaryCooldown) return prev;

      const isSpecialShot = prev.player.hasSpecialCharge;
      const currentCard = prev.cards.find(c => c.id === cardId) || prev.cards[0];
      
      // Handle lightning attacks differently from projectile spells
      if (currentCard.element === 'lightning') {
        return handleLightningAttack(prev, currentCard, isSpecialShot, currentTime);
      }
      
      const targetDirection = { x: 1, y: 0 }; // Fire to the right
      
      // Calculate launch position (from player's hand/chest level)
      const playerHeight = prev.player.size * 2;
      const handLevel = prev.player.position.y - playerHeight * 0.3; // Upper chest/hand area
      const playerFootLevel = prev.player.position.y + playerHeight / 2; // Where player's feet are
      
      // Get config for this spell type
      const config = isSpecialShot ? PROJECTILE_CONFIG.playerSuper : PROJECTILE_CONFIG.playerPrimary;
      
      // Create spell with special properties if charged
      const newSpell: Spell = {
        id: `fireball-${currentTime}`,
        name: isSpecialShot ? 'Super Fireball' : 'Fireball',
        damage: config.damage,
        effect: 'fire',
        position: { 
          x: prev.player.position.x, 
          y: handLevel // Launch from hand level, not center
        },
        velocity: {
          x: targetDirection.x * config.velocity.x,
          y: targetDirection.y * config.velocity.x + config.velocity.y // Apply upward arc
        },
        size: config.size,
        duration: config.duration,
        createdAt: currentTime,
        gravity: config.gravity,
        isSuper: isSpecialShot,
        groundLevel: playerFootLevel // Store where this should land
      };

      return {
        ...prev,
        spells: [...prev.spells, newSpell],
        player: {
          ...prev.player,
          lastPrimaryShot: currentTime,
          hasSpecialCharge: false // Consume special charge
        }
      };
    });
  }, []);

  // Handle combat keys
  useEffect(() => {
    const handleCombatKeys = (event: KeyboardEvent) => {
      if (gameState.gameStatus !== 'playing') return;
      
      const currentActiveCard = gameState.cards[activeSpellIndex];
      
      // Primary fire (spacebar)
      if (event.code === 'Space') {
        event.preventDefault();
        firePrimary(currentActiveCard.id);
      }
      
      // Spell switching (J, K, L, ;)
      if (event.key.toLowerCase() === 'j') {
        event.preventDefault();
        activeSpellIndex = 0; // Fireball
        return;
      }
      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        activeSpellIndex = Math.min(1, gameState.cards.length - 1); // Lightning
        return;
      }
      if (event.key.toLowerCase() === 'l') {
        event.preventDefault();
        activeSpellIndex = Math.min(2, gameState.cards.length - 1); // Future spell
        return;
      }
      if (event.key === ';') {
        event.preventDefault();
        activeSpellIndex = Math.min(3, gameState.cards.length - 1); // Future spell
        return;
      }
      
      // Special fire - based on current active spell
      if (event.key.toLowerCase() === 'm') { // Temporary key for special
        event.preventDefault();
        const currentTime = Date.now();
        const specialCooldown = 3000; // 3 seconds between special attempts
        
        if (currentTime - gameState.player.lastSpecialAttempt >= specialCooldown) {
          startMiniGame(currentActiveCard.id); // Use the card ID, not mini-game ID
        }
      }
    };

    window.addEventListener('keydown', handleCombatKeys);
    return () => window.removeEventListener('keydown', handleCombatKeys);
  }, [gameState.gameStatus, gameState.player.lastSpecialAttempt, firePrimary, startMiniGame]);

  const completeMiniGame = useCallback((performance: number) => {
    setGameState(prev => {
      const currentTime = Date.now();
      
      // Give special charge based on mini-game performance
      const giveSpecialCharge = performance >= 50; // 50% or better gives special charge

      return {
        ...prev,
        player: {
          ...prev.player,
          hasSpecialCharge: giveSpecialCharge,
          lastSpecialAttempt: currentTime
        },
        activeMiniGame: null,
        gameStatus: 'playing'
      };
    });
  }, []);

  return {
    gameState,
    gameConfig,
    startMiniGame,
    completeMiniGame,
    resetGame
  };
}; 
// Centralized configuration for all projectile and spell physics
export const PROJECTILE_CONFIG = {
  // Player Primary Fireball
  playerPrimary: {
    velocity: {
      x: 16,
      y: -1 // Upward arc
    },
    gravity: 0.12,
    damage: 20,
    size: 10,
    duration: 3000,
    knockback: {
      force: 2, // Moderate knockback
      duration: 15 // ms for knockback effect
    },
    particles: {
      chance: 0.3, // 30% chance per frame
      count: 2    // 2 particles per burst
    }
  },

  // Player Super Fireball
  playerSuper: {
    velocity: {
      x: 10,
      y: -1 // Upward arc
    },
    gravity: 0.12,
    damage: 60,
    size: 30,
    duration: 3000,
    knockback: {
      force: 35, // MASSIVE knockback for super spells
      duration: 500 // Longer knockback effect
    },
    particles: {
      chance: 0.8, // 80% chance per frame
      count: 8    // 8 particles per burst
    },
    // Mini-fireball fan settings
    miniFan: {
      count: 5,
      angles: [-30, -15, 0, 15, 30], // Degrees spread
      velocity: 3,
      damage: 15,
      size: 6,
      gravity: 0.08,
      staggerDelay: 50, // ms between each mini-fireball
      knockback: {
        force: 12, // Light knockback for mini-fireballs
        duration: 250
      }
    },
    areaOfEffect: {
      radiusMultiplier: 2.5 // spell.size * 2.5 for hit radius
    }
  },

  // Player Lightning Primary
  lightningPrimary: {
    damage: 8,
    range: 300, // Long range
    cooldown: 150, // Very fast
    particles: {
      chance: 0.8, // Lots of electric sparks
      count: 6
    },
    visual: {
      segments: 8, // Number of jagged segments
      jitterAmount: 15, // How much the lightning zigzags
      width: 2,
      flashDuration: 100 // How long lightning stays visible
    }
  },

  // Player Lightning Super (Chain Lightning)
  lightningSuper: {
    damage: 25,
    chainCount: 10, // Max enemies to chain to
    chainRange: 120, // Distance between chain jumps
    stunDuration: 1500, // ms enemies are stunned
    particles: {
      chance: 1.0, // Always spawn particles
      count: 15
    },
    visual: {
      segments: 12,
      jitterAmount: 25,
      width: 3,
      flashDuration: 800, // Longer flash for creeping effect
      creepSpeed: 150, // ms delay between chain jumps
      pathFadeTime: 400 // How long each path stays visible
    }
  },

  // Enemy Projectiles
  enemy: {
    velocity: {
      base: 8,     // Base speed multiplier
      upwardArc: -1.5 // Upward arc
    },
    gravity: 0.12,
    damage: 10,
    size: 8,
    cooldown: 2000 // ms between shots
  },

  // Particle Settings
  particles: {
    fire: {
      maxLife: {
        min: 30,
        max: 50
      },
      colors: ['#ff6644', '#ffaa22']
    },
    explosion: {
      count: {
        normal: 10,
        super: 20
      },
      speed: {
        normal: { min: 3, max: 6 },
        super: { min: 6, max: 10 }
      },
      maxLife: {
        min: 40,
        max: 60
      },
      colors: ['#ff4444', '#ffaa00']
    },
    sparks: {
      count: 5,
      speed: {
        x: 8, // horizontal spread
        y: { min: 2, max: 8 } // upward velocity
      },
      maxLife: {
        min: 20,
        max: 35
      },
      color: '#ffff88'
    },
    electric: {
      count: 8,
      speed: {
        min: 2,
        max: 6
      },
      maxLife: {
        min: 30,
        max: 50
      },
      colors: ['#ffffff', '#aaaaff', '#ddddff']
    }
  },

  // Physics
  physics: {
    airResistance: 0.98,
    sparkGravity: 0.2,
    fireGravity: 0.1
  },

  // Enemy AI Configuration
  enemyAI: {
    // Entry behavior
    entry: {
      spawnOffsetX: 100, // How far off-screen they spawn
      walkInSpeed: 1.5,  // Speed when walking in
      entryTargetVariance: 80 // Random variance in initial target position
    },
    
    // Movement behavior
    movement: {
      baseSpeed: 1.0,
      speedVariance: 0.5, // ±0.5, so 0.5-1.5x speed
      stoppingDistance: 30, // How close to target before stopping
      pathUpdateInterval: 500 // ms between path recalculations
    },
    
    // Combat behavior  
    combat: {
      preferredRange: { min: 80, max: 200 }, // Optimal shooting distance
      reactionTime: { min: 1000, max: 3000 }, // ms before reacting
      accuracy: { min: 0.6, max: 0.95 }, // Aim accuracy range
      aggression: { min: 0.3, max: 0.8 }, // Advance vs hang back
      personalSpace: { min: 40, max: 60 } // Distance from other enemies
    },
    
    // Positioning behavior
    positioning: {
      lineOfSightImportance: 0.7, // How much they prioritize clear shots
      coverSeeking: 0.3, // How much they try to stay near edges
      flankingTendency: 0.4 // Chance to try flanking positions
    }
  }
}; 
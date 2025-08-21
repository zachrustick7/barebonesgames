import React, { useRef, useEffect } from 'react';
import { GameState, GameConfig, Particle, Effect } from '../types/game';
import { getElementColor } from '../data/cards';

interface GameCanvasProps {
  gameState: GameState;
  gameConfig: GameConfig;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, gameConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply screen shake
    ctx.save();
    if (gameState.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * gameState.screenShake;
      const shakeY = (Math.random() - 0.5) * gameState.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Clear canvas
    ctx.clearRect(0, 0, gameConfig.canvasWidth, gameConfig.canvasHeight);

    // Draw subtle ground line at foot level
    const basePlayerHeight = 20 * 2; // Using base player size
    const shadowOffset = basePlayerHeight / 2 + 2;
    const typicalPlayerY = gameConfig.canvasHeight * 0.5; // Much higher - where players typically stand
    const groundLevel = typicalPlayerY + shadowOffset;
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, groundLevel);
    ctx.lineTo(gameConfig.canvasWidth, groundLevel);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw background sections
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, gameConfig.canvasWidth, gameConfig.canvasHeight);

    // Draw player area (left side)
    ctx.fillStyle = 'rgba(0, 50, 100, 0.3)';
    ctx.fillRect(0, 0, 450, gameConfig.canvasHeight);

    // Draw enemy area (right side)
    ctx.fillStyle = 'rgba(100, 50, 0, 0.3)';
    ctx.fillRect(550, 0, gameConfig.canvasWidth - 550, gameConfig.canvasHeight);

    // Draw enemy spawn passage - simple gray slit in the wall
    const passageWidth = 8;  // Very thin
    const passageHeight = 100; // Tall enough for enemies
    const passageX = gameConfig.canvasWidth - passageWidth; // Flush with right edge
    const passageY = (gameConfig.canvasHeight - passageHeight) / 2; // Centered vertically
    
    // Simple gray passage
    ctx.fillStyle = '#555555';
    ctx.fillRect(passageX, passageY, passageWidth, passageHeight);

    // Draw player (humanoid wizard)
    const playerWidth = gameState.player.size * 1.2;
    const playerHeight = gameState.player.size * 2;
    
    // Player shadow (rectangular, offset to bottom-left)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    const playerShadowWidth = playerWidth * 0.8;
    const playerShadowHeight = 6;
    const playerShadowOffsetX = -4;
    const playerShadowOffsetY = playerHeight / 2 + 2;
    
    // Draw rounded rectangle shadow
    const playerShadowX = gameState.player.position.x - playerShadowWidth / 2 + playerShadowOffsetX;
    const playerShadowY = gameState.player.position.y + playerShadowOffsetY;
    
    ctx.beginPath();
    ctx.roundRect(playerShadowX, playerShadowY, playerShadowWidth, playerShadowHeight, 3);
    ctx.fill();
    
    // Player body (wizard robe) - glow if special charge ready
    if (gameState.player.hasSpecialCharge) {
      // Glow effect
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#66bbff'; // Slightly brighter when charged
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#44aaff';
    }
    
    ctx.fillRect(
      gameState.player.position.x - playerWidth / 2,
      gameState.player.position.y - playerHeight / 2,
      playerWidth,
      playerHeight
    );
    
    // Reset shadow for other elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Player head
    ctx.fillStyle = '#ffdbac'; // skin tone
    const headSize = playerWidth * 0.6;
    ctx.fillRect(
      gameState.player.position.x - headSize / 2,
      gameState.player.position.y - playerHeight / 2 - headSize * 0.8,
      headSize,
      headSize * 0.8
    );

    // Player wizard hat
    ctx.fillStyle = '#663399';
    ctx.beginPath();
    ctx.moveTo(gameState.player.position.x, gameState.player.position.y - playerHeight / 2 - headSize * 0.8);
    ctx.lineTo(gameState.player.position.x - 12, gameState.player.position.y - playerHeight / 2 - headSize * 0.8 - 18);
    ctx.lineTo(gameState.player.position.x + 12, gameState.player.position.y - playerHeight / 2 - headSize * 0.8 - 18);
    ctx.closePath();
    ctx.fill();

    // Draw enemies (sorted by Y position for proper depth ordering)
    const sortedEnemies = [...gameState.enemies].sort((a, b) => a.position.y - b.position.y);
    sortedEnemies.forEach(enemy => {
      const enemyWidth = enemy.size * 1.4;
      const enemyHeight = enemy.size * 1.8;
      
      // Enemy shadow (rectangular, offset to bottom-left)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      const enemyShadowWidth = enemyWidth * 0.8;
      const enemyShadowHeight = 5;
      const enemyShadowOffsetX = -3;
      const enemyShadowOffsetY = enemyHeight / 2 + 2;
      
      // Draw rounded rectangle shadow
      const enemyShadowX = enemy.position.x - enemyShadowWidth / 2 + enemyShadowOffsetX;
      const enemyShadowY = enemy.position.y + enemyShadowOffsetY;
      
      ctx.beginPath();
      ctx.roundRect(enemyShadowX, enemyShadowY, enemyShadowWidth, enemyShadowHeight, 2);
      ctx.fill();
      
      // Enemy body (different colors for variety, flash white when hit, blue glow when stunned)
      const isFlashing = enemy.hitFlash && (Date.now() - enemy.hitFlash) < 150;
      const isStunned = enemy.stunEndTime && Date.now() < enemy.stunEndTime;
      
      if (isStunned) {
        ctx.shadowColor = '#4444ff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = isFlashing ? '#ffffff' : '#6666ff'; // Blue tint when stunned
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = isFlashing ? '#ffffff' : '#ff4444';
      }
      ctx.fillRect(
        enemy.position.x - enemyWidth / 2,
        enemy.position.y - enemyHeight / 2,
        enemyWidth,
        enemyHeight
      );
      
      // Enemy head  
      if (isStunned) {
        ctx.fillStyle = isFlashing ? '#ffffff' : '#8888ff'; // Blue tint when stunned
      } else {
        ctx.fillStyle = isFlashing ? '#ffffff' : '#ff6666'; // slightly lighter red
      }
      const enemyHeadSize = enemyWidth * 0.7;
      ctx.fillRect(
        enemy.position.x - enemyHeadSize / 2,
        enemy.position.y - enemyHeight / 2 - enemyHeadSize * 0.7,
        enemyHeadSize,
        enemyHeadSize * 0.7
      );
      
      // Clear shadow for health bar
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Enemy health bar
      const barWidth = 30;
      const barHeight = 4;
      const healthPercent = enemy.health / enemy.maxHealth;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(
        enemy.position.x - barWidth / 2,
        enemy.position.y - enemyHeight / 2 - enemyHeadSize * 0.7 - 8,
        barWidth,
        barHeight
      );
      
      ctx.fillStyle = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffff44' : '#ff4444';
      ctx.fillRect(
        enemy.position.x - barWidth / 2,
        enemy.position.y - enemyHeight / 2 - enemyHeadSize * 0.7 - 8,
        barWidth * healthPercent,
        barHeight
      );
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      ctx.fillStyle = projectile.isPlayerProjectile ? '#44ff44' : '#ff6644';
      ctx.beginPath();
      ctx.arc(projectile.position.x, projectile.position.y, projectile.size, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw spells
    gameState.spells.forEach(spell => {
      const color = getElementColor(spell.effect as any);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = spell.isSuper ? 20 : 10;
      
      ctx.beginPath();
      ctx.arc(spell.position.x, spell.position.y, spell.size, 0, 2 * Math.PI);
      ctx.fill();
      
      // Extra glow for super fireballs
      if (spell.isSuper) {
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(spell.position.x, spell.position.y, spell.size * 0.7, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });

    // Draw particles
    gameState.particles.forEach(particle => {
      const alpha = 1 - (particle.life / particle.maxLife);
      ctx.globalAlpha = alpha;
      
      ctx.fillStyle = particle.color;
      if (particle.type === 'fire') {
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 5;
      }
      
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Draw effects
    gameState.effects.forEach(effect => {
      const elapsed = Date.now() - effect.startTime;
      const progress = elapsed / effect.duration;
      
      if (effect.type === 'explosion') {
        const radius = effect.size * (1 + progress * 2);
        const alpha = 1 - progress;
        
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(effect.position.x, effect.position.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (effect.type === 'hit') {
        const alpha = 1 - progress;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(effect.position.x, effect.position.y, effect.size * 1.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (effect.type === 'ground_impact') {
        const alpha = 1 - progress;
        const width = effect.size * 2 * (1 + progress);
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffff88';
        ctx.fillRect(
          effect.position.x - width / 2,
          effect.position.y - 2,
          width,
          4
        );
        ctx.globalAlpha = 1;
      } else if (effect.type === 'lightning') {
        // Draw jagged lightning bolt with dramatic effects
        const alpha = Math.max(0.3, 1 - progress); // Keep some visibility longer
        ctx.globalAlpha = alpha;
        
        // Create jagged path from start to target
        if (effect.targetPosition) {
          const target = effect.targetPosition;
          const segments = effect.segments || 8;
          const jitter = effect.jitterAmount || 15;
          const baseWidth = effect.width || 2;
          const strokeColors = ['#ffffff', '#aaaaff', '#ddddff'];
          
          // Draw multiple overlapping lightning strokes for thickness
          strokeColors.forEach((color, strokeIndex) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = baseWidth + (strokeColors.length - strokeIndex - 1) * 2;
            ctx.shadowColor = '#4444ff';
            ctx.shadowBlur = 12 + strokeIndex * 4;
            
            ctx.beginPath();
            ctx.moveTo(effect.position.x, effect.position.y);
            
            for (let i = 1; i < segments; i++) {
              const segmentProgress = i / segments;
              const baseX = effect.position.x + (target.x - effect.position.x) * segmentProgress;
              const baseY = effect.position.y + (target.y - effect.position.y) * segmentProgress;
              
              // Add random jitter perpendicular to the line
              const perpOffset = (Math.random() - 0.5) * jitter;
              const dx = target.x - effect.position.x;
              const dy = target.y - effect.position.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const perpX = -dy / length * perpOffset;
              const perpY = dx / length * perpOffset;
              
              ctx.lineTo(baseX + perpX, baseY + perpY);
            }
            
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          });
        }
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      } else if (effect.type === 'chain_lightning') {
        // Draw chain lightning connecting multiple points
        const alpha = 1 - progress;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = effect.width || 3;
        ctx.shadowColor = '#4444ff';
        ctx.shadowBlur = 12;
        
        if (effect.chainPositions && effect.chainPositions.length > 1) {
          const segments = effect.segments || 12;
          const jitter = effect.jitterAmount || 25;
          
          // Draw lightning between each pair of positions
          for (let i = 0; i < effect.chainPositions.length - 1; i++) {
            const start = effect.chainPositions[i];
            const end = effect.chainPositions[i + 1];
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            
            const chainSegments = Math.max(3, Math.floor(segments / effect.chainPositions.length));
            for (let j = 1; j < chainSegments; j++) {
              const segmentProgress = j / chainSegments;
              const baseX = start.x + (end.x - start.x) * segmentProgress;
              const baseY = start.y + (end.y - start.y) * segmentProgress;
              
              // Add random jitter
              const perpOffset = (Math.random() - 0.5) * jitter;
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const perpX = -dy / length * perpOffset;
              const perpY = dx / length * perpOffset;
              
              ctx.lineTo(baseX + perpX, baseY + perpY);
            }
            
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          }
        }
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    });

    // Draw UI elements
    drawUI(ctx, gameState, gameConfig);
    
    // Restore canvas context
    ctx.restore();

  }, [gameState, gameConfig]);

  const drawUI = (ctx: CanvasRenderingContext2D, gameState: GameState, gameConfig: GameConfig) => {
    // Player health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthPercent = gameState.player.health / gameState.player.maxHealth;

    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, healthBarWidth, healthBarHeight);

    ctx.fillStyle = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffff44' : '#ff4444';
    ctx.fillRect(20, 20, healthBarWidth * healthPercent, healthBarHeight);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(`Health: ${gameState.player.health}/${gameState.player.maxHealth}`, 20, 60);

    // Score
    ctx.fillText(`Score: ${gameState.score}`, 20, 80);
    ctx.fillText(`Wave: ${gameState.wave}`, 20, 100);

    // Controls help
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.fillText('WASD to move', 20, gameConfig.canvasHeight - 60);
    ctx.fillText('Click spell cards to cast', 20, gameConfig.canvasHeight - 40);
    ctx.fillText('Dodge red projectiles!', 20, gameConfig.canvasHeight - 20);

    // Game over screen
    if (gameState.gameStatus === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, gameConfig.canvasWidth, gameConfig.canvasHeight);

      ctx.fillStyle = '#ff4444';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', gameConfig.canvasWidth / 2, gameConfig.canvasHeight / 2 - 50);

      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, gameConfig.canvasWidth / 2, gameConfig.canvasHeight / 2);

      ctx.font = '16px Arial';
      ctx.fillText('Press R to restart', gameConfig.canvasWidth / 2, gameConfig.canvasHeight / 2 + 50);
      
      ctx.textAlign = 'left';
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={gameConfig.canvasWidth}
      height={gameConfig.canvasHeight}
      style={{
        border: '2px solid #333',
        backgroundColor: '#0a0a0a',
        display: 'block',
        width: '1000px',
        height: '600px',
        maxWidth: '1000px',
        maxHeight: '600px',
        minWidth: '1000px',
        minHeight: '600px'
      }}
    />
  );
}; 
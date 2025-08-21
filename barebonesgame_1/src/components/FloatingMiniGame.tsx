import React, { useState, useEffect, useCallback } from 'react';

interface FloatingMiniGameProps {
  isActive: boolean;
  onHit: (success: boolean) => void;
  playerPosition: { x: number; y: number };
}

export const FloatingMiniGame: React.FC<FloatingMiniGameProps> = ({ 
  isActive, 
  onHit, 
  playerPosition 
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const [targetPosition, setTargetPosition] = useState<number>(0);
  const [lastHitTime, setLastHitTime] = useState<number>(0);
  const [hitFeedback, setHitFeedback] = useState<'success' | 'miss' | null>(null);

  // Set random target position when activated
  useEffect(() => {
    if (isActive) {
      setTargetPosition(Math.random() * 360);
    }
  }, [isActive]);

  // Continuous rotation when active
  useEffect(() => {
    if (isActive) {
      const rotationInterval = setInterval(() => {
        setRotation(prev => (prev + 4) % 360); // Same speed as before
      }, 16); // 60fps

      return () => clearInterval(rotationInterval);
    }
  }, [isActive]);

  // Handle spacebar for mini-game
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && isActive) {
        event.preventDefault();
        
        // Prevent spam clicking (minimum 200ms between attempts)
        const now = Date.now();
        if (now - lastHitTime < 200) return;
        setLastHitTime(now);

        // Check if green area is at the top
        const greenStart = (targetPosition + rotation) % 360;
        const greenEnd = (targetPosition + rotation + 45) % 360;
        const tolerance = 15;
        
        let isInGreenArea = false;
        if (greenEnd > greenStart) {
          isInGreenArea = (greenStart <= tolerance) || (greenStart >= (360 - tolerance)) ||
                         (greenEnd >= (360 - tolerance)) || (greenEnd <= tolerance);
        } else {
          isInGreenArea = true;
        }
        
        // Show feedback
        setHitFeedback(isInGreenArea ? 'success' : 'miss');
        setTimeout(() => setHitFeedback(null), 500);
        
        // Call parent with result
        onHit(isInGreenArea);
        
        // Reset target for next attempt
        setTargetPosition(Math.random() * 360);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, rotation, targetPosition, onHit, lastHitTime]);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${playerPosition.x - 15}px`,
        top: `${playerPosition.y - 60}px`, // Float above wizard
        width: '30px',
        height: '30px',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      {/* Mini lock container */}
      <div
        style={{
          width: '30px',
          height: '30px',
          position: 'relative',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))'
        }}
      >
        {/* Gray donut base */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: '#666',
            position: 'relative'
          }}
        >
          {/* Green arc overlay */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              position: 'absolute',
              top: '0',
              left: '0',
              background: `conic-gradient(
                from ${targetPosition + rotation}deg,
                #44ff44 0deg,
                #44ff44 45deg,
                transparent 45deg,
                transparent 360deg
              )`,
              mask: 'radial-gradient(circle, transparent 38%, black 40%, black 100%)',
              WebkitMask: 'radial-gradient(circle, transparent 38%, black 40%, black 100%)'
            }}
          />
          
          {/* Inner hole */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'rgba(26, 26, 46, 0.9)'
            }}
          />
        </div>

        {/* Fixed ticker at top */}
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '3px solid transparent',
            borderRight: '3px solid transparent',
            borderTop: '5px solid #fff',
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))',
            zIndex: 10
          }}
        />

        {/* Hit feedback */}
        {hitFeedback && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '12px',
              color: hitFeedback === 'success' ? '#44ff44' : '#ff4444',
              fontWeight: 'bold',
              textShadow: '0 0 2px rgba(0,0,0,0.8)',
              zIndex: 20,
              animation: 'fadeOut 0.5s ease-out'
            }}
          >
            {hitFeedback === 'success' ? '✓' : '✗'}
          </div>
        )}
      </div>
    </div>
  );
}; 
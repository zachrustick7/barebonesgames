import React, { useState, useEffect, useCallback } from 'react';
import { MiniGameResult } from '../types/game';

interface InlineMiniGameProps {
  gameId: string;
  spellName?: string; // Name of the spell/card
  onComplete: (result: MiniGameResult) => void;
  onCancel: () => void;
}

export const InlineMiniGame: React.FC<InlineMiniGameProps> = ({ gameId, spellName, onComplete, onCancel }) => {
  const [gameState, setGameState] = useState<'waiting' | 'active' | 'completed'>('waiting');
  const [rotation, setRotation] = useState<number>(0);
  const [targetPosition, setTargetPosition] = useState<number>(0);
  const [countdownText, setCountdownText] = useState<string>('Ready...');
  const [gameResult, setGameResult] = useState<'success' | 'failure' | null>(null);
  const [lightningPulse, setLightningPulse] = useState<number>(0); // 0-100 intensity
  const [showPulse, setShowPulse] = useState<boolean>(false);
  const [mathProblem, setMathProblem] = useState<{ question: string; answer: number } | null>(null);
  const [mathTimeLeft, setMathTimeLeft] = useState<number>(3);

  // Mini-game initialization
  useEffect(() => {
    if (gameId === 'popTheLock') {
      // Set random target position (0-360 degrees)
      setTargetPosition(Math.random() * 360);
      
      // Countdown timer
      setCountdownText('Ready...');
      
      const countdownTimer = setTimeout(() => {
        setCountdownText('Go!');
        setTimeout(() => {
          setGameState('active');
        }, 500);
      }, 1000);

      return () => clearTimeout(countdownTimer);
    } else if (gameId === 'lightningTiming') {
      setCountdownText('Ready...');
      
      const countdownTimer = setTimeout(() => {
        setCountdownText('Watch for the pulse...');
        setTimeout(() => {
          setGameState('active');
          startLightningSequence();
        }, 500);
      }, 1000);

      return () => clearTimeout(countdownTimer);
    } else if (gameId === 'mathProblem') {
      // Generate random math problem
      const num1 = Math.floor(Math.random() * 9) + 1; // 1-9
      const num2 = Math.floor(Math.random() * 9) + 1; // 1-9
      const operations = ['+', '-', '*'];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      let answer: number;
      let question: string;
      
      switch (operation) {
        case '+':
          answer = num1 + num2;
          question = `${num1} + ${num2}`;
          break;
        case '-':
          // Ensure positive result
          const larger = Math.max(num1, num2);
          const smaller = Math.min(num1, num2);
          answer = larger - smaller;
          question = `${larger} - ${smaller}`;
          break;
        case '*':
          // Use smaller numbers for multiplication
          const smallNum1 = Math.floor(Math.random() * 5) + 1; // 1-5
          const smallNum2 = Math.floor(Math.random() * 5) + 1; // 1-5
          answer = smallNum1 * smallNum2;
          question = `${smallNum1} × ${smallNum2}`;
          break;
        default:
          answer = num1 + num2;
          question = `${num1} + ${num2}`;
      }
      
      // Ensure answer is between 0-9
      if (answer > 9) {
        answer = num1 + Math.floor(Math.random() * (9 - num1));
        question = `${num1} + ${answer - num1}`;
      }
      
      setMathProblem({ question, answer });
      setCountdownText('Ready...');
      
      const countdownTimer = setTimeout(() => {
        setCountdownText('Solve it!');
        setTimeout(() => {
          setGameState('active');
          startMathTimer();
        }, 500);
      }, 1000);

      return () => clearTimeout(countdownTimer);
    }
  }, [gameId]);

  // Donut rotation animation when game is active
  useEffect(() => {
    if (gameState === 'active') {
      const rotationInterval = setInterval(() => {
        setRotation(prev => (prev + 4) % 360); // 4 degrees per frame, faster speed
      }, 16); // ~60fps

      return () => clearInterval(rotationInterval);
    }
  }, [gameState]);

  const handleLockAttempt = useCallback(() => {
    if (gameState === 'active') {
      // Calculate if the green area is aligned with the ticker (top, 0 degrees)
      // The green area rotates with the donut, so we check if it's at the top
      const greenStart = (targetPosition + rotation) % 360;
      const greenEnd = (targetPosition + rotation + 45) % 360; // 45 degrees = 1/8 of circle
      
      // Check if green area is at the top (0 degrees) with tolerance
      const tolerance = 15; // degrees - more forgiving
      let isInGreenArea = false;
      
      // Check if the green area encompasses 0 degrees (top position)
      if (greenEnd > greenStart) {
        // Normal case: green area doesn't wrap around
        isInGreenArea = (greenStart <= tolerance) || (greenStart >= (360 - tolerance)) ||
                       (greenEnd >= (360 - tolerance)) || (greenEnd <= tolerance);
      } else {
        // Wrapped case: green area crosses 0 degrees - automatically at top
        isInGreenArea = true;
      }
      
      const success = isInGreenArea;
      setGameResult(success ? 'success' : 'failure');
      setGameState('completed');

      // Instant completion - no delay
      setTimeout(() => {
        onComplete({ score: success ? 100 : 0, completed: true });
      }, 100);
    }
  }, [gameState, rotation, targetPosition, onComplete]);

  const startLightningSequence = useCallback(() => {
    // Start building up electric energy
    const buildUpTime = 2000 + Math.random() * 1500; // 2-3.5 seconds
    let pulseInterval: NodeJS.Timeout;
    
    // Gradual buildup
    let intensity = 0;
    const buildInterval = setInterval(() => {
      intensity += 2;
      setLightningPulse(intensity);
      if (intensity >= 70) {
        clearInterval(buildInterval);
        
        // Peak pulse moment - player must hit spacebar now!
        setTimeout(() => {
          setShowPulse(true);
          setLightningPulse(100);
          
          // Success window is only 300ms
          setTimeout(() => {
            if (gameState === 'active') {
              // Missed the pulse
              setGameResult('failure');
              setGameState('completed');
              setTimeout(() => {
                onComplete({ score: 0, completed: true });
              }, 100);
            }
          }, 300);
        }, 200);
      }
    }, 30);
  }, [gameState, onComplete]);

  const handleLightningTiming = useCallback(() => {
    if (gameState === 'active' && showPulse) {
      // Hit the pulse at the right moment!
      setGameResult('success');
      setGameState('completed');
      setTimeout(() => {
        onComplete({ score: 100, completed: true });
      }, 100);
    }
  }, [gameState, showPulse, onComplete]);

  const startMathTimer = useCallback(() => {
    const timerInterval = setInterval(() => {
      setMathTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          if (gameState === 'active') {
            // Time's up!
            setGameResult('failure');
            setGameState('completed');
            setTimeout(() => {
              onComplete({ score: 0, completed: true });
            }, 100);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [gameState, onComplete]);

  const handleMathAnswer = useCallback((answer: number) => {
    if (gameState === 'active' && mathProblem) {
      const correct = answer === mathProblem.answer;
      setGameResult(correct ? 'success' : 'failure');
      setGameState('completed');
      setTimeout(() => {
        onComplete({ score: correct ? 100 : 0, completed: true });
      }, 100);
    }
  }, [gameState, mathProblem, onComplete]);

  // Handle keyboard input for mini-games
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameState === 'active') {
        if (event.code === 'Space') {
          event.preventDefault();
          if (gameId === 'popTheLock') {
            handleLockAttempt();
          } else if (gameId === 'lightningTiming') {
            handleLightningTiming();
          }
        } else if (gameId === 'mathProblem') {
          // Handle number keys for math mini-game
          const key = event.key;
          if (key >= '0' && key <= '9') {
            event.preventDefault();
            handleMathAnswer(parseInt(key));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, gameId, handleLockAttempt, handleLightningTiming, handleMathAnswer]);

  const handleSkip = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const renderLightningTimingGame = () => {
    return (
      <>
        {/* Fixed header */}
        <h3 style={{
          color: '#44aaff',
          margin: '0',
          fontSize: '20px',
          position: 'absolute',
          top: '25px',
          left: '0',
          right: '0',
          textAlign: 'center'
        }}>
          ⚡ {spellName || 'Lightning'}
        </h3>

        {/* Fixed content area */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '0',
          right: '0',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          {gameState === 'waiting' && (
            <div style={{ 
              fontSize: '32px', 
              color: '#ffaa44',
              fontWeight: 'bold'
            }}>
              {countdownText}
            </div>
          )}
          
          {gameState === 'active' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* Electric orb that pulses */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, 
                    ${showPulse ? '#ffffff' : `rgba(68, 68, 255, ${lightningPulse / 100})`}, 
                    ${showPulse ? '#ffff44' : `rgba(68, 68, 255, ${lightningPulse / 200})`},
                    transparent)`,
                  boxShadow: showPulse ? '0 0 30px #ffffff, 0 0 60px #4444ff' : `0 0 ${lightningPulse/3}px rgba(68, 68, 255, 0.8)`,
                  animation: showPulse ? 'lightning-flash 0.1s infinite' : 'none',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  position: 'relative'
                }}
              >
                {/* Electric sparks around the orb */}
                {lightningPulse > 50 && (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      width: '2px',
                      height: '20px',
                      background: '#ffffff',
                      transform: 'translateX(-50%)',
                      opacity: Math.random()
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '-10px',
                      right: '20%',
                      width: '2px',
                      height: '15px',
                      background: '#ffffff',
                      opacity: Math.random()
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: '-10px',
                      top: '30%',
                      width: '15px',
                      height: '2px',
                      background: '#ffffff',
                      opacity: Math.random()
                    }} />
                  </>
                )}
              </div>
              
              {/* Energy meter */}
              <div style={{
                width: '120px',
                height: '8px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${lightningPulse}%`,
                  height: '100%',
                  background: showPulse ? '#ffffff' : 'linear-gradient(90deg, #4444ff, #8888ff)',
                  borderRadius: '4px',
                  transition: showPulse ? 'none' : 'width 0.1s ease'
                }} />
              </div>
            </div>
          )}

          {gameState === 'completed' && (
            <div style={{
              fontSize: '32px',
              color: gameResult === 'success' ? '#44ff44' : '#ff4444',
              fontWeight: 'bold'
            }}>
              {gameResult === 'success' ? 'Perfect!' : 'Missed!'}
            </div>
          )}
        </div>

        {/* Fixed instruction text */}
        <div style={{
          position: 'absolute',
          bottom: '25px',
          left: '0',
          right: '0',
          textAlign: 'center',
          color: '#999',
          fontSize: '14px',
          fontWeight: 'normal'
        }}>
          {gameState === 'active' ? 
            (showPulse ? 'Press [SPACEBAR] NOW!' : 'Wait for the pulse...') : 
            ''
          }
        </div>
      </>
    );
  };

  const renderMathGame = () => {
    return (
      <>
        {/* Fixed header */}
        <h3 style={{
          color: '#44aaff',
          margin: '0',
          fontSize: '20px',
          position: 'absolute',
          top: '25px',
          left: '0',
          right: '0',
          textAlign: 'center'
        }}>
          ⚡ {spellName || 'Lightning'}
        </h3>

        {/* Fixed content area */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '0',
          right: '0',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          {gameState === 'waiting' && (
            <div style={{ 
              fontSize: '32px', 
              color: '#ffaa44',
              fontWeight: 'bold'
            }}>
              {countdownText}
            </div>
          )}
          
          {gameState === 'active' && mathProblem && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* Math problem */}
              <div style={{
                fontSize: '48px',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '0 0 10px #4444ff'
              }}>
                {mathProblem.question} = ?
              </div>
              
              {/* Timer */}
              <div style={{
                fontSize: '24px',
                color: mathTimeLeft <= 1 ? '#ff4444' : '#ffaa44',
                fontWeight: 'bold'
              }}>
                {mathTimeLeft}s
              </div>
              
              {/* Number pad hint */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '5px',
                fontSize: '14px',
                color: '#999'
              }}>
                {[0,1,2,3,4,5,6,7,8,9].map(num => (
                  <div key={num} style={{
                    padding: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    {num}
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameState === 'completed' && (
            <div style={{
              fontSize: '32px',
              color: gameResult === 'success' ? '#44ff44' : '#ff4444',
              fontWeight: 'bold'
            }}>
              {gameResult === 'success' ? 'Correct!' : 'Wrong!'}
            </div>
          )}
        </div>

        {/* Fixed instruction text */}
        <div style={{
          position: 'absolute',
          bottom: '25px',
          left: '0',
          right: '0',
          textAlign: 'center',
          color: '#999',
          fontSize: '14px',
          fontWeight: 'normal'
        }}>
          {gameState === 'active' ? 'Press the number key!' : ''}
        </div>
      </>
    );
  };

    const renderPopTheLockGame = () => {
    return (
      <>
                {/* Fixed header - NEVER changes position */}
        <h3 style={{
          color: '#44aaff',
          margin: '0',
          fontSize: '20px',
          position: 'absolute',
          top: '25px',
          left: '0',
          right: '0',
          textAlign: 'center'
        }}>
          🔥 {spellName || 'Fireball'}
        </h3>

        {/* Fixed content area - transitions between states */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '0',
          right: '0',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {gameState === 'waiting' && (
            <div style={{ 
              fontSize: '32px', 
              color: '#ffaa44',
              fontWeight: 'bold'
            }}>
              {countdownText}
            </div>
          )}
          
          {gameState === 'active' && (
            /* Spinning Donut Lock */
            <div 
              onClick={handleLockAttempt}
              style={{
                width: '120px',
                height: '120px',
                position: 'relative',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {/* Spinning donut */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  position: 'relative',
                  transition: 'none'
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
                        mask: 'radial-gradient(circle, transparent 51%, black 53%, black 100%)',
                        WebkitMask: 'radial-gradient(circle, transparent 51%, black 53%, black 100%)'
                      }}
                    />
                  
                  {/* Inner hole to make it a donut */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                                          width: '65px',
                    height: '65px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(26, 26, 46, 0.85)'
                    }}
                  />
                </div>
              </div>
              
              {/* Fixed ticker at top */}
              <div
                style={{
                  position: 'absolute',
                  top: '-5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '0',
                  height: '0',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '15px solid #fff',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                  zIndex: 10
                }}
              />
            </div>
          )}
          
          {gameState === 'completed' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <div style={{ 
                fontSize: '32px',
                color: gameResult === 'success' ? '#44ff44' : '#ff4444',
                margin: '0 0 10px 0'
              }}>
                {gameResult === 'success' ? '✅' : '❌'}
              </div>
              <div style={{ 
                fontSize: '18px', 
                color: gameResult === 'success' ? '#44ff44' : '#ff4444',
                fontWeight: 'bold'
              }}>
                {gameResult === 'success' ? 'Success!' : 'Missed!'}
              </div>
            </div>
          )}
        </div>
        
                {/* Fixed instruction text - never changes */}
        <div style={{
          position: 'absolute',
          bottom: '25px',
          left: '0',
          right: '0',
          textAlign: 'center',
          padding: '0 15px'
        }}>
          <span style={{
            fontSize: '13px',
            color: '#bbb'
          }}>
            Press{' '}
          </span>
          <span style={{
            fontSize: '13px',
            color: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontWeight: 'bold'
          }}>
            SPACEBAR
          </span>
        </div>
      </>
    );
  };

  return (
    <div style={{
      backgroundColor: 'rgba(26, 26, 46, 0.85)',
      border: '2px solid rgba(255, 68, 68, 0.9)',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      width: '240px',
      height: '340px',
      position: 'relative',
      boxShadow: '0 0 20px rgba(255, 68, 68, 0.4)',
      backdropFilter: 'blur(2px)'
    }}>


      {gameId === 'popTheLock' ? renderPopTheLockGame() : 
       gameId === 'lightningTiming' ? renderLightningTimingGame() :
       gameId === 'mathProblem' ? renderMathGame() : (
        <>
          <h3 style={{ 
            color: '#44aaff', 
            margin: '0 0 15px 0',
            fontSize: '24px'
          }}>
            Mini-Game: {gameId}
          </h3>
          <p style={{ 
            fontSize: '14px',
            margin: '0 0 20px 0',
            color: '#aaa'
          }}>
            Not implemented yet
          </p>
          <button 
            onClick={() => onComplete({ score: 75, completed: true })}
            style={{
              padding: '10px 20px',
              backgroundColor: '#44aaff',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Complete (75%)
          </button>
        </>
      )}
    </div>
  );
}; 
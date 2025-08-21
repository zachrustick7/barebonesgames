import React, { useState, useEffect, useCallback } from 'react';
import { MiniGameResult } from '../types/game';

interface MiniGameProps {
  gameId: string;
  onComplete: (result: MiniGameResult) => void;
  onCancel: () => void;
}

export const MiniGame: React.FC<MiniGameProps> = ({ gameId, onComplete, onCancel }) => {
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'active' | 'completed'>('waiting');
  const [startTime, setStartTime] = useState<number>(0);
  const [showTarget, setShowTarget] = useState<boolean>(false);
  const [reactionTime, setReactionTime] = useState<number>(0);

  // Simple reaction time mini-game
  useEffect(() => {
    if (gameId === 'reactionTime') {
      // Wait 1-3 seconds then show target
      const delay = 1000 + Math.random() * 2000;
      
      const timer = setTimeout(() => {
        setShowTarget(true);
        setStartTime(Date.now());
        setGameState('active');
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [gameId]);

  const handleTargetClick = useCallback(() => {
    if (gameState === 'active') {
      const endTime = Date.now();
      const reaction = endTime - startTime;
      setReactionTime(reaction);
      setGameState('completed');

      // Score based on reaction time (faster = better)
      // Under 200ms = 100%, 200-500ms = 80-100%, 500ms+ = lower
      let score = 100;
      if (reaction > 200) {
        score = Math.max(20, 100 - ((reaction - 200) / 10));
      }

      setTimeout(() => {
        onComplete({ score: Math.round(score), completed: true });
      }, 1000);
    }
  }, [gameState, startTime, onComplete]);

  const renderReactionGame = () => {
    if (gameState === 'waiting') {
      return (
        <div className="mini-game-content">
          <h3>Quick Draw!</h3>
          <p>Wait for the target to appear, then click it as fast as you can!</p>
          <div className="waiting-indicator">Get ready...</div>
        </div>
      );
    }

    if (gameState === 'active' && showTarget) {
      return (
        <div className="mini-game-content">
          <h3>CLICK NOW!</h3>
          <button 
            className="target-button"
            onClick={handleTargetClick}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: '#ff4444',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            🎯
          </button>
        </div>
      );
    }

    if (gameState === 'completed') {
      return (
        <div className="mini-game-content">
          <h3>Great!</h3>
          <p>Reaction time: {reactionTime}ms</p>
          <p>Casting spell...</p>
        </div>
      );
    }

    return null;
  };

  const renderPlaceholderGame = () => {
    return (
      <div className="mini-game-content">
        <h3>Mini-Game: {gameId}</h3>
        <p>This mini-game is not implemented yet.</p>
        <button onClick={() => onComplete({ score: 75, completed: true })}>
          Complete (75% score)
        </button>
      </div>
    );
  };

  return (
    <div className="mini-game-overlay">
      <div className="mini-game-modal">
        <button className="close-button" onClick={onCancel}>×</button>
        {gameId === 'reactionTime' ? renderReactionGame() : renderPlaceholderGame()}
      </div>
    </div>
  );
}; 
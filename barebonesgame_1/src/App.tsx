import React, { useEffect, useCallback } from 'react';
import './App.css';
import { useGameEngine } from './hooks/useGameEngine';
import { GameCanvas } from './components/GameCanvas';
import { SpellCards } from './components/SpellCards';
import { InlineMiniGame } from './components/InlineMiniGame';


function App() {
  const { gameState, gameConfig, completeMiniGame, resetGame } = useGameEngine();

  // Handle restart key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r' && gameState.gameStatus === 'gameOver') {
        resetGame();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [gameState.gameStatus, resetGame]);

  // Auto-focus the app and prevent default spacebar scroll
  useEffect(() => {
    const appElement = document.querySelector('.App') as HTMLElement;
    if (appElement) {
      appElement.focus();
      appElement.setAttribute('tabIndex', '0');
    }

    // Prevent spacebar from scrolling the page
    const preventSpacebarScroll = (event: KeyboardEvent) => {
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', preventSpacebarScroll);
    return () => document.removeEventListener('keydown', preventSpacebarScroll);
  }, []);

  // Remove mouse click handler - now using keyboard

  const handleMiniGameComplete = useCallback((result: any) => {
    completeMiniGame(result.score);
  }, [completeMiniGame]);

  const handleMiniGameCancel = useCallback(() => {
    completeMiniGame(0); // Complete with 0 score
  }, [completeMiniGame]);

  const getActiveMiniGameId = () => {
    if (!gameState.activeMiniGame) return null;
    const card = gameState.cards.find(c => c.id === gameState.activeMiniGame);
    return card?.miniGameId || null;
  };

    return (
    <div className="App" style={{
      backgroundColor: '#0a0a0a',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <header style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ 
          color: '#44aaff', 
          margin: '0 0 10px 0',
          fontSize: '36px',
          textShadow: '0 0 10px #44aaff'
        }}>
          🧙‍♂️ MiniMage
        </h1>
        <p style={{ color: '#aaa', margin: 0 }}>
          Cast spells through mini-games! Dodge projectiles with WASD!
        </p>
      </header>

      {/* Game Canvas with Overlaid UI */}
      <div style={{ 
        border: '2px solid #333',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        display: 'inline-block'
      }}>
        <GameCanvas gameState={gameState} gameConfig={gameConfig} />
        
        {/* Spell Cards Overlay - Bottom Left */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          display: 'flex',
          gap: '10px',
          flexDirection: 'row'
        }}>
          <SpellCards 
            cards={gameState.cards}
          />
        </div>
        
                  {/* Mini-Game Overlay */}
          {gameState.activeMiniGame && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}>
              <InlineMiniGame
                gameId={getActiveMiniGameId() || 'unknown'}
                spellName={gameState.cards.find(c => c.id === gameState.activeMiniGame)?.name}
                onComplete={handleMiniGameComplete}
                onCancel={handleMiniGameCancel}
              />
            </div>
          )}
              


        {/* Game Status Overlay - positioned inside game container */}
        {gameState.gameStatus === 'paused' && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            backgroundColor: 'rgba(51, 51, 51, 0.9)',
            borderRadius: '6px',
            textAlign: 'center',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            whiteSpace: 'nowrap',
            fontSize: '14px',
            color: '#fff'
          }}>
            Game Paused - Complete the mini-game to continue
          </div>
        )}
        </div>

      {/* Instructions */}
      <footer style={{ 
        marginTop: '30px', 
        textAlign: 'center',
        color: '#666',
        fontSize: '14px',
        maxWidth: '600px'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>How to Play:</strong>
        </div>
        <div>
          • Use WASD to move your wizard and dodge red projectiles<br/>
          • Press SPACEBAR for primary fire (varies by spell)<br/>
          • Press J/K to switch spells (Fireball ⚡ Lightning)<br/>
          • Press M for special mini-game (longer cooldown)<br/>
          • Perfect mini-game = wizard glows + next shot is SUPER!
        </div>
      </footer>
    </div>
  );
}

export default App;

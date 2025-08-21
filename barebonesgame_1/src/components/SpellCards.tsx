import React from 'react';
import { Card } from '../types/game';
import { getElementColor } from '../data/cards';

interface SpellCardsProps {
  cards: Card[];
}

export const SpellCards: React.FC<SpellCardsProps> = ({ cards }) => {
  const currentTime = Date.now();

  const isCardOnCooldown = (card: Card): boolean => {
    return currentTime - card.lastUsed < card.cooldown;
  };

  const getCooldownPercent = (card: Card): number => {
    if (!isCardOnCooldown(card)) return 0;
    return ((currentTime - card.lastUsed) / card.cooldown) * 100;
  };

  const getRarityColor = (rarity: Card['rarity']): string => {
    switch (rarity) {
      case 'common': return '#888888';
      case 'rare': return '#4488ff';
      case 'epic': return '#aa44ff';
      case 'legendary': return '#ffaa44';
    }
  };

  return (
    <>
      {cards.map((card, index) => {
        const onCooldown = isCardOnCooldown(card);
        const cooldownPercent = getCooldownPercent(card);
        const elementColor = getElementColor(card.element);
        const rarityColor = getRarityColor(card.rarity);
        const keyLabels = ['J', 'K', 'L', ';'];
        const keyLabel = keyLabels[index] || '?';

        return (
          <div
            key={card.id}
            className={`spell-card ${onCooldown ? 'on-cooldown' : ''}`}
                              style={{
                    border: `2px solid ${rarityColor}`,
                    backgroundColor: onCooldown ? 'rgba(51, 51, 51, 0.9)' : 'rgba(26, 26, 46, 0.9)',
                    opacity: onCooldown ? 0.6 : 0.95,
                    position: 'relative',
                    padding: '8px',
                    borderRadius: '8px',
                    width: '70px',
                    height: '98px',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
          >
            {/* Keyboard indicator */}
            <div style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              backgroundColor: '#333',
              color: '#fff',
              padding: '1px 4px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 'bold',
              lineHeight: '1'
            }}>
              {keyLabel}
            </div>

            {/* Card name */}
            <div style={{ 
              color: elementColor, 
              fontSize: '11px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginTop: '8px',
              lineHeight: '1.2'
            }}>
              {card.name}
            </div>

            {/* Element indicator */}
            {card.element && (
              <div style={{
                backgroundColor: elementColor,
                color: '#fff',
                padding: '1px 3px',
                borderRadius: '2px',
                fontSize: '8px',
                textAlign: 'center',
                alignSelf: 'center',
                lineHeight: '1'
              }}>
                {card.element.toUpperCase()}
              </div>
            )}

            {/* Cooldown overlay */}
            {onCooldown && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: '3px',
                  backgroundColor: '#44aaff',
                  width: `${cooldownPercent}%`,
                  transition: 'width 0.1s linear',
                  borderRadius: '0 0 4px 4px'
                }}
              />
            )}

            {/* Cooldown timer */}
            {onCooldown && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: '1px 3px',
                  borderRadius: '3px'
                }}
              >
                {Math.ceil((card.cooldown - (currentTime - card.lastUsed)) / 1000)}s
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}; 
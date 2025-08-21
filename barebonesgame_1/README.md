# 🧙‍♂️ MiniMage - Web-Based Spellcasting Card Game

A modular, web-based wizard combat game where cards trigger mini-games, and mini-game performance controls spell outcomes in real-time combat.

## 🎮 Game Overview

You play as a wizard who fights off waves of enemies while dodging projectiles in real time. Cast spells by clicking cards that launch unique mini-games. Your performance in each mini-game determines the strength and accuracy of your spells.

## ✨ Current Features (V0.1 - Greybox Prototype)

### ✅ Core Gameplay
- **WASD Player Movement**: Control your wizard on the left side of the screen
- **Real-time Combat**: Enemies spawn on the right and launch projectiles
- **Spell Card System**: 4 different spell cards with unique properties
- **Mini-Game Integration**: Reaction-time mini-game affects spell power
- **Collision Detection**: Dodge enemy projectiles and hit enemies with spells
- **Health & Scoring**: Player health, enemy defeat scoring, and game over states
- **Spell Cooldowns**: Cards have cooldown timers and visual indicators

### 🎯 Current Spell Cards
1. **Fireball** (Common, Fire) - Pop the Lock mini-game

*Other cards removed until their mini-games are implemented*

### 🎮 Controls
- **WASD**: Move wizard
- **JKL;**: Cast spells (right hand, slots 1-4)
- **SPACEBAR**: Interact in mini-games
- **R**: Restart game (when game over)

### 🏗️ Technical Features
- **Modular Architecture**: Easy to add new cards and mini-games
- **TypeScript**: Full type safety for game entities
- **React + Canvas**: Smooth 60fps gameplay
- **Performance Scaling**: Mini-game results directly affect spell damage
- **Responsive Design**: Works on different screen sizes

## 🚀 Getting Started

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to play the game.

## 🎯 How to Play

1. **Move**: Use WASD to dodge red enemy projectiles
2. **Cast Spells**: Press J to trigger the Pop the Lock mini-game
3. **Pop the Lock**: Game pauses, "Ready... Go!" countdown, press SPACEBAR to stop spinning donut on green
4. **Instant Casting**: Perfect timing = immediate spell cast with 100% damage
5. **Resume**: Game continues immediately after mini-game completion

## 🔧 Development Status

### ✅ Completed (V0.1)
- [x] Basic game loop and player movement
- [x] Enemy spawning and AI
- [x] Projectile system
- [x] Card-based spell casting
- [x] Mini-game framework (reaction time implemented)
- [x] Collision detection
- [x] Health/scoring system
- [x] Game over/restart functionality

### 🚧 Next Steps (Future Versions)
- [ ] Implement remaining mini-games:
  - [ ] Memory Grid
  - [ ] Number Sequence
  - [ ] Wind Archery
- [ ] Enhanced enemy types and patterns
- [ ] Boss encounters
- [ ] Particle effects and animations
- [ ] Sound effects and music
- [ ] Card collection/deck building
- [ ] Status effects and special abilities
- [ ] Wave progression system
- [ ] High score persistence

## 🏗️ Architecture

### Core Components
- **`useGameEngine`**: Main game loop, state management, and physics
- **`GameCanvas`**: Renders all game entities using HTML5 Canvas
- **`SpellCards`**: UI for spell cards with cooldowns and rarity indicators
- **`MiniGame`**: Modal system for mini-game challenges
- **Type System**: Comprehensive TypeScript interfaces for all game entities

### Data Structure
- **Cards**: JSON-configurable with mini-game associations
- **Mini-Games**: Modular system for easy extension
- **Game State**: Centralized state management for all entities

## 🎨 Game Design

### Card Rarity System
- **Common** (Gray): 1.0x base power
- **Rare** (Blue): 1.3x base power
- **Epic** (Purple): 1.7x base power
- **Legendary** (Orange): 2.2x base power

### Performance Scaling
Mini-game performance (0-100%) affects spell power:
- 0-50%: Reduced damage (0.5x - 1.0x)
- 50-100%: Enhanced damage (1.0x - 2.0x)
- Combined with rarity multiplier for final damage

### Element Types
- 🔥 **Fire**: High damage, fast projectiles
- ❄️ **Ice**: Piercing effects
- ⚡ **Lightning**: Chain reactions
- 🌍 **Earth**: Area effects
- 🌟 **Arcane**: Special abilities

## 📁 Project Structure

```
src/
├── types/
│   └── game.ts              # TypeScript interfaces
├── data/
│   └── cards.ts             # Card configurations and mini-games
├── hooks/
│   └── useGameEngine.ts     # Main game engine
├── components/
│   ├── GameCanvas.tsx       # Canvas renderer
│   ├── SpellCards.tsx       # Card UI
│   └── MiniGame.tsx         # Mini-game modal
└── App.tsx                  # Main application
```

## 🛠️ Technologies Used

- **React 18** with TypeScript
- **HTML5 Canvas** for game rendering
- **CSS3** for UI styling and animations
- **React Hooks** for state management
- **RequestAnimationFrame** for smooth 60fps gameplay

---

*Built with ❤️ for the love of game development and modular architecture!*

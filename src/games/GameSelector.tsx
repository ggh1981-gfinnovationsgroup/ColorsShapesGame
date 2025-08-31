import React from 'react';
import TapTheColorGame from './TapTheColorGame';
import ShapeMatchGame from './ShapeMatchGame';
import ColorShapesMixGame from './ColorShapesMixGame';
import NumberRecognition from './NumberRecognition';
import MemoryGame from './MemoryGame';
import PatternGame from './PatternGame';
import AudioRecognition from './AudioRecognition';

export type GameType = 
  | 'tap-the-color' 
  | 'shape-match' 
  | 'color-shapes-mix'
  | 'number-recognition'
  | 'memory-game'
  | 'pattern-game'
  | 'audio-recognition';

interface GameSelectorProps {
  gameType: GameType;
  onScore: (points: number) => void;
  onMistake: () => void;
  onComplete: () => void;
  level: number;
  language: 'es' | 'en' | 'both';
}

const GameSelector: React.FC<GameSelectorProps> = ({
  gameType,
  onScore,
  onMistake,
  onComplete,
  level,
  language
}) => {
  switch (gameType) {
    case 'tap-the-color':
      return (
        <TapTheColorGame
          onScore={onScore}
          onMistake={onMistake}
          onComplete={onComplete}
          level={level}
          language={language}
        />
      );
    
    case 'shape-match':
      return (
        <ShapeMatchGame
          onScore={onScore}
          onMistake={onMistake}
          onComplete={onComplete}
          level={level}
          language={language}
        />
      );
    
    case 'color-shapes-mix':
      return (
        <ColorShapesMixGame
          onScore={onScore}
          onMistake={onMistake}
          onComplete={onComplete}
          level={level}
          language={language}
        />
      );
    
    case 'number-recognition':
      return (
        <NumberRecognition
          onScore={onScore}
          onMistake={onMistake}
          onComplete={onComplete}
          level={level}
          language={language}
          childAge={4}
        />
      );
    
    case 'memory-game':
      return (
        <MemoryGame
          onScore={onScore}
          onMistake={onMistake}
          onComplete={onComplete}
          level={level}
          language={language}
        />
      );
    
    case 'pattern-game':
      return (
        <PatternGame
          onScore={onScore}
          onMistake={onMistake}
          onComplete={onComplete}
          level={level}
          language={language}
        />
      );
    
    case 'audio-recognition':
      return (
        <AudioRecognition
          onScore={onScore}
          onMistake={onMistake}
          onComplete={onComplete}
          level={level}
          language={language}
        />
      );
    
    default:
      return (
        <TapTheColorGame
          onScore={onScore}
          onMistake={onMistake}
          onComplete={onComplete}
          level={level}
          language={language}
        />
      );
  }
};

export default GameSelector;

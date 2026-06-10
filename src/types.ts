export type PlayerPosition = 'bottom' | 'right' | 'top' | 'left';

export interface Player {
  id: number;
  name: string;
  position: PlayerPosition;
  isAlive: boolean;
  avatarColor: string;
  avatarSeed: string; // for nice designs
  isHuman: boolean;
  eliminatedInWave?: number; // Wave number when they were eliminated
}

export type GameState = 'lobby' | 'playing' | 'exploded' | 'round_end' | 'game_over';

export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard';
  autoPassMinDelay: number; // in sec
  autoPassMaxDelay: number; // in sec
}

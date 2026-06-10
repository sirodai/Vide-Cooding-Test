import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RefreshCcw, Award } from 'lucide-react';
import { Player } from '../types';
import { audio } from '../utils/audio';

interface GameOverScreenProps {
  players: Player[];
  onRestart: () => void;
}

export default function GameOverScreen({ players, onRestart }: GameOverScreenProps) {
  // Find surviving player
  const winner = players.find((p) => p.isAlive);
  const isHumanWinner = winner?.isHuman || false;

  // Compile leaderboard sorting:
  const sortedLeaderboard = [...players].sort((a, b) => {
    if (a.isAlive && !b.isAlive) return -1;
    if (!a.isAlive && b.isAlive) return 1;
    
    // Both eliminated, compare wave of elimination
    const wA = a.eliminatedInWave || 0;
    const wB = b.eliminatedInWave || 0;
    return wB - wA; // Higher wave eliminated = better rank
  });

  const getRankBadge = (idx: number) => {
    switch (idx) {
      case 0:
        return <span className="bg-[#FF4444] text-white border border-white font-mono font-black text-[8px] px-1.5 py-0.5 uppercase skew-x-[-10deg]">👑 WINNER</span>;
      case 1:
        return <span className="bg-white text-black border border-white font-mono font-bold text-[8px] px-1.5 py-0.5 uppercase skew-x-[-10deg]">🥈 2ND</span>;
      case 2:
        return <span className="bg-black text-gray-400 border border-gray-800 font-mono font-bold text-[8px] px-1.5 py-0.5 uppercase skew-x-[-10deg]">🥉 3RD</span>;
      default:
        return <span className="bg-black text-gray-700 border border-gray-900 font-mono font-bold text-[8px] px-1.5 py-0.5 uppercase skew-x-[-10deg]">💀 4TH</span>;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4 sm:p-5 bg-[#0F0F0F] border-4 border-white text-white relative select-none">
      {/* Top Graphic line */}
      <div className="absolute top-0 left-0 w-full h-[4px] bg-[#FF4444]" />

      {/* Hero Badge */}
      <motion.div
        initial={{ scale: 0.7, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className={`inline-block p-2 border-2 border-white mb-2 ${
          isHumanWinner
            ? 'bg-[#FF4444] text-white animate-bounce shadow-[4px_4px_0px_rgba(255,255,255,0.25)]'
            : 'bg-black text-gray-500 border-gray-800'
        }`}
      >
        <Trophy size={32} fill="currentColor" className="stroke-[2.5]" />
      </motion.div>

      {/* Main Announcement */}
      <h2 className="text-2xl font-display font-black italic tracking-tighter text-center text-white uppercase leading-none">
        {isHumanWinner ? 'VICTORY' : 'GAME OVER'}
      </h2>
      <p className="text-[9px] font-mono font-bold text-gray-400 text-center tracking-[0.1em] mt-1 uppercase">
        {isHumanWinner 
          ? 'YOU CONQUERED THE EXPLOSION ROULETTE' 
          : 'FATAL BLAST ENDED YOUR CHANCE'
        }
      </p>

      {/* Leaderboard Table */}
      <div className="w-full my-3 bg-black border-2 border-white">
        <div className="bg-white text-black py-1 px-3 border-b-2 border-white flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider">
          <Award size={12} className="stroke-[2.5]" />
          <span>FINAL STANDINGS</span>
        </div>

        <div className="divide-y divide-gray-900 font-mono text-[10px]">
          {sortedLeaderboard.map((player, idx) => (
            <div
              key={player.id}
              className={`px-3 py-1.5 flex items-center justify-between transition-all ${
                player.isHuman
                  ? 'bg-white/5'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {player.isAlive ? '🏆' : '💀'}
                </span>
                <div>
                  <div className="font-bold flex items-center gap-1 uppercase">
                    <span className={player.isHuman ? 'text-[#FF4444] font-black' : 'text-white'}>
                      {player.name}
                    </span>
                    {player.isHuman && (
                      <span className="text-[7px] bg-[#FF4444] text-white px-0.5 font-mono font-black">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[8px] text-gray-500 uppercase">
                    {player.isAlive 
                      ? 'SOLE SURVIVOR' 
                      : `BURST IN WAVE ${player.eliminatedInWave}`
                    }
                  </div>
                </div>
              </div>
              
              <div>{getRankBadge(idx)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Restart Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          audio.playPass();
          onRestart();
        }}
        className="w-full bg-[#FF4444] text-white border-4 border-white font-display font-black tracking-[0.12em] py-3 px-4 text-xs uppercase skew-x-[-6deg] cursor-pointer hover:bg-white hover:text-black transition-colors shadow-[3px_3px_0px_rgba(255,255,255,0.2)]"
      >
        <RefreshCcw size={12} className="inline mr-1" />
        REPLAY ROULETTE
      </motion.button>
    </div>
  );
}

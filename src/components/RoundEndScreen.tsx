import React from 'react';
import { motion } from 'motion/react';
import { Users } from 'lucide-react';
import { Player } from '../types';
import { audio } from '../utils/audio';

interface RoundEndScreenProps {
  players: Player[];
  explodedPlayerId: number;
  wave: number;
  onNextWave: () => void;
  onEndGame: () => void;
}

export default function RoundEndScreen({
  players,
  explodedPlayerId,
  wave,
  onNextWave,
  onEndGame
}: RoundEndScreenProps) {
  const loser = players.find((p) => p.id === explodedPlayerId);
  const humanPlayer = players.find((p) => p.isHuman);
  const isHumanDead = !humanPlayer?.isAlive;

  const activePlayersCount = players.filter((p) => p.isAlive).length;

  const handleNextClick = () => {
    audio.playPass();
    onNextWave();
  };

  const handleEndClick = () => {
    audio.playDefeat();
    onEndGame();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4 sm:p-5 bg-[#0F0F0F] border-4 border-white text-white relative select-none">
      {/* Absolute Crimson Safety Stripe */}
      <div className="absolute top-0 left-0 w-full h-[4px] bg-[#FF4444]" />

      {/* Bullet Mark / Danger Sign */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-block bg-[#FF4444] border-4 border-white text-black font-display font-black tracking-tighter text-xl px-4 py-1 skew-x-[-8deg] shadow-[3px_3px_0px_rgba(255,255,255,0.15)] mb-2.5"
      >
        💥 BLAST!
      </motion.div>

      {/* Exploded Headline */}
      <h2 className="text-xl sm:text-2xl font-display font-black italic tracking-tighter text-[#FF4444] text-center uppercase leading-none">
        BOMB EXPLODED
      </h2>
      <p className="text-[9px] font-mono font-bold text-gray-400 tracking-[0.15em] mt-1 uppercase">
        WAVE {wave} REPORT SECURED
      </p>

      {/* Loser card with heavy labels */}
      {loser && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full bg-black border-2 border-[#FF4444] p-3 my-3 text-center relative"
        >
          <div className="absolute -top-2.5 right-3">
            <span className="px-1.5 py-0.5 bg-black text-[#FF4444] border border-[#FF4444] text-[7px] font-mono font-black uppercase tracking-widest">
              ELIMINATED
            </span>
          </div>

          <div className="text-base font-mono font-black text-white uppercase tracking-wider">
            {loser.name} {loser.isHuman && '(YOU)'}
          </div>
          <p className="text-[10px] font-mono text-gray-400 mt-1 max-w-[260px] mx-auto">
            手渡しが間に合わず、大爆発を浴びてしまいました！
          </p>
        </motion.div>
      )}

      {/* Survivor Grid List */}
      <div className="w-full space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-[#FF4444] pl-0.5">
          <Users size={12} className="stroke-[2.5]" />
          <span>CURRENT STATUS:</span>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5">
          {players.map((p) => (
            <div
              key={p.id}
              className={`p-2 border-2 font-mono text-[10px] font-bold flex items-center justify-between ${
                p.isAlive
                  ? 'bg-black border-white text-white'
                  : 'bg-[#121111] border-gray-900 text-gray-600 opacity-40 line-through'
              }`}
            >
              <span className="truncate max-w-[70px] uppercase font-bold">{p.name} {p.isHuman && '*'}</span>
              <span className={`text-[7px] font-black uppercase px-1 py-0.5 ${
                p.isAlive ? 'bg-white text-black' : 'bg-transparent text-gray-600'
              }`}>
                {p.isAlive ? 'ALIVE' : 'OUT'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="w-full space-y-2 relative z-10">
        {isHumanDead ? (
          <>
            {activePlayersCount >= 2 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNextClick}
                className="w-full bg-black hover:bg-white hover:text-black text-white font-mono font-black py-2.5 px-4 border-2 border-white uppercase tracking-[0.08em] text-[10px] transition-colors cursor-pointer skew-x-[-4deg]"
              >
                CPUの戦いを観戦する ({activePlayersCount}人)
              </motion.button>
            ) : null}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEndClick}
              className="w-full bg-[#FF4444] text-white hover:bg-white hover:text-black font-display font-black py-3 px-4 border-4 border-white uppercase tracking-[0.1em] text-xs transition-colors cursor-pointer skew-x-[-6deg] shadow-[3px_3px_0px_rgba(255,255,255,0.2)]"
            >
              FINAL LEADERBOARD
            </motion.button>
          </>
        ) : (
          <>
            {activePlayersCount >= 2 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNextClick}
                className="w-full bg-white text-black hover:bg-[#FF4444] hover:text-white hover:border-[#FF4444] font-display font-black py-3 px-4 border-4 border-white uppercase tracking-[0.1em] text-xs transition-colors cursor-pointer skew-x-[-6deg] shadow-[3px_3px_0px_rgba(255,255,255,0.2)]"
              >
                {activePlayersCount === 3 ? 'WAVE 2 (3-PLAYER) START' : 'FINAL FIGHT (1VS1) START'}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEndClick}
                className="w-full bg-[#FF4444] text-white hover:bg-white hover:text-black font-display font-black py-3 px-4 border-4 border-white uppercase tracking-[0.1em] text-xs transition-colors cursor-pointer skew-x-[-8deg] shadow-[3px_3px_0px_rgba(255,255,255,0.2)] animate-pulse"
              >
                GO TO WINNER PODIUM
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

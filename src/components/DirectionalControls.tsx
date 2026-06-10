import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { Player } from '../types';

interface DirectionalControlsProps {
  hasBomb: boolean;
  onPass: (targetPosition: 'top' | 'left' | 'right') => void;
  players: Player[];
  isPassing?: boolean;
  previousHolderId?: number | null;
}

export default function DirectionalControls({
  hasBomb,
  onPass,
  players,
  isPassing = false,
  previousHolderId = null
}: DirectionalControlsProps) {
  // Get survivors at each direction from the human's perspective
  const rightPlayer = players.find(p => p.position === 'right');
  const topPlayer = players.find(p => p.position === 'top');
  const leftPlayer = players.find(p => p.position === 'left');

  const isLeftAlive = leftPlayer?.isAlive || false;
  const isTopAlive = topPlayer?.isAlive || false;
  const isRightAlive = rightPlayer?.isAlive || false;

  const alivePlayersCount = players.filter((p) => p.isAlive).length;
  const isFinalTwo = alivePlayersCount <= 2;

  // We cannot pass back to the previous holder unless it is a 1vs1 final match (last 2 players)
  const isLeftBlocked = !isFinalTwo && previousHolderId !== null && leftPlayer?.id === previousHolderId;
  const isTopBlocked = !isFinalTwo && previousHolderId !== null && topPlayer?.id === previousHolderId;
  const isRightBlocked = !isFinalTwo && previousHolderId !== null && rightPlayer?.id === previousHolderId;

  const isPassEnabled = hasBomb && !isPassing;

  const handleArrowClick = (dir: 'left' | 'top' | 'right') => {
    if (!isPassEnabled) return;
    if (dir === 'left' && isLeftAlive && !isLeftBlocked) onPass('left');
    if (dir === 'top' && isTopAlive && !isTopBlocked) onPass('top');
    if (dir === 'right' && isRightAlive && !isRightBlocked) onPass('right');
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-black border-4 border-white rounded-none shadow-[4px_4px_0px_rgba(255,255,255,0.15)] max-w-xs mx-auto relative select-none">
      
      {/* Absolute Header Info */}
      <div className="text-center mb-2 w-full">
        {hasBomb ? (
          isPassing ? (
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.05em] text-amber-500 animate-pulse">
              ✈ FLYING... PASS IN TRANSIT ✈
            </span>
          ) : (
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.05em] text-[#FF4444] animate-pulse">
              ★ READY! PASS NOW [W A D] ★
            </span>
          )
        ) : (
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.05em] text-gray-500">
            WAITING FOR OPPONENT TO PASS...
          </span>
        )}
      </div>

      {/* Target Direction Cross Grid */}
      <div className="grid grid-cols-3 gap-2 w-48 h-36 items-center justify-items-center relative">
        
        {/* Row 1: Top option */}
        <div className="col-start-2">
          {topPlayer && (
            <motion.button
              whileHover={isPassEnabled && isTopAlive && !isTopBlocked ? { scale: 1.05 } : {}}
              whileTap={isPassEnabled && isTopAlive && !isTopBlocked ? { scale: 0.95 } : {}}
              onClick={() => handleArrowClick('top')}
              disabled={!isPassEnabled || !isTopAlive || isTopBlocked}
              className={`flex flex-col items-center justify-center w-11 h-11 border-2 font-mono transition-all duration-150 skew-x-[-5deg] ${
                !isTopAlive
                  ? 'bg-black border-gray-900 text-gray-800 cursor-not-allowed opacity-15'
                  : isTopBlocked
                  ? 'bg-[#150a0a] border-amber-800 text-amber-700 cursor-not-allowed opacity-50'
                  : isPassEnabled
                  ? 'bg-[#FF4444] border-white text-black font-black hover:bg-white hover:text-black hover:border-black shadow-lg'
                  : 'bg-black border-gray-800 text-gray-500'
              }`}
            >
              <span className="text-[8px] font-black leading-none">{isTopBlocked ? '❌' : '↑[W]'}</span>
              <ArrowUp size={14} className="stroke-[3]" />
              <span className="text-[6px] font-black truncate max-w-[38px] uppercase leading-none mt-0.5">{isTopBlocked ? 'BLOCKED' : topPlayer.name}</span>
            </motion.button>
          )}
        </div>

        {/* Row 2: Left and Right options */}
        <div className="col-start-1 row-start-2">
          {leftPlayer && (
            <motion.button
              whileHover={isPassEnabled && isLeftAlive && !isLeftBlocked ? { scale: 1.05 } : {}}
              whileTap={isPassEnabled && isLeftAlive && !isLeftBlocked ? { scale: 0.95 } : {}}
              onClick={() => handleArrowClick('left')}
              disabled={!isPassEnabled || !isLeftAlive || isLeftBlocked}
              className={`flex flex-col items-center justify-center w-11 h-11 border-2 font-mono transition-all duration-150 skew-x-[-5deg] ${
                !isLeftAlive
                  ? 'bg-black border-gray-900 text-gray-800 cursor-not-allowed opacity-15'
                  : isLeftBlocked
                  ? 'bg-[#150a0a] border-amber-800 text-amber-700 cursor-not-allowed opacity-50'
                  : isPassEnabled
                  ? 'bg-[#FF4444] border-white text-black font-black hover:bg-white hover:text-black hover:border-black shadow-lg'
                  : 'bg-black border-gray-800 text-gray-500'
              }`}
            >
              <span className="text-[8px] font-black leading-none">{isLeftBlocked ? '❌' : '[A]←'}</span>
              <ArrowLeft size={14} className="stroke-[3]" />
              <span className="text-[6px] font-black truncate max-w-[38px] uppercase leading-none mt-0.5">{isLeftBlocked ? 'BLOCKED' : leftPlayer.name}</span>
            </motion.button>
          )}
        </div>

        {/* Center Target Box */}
        <div className="col-start-2 row-start-2 flex items-center justify-center w-8 h-8 bg-black border-2 border-gray-800 skew-x-[-5deg]">
          <div className={`w-2 h-2 skew-x-[-5deg] transition-all duration-300 ${
            isPassEnabled 
              ? 'bg-[#FF4444] animate-ping' 
              : 'bg-gray-800'
          }`} />
        </div>

        <div className="col-start-3 row-start-2">
          {rightPlayer && (
            <motion.button
              whileHover={isPassEnabled && isRightAlive && !isRightBlocked ? { scale: 1.05 } : {}}
              whileTap={isPassEnabled && isRightAlive && !isRightBlocked ? { scale: 0.95 } : {}}
              onClick={() => handleArrowClick('right')}
              disabled={!isPassEnabled || !isRightAlive || isRightBlocked}
              className={`flex flex-col items-center justify-center w-11 h-11 border-2 font-mono transition-all duration-150 skew-x-[-5deg] ${
                !isRightAlive
                  ? 'bg-black border-gray-900 text-gray-800 cursor-not-allowed opacity-15'
                  : isRightBlocked
                  ? 'bg-[#150a0a] border-amber-800 text-amber-700 cursor-not-allowed opacity-50'
                  : isPassEnabled
                  ? 'bg-[#FF4444] border-white text-black font-black hover:bg-white hover:text-black hover:border-black shadow-lg'
                  : 'bg-black border-gray-800 text-gray-500'
              }`}
            >
              <span className="text-[8px] font-black leading-none">{isRightBlocked ? '❌' : '→[D]'}</span>
              <ArrowRight size={14} className="stroke-[3]" />
              <span className="text-[6px] font-black truncate max-w-[38px] uppercase leading-none mt-0.5">{isRightBlocked ? 'BLOCKED' : rightPlayer.name}</span>
            </motion.button>
          )}
        </div>

        {/* Row 3: Your indicator at bottom */}
        <div className="col-start-2 row-start-3">
          <div className="flex flex-col items-center justify-center w-11 h-11 border-2 border-white bg-[#0A0A0A] text-white skew-x-[-5deg]">
            <span className="text-[8px] font-black font-mono leading-none">YOU</span>
            <ArrowDown size={12} className="stroke-[2] opacity-40 mt-0.5" />
            <span className="text-[7px] font-bold tracking-wider text-gray-500 leading-none">P1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

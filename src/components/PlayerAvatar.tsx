import React from 'react';
import { motion } from 'motion/react';
import { Crown } from 'lucide-react';
import { Player } from '../types';

interface PlayerAvatarProps {
  player: Player;
  isCurrentHolder: boolean;
  isTargetHolder: boolean;
  timerRatio: number; // 0 to 1, where 1 means extremely close to explosion
  isTicking: boolean;
  wave: number;
  holderTimeRemaining?: number;
}

export default function PlayerAvatar({
  player,
  isCurrentHolder,
  timerRatio,
  isTicking,
  holderTimeRemaining = 2.0
}: PlayerAvatarProps) {
  const { name, isAlive, isHuman, eliminatedInWave } = player;

  // Compute nervous level based on bomb proximity or personal holding limit
  const isHoldingCritical = isCurrentHolder && holderTimeRemaining < 0.8;
  const isHoldingDanger = isCurrentHolder && holderTimeRemaining < 0.4;
  
  const isAlarming = isCurrentHolder && (timerRatio > 0.6 || isHoldingCritical);
  const isPanicked = isCurrentHolder && (timerRatio > 0.85 || isHoldingDanger);

  let avatarExpression = '😊'; // default happy
  if (!isAlive) {
    avatarExpression = '💀';
  } else if (isCurrentHolder) {
    if (isHoldingDanger) {
      avatarExpression = '😱';
    } else if (isHoldingCritical) {
      avatarExpression = '😰';
    } else {
      avatarExpression = '😨';
    }
  } else {
    if (timerRatio > 0.8 && isTicking) {
      avatarExpression = '😬';
    } else if (timerRatio > 0.5 && isTicking) {
      avatarExpression = '👁️_👁️';
    } else {
      avatarExpression = isHuman ? '🧑‍🚀' : '🤖';
    }
  }

  // Animation variants for shake/vibration
  const getShakeAnimation = () => {
    if (!isAlive) return {};
    if (isPanicked) {
      return {
        x: [0, -6, 6, -6, 6, -3, 3, 0],
        y: [0, 4, -4, 4, -4, 2, -2, 0],
        transition: { repeat: Infinity, duration: 0.15 }
      };
    }
    if (isAlarming) {
      return {
        x: [0, -3, 3, -3, 3, 0],
        y: [0, 2, -2, 2, -2, 0],
        transition: { repeat: Infinity, duration: 0.3 }
      };
    }
    if (isCurrentHolder) {
      return {
        x: [0, -1, 1, -1, 1, 0],
        transition: { repeat: Infinity, duration: 0.5 }
      };
    }
    return {};
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-20 h-20 sm:w-24 sm:h-24 select-none">
      
      {/* Target Arrow Spotlight */}
      {isCurrentHolder && isAlive && (
        <motion.div
          className={`absolute -inset-2 sm:-inset-3 border-2 border-dashed animate-pulse ${
            isHoldingCritical ? 'border-[#FF4444]' : 'border-amber-500'
          }`}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
        />
      )}

      {/* Main Avatar Card (Pure Brutalist Look!) */}
      <motion.div
        animate={getShakeAnimation()}
        className={`relative flex flex-col items-center justify-center w-12 h-12 sm:w-16 sm:h-16 shadow-[2px_2px_0px_rgba(255,255,255,0.15)] transition-all duration-200 skew-x-[-8deg] ${
          isAlive
            ? isCurrentHolder
              ? isHoldingCritical
                ? 'border-2 border-[#FF4444] bg-[#FF4444] text-black scale-105'
                : 'border-2 border-amber-500 bg-amber-500 text-black scale-105'
              : 'border-2 border-white bg-black text-white'
            : 'border-2 border-gray-800 bg-[#121212] text-gray-500 opacity-45'
        }`}
      >
        {/* User indicator bar */}
        {isHuman && (
          <span className={`absolute -top-2.5 left-1/2 transform -translate-x-1/2 font-mono text-[8px] font-black px-1.5 py-0.5 border scale-90 tracking-wider leading-none ${
            isCurrentHolder ? 'bg-black text-white border-white' : 'bg-[#FF4444] text-black border-white'
          }`}>
            YOU
          </span>
        )}

        {/* Expression Render */}
        <div className="text-lg sm:text-2xl mt-0.5 leading-none">
          {avatarExpression}
        </div>

        {/* Character Sub-Role Badge/Indicator */}
        <div className="mt-0.5 leading-none">
          <span className={`text-[7px] font-mono font-bold uppercase ${
            isCurrentHolder ? 'text-black' : 'text-gray-400'
          }`}>
            {isHuman ? 'HUMAN' : 'CPU'}
          </span>
        </div>
      </motion.div>

      {/* Name Tag */}
      <div className="mt-1.5 text-center w-full z-10 px-0.5">
        <div className={`text-[10px] sm:text-xs font-mono font-black uppercase truncate leading-none ${
          isAlive 
            ? isCurrentHolder 
              ? isHoldingCritical
                ? 'text-[#FF4444] scale-105 font-black animate-pulse'
                : 'text-amber-500 font-black' 
              : 'text-white'
            : 'text-gray-600 line-through'
        }`}>
          {name}
        </div>
        
        {/* Elimination Placement Tag */}
        {!isAlive && (
          <span className="inline-block bg-black border border-gray-800 text-gray-500 text-[7px] font-mono font-bold px-1.5 mt-0.5 leading-none">
            {eliminatedInWave === 1 ? '4th (W1)' : eliminatedInWave === 2 ? '3rd (W2)' : '2nd (W3)'}
          </span>
        )}

        {isAlive && isCurrentHolder && (
          <span className={`inline-block text-[8px] font-mono font-black px-1.5 mt-0.5 border leading-none ${
            isHoldingCritical 
              ? 'bg-[#FF4444] text-black border-white animate-[bounce_0.5s_infinite]' 
              : 'bg-amber-500 text-black border-white'
          }`}>
            LIMIT: {holderTimeRemaining.toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Play } from 'lucide-react';
import { audio } from '../utils/audio';

interface IntroScreenProps {
  onStartGame: (playerName: string, difficulty: 'easy' | 'normal' | 'hard') => void;
}

export default function IntroScreen({ onStartGame }: IntroScreenProps) {
  const [name, setName] = useState('プレイヤー');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audio.interactionTrigger();
    onStartGame(name.trim() || 'プレイヤー', difficulty);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4 sm:p-5 bg-[#0F0F0F] border-4 border-white text-white relative select-none">
      {/* Absolute Header Ribbon */}
      <div className="absolute top-0 left-0 w-full h-[4px] bg-[#FF4444]" />

      {/* Main Game Logo Title */}
      <div className="text-center mb-4 relative z-10 w-full mt-1">
        <motion.div
          animate={{ rotate: [-2, 2, -2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="inline-block bg-[#FF4444] border-4 border-white text-black font-display font-black tracking-tighter text-2xl px-5 py-1.5 skew-y-[-3deg] skew-x-[-8deg] shadow-[4px_4px_0px_rgba(255,255,255,0.15)]"
        >
          BOOM
        </motion.div>
        
        <h1 className="text-2xl font-display font-black italic tracking-tighter text-white uppercase mt-2 leading-none">
          EXPLOSION ROULETTE
        </h1>
        <p className="text-[10px] font-mono text-[#FF4444] tracking-[0.15em] mt-1.5 uppercase font-bold">
          ★ PASS OR DIE ★
        </p>
      </div>

      {/* Brutalist Rules Bubble */}
      <div className="mb-4 p-3 border-2 border-white bg-black text-[10px] space-y-1.5 text-left w-full leading-relaxed">
        <div className="flex items-center gap-1.5 text-[#FF4444] font-black font-mono uppercase tracking-wider">
          <Star size={12} className="fill-[#FF4444] stroke-none" />
          <span>Rules:</span>
        </div>
        <div className="space-y-1 text-gray-300 font-mono">
          <p>
            1. <strong className="text-white text-[10px]">4人</strong>でランダムに爆発する爆弾をパスし合います。
          </p>
          <p>
            2. あなたの番は<strong className="text-white">方向キー（W,A,D or ↑,←,→）</strong>か画面の矢印で即決パス。
          </p>
          <p>
            3. 手元で爆発した瞬間、その場で<strong className="text-[#FF4444]">即時脱落</strong>！
          </p>
          <p>
            4. 最後の1人生存で、賞賛と勝利をその手に。
          </p>
        </div>
      </div>

      {/* Setup Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4 relative z-10">
        {/* Name input */}
        <div className="space-y-1 text-left">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-gray-400">
            Player Alias
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={10}
            className="w-full bg-black border-4 border-white text-white font-mono uppercase font-bold px-3 py-2 text-xs focus:bg-white focus:text-black transition-colors focus:outline-none"
            placeholder="ENTER YOUR NAME..."
          />
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-1 text-left">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-gray-400">
            CPU Pass Speed
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['easy', 'normal', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => {
                  audio.playTick(diff === 'easy' ? 0.3 : diff === 'normal' ? 0.6 : 1.0);
                  setDifficulty(diff);
                }}
                className={`py-2 text-[10px] font-mono font-bold border-2 transition-all uppercase ${
                  difficulty === diff
                    ? 'bg-white text-black border-white'
                    : 'bg-black text-white border-gray-800 hover:border-gray-500'
                }`}
              >
                {diff === 'easy' && 'EASY'}
                {diff === 'normal' && 'NORMAL'}
                {diff === 'hard' && 'HARD'}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#FF4444] text-white border-4 border-white font-display font-black tracking-[0.12em] py-3 px-4 text-xs uppercase skew-x-[-6deg] cursor-pointer hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_rgba(255,255,255,0.2)]"
        >
          <Play size={14} fill="currentColor" stroke="none" />
          START MATCH
        </motion.button>
      </form>
    </div>
  );
}

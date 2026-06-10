import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface BombProps {
  timer: number;
  totalTime: number;
  isTicking: boolean;
  isExploded: boolean;
}

export default function Bomb({ timer, totalTime, isTicking, isExploded }: BombProps) {
  // Let's create an elegant fuse burning visual and dynamic floating spark particles.
  const [sparks, setSparks] = useState<{ id: number; lx: number; ly: number }[]>([]);

  const progressRatio = Math.max(0, Math.min(1, (totalTime - timer) / totalTime));
  const isCloseToExplosion = progressRatio > 0.75;
  const isSuperHot = progressRatio > 0.90;

  // Render sparkles dynamically when ticking
  useEffect(() => {
    if (!isTicking) {
      setSparks([]);
      return;
    }

    const interval = setInterval(() => {
      // Create new spark
      const sparkCount = isScaleUp ? 3 : 1;
      const newSparks = Array.from({ length: sparkCount }).map(() => ({
        id: Math.random() + Date.now(),
        // Offset around the top-right fuse ending
        lx: (Math.random() - 0.5) * 25,
        ly: (Math.random() - 0.5) * 15 - 15,
      }));

      setSparks((prev) => [...prev, ...newSparks].slice(-15));
    }, isSuperHot ? 80 : 150);

    return () => clearInterval(interval);
  }, [isTicking, isSuperHot]);

  // Handle pulse rate changes
  const isScaleUp = progressRatio > 0.5;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center select-none z-10">
      {/* Background Pulse Shadow */}
      {isTicking && (
        <motion.div
          className={`absolute inset-4 rounded-full filter blur-2xl opacity-40 mix-blend-screen ${
            isSuperHot ? 'bg-red-600' : isCloseToExplosion ? 'bg-orange-600' : 'bg-yellow-500'
          }`}
          animate={{
            scale: isSuperHot ? [1, 1.4, 1] : [1, 1.25, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: isSuperHot ? 0.25 : isCloseToExplosion ? 0.45 : 0.85,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main Bomb Wrapper with Shaking on extreme alarm */}
      <motion.div
        animate={
          isExploded
            ? { scale: [1, 1.8, 0], opacity: [1, 1, 0] }
            : isSuperHot
            ? {
                x: [0, -3, 3, -3, 3, 0],
                y: [0, 2, -2, 2, -2, 0],
                scale: 1.15,
              }
            : isCloseToExplosion
            ? {
                x: [0, -1.5, 1.5, 0],
                scale: 1.08,
              }
            : { scale: 1.0 }
        }
        transition={
          isSuperHot
            ? { repeat: Infinity, duration: 0.1 }
            : isCloseToExplosion
            ? { repeat: Infinity, duration: 0.25 }
            : {}
        }
        className="relative flex items-center justify-center w-full h-full"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-24 h-24 drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]"
        >
          {/* Fuse curve */}
          <path
            d="M 50 35 C 55 20, 65 15, 75 18"
            fill="none"
            stroke="#d1a270"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="4,2"
            className={isTicking ? "animate-[dash_10s_linear_infinite]" : ""}
          />

          {/* Golden metallic neck of the bomb */}
          <rect x="42" y="32" width="16" height="6" rx="2" fill="#d4af37" />
          <ellipse cx="50" cy="32" rx="8" ry="2" fill="#aa8000" />

          {/* Main Bomb Sphere */}
          <ellipse cx="50" cy="65" rx="30" ry="30" fill="#1e2025" />
          <path
            d="M 32 45 A 25 25 0 0 1 68 45"
            fill="none"
            stroke="#2e323b"
            strokeWidth="5"
          />

          {/* Highlight (Gives a clean glossy/metallic sphere feel) */}
          <ellipse cx="38" cy="52" rx="7" ry="5" fill="#50545e" opacity="0.6" transform="rotate(-30 38 52)" />
          <circle cx="35" cy="48" r="2" fill="#ffffff" opacity="0.8" />

          {/* Hazard/Warning symbol inside the center of the bomb */}
          <polygon
            points="50,52 61,72 39,72"
            fill={isSuperHot ? "#ef4444" : isCloseToExplosion ? "#f97316" : "#eab308"}
            opacity="0.85"
            className={isTicking ? "animate-pulse" : ""}
          />
          <circle
            cx="50"
            cy="66"
            r="2"
            fill="#1e2025"
          />
          <line
            x1="50"
            y1="58"
            x2="50"
            y2="63"
            stroke="#1e2025"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Live Sparkle Emitters at top right (75, 18) matches end of curve */}
        {isTicking && (
          <div className="absolute top-[28px] right-[24px]">
            {/* Realtime Sparks rendering with absolute container positioning */}
            <div className="relative">
              {/* Central fuse spark core */}
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 0.15 }}
                className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_#f59e0b] -translate-x-1/2 -translate-y-1/2"
              />
              
              {/* Particle Sparks */}
              <AnimatePresence>
                {sparks.map((spark) => (
                  <motion.div
                    key={spark.id}
                    initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                    animate={{
                      scale: 0.2,
                      opacity: 0,
                      x: spark.lx,
                      y: spark.ly,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="absolute w-2 h-2 rounded-full cursor-none bg-yellow-400 shadow-[0_0_6px_#f97316]"
                    style={{ left: 0, top: 0 }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>

      {/* Ticking text (Count representation or Percent Warning) */}
      <AnimatePresence>
        {isTicking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute bottom-[0px] text-xs font-mono font-bold py-1 px-3.5 rounded-full shadow border backdrop-blur-sm tracking-widest ${
              isSuperHot
                ? 'bg-red-950 border-red-500 text-red-500 scale-110'
                : isCloseToExplosion
                ? 'bg-orange-950/80 border-orange-500 text-orange-400'
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
            }`}
          >
            {isSuperHot ? '!! FLUSHING !!' : isCloseToExplosion ? '!! BURNING !!' : 'TICKING...'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Volume2,
  VolumeX,
  Keyboard,
  Zap,
  Info,
  ChevronRight,
  HelpCircle,
  Skull,
  Award
} from 'lucide-react';

import { Player, GameState, PlayerPosition } from './types';
import { audio } from './utils/audio';

import IntroScreen from './components/IntroScreen';
import PlayerAvatar from './components/PlayerAvatar';
import Bomb from './components/Bomb';
import DirectionalControls from './components/DirectionalControls';
import RoundEndScreen from './components/RoundEndScreen';
import GameOverScreen from './components/GameOverScreen';

export default function App() {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [playerName, setPlayerName] = useState('プレイヤー');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [wave, setWave] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Default coordinate setup for 4-player circle
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      name: 'プレイヤー',
      position: 'bottom',
      isAlive: true,
      avatarColor: 'bg-indigo-600',
      avatarSeed: 'p1',
      isHuman: true,
    },
    {
      id: 2,
      name: 'CPU 1',
      position: 'right',
      isAlive: true,
      avatarColor: 'bg-emerald-600',
      avatarSeed: 'cpu1',
      isHuman: false,
    },
    {
      id: 3,
      name: 'CPU 2',
      position: 'top',
      isAlive: true,
      avatarColor: 'bg-amber-600',
      avatarSeed: 'cpu2',
      isHuman: false,
    },
    {
      id: 4,
      name: 'CPU 3',
      position: 'left',
      isAlive: true,
      avatarColor: 'bg-pink-600',
      avatarSeed: 'cpu3',
      isHuman: false,
    },
  ]);

  const [currentHolderId, setCurrentHolderId] = useState<number>(1);
  const [previousHolderId, setPreviousHolderId] = useState<number | null>(null);
  const previousHolderRef = useRef<number | null>(null);
  previousHolderRef.current = previousHolderId;

  const [timer, setTimer] = useState<number>(15);
  const [totalTime, setTotalTime] = useState<number>(15);
  const [isTicking, setIsTicking] = useState<boolean>(false);
  const [explodedPlayerId, setExplodedPlayerId] = useState<number | null>(null);

  // New state for 2s force hold limit and physics flying transit
  const [isPassing, setIsPassing] = useState<boolean>(false);
  const [passOriginId, setPassOriginId] = useState<number | null>(null);
  const [passTargetId, setPassTargetId] = useState<number | null>(null);
  const [passTimeElapsed, setPassTimeElapsed] = useState<number>(0);
  const [holderTimeRemaining, setHolderTimeRemaining] = useState<number>(2.0);

  // Sync references for interval callbacks and CPU logic threads to access latest values instantly
  const currentHolderIdRef = useRef<number>(1);
  const previousHolderIdRef = useRef<number | null>(null);
  const isPassingRef = useRef<boolean>(false);
  const passOriginIdRef = useRef<number | null>(null);
  const passTargetIdRef = useRef<number | null>(null);
  const passTimeElapsedRef = useRef<number>(0);
  const holderTimeRemainingRef = useRef<number>(2.0);

  currentHolderIdRef.current = currentHolderId;
  previousHolderIdRef.current = previousHolderId;
  isPassingRef.current = isPassing;
  passOriginIdRef.current = passOriginId;
  passTargetIdRef.current = passTargetId;
  passTimeElapsedRef.current = passTimeElapsed;
  holderTimeRemainingRef.current = holderTimeRemaining;

  // Visual error indicator (burst border color or quick red note)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // --- REFS FOR TIMING ---
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const cpuActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tickAudioTimerRef = useRef<number>(0); // Timestamp of last ticker beep

  // --- AUDIO MUTING TOGGLE ---
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        audio.interactionTrigger();
        audio.playTick(0.5);
      }
      return next;
    });
  };

  // --- REACTION RANGE CALCULATIONS BASED ON DIFFICULTY ---
  // If hold limit is 2.0s we adjust CPU easy reaction range so they don't hold past 2.0s always but still feel slow.
  const getCpuHoldRange = useCallback(() => {
    switch (difficulty) {
      case 'easy':
        return { min: 800, max: 1700 };
      case 'hard':
        return { min: 250, max: 600 };
      case 'normal':
      default:
        return { min: 500, max: 1200 };
    }
  }, [difficulty]);

  // Handler to formally resolve when bomb arrives at target player (from flying)
  const handleArrival = useCallback((targetId: number, originId: number) => {
    setCurrentHolderId(targetId);
    setPreviousHolderId(originId);
    
    setIsPassing(false);
    setPassOriginId(null);
    setPassTargetId(null);
    setPassTimeElapsed(0);
    
    // Reset individual hold timer back to full 2.0s upon arrival!
    setHolderTimeRemaining(2.0);
  }, []);

  // --- ACTION: BOMB PASSING ---
  const passBombTo = useCallback(
    (targetId: number) => {
      if (gameState !== 'playing') return;
      if (isPassingRef.current) return; // Prevent any pass inputs while bomb is in transit!

      const target = players.find((p) => p.id === targetId);
      if (!target || !target.isAlive) return;

      // Check if it's the same person who just passed it (forbid except in finals)
      const alivePlayers = players.filter((p) => p.isAlive);
      const isFinalTwo = alivePlayers.length <= 2;

      if (!isFinalTwo && previousHolderIdRef.current !== null && targetId === previousHolderIdRef.current) {
        setFeedbackMessage('⚠ 直前に渡してきた相手にはパスできません！');
        setTimeout(() => setFeedbackMessage(null), 1200);
        return;
      }

      if (soundEnabled) {
        audio.playPass();
      }

      // Start pass flying sequence!
      const originId = currentHolderIdRef.current;
      
      setIsPassing(true);
      setPassOriginId(originId);
      setPassTargetId(targetId);
      setPassTimeElapsed(0);

      // Flash feedback
      const origin = players.find((p) => p.id === originId);
      if (origin) {
        setFeedbackMessage(`${origin.name} ➔ ${target.name}`);
        setTimeout(() => setFeedbackMessage(null), 850);
      }
    },
    [players, gameState, soundEnabled]
  );

  // --- CONTROLLER: CPU LOGIC ---
  useEffect(() => {
    // If not actively running or winner found, do nothing
    if (gameState !== 'playing' || !isTicking) {
      if (cpuActionTimeoutRef.current) clearTimeout(cpuActionTimeoutRef.current);
      return;
    }

    const currentHolder = players.find((p) => p.id === currentHolderId);
    if (!currentHolder || !currentHolder.isAlive || currentHolder.isHuman) {
      // It is the human player's turn, CPU does not queue action
      if (cpuActionTimeoutRef.current) clearTimeout(cpuActionTimeoutRef.current);
      return;
    }

    // Current holder is a CPU. We schedule a random delay, then they pass to an alive opponent.
    const delayRange = getCpuHoldRange();
    // Pure reaction delay based on difficulty setting (no artificial 2s cooldown wait block added!)
    const randomDelay = Math.random() * (delayRange.max - delayRange.min) + delayRange.min;

    if (cpuActionTimeoutRef.current) clearTimeout(cpuActionTimeoutRef.current);

    cpuActionTimeoutRef.current = setTimeout(() => {
      // Find other alive players
      const aliveOpponents = players.filter(
        (p) => p.isAlive && p.id !== currentHolderId
      );

      if (aliveOpponents.length > 0) {
        // CPU passes randomly to one of the other survivors
        // Prevent passing back to the previous holder unless it's the final 2 players
        const totalAliveCount = players.filter((p) => p.isAlive).length;
        const validTargets = totalAliveCount > 2 && previousHolderIdRef.current !== null
          ? aliveOpponents.filter((p) => p.id !== previousHolderIdRef.current)
          : aliveOpponents;

        const targetList = validTargets.length > 0 ? validTargets : aliveOpponents;
        const randomTarget = targetList[Math.floor(Math.random() * targetList.length)];
        passBombTo(randomTarget.id);
      }
    }, randomDelay);

    return () => {
      if (cpuActionTimeoutRef.current) clearTimeout(cpuActionTimeoutRef.current);
    };
  }, [currentHolderId, players, gameState, isTicking, getCpuHoldRange, passBombTo]);

  // --- KEYBOARD LISTENER ---
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !isTicking) return;
      if (isPassingRef.current) return; // Prevent key passing during flight transit

      const currentHolder = players.find((p) => p.id === currentHolderId);
      if (!currentHolder || !currentHolder.isHuman) return;

      // Key mapping
      const key = e.key.toLowerCase();
      const isUp = key === 'arrowup' || key === 'w';
      const isLeft = key === 'arrowleft' || key === 'a';
      const isRight = key === 'arrowright' || key === 'd';
      const isDown = key === 'arrowdown' || key === 's';

      if (isDown) {
        setFeedbackMessage('⚠ 自分自身には渡せません！');
        setTimeout(() => setFeedbackMessage(null), 1000);
        return;
      }

      let targetPos: PlayerPosition | null = null;
      if (isUp) targetPos = 'top';
      if (isLeft) targetPos = 'left';
      if (isRight) targetPos = 'right';

      if (targetPos) {
        const targetPlayer = players.find((p) => p.position === targetPos);
        if (targetPlayer) {
          if (targetPlayer.isAlive) {
            passBombTo(targetPlayer.id);
          } else {
            // Player is already dead
            setFeedbackMessage(`❌ ${targetPlayer.name} はすでに脱落しています！`);
            setTimeout(() => setFeedbackMessage(null), 1200);
          }
        }
      }
    },
    [currentHolderId, players, gameState, isTicking, passBombTo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // --- TIMING & TICKING LOOP ---
  useEffect(() => {
    if (gameState !== 'playing' || !isTicking) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    const intervalTime = 50; // loop runs every 50ms for high precision
    gameLoopRef.current = setInterval(() => {
      // 1. Handle flying bomb transit physics
      if (isPassingRef.current) {
        passTimeElapsedRef.current += intervalTime / 1000;
        setPassTimeElapsed(passTimeElapsedRef.current);

        if (passTimeElapsedRef.current >= 0.35) {
          // Transit finish: Bomb formally arrives at the target recipient!
          const targetId = passTargetIdRef.current;
          const originId = passOriginIdRef.current;
          if (targetId !== null && originId !== null) {
            handleArrival(targetId, originId);
          }
        }
      } else {
        // Under normal holding conditions, tick down the current owner's personal hold limits!
        holderTimeRemainingRef.current = Math.max(0, holderTimeRemainingRef.current - intervalTime / 1000);
        setHolderTimeRemaining(holderTimeRemainingRef.current);

        if (holderTimeRemainingRef.current <= 0) {
          // Force blast! Current holder has kept the bomb past the 2.0s limit!
          setIsTicking(false);
          if (gameLoopRef.current) clearInterval(gameLoopRef.current);
          triggerExplosion(true); // Force holding limit explosion
          return;
        }
      }

      // 2. Continuous drop of the absolute overall timer fuse
      setTimer((prev) => {
        const nextValue = prev - intervalTime / 1000;
        
        if (nextValue <= 0) {
          // Total Game timer depletion explosion!
          setIsTicking(false);
          if (gameLoopRef.current) clearInterval(gameLoopRef.current);
          
          triggerExplosion(false); // Overall fuse expired blowup
          return 0;
        }

        // Ticking Sound Frequency Speed-Up
        const timeRatio = Math.max(0, Math.min(1, (totalTime - nextValue) / totalTime));
        const nextBeepDelay = timeRatio > 0.9 ? 80 : timeRatio > 0.75 ? 180 : timeRatio > 0.5 ? 320 : 650;
        const now = Date.now();

        if (now - tickAudioTimerRef.current >= nextBeepDelay) {
          if (soundEnabled) {
            audio.playTick(timeRatio);
          }
          tickAudioTimerRef.current = now;
        }

        return nextValue;
      });
    }, intervalTime);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, isTicking, totalTime, soundEnabled, handleArrival]);

  // --- ACTION: TARGET EXPLOSION ---
  const triggerExplosion = (isForceLimit: boolean = false) => {
    // Who is the official loser?
    // If bomb expires in transit (flying) during normal timer deplete, blame the origin thrower who released late.
    // If it's a holding force limit timeout, blame the stagnant current id.
    let loserId = currentHolderIdRef.current;
    
    if (isPassingRef.current && !isForceLimit) {
      if (passOriginIdRef.current !== null) {
        loserId = passOriginIdRef.current;
      }
    }
    
    setExplodedPlayerId(loserId);
    setGameState('exploded');

    if (soundEnabled) {
      audio.playExplosion();
    }

    // Set a quick visual screen shake delays and mark player as dead
    setTimeout(() => {
      // Mark player dead
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === loserId
            ? { ...p, isAlive: false, eliminatedInWave: wave }
            : p
        )
      );
      
      // Navigate to round end screen
      setGameState('round_end');
    }, 2200);
  };

  // --- ACTIONS: WAVE NAVIGATION ---
  const handleStartGame = (humanName: string, selectedDiff: 'easy' | 'normal' | 'hard') => {
    setPlayerName(humanName);
    setDifficulty(selectedDiff);

    // Initial resets
    const initialPlayers: Player[] = [
      {
        id: 1,
        name: humanName,
        position: 'bottom',
        isAlive: true,
        avatarColor: 'bg-indigo-600',
        avatarSeed: 'p1',
        isHuman: true,
      },
      {
        id: 2,
        name: 'CPU 1（右）',
        position: 'right',
        isAlive: true,
        avatarColor: 'bg-emerald-600',
        avatarSeed: 'cpu1',
        isHuman: false,
      },
      {
        id: 3,
        name: 'CPU 2（上）',
        position: 'top',
        isAlive: true,
        avatarColor: 'bg-amber-600',
        avatarSeed: 'cpu2',
        isHuman: false,
      },
      {
        id: 4,
        name: 'CPU 3（左）',
        position: 'left',
        isAlive: true,
        avatarColor: 'bg-pink-600',
        avatarSeed: 'cpu3',
        isHuman: false,
      },
    ];

    setPlayers(initialPlayers);
    setWave(1);
    startRoundForWave(initialPlayers, 1);
  };

  const startRoundForWave = (currentPlayersSet: Player[], currentWave: number) => {
    // Random fuse duration: 10s to 17s
    const randomTimer = Math.floor(Math.random() * 8) + 10;
    
    // Choose starting holder randomly among ALIVE players
    const alivePlayers = currentPlayersSet.filter((p) => p.isAlive);
    const randomStarter = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

    setTimer(randomTimer);
    setTotalTime(randomTimer);
    setCurrentHolderId(randomStarter.id);
    setPreviousHolderId(null);
    setExplodedPlayerId(null);
    setFeedbackMessage(null);
    
    // Reset flight transient and personal hold limits
    setIsPassing(false);
    setPassOriginId(null);
    setPassTargetId(null);
    setPassTimeElapsed(0);
    setHolderTimeRemaining(2.0);
    
    setGameState('playing');
    
    // Tiny delay so player has half a second to locate the bomb starter
    setTimeout(() => {
      setIsTicking(true);
      if (soundEnabled) {
        audio.playTick(0.1);
      }
    }, 800);
  };

  const handleNextWave = () => {
    const nextWaveNum = wave + 1;
    setWave(nextWaveNum);
    startRoundForWave(players, nextWaveNum);
  };

  const handleEndGame = () => {
    setGameState('game_over');
    if (soundEnabled) {
      const human = players.find((p) => p.isHuman);
      if (human?.isAlive) {
        audio.playVictory();
      } else {
        audio.playDefeat();
      }
    }
  };

  const handleRestart = () => {
    setGameState('lobby');
    setWave(1);
  };

  // --- POSITION RENDER COORDINATES MAPPINGS ON DESK ---
  const getCoordinatesForPosition = (pos: PlayerPosition) => {
    switch (pos) {
      case 'top':
        return { left: '50%', top: '15%' };
      case 'left':
        return { left: '15%', top: '50%' };
      case 'right':
        return { left: '85%', top: '50%' };
      case 'bottom':
      default:
        return { left: '50%', top: '82%' };
    }
  };

  // Compute coordinates. If bomb is flying in transit, interpolate between origin and target!
  const getBombCoords = () => {
    if (isPassing && passOriginId !== null && passTargetId !== null) {
      const originPlayer = players.find((p) => p.id === passOriginId);
      const targetPlayer = players.find((p) => p.id === passTargetId);
      if (originPlayer && targetPlayer) {
        const originCoords = getCoordinatesForPosition(originPlayer.position);
        const targetCoords = getCoordinatesForPosition(targetPlayer.position);
        
        const parsePercent = (str: string) => parseFloat(str.replace('%', ''));
        const originLeft = parsePercent(originCoords.left);
        const originTop = parsePercent(originCoords.top);
        const targetLeft = parsePercent(targetCoords.left);
        const targetTop = parsePercent(targetCoords.top);
        
        // Linear progress interpolation
        const progress = Math.min(1, Math.max(0, passTimeElapsed / 0.35));
        const interpLeft = originLeft + (targetLeft - originLeft) * progress;
        const interpTop = originTop + (targetTop - originTop) * progress;
        
        return { left: `${interpLeft}%`, top: `${interpTop}%` };
      }
    }
    
    // Default holding or stationary coords
    return currentHolderPlayer
      ? getCoordinatesForPosition(currentHolderPlayer.position)
      : { left: '46%', top: '48%' };
  };

  const currentHolderPlayer = players.find((p) => p.id === currentHolderId);
  const currentHolderCoords = getBombCoords();

  const humanPlayer = players.find((p) => p.isHuman);
  const isHumanHoldingBomb = currentHolderPlayer?.isHuman || false;

  const timerRatio = Math.max(0, Math.min(1, (totalTime - timer) / totalTime));

  const explodedPlayer = players.find((p) => p.id === explodedPlayerId);
  const explodedCoords = explodedPlayer 
    ? getCoordinatesForPosition(explodedPlayer.position)
    : currentHolderCoords;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#FF4444]/30 relative select-none">
      
      {/* Absolute Background Large Typography Accent Watermarks */}
      <div className="absolute inset-x-0 h-full z-0 opacity-[0.02] flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <h1 className="text-[120px] sm:text-[220px] md:text-[350px] font-display font-black leading-none tracking-tighter uppercase italic select-none">BOOM</h1>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 rotate-90 opacity-[0.02] pointer-events-none select-none hidden xl:block z-0">
        <span className="text-[80px] font-black tracking-widest uppercase select-none font-sans">DO NOT HOLD THE BOMB</span>
      </div>

      {/* Global Top Header Bar */}
      <header className="max-w-2xl w-full mx-auto px-4 py-2 border-b-2 border-white bg-black flex items-center justify-between relative z-20">
        <div className="flex flex-col">
          <span className="text-[#FF4444] font-mono text-[9px] tracking-[0.2em] font-black uppercase leading-none">Live Match</span>
          <h2 className="text-base sm:text-lg font-display font-black italic tracking-tighter uppercase text-white mt-1 leading-none">
            EXPLOSION ROULETTE
          </h2>
        </div>

        {/* Action utility bar */}
        <div className="flex items-center gap-2">
          {/* Mute controls */}
          <button
            onClick={toggleSound}
            className={`px-2 py-1 border font-mono font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-white text-black border-white hover:bg-[#FF4444] hover:text-white hover:border-[#FF4444]'
                : 'bg-black text-gray-500 border-gray-800 hover:border-gray-500'
            }`}
          >
            {soundEnabled ? 'SOUND ON' : 'MUTE'}
          </button>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-1.5 relative z-10 w-full max-w-md mx-auto overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* 1. LOBBY STATE */}
          {gameState === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <IntroScreen onStartGame={handleStartGame} />
            </motion.div>
          )}

          {/* 2. PLAYING / ACTIVE ARENA STATE */}
          {(gameState === 'playing' || gameState === 'exploded') && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={gameState === 'exploded' ? {
                x: [0, -12, 12, -9, 9, -6, 6, -3, 3, 0],
                y: [0, 9, -9, 7, -7, 5, -5, 3, -3, 0],
                scale: [1, 1.04, 0.98, 1.02, 1],
                transition: { duration: 1.2, ease: "easeInOut" }
              } : { opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col gap-2 relative overflow-hidden"
            >
              {/* Top status header */}
              <div className="w-full bg-black border-2 border-white p-2 flex items-center justify-between font-mono text-[9px] sm:text-xs select-none shadow-[2px_2px_0px_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-[#FF4444] text-black px-2 py-0.5 border-2 border-white skew-x-[-10deg] uppercase tracking-tight font-sans">
                    WAVE 0{wave}
                  </span>
                  <span className="text-white font-bold tracking-wider uppercase hidden sm:inline">
                    | {players.filter((p) => p.isAlive).length} ALIVE
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-bold">VELOCITY:</span>
                  <span className={`font-black uppercase tracking-wider ${
                    difficulty === 'hard' ? 'text-[#FF4444]' : difficulty === 'normal' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {difficulty}
                  </span>
                </div>
              </div>

              {/* Central Floating Arena Circle (Styled as solid square brutal battle space) */}
              <div className="relative w-[260px] h-[260px] sm:w-[310px] sm:h-[310px] mx-auto bg-black border-4 border-white shadow-[4px_4px_0px_rgba(255,255,255,0.15)] overflow-hidden">
                {/* Decorative Table Felt layout */}
                <div className="absolute inset-5 border border-white/10 bg-[#060606] flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 border border-dashed border-white/5 flex items-center justify-center font-mono text-[8px] text-white/5 uppercase tracking-[0.1em]">
                    DEATHZONE
                  </div>
                </div>

                {/* Draw Player Seats based on Circular Configuration */}
                {players.map((p) => {
                  const coords = getCoordinatesForPosition(p.position);
                  return (
                    <div
                      key={p.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: coords.left, top: coords.top }}
                    >
                      <PlayerAvatar
                        player={p}
                        isCurrentHolder={currentHolderId === p.id}
                        isTargetHolder={false}
                        timerRatio={timerRatio}
                        isTicking={isTicking}
                        wave={wave}
                        holderTimeRemaining={currentHolderId === p.id ? holderTimeRemaining : 2.0}
                      />
                    </div>
                  );
                })}

                {/* Animated Flying/Orbiting Ticking Bomb */}
                <motion.div
                  className="absolute z-10 pointer-events-none cursor-none scale-75 sm:scale-90"
                  animate={{
                    left: currentHolderCoords.left,
                    top: currentHolderCoords.top,
                    x: '-50%',
                    y: '-58%', // Offset vertical alignment so bomb sits above player cards nicely
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 140,
                    damping: 17,
                  }}
                >
                  <Bomb
                    timer={timer}
                    totalTime={totalTime}
                    isTicking={isTicking}
                    isExploded={gameState === 'exploded'}
                  />
                </motion.div>

                {/* Feedback Toast overlays inside the board */}
                <AnimatePresence>
                  {feedbackMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 bg-black border-2 border-[#FF4444] text-[#FF4444] px-3 py-1 font-mono font-black tracking-widest text-[9px] z-20 whitespace-nowrap shadow-lg select-none skew-x-[-5deg]"
                    >
                      {feedbackMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Urgent Warning Flash overlays */}
                {isHumanHoldingBomb && isTicking && (
                  <div className={`absolute inset-0 pointer-events-none border-4 transition-all duration-100 ${
                    timerRatio > 0.85 
                      ? 'border-[#FF4444] animate-pulse opacity-90' 
                      : 'border-white/10'
                  }`} />
                )}

                {/* Extreme Explosion Shockwave Overlay and Fireball */}
                {gameState === 'exploded' && (
                  <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden">
                    {/* Full Screen Flash */}
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: [1, 1, 0.8, 0] }}
                      transition={{ duration: 1.2, times: [0, 0.15, 0.4, 1] }}
                      className="absolute inset-0 bg-white"
                    />
                    
                    {/* Dark Red Vignette Flash */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 1, 0.4, 0] }}
                      transition={{ duration: 1.8, times: [0, 0.05, 0.3, 0.7, 1] }}
                      className="absolute inset-0 bg-red-600 mix-blend-overlay"
                    />

                    {/* Concentric Shockwave Circles from Exploded Coordinates */}
                    <motion.div
                      className="absolute rounded-full border-4 border-yellow-400 bg-orange-500/30"
                      style={{
                        left: explodedCoords.left,
                        top: explodedCoords.top,
                        x: '-50%',
                        y: '-50%'
                      }}
                      initial={{ width: 0, height: 0, opacity: 1 }}
                      animate={{ width: '300px', height: '300px', opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />

                    <motion.div
                      className="absolute rounded-full border-2 border-red-500 bg-red-600/10"
                      style={{
                        left: explodedCoords.left,
                        top: explodedCoords.top,
                        x: '-50%',
                        y: '-50%'
                      }}
                      initial={{ width: 0, height: 0, opacity: 1 }}
                      animate={{ width: '450px', height: '450px', opacity: 0 }}
                      transition={{ delay: 0.15, duration: 1.0, ease: 'easeOut' }}
                    />

                    {/* Flying Fire Particles */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i * 360) / 12 + Math.random() * 20;
                      const distance = 80 + Math.random() * 60;
                      const rad = (angle * Math.PI) / 180;
                      const tx = Math.cos(rad) * distance;
                      const ty = Math.sin(rad) * distance;
                      return (
                        <motion.div
                          key={i}
                          className="absolute w-3 h-3 bg-yellow-400 rounded-none skew-x-[-10deg] border border-white"
                          style={{
                            left: explodedCoords.left,
                            top: explodedCoords.top,
                            x: '-50%',
                            y: '-50%'
                          }}
                          initial={{ scale: 1, opacity: 1 }}
                          animate={{
                            x: `calc(-50% + ${tx}px)`,
                            y: `calc(-50% + ${ty}px)`,
                            scale: [1, 2, 0],
                            rotate: [0, 180 + Math.random() * 180],
                            opacity: [1, 0.8, 0]
                          }}
                          transition={{ duration: 0.75, ease: 'easeOut' }}
                        />
                      );
                    })}

                    {/* Big Brutalist KABOOM Comic Text */}
                    <motion.div
                      className="absolute font-display font-black tracking-tighter text-3xl text-white italic bg-black border-2 border-white px-4 py-2 skew-x-[-12deg] skew-y-[-4deg] shadow-[4px_4px_0px_#FF4444]"
                      style={{
                        left: explodedCoords.left,
                        top: explodedCoords.top,
                        x: '-50%',
                        y: '-140%' // Slightly above center of explosion
                      }}
                      initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
                      animate={{ scale: [0.3, 1.2, 1], rotate: [-20, 10, -5], opacity: 1 }}
                      transition={{ duration: 0.45, ease: 'backOut' }}
                    >
                      KABOOM!!
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Interactive Player Direction Controls */}
              <div className="w-full">
                <DirectionalControls
                  hasBomb={isHumanHoldingBomb && isTicking && gameState === 'playing'}
                  onPass={(pos) => {
                    const matched = players.find((p) => p.position === pos);
                    if (matched) passBombTo(matched.id);
                  }}
                  players={players}
                  isPassing={isPassing}
                  previousHolderId={previousHolderId}
                />
              </div>

              {/* Extra helper cheat-sheet keys */}
              <div className="text-center text-[8px] text-gray-500 font-mono tracking-wider flex items-center justify-center gap-1 leading-none uppercase font-bold">
                <Keyboard size={10} className="stroke-[2]" />
                <span>HOTKEYS: [W A D] OR [↑ ← →] DIRECTIONS.</span>
              </div>
            </motion.div>
          )}

          {/* 3. WAVE RESULT SCREEN (ROUND END) */}
          {gameState === 'round_end' && explodedPlayerId !== null && (
            <motion.div
              key="round_end"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <RoundEndScreen
                players={players}
                explodedPlayerId={explodedPlayerId}
                wave={wave}
                onNextWave={handleNextWave}
                onEndGame={handleEndGame}
              />
            </motion.div>
          )}

          {/* 4. GAME OVER SUMMARY SCREEN */}
          {gameState === 'game_over' && (
            <motion.div
              key="game_over"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <GameOverScreen players={players} onRestart={handleRestart} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Persistent Clean Footer block */}
      <footer className="w-full max-w-2xl mx-auto px-4 mt-auto py-1.5 text-center text-[8px] sm:text-[9px] text-gray-600 font-mono flex items-center justify-between gap-2 uppercase font-bold border-t border-gray-950">
        <div>
          ROULETTE RIVALRY &copy; 2026
        </div>
        <div className="flex gap-3">
          <span>DESKTOP: USE WASD / ARROWS</span>
          <span>MOBILE: TAP KEYS</span>
        </div>
      </footer>
    </div>
  );
}

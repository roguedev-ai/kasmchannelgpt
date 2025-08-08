'use client';

import { useEffect, useState } from 'react';

interface OceanWaveTransitionProps {
  isVisible: boolean;
  direction: 'toVoice' | 'toChat';
  onComplete?: () => void;
}

export function OceanWaveTransition({ isVisible, direction, onComplete }: OceanWaveTransitionProps) {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'active' | 'exit'>('enter');

  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => setAnimationPhase('active'), 100);
    const timer2 = setTimeout(() => setAnimationPhase('exit'), 800);
    const timer3 = setTimeout(() => {
      onComplete?.();
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const waveDirection = direction === 'toVoice' ? 'translate-y-full' : '-translate-y-full';
  const waveTransform = animationPhase === 'enter' 
    ? waveDirection 
    : animationPhase === 'active' 
    ? 'translate-y-0' 
    : direction === 'toVoice' ? '-translate-y-full' : 'translate-y-full';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Multiple wave layers for depth effect */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-transform duration-700 ease-in-out ${waveTransform}`}
          style={{
            background: `linear-gradient(45deg, 
              rgba(52, 235, 222, ${0.8 - i * 0.15}) 0%,
              rgba(100, 200, 255, ${0.9 - i * 0.15}) 25%,
              rgba(138, 43, 226, ${0.8 - i * 0.15}) 50%,
              rgba(233, 30, 99, ${0.7 - i * 0.15}) 75%,
              rgba(255, 105, 97, ${0.6 - i * 0.15}) 100%
            )`,
            clipPath: `polygon(
              0% ${100 - i * 5}%,
              ${10 + i * 5}% ${95 - i * 3}%,
              ${25 + i * 3}% ${98 - i * 2}%,
              ${40 + i * 4}% ${92 - i * 3}%,
              ${55 + i * 2}% ${96 - i * 2}%,
              ${70 + i * 3}% ${94 - i * 3}%,
              ${85 + i * 2}% ${97 - i * 2}%,
              100% ${95 - i * 3}%,
              100% 100%,
              0% 100%
            )`,
            animationDelay: `${i * 50}ms`
          }}
        >
          {/* Animated wave pattern overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `repeating-linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.1) 1px,
                rgba(255, 255, 255, 0.1) 2px,
                transparent 3px,
                transparent 8px
              )`,
              animation: `wave-flow ${1.5 + i * 0.2}s linear infinite`,
              transform: direction === 'toVoice' ? 'translateX(100%)' : 'translateX(-100%)'
            }}
          />
        </div>
      ))}

      {/* Particle effects */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1000}ms`,
              animationDuration: `${1 + Math.random() * 2}s`,
              opacity: animationPhase === 'active' ? 0.8 : 0,
              transition: 'opacity 300ms ease-in-out'
            }}
          />
        ))}
      </div>

      {/* Transition text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`text-white text-2xl font-light transition-all duration-500 ${
            animationPhase === 'active' 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-90'
          }`}
        >
          {direction === 'toVoice' ? '🎤 Entering Voice Mode' : '💬 Returning to Chat'}
        </div>
      </div>

      <style jsx>{`
        @keyframes wave-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
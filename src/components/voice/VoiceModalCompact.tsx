/**
 * Compact Voice Modal Alternative
 * 
 * Shows only the latest 1-2 lines of conversation
 * Optimized for minimal screen usage on mobile
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { parseMarkdownForVoice } from '@/lib/voice/utils';

interface CompactVoiceDisplayProps {
  transcript: string;
  agentResponse: string;
  voiceState: 'idle' | 'listening' | 'recording' | 'processing' | 'speaking';
}

export function CompactVoiceDisplay({ 
  transcript, 
  agentResponse, 
  voiceState 
}: CompactVoiceDisplayProps) {
  const [displayText, setDisplayText] = useState('');
  const [isUserText, setIsUserText] = useState(false);
  
  // Auto-scroll effect for long text
  const textRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any existing scroll
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    // Update display based on state
    if (transcript && (voiceState === 'recording' || voiceState === 'processing')) {
      setDisplayText(transcript);
      setIsUserText(true);
    } else if (agentResponse && voiceState === 'speaking') {
      const cleanResponse = parseMarkdownForVoice(agentResponse);
      // Show only last 100 characters on mobile
      const isMobile = window.innerWidth < 640;
      const charLimit = isMobile ? 100 : 150;
      
      if (cleanResponse.length > charLimit) {
        // Get the last sentence or chunk
        const sentences = cleanResponse.split('. ');
        const lastSentence = sentences[sentences.length - 1] || sentences[sentences.length - 2];
        setDisplayText('...' + lastSentence.slice(-charLimit));
      } else {
        setDisplayText(cleanResponse);
      }
      setIsUserText(false);
      
      // Auto-scroll for long text
      if (textRef.current && cleanResponse.length > charLimit) {
        let scrollPosition = 0;
        scrollIntervalRef.current = setInterval(() => {
          if (textRef.current) {
            scrollPosition += 1;
            textRef.current.scrollLeft = scrollPosition;
            
            // Reset when reached end
            if (scrollPosition >= textRef.current.scrollWidth - textRef.current.clientWidth) {
              scrollPosition = 0;
            }
          }
        }, 50);
      }
    }
    
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [transcript, agentResponse, voiceState]);
  
  // Don't show anything in idle state
  if (voiceState === 'idle' || !displayText) {
    return null;
  }
  
  return (
    <div className="absolute bottom-32 left-0 right-0 px-6 sm:px-8 pointer-events-none">
      <div className="max-w-2xl mx-auto">
        <div className={`
          backdrop-blur-md rounded-2xl px-4 py-3 
          transition-all duration-300 ease-in-out
          ${isUserText 
            ? 'bg-white/10 border border-white/20' 
            : 'bg-black/20 border border-white/10'
          }
        `}>
          {/* Speaker indicator */}
          <div className="flex items-center gap-2 mb-1">
            <div className={`
              w-2 h-2 rounded-full animate-pulse
              ${isUserText ? 'bg-blue-400' : 'bg-green-400'}
            `} />
            <span className="text-xs text-white/60">
              {isUserText ? 'You' : 'Assistant'}
            </span>
          </div>
          
          {/* Text display */}
          <div 
            ref={textRef}
            className="text-white text-sm sm:text-base leading-relaxed overflow-x-auto whitespace-nowrap scrollbar-hide"
            style={{ 
              maskImage: 'linear-gradient(to right, transparent, black 10px, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 10px, black 90%, transparent)'
            }}
          >
            {displayText}
          </div>
        </div>
      </div>
    </div>
  );
}

// CSS for hiding scrollbar
const compactVoiceStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = compactVoiceStyles;
  document.head.appendChild(styleSheet);
}
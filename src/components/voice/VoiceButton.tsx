'use client';

import { Mic } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VoiceButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceButton({ onClick, disabled }: VoiceButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="
              relative h-10 w-10 flex-shrink-0 rounded-full
              bg-gradient-to-br from-purple-500 via-pink-500 to-red-500
              hover:from-purple-600 hover:via-pink-600 hover:to-red-600
              active:from-purple-700 active:via-pink-700 active:to-red-700
              disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600
              shadow-lg hover:shadow-xl active:shadow-md
              transition-all duration-200 ease-in-out
              hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              group
              flex items-center justify-center
              border-2 border-white/20 hover:border-white/30
            "
          >
            {/* Animated background glow */}
            <div className="
              absolute inset-0 rounded-full
              bg-gradient-to-br from-purple-400/30 via-pink-400/30 to-red-400/30
              opacity-0 group-hover:opacity-100
              animate-pulse
              transition-opacity duration-300
              blur-sm
            " />
            
            {/* Mic icon with enhanced styling */}
            <Mic className="
              h-5 w-5 text-white relative z-10
              drop-shadow-sm
              group-hover:drop-shadow-md
              transition-all duration-200
            " />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Try voice mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
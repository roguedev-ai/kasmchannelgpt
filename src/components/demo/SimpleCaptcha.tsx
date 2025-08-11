/**
 * Simple Captcha Component
 * 
 * Basic math-based captcha to prevent bot abuse of free trial.
 * Generates simple addition problems for human verification.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleCaptchaProps {
  onVerified: () => void;
  className?: string;
}

export function SimpleCaptcha({ onVerified, className }: SimpleCaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate new captcha
  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setUserAnswer('');
    setError(null);
  };

  // Initialize on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Handle verification
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expectedAnswer = num1 + num2;
    const userAnswerNum = parseInt(userAnswer, 10);
    
    if (isNaN(userAnswerNum)) {
      setError('Please enter a valid number');
      return;
    }
    
    setIsVerifying(true);
    
    // Add small delay to prevent rapid attempts
    setTimeout(() => {
      if (userAnswerNum === expectedAnswer) {
        // Store verification in session storage with timestamp
        const verificationData = {
          verified: true,
          timestamp: Date.now(),
          // Verification valid for 5 minutes
          expiresAt: Date.now() + (5 * 60 * 1000)
        };
        
        sessionStorage.setItem('customgpt.captchaVerified', JSON.stringify(verificationData));
        onVerified();
      } else {
        setError('Incorrect answer. Please try again.');
        generateCaptcha();
      }
      
      setIsVerifying(false);
    }, 500);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Please solve this simple math problem to continue:
      </div>
      
      <div className="flex items-center gap-3">
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg font-mono text-lg">
          {num1} + {num2} = ?
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={generateCaptcha}
          title="Generate new problem"
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={handleVerify} className="flex gap-2">
        <Input
          type="number"
          value={userAnswer}
          onChange={(e) => {
            setUserAnswer(e.target.value);
            setError(null);
          }}
          placeholder="Your answer"
          className={cn(
            "flex-1",
            error && "border-red-500 focus:ring-red-500"
          )}
          disabled={isVerifying}
          autoFocus
        />
        
        <Button
          type="submit"
          disabled={!userAnswer || isVerifying}
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </Button>
      </form>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// Helper function to check if captcha verification is still valid
export function isCaptchaVerified(): boolean {
  if (typeof window === 'undefined') return false;
  
  const verificationData = sessionStorage.getItem('customgpt.captchaVerified');
  if (!verificationData) return false;
  
  try {
    const data = JSON.parse(verificationData);
    // Check if verification hasn't expired
    return data.verified && data.expiresAt > Date.now();
  } catch {
    return false;
  }
}
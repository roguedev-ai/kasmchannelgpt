/**
 * Partner Login Component
 * 
 * Provides a login form for partner authentication.
 * Matches CustomGPT UI theme and integrates with mock API.
 */

'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { User, Lock, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { sessionManager } from '@/lib/session/partner-session';
import { cn } from '@/lib/utils';

interface PartnerLoginProps {
  onLoginSuccess?: () => void;
  onLoginError?: (error: Error) => void;
  className?: string;
}

export function PartnerLogin({ 
  onLoginSuccess, 
  onLoginError,
  className 
}: PartnerLoginProps) {
  const [partnerId, setPartnerId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Call REAL API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();

      if (data.token) {
        // Store real JWT session
        sessionManager.setSession(data.token, data.partnerId || partnerId);
        
        toast.success('Login successful', {
          description: `Welcome back, ${email}`
        });
        
        onLoginSuccess?.();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during login';
      setError(errorMessage);
      toast.error('Login failed', {
        description: errorMessage
      });
      onLoginError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("w-[400px] shadow-lg", className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Partner Login</CardTitle>
        <CardDescription>
          Enter your partner ID and email to access the platform
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Partner ID Input */}
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Partner ID"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="pl-9"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Email Input */}
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

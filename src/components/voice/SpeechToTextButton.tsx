'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SpeechToTextButtonProps {
  onTranscription: (text: string) => void;
  onTranscriptionStart?: () => void;
  onTranscriptionEnd?: () => void;
  disabled?: boolean;
  isMobile?: boolean;
  className?: string;
}

export function SpeechToTextButton({ 
  onTranscription, 
  onTranscriptionStart,
  onTranscriptionEnd,
  disabled = false, 
  isMobile = false,
  className 
}: SpeechToTextButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Don't call onTranscriptionEnd here - let processAudio handle it
      
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      setRecordingDuration(0);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());
        
        // Process the audio
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onTranscriptionStart?.();
      
      // Start duration timer
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
      }, 100) as any;

      // Auto-stop recording after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
        toast.info('Recording stopped after 30 seconds');
      }, 30000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Unable to access microphone. Please check your permissions.');
      onTranscriptionEnd?.();
    }
  }, [stopRecording, onTranscriptionStart, onTranscriptionEnd]);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert blob to base64 for sending
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];

        // Check for demo mode and add appropriate headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add deployment mode header
        const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
        headers['X-Deployment-Mode'] = deploymentMode;
        
        // In demo mode, add OpenAI key from window object if available
        if (deploymentMode === 'demo' && (window as any).__demoOpenAIKey) {
          headers['X-OpenAI-API-Key'] = (window as any).__demoOpenAIKey;
        }

        const response = await fetch('/api/proxy/voice/transcribe', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            audio: base64Data,
            mimeType: audioBlob.type,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Transcription failed' }));
          
          // Check if it's an OpenAI API key error
          if (response.status === 500 && errorData.error && errorData.error.includes('OpenAI API key')) {
            toast.error(errorData.error);
            throw new Error('OpenAI API key not configured');
          }
          
          throw new Error(errorData.error || 'Transcription failed');
        }

        const data = await response.json();
        
        if (data.text) {
          onTranscription(data.text);
          toast.success('Speech transcribed successfully');
        } else {
          throw new Error('No transcription received');
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to process audio');
      };

    } catch (error) {
      console.error('Transcription error:', error);
      
      // Don't show duplicate toast for OpenAI API key error
      if (error instanceof Error && error.message === 'OpenAI API key not configured') {
        // Toast already shown above
      } else if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to transcribe speech. Please try again.');
      }
    } finally {
      setIsProcessing(false);
      onTranscriptionEnd?.();
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isActive = isRecording || isProcessing;

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleClick}
            disabled={disabled || isProcessing}
            className={cn(
              "relative text-muted-foreground hover:text-foreground transition-all",
              isActive && "text-red-600 hover:text-red-700",
              isRecording && "animate-pulse bg-red-50 hover:bg-red-100",
              className
            )}
          >
            {isProcessing ? (
              <div className="relative">
                <Loader2 className={cn(
                  "animate-spin",
                  isMobile ? "h-5 w-5" : "h-5 w-5"
                )} />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
                  Processing...
                </span>
              </div>
            ) : isRecording ? (
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25" />
                <MicOff className={cn(
                  "relative z-10",
                  isMobile ? "h-5 w-5" : "h-5 w-5"
                )} />
                {/* Recording duration */}
                {recordingDuration > 0 && (
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-red-600 font-medium whitespace-nowrap">
                    {formatDuration(recordingDuration)}
                  </span>
                )}
              </div>
            ) : (
              <Mic className={cn(isMobile ? "h-5 w-5" : "h-5 w-5")} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isProcessing ? 'Processing your speech...' : isRecording ? `Recording... ${formatDuration(recordingDuration)}` : 'Click to start speech-to-text'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
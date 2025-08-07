'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';
import RotateLoader from 'react-spinners/RotateLoader';
import { X } from 'lucide-react';
import Canvas from './Canvas';
import { speechManager } from '@/lib/voice/speech-manager';
import { particleActions } from '@/lib/voice/particle-manager';
import { useMessageStore, useConversationStore } from '@/hooks/useWidgetStore';
import { generateId } from '@/lib/utils';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

export function VoiceModal({ isOpen, onClose, projectId, projectName }: VoiceModalProps) {
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [isManualRecording, setIsManualRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Message store integration
  const { addMessage } = useMessageStore();
  const { currentConversation, ensureConversation } = useConversationStore();
  const [currentUserMessageId, setCurrentUserMessageId] = useState<string | null>(null);

  const vad = useMicVAD({
    preSpeechPadFrames: 5,
    positiveSpeechThreshold: 0.90,  // Back to AIUI settings
    negativeSpeechThreshold: 0.75,   // Back to AIUI settings
    minSpeechFrames: 4,              // Back to AIUI settings
    startOnLoad: false,              // Start manually to handle permissions properly
    workletURL: '/vad.worklet.bundle.min.js',
    modelURL: '/silero_vad.onnx',
    onSpeechStart: () => {
      console.log('🎤 [VAD] Speech started detected');
      const debugMsg = `${new Date().toLocaleTimeString()} - VAD: Speech started`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      speechManager.onSpeechStart();
    },
    onSpeechEnd: (audio) => {
      console.log('🎤 [VAD] Speech ended, audio length:', audio.length);
      const debugMsg = `${new Date().toLocaleTimeString()} - VAD: Speech ended, audio length: ${audio.length}`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      speechManager.onSpeechEnd(audio);
    },
    onVADMisfire: () => {
      console.log('🎤 [VAD] Misfire detected');
      const debugMsg = `${new Date().toLocaleTimeString()} - VAD: Misfire (noise detected)`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      speechManager.onMisfire();
    }
  });

  // Set up speech manager when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      console.log('🔧 [VOICE-MODAL] Setting up speech manager');
      speechManager.setProjectId(projectId);
      speechManager.setCallbacks({
        onUserSpeaking: () => {
          particleActions.onUserSpeaking();
          setTranscript('');
        },
        onProcessing: () => {
          particleActions.onProcessing();
        },
        onAiSpeaking: () => particleActions.onAiSpeaking(),
        onReset: () => particleActions.reset(),
        onDebug: (message: string, data?: any) => {
          const debugMsg = `${new Date().toLocaleTimeString()} - ${message}`;
          setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
        },
        onError: (error: string) => {
          const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: ${error}`;
          setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
        },
        onTranscriptReceived: async (transcript: string) => {
          console.log('🎯 [VOICE-MODAL] Transcript received:', transcript);
          setTranscript(transcript);
          
          // Ensure we have a conversation
          const conversation = await ensureConversation(parseInt(projectId), transcript);
          
          // Create and add user message to chat
          const userMessage = {
            id: generateId(),
            role: 'user' as const,
            content: transcript,
            timestamp: new Date().toISOString(),
            status: 'sent' as const,
          };
          
          setCurrentUserMessageId(userMessage.id);
          addMessage(conversation.id.toString(), userMessage);
          
          const debugMsg = `${new Date().toLocaleTimeString()} - Added user message to chat: "${transcript}"`;
          setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
        },
        onResponseReceived: async (response: string) => {
          console.log('🎯 [VOICE-MODAL] Response received:', response);
          
          if (currentConversation) {
            // Create and add assistant message to chat
            const assistantMessage = {
              id: generateId(),
              role: 'assistant' as const,
              content: response,
              timestamp: new Date().toISOString(),
              status: 'sent' as const,
              citations: [], // Voice responses typically don't have citations
            };
            
            addMessage(currentConversation.id.toString(), assistantMessage);
            
            const debugMsg = `${new Date().toLocaleTimeString()} - Added AI response to chat: "${response.substring(0, 50)}..."`;
            setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
          }
        }
      });
    }
    
    // Clean up when modal closes
    if (!isOpen) {
      speechManager.clearConversation();
      setTranscript('');
      setDebugMessages([]);
    }
  }, [isOpen, projectId]);

  // Define handleToggleListening before useEffect that uses it
  const handleToggleListening = useCallback(async () => {
    console.log('🔘 [VOICE-MODAL] Toggle listening clicked', { 
      vadLoading: vad.loading,
      vadListening: vad.listening,
      vadErrored: vad.errored
    });
    
    // Enhanced error handling for VAD
    if (vad.errored) {
      console.error('❌ [VOICE-MODAL] VAD is in error state, attempting recovery...');
      const errorMsg = `${new Date().toLocaleTimeString()} - VAD ERROR: Attempting to recover. Check browser console.`;
      setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
      
      // Try to restart VAD after error
      try {
        console.log('🔄 [VOICE-MODAL] Attempting VAD recovery...');
        // Wait a moment then try to start
        setTimeout(() => {
          if (!vad.listening && !vad.loading) {
            console.log('🔄 [VOICE-MODAL] Retry VAD start after error');
            vad.start();
          }
        }, 1000);
        return;
      } catch (recoveryError) {
        console.error('❌ [VOICE-MODAL] VAD recovery failed:', recoveryError);
        const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: VAD recovery failed. Try refreshing the page.`;
        setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
        return;
      }
    }
    
    try {
      if (vad.listening) {
        console.log('⏸️ [VOICE-MODAL] Pausing VAD');
        vad.pause();
        const debugMsg = `${new Date().toLocaleTimeString()} - VAD paused`;
        setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      } else {
        console.log('▶️ [VOICE-MODAL] Starting VAD');
        
        // Enhanced microphone permission check
        try {
          console.log('🎤 [VOICE-MODAL] Checking microphone permissions...');
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 16000
            } 
          });
          
          // Test the stream briefly
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          console.log('🎯 [VOICE-MODAL] Audio context created successfully');
          
          // Clean up test resources
          source.disconnect();
          audioContext.close();
          stream.getTracks().forEach(track => track.stop());
          
          console.log('🎯 [VOICE-MODAL] Microphone permission granted and tested');
        } catch (permissionError) {
          console.error('❌ [VOICE-MODAL] Microphone permission or setup failed:', permissionError);
          const errorMessage = permissionError instanceof Error ? permissionError.message : 'Check permissions.';
          const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: Microphone setup failed. ${errorMessage}`;
          setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
          return;
        }
        
        // Start VAD with additional error handling
        try {
          vad.start();
          const debugMsg = `${new Date().toLocaleTimeString()} - VAD started successfully`;
          setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
        } catch (vadError) {
          console.error('❌ [VOICE-MODAL] VAD start failed:', vadError);
          const errorMessage = vadError instanceof Error ? vadError.message : 'Unknown error';
          const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: VAD failed to start. ${errorMessage}`;
          setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
        }
      }
    } catch (error) {
      console.error('❌ [VOICE-MODAL] Error in toggle listening:', error);
      const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: ${error instanceof Error ? error.message : 'Failed to toggle VAD'}`;
      setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
    }
  }, [vad]);

  // Manual recording fallback when VAD fails
  const handleManualRecording = useCallback(async () => {
    console.log('🎤 [MANUAL] Starting manual recording fallback');
    
    try {
      if (!isManualRecording) {
        // Start manual recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        recorder.onstop = async () => {
          console.log('🎤 [MANUAL] Recording stopped, processing audio...');
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          
          try {
            // Create audio context for decoding compressed audio
            const audioContext = new AudioContext();
            
            // Convert blob to ArrayBuffer
            const audioBuffer = await audioBlob.arrayBuffer();
            
            // Decode the compressed audio to get raw PCM data
            const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
            console.log('🎯 [MANUAL] Audio decoded:', {
              sampleRate: decodedAudio.sampleRate,
              channels: decodedAudio.numberOfChannels,
              duration: decodedAudio.duration,
              length: decodedAudio.length
            });
            
            // Convert to mono Float32Array (match VAD format)
            const channelData = decodedAudio.getChannelData(0); // Get first channel
            const audioArray = new Float32Array(channelData);
            
            console.log('🎯 [MANUAL] Audio converted to Float32Array:', audioArray.length, 'samples');
            
            // Process through speech manager
            speechManager.onSpeechStart();
            await speechManager.onSpeechEnd(audioArray);
            
            // Clean up audio context
            await audioContext.close();
            
          } catch (error) {
            console.error('❌ [MANUAL] Audio decoding failed:', error);
            const errorMsg = `${new Date().toLocaleTimeString()} - Manual recording audio decode failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
          }
          
          // Clean up recording resources
          stream.getTracks().forEach(track => track.stop());
          setIsManualRecording(false);
          setMediaRecorder(null);
        };
        
        setMediaRecorder(recorder);
        setIsManualRecording(true);
        recorder.start();
        
        const debugMsg = `${new Date().toLocaleTimeString()} - Manual recording started (VAD fallback)`;
        setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
        
      } else {
        // Stop manual recording
        if (mediaRecorder) {
          mediaRecorder.stop();
        }
      }
    } catch (error) {
      console.error('❌ [MANUAL] Manual recording failed:', error);
      const errorMsg = `${new Date().toLocaleTimeString()} - Manual recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
    }
  }, [isManualRecording, mediaRecorder]);

  // Track if we've already auto-started to prevent loops
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Handle VAD state updates with comprehensive error checking
  useEffect(() => {
    console.log('🔄 [VOICE-MODAL] VAD state changed', { 
      isOpen,
      vadLoading: vad.loading, 
      vadListening: vad.listening,
      vadUserSpeaking: vad.userSpeaking,
      vadErrored: vad.errored,
      hasAutoStarted
    });
    
    // Check for VAD errors
    if (vad.errored) {
      console.error('❌ [VOICE-MODAL] VAD encountered an error');
      const errorMsg = `${new Date().toLocaleTimeString()} - VAD ERROR: Check console and microphone permissions`;
      setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
      return;
    }
    
    // Auto-start VAD when it finishes loading (like AIUI behavior) - but only once
    if (isOpen && !vad.loading && !vad.listening && !vad.errored && !hasAutoStarted) {
      console.log('🎯 [VOICE-MODAL] VAD loaded successfully, attempting auto-start...');
      const debugMsg = `${new Date().toLocaleTimeString()} - VAD loaded, attempting auto-start`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      
      setHasAutoStarted(true);
      // Use setTimeout to break the synchronous cycle and allow for proper initialization
      setTimeout(() => {
        handleToggleListening();
      }, 300); // Increased delay for better stability
    }
    
    // If VAD is in error state but we haven't tried recovery, attempt recovery
    if (isOpen && !vad.loading && vad.errored && hasAutoStarted) {
      console.log('🔄 [VOICE-MODAL] VAD in error state, scheduling recovery attempt...');
      const debugMsg = `${new Date().toLocaleTimeString()} - VAD error detected, will attempt recovery`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      
      // Don't continuously retry, just once more after a delay
      setTimeout(() => {
        if (vad.errored && !vad.listening) {
          console.log('🔄 [VOICE-MODAL] Executing VAD recovery attempt');
          handleToggleListening();
        }
      }, 1500);
    }
    
    // Pause when modal closes
    if (!isOpen && vad.listening) {
      console.log('🛑 [VOICE-MODAL] Pausing VAD (modal closed)');
      vad.pause();
    }
  }, [isOpen, vad.loading, vad.listening, vad.errored, hasAutoStarted]);

  // Reset auto-start flag when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasAutoStarted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setLoading(vad.loading);
  }, [vad.loading]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RotateLoader
                loading={loading}
                color="#27eab6"
                aria-label="Loading Voice"
                data-testid="loader"
              />
            </div>
          ) : (
            <>
              {/* Canvas for particle animation */}
              <Canvas draw={particleActions.draw} />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
                aria-label="Close voice mode"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {/* Control buttons */}
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-4">
                <button
                  onClick={handleToggleListening}
                  className={`px-8 py-4 rounded-full font-medium transition-all transform hover:scale-105 ${
                    vad.listening
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50'
                      : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                  }`}
                >
                  {vad.listening ? 'Pause' : 'Resume'}
                </button>
                
                {/* Manual recording fallback if VAD fails */}
                {vad.errored && (
                  <>
                    <button
                      onClick={handleManualRecording}
                      className={`px-6 py-4 rounded-full font-medium transition-all transform hover:scale-105 ${
                        isManualRecording
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {isManualRecording ? 'Stop Recording' : 'Manual Record'}
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-4 rounded-full font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all transform hover:scale-105"
                    >
                      Reload & Retry
                    </button>
                  </>
                )}
              </div>

              {/* Status display */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center pointer-events-none">
                <p className="text-2xl font-light mb-2">
                  {isManualRecording 
                    ? 'Recording...' 
                    : vad.errored 
                    ? 'Error - Try Manual Mode' 
                    : vad.listening 
                    ? 'Listening...' 
                    : 'Paused'}
                </p>
                {vad.errored && !isManualRecording && (
                  <p className="text-sm text-red-300 max-w-md mx-auto mb-2">
                    VAD worklet failed to load. Use "Manual Record" button below or reload page.
                  </p>
                )}
                {isManualRecording && (
                  <p className="text-sm text-green-300 max-w-md mx-auto mb-2">
                    Press "Stop Recording" when you finish speaking.
                  </p>
                )}
                {transcript && (
                  <p className="text-lg text-white/70 max-w-md mx-auto">"{transcript}"</p>
                )}
              </div>

              {/* Debug console - Always visible for debugging */}
              <div className="absolute bottom-32 left-8 right-8 max-w-2xl mx-auto max-h-40 overflow-y-auto bg-black/30 backdrop-blur-sm rounded-lg p-4">
                <div className="text-xs text-green-400 font-mono space-y-1">
                  <div className={`${vad.errored ? 'text-red-400' : 'text-yellow-400'}`}>
                    VAD Status: {vad.loading ? 'Loading...' : vad.errored ? 'ERROR' : vad.listening ? 'Listening' : 'Paused'}
                  </div>
                  <div className="text-yellow-400">User Speaking: {vad.userSpeaking ? 'Yes' : 'No'}</div>
                  <div className="text-yellow-400">Project ID: {projectId || 'Not Set'}</div>
                  <div className={`${vad.errored ? 'text-red-400' : 'text-blue-400'}`}>
                    VAD Error: {vad.errored ? 'Yes - Check microphone permissions' : 'No'}
                  </div>
                  <div className="text-blue-400">Model Files: /silero_vad.onnx, /vad.worklet.bundle.min.js</div>
                  {debugMessages.length > 0 ? (
                    debugMessages.slice(-6).map((msg, i) => (
                      <div key={i} className={`opacity-90 ${msg.includes('ERROR') ? 'text-red-300' : ''}`}>{msg}</div>
                    ))
                  ) : (
                    <div className="text-gray-400">Initializing VAD... Check console for details</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
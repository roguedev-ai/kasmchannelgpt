'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMicVAD, utils } from '@ricky0123/vad-react';
import RotateLoader from 'react-spinners/RotateLoader';
import { X, StopCircle, Mic, MicOff } from 'lucide-react';
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

// Separate component that handles VAD initialization
function VoiceModalContent({ isOpen, onClose, projectId, projectName }: VoiceModalProps) {
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [isManualRecording, setIsManualRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Message store integration
  const { addMessage, messages } = useMessageStore();
  const { currentConversation, ensureConversation } = useConversationStore();
  const [currentUserMessageId, setCurrentUserMessageId] = useState<string | null>(null);

  // Initialize VAD
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
      
      // Ensure we have a conversation before starting voice
      const setupConversation = async () => {
        try {
          let conversation = currentConversation;
          
          // If no current conversation, create one for voice
          if (!conversation) {
            console.log('🔄 [VOICE-MODAL] No current conversation, creating one for voice');
            conversation = await ensureConversation(parseInt(projectId), 'Voice conversation');
            console.log('✅ [VOICE-MODAL] Created conversation:', conversation.id, 'session:', conversation.session_id);
          }
          
          // Load conversation history and session ID
          const conversationMessages = messages.get(conversation.id.toString()) || [];
          console.log('📝 [VOICE-MODAL] Loading conversation history:', conversationMessages.length, 'messages');
          speechManager.setConversationHistory(conversationMessages);
          speechManager.setSessionId(conversation.session_id);
        } catch (error) {
          console.error('❌ [VOICE-MODAL] Failed to setup conversation:', error);
          const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: Failed to setup conversation`;
          setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
        }
      };
      
      setupConversation();
      
      speechManager.setCallbacks({
        onUserSpeaking: () => {
          particleActions.onUserSpeaking();
          setTranscript('');
        },
        onProcessing: () => {
          particleActions.onProcessing();
        },
        onAiSpeaking: () => {
          particleActions.onAiSpeaking();
          setIsAgentSpeaking(true);
        },
        onReset: () => {
          particleActions.reset();
          setIsAgentSpeaking(false);
        },
        onDebug: (message: string, data?: any) => {
          const debugMsg = `${new Date().toLocaleTimeString()} - ${message}`;
          setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
        },
        onError: (error: string) => {
          const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: ${error}`;
          setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
          
          // Check if it's an API key error
          if (error.includes('OpenAI API key')) {
            setApiKeyError(true);
          }
        },
        onTranscriptReceived: async (transcript: string) => {
          console.log('🎯 [VOICE-MODAL] Transcript received:', transcript);
          setTranscript(transcript);
          
          // Ensure we have a conversation
          const conversation = await ensureConversation(parseInt(projectId), transcript);
          
          // Update sessionId if we got a new conversation
          if (conversation.session_id && conversation.session_id !== speechManager.getSessionId()) {
            console.log('🔄 [VOICE-MODAL] Updating session ID:', conversation.session_id);
            speechManager.setSessionId(conversation.session_id);
          }
          
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
          
          // Display the agent's response in the voice window
          setAgentResponse(response);
          
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
      // Don't clear conversation history to maintain context
      setTranscript('');
      setAgentResponse('');
      setDebugMessages([]);
      setIsAgentSpeaking(false);
    }
  }, [isOpen, projectId, currentConversation, messages]);

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
        // Start manual recording with better audio quality
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          } 
        });
        
        // Choose the best available audio format
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm';
          
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        recorder.onstop = async () => {
          console.log('🎤 [MANUAL] Recording stopped, processing audio...');
          // MediaRecorder doesn't produce WAV, it produces webm/opus or similar
          const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          
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
            
            // CRITICAL: Resample from 48kHz to 16kHz for VAD/Whisper compatibility
            let audioArray: Float32Array;
            if (decodedAudio.sampleRate !== 16000) {
              console.log('🔄 [MANUAL] Resampling from', decodedAudio.sampleRate, 'to 16kHz');
              const resampleRatio = 16000 / decodedAudio.sampleRate;
              const newLength = Math.floor(channelData.length * resampleRatio);
              audioArray = new Float32Array(newLength);
              
              // Simple linear interpolation resampling
              for (let i = 0; i < newLength; i++) {
                const srcIndex = i / resampleRatio;
                const srcIndexFloor = Math.floor(srcIndex);
                const srcIndexCeil = Math.min(srcIndexFloor + 1, channelData.length - 1);
                const fraction = srcIndex - srcIndexFloor;
                
                audioArray[i] = channelData[srcIndexFloor] * (1 - fraction) + 
                               channelData[srcIndexCeil] * fraction;
              }
            } else {
              audioArray = new Float32Array(channelData);
            }
            
            console.log('🎯 [MANUAL] Audio ready:', audioArray.length, 'samples at 16kHz');
            
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

  // Handle stopping the agent's speech
  const handleStopSpeech = useCallback(() => {
    console.log('🛑 [VOICE-MODAL] Stopping agent speech');
    speechManager.stopAudio();
    setIsAgentSpeaking(false);
  }, []);

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
    
    // Don't auto-start VAD - wait for user interaction
    // This prevents microphone permission request on modal open
    if (isOpen && !vad.loading && !vad.listening && !vad.errored) {
      console.log('🎯 [VOICE-MODAL] VAD loaded successfully, ready for manual start');
      const debugMsg = `${new Date().toLocaleTimeString()} - Click to start listening`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
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

  // Reset auto-start flag and error state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasAutoStarted(false);
      setApiKeyError(false);
      setTranscript('');
      setAgentResponse('');
      setIsAgentSpeaking(false);
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
              
              {/* API Key Error Message */}
              {apiKeyError && (
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-lg p-4 max-w-md">
                  <p className="text-white text-center mb-2">
                    <strong>Voice feature unavailable</strong>
                  </p>
                  <p className="text-white/80 text-sm text-center">
                    OpenAI API key is required for voice transcription and text-to-speech. 
                    Please add <code className="bg-black/30 px-1 rounded">OPENAI_API_KEY</code> to your <code className="bg-black/30 px-1 rounded">.env.local</code> file.
                  </p>
                </div>
              )}
              

              {/* Status display */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                <p className="text-3xl font-light mb-4">
                  {isManualRecording 
                    ? 'Recording...' 
                    : vad.errored 
                    ? 'Click button to speak' 
                    : vad.listening 
                    ? 'Listening...' 
                    : vad.loading
                    ? 'Initializing...'
                    : 'Click to start'}
                </p>
                
                {/* Show user's transcript */}
                {transcript && (
                  <div className="mb-6">
                    <p className="text-sm text-white/50 mb-1">You said:</p>
                    <p className="text-lg text-white/80 max-w-md mx-auto">"{transcript}"</p>
                  </div>
                )}
                
                {/* Show agent's response */}
                {agentResponse && (
                  <div className="animate-fade-in">
                    <p className="text-sm text-white/50 mb-1">Agent:</p>
                    <p className="text-xl text-white max-w-md mx-auto">"{agentResponse}"</p>
                  </div>
                )}
                
                {/* Start listening button when not listening */}
                {!vad.loading && !vad.listening && !isManualRecording && (
                  <button
                    onClick={handleToggleListening}
                    className="mt-8 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all transform hover:scale-105 pointer-events-auto"
                  >
                    Start Listening
                  </button>
                )}
              </div>

              {/* Bottom control buttons */}
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                {/* Manual recording button only shown if VAD fails */}
                {vad.errored && (
                  <button
                    onClick={handleManualRecording}
                    className={`group flex items-center gap-2 px-4 sm:px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 ${
                      isManualRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50'
                        : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                    }`}
                    aria-label={isManualRecording ? 'Stop recording' : 'Start recording'}
                  >
                    {isManualRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    <span className="font-medium hidden sm:inline">
                      {isManualRecording ? 'Stop Recording' : 'Hold to Speak'}
                    </span>
                  </button>
                )}

                {/* Stop button when agent is speaking */}
                {isAgentSpeaking && (
                  <button
                    onClick={handleStopSpeech}
                    className="group flex items-center gap-2 px-4 sm:px-6 py-3 rounded-full bg-red-500/20 hover:bg-red-500/30 text-white backdrop-blur-sm transition-all transform hover:scale-105"
                    aria-label="Stop speaking"
                  >
                    <StopCircle className="w-5 h-5" />
                    <span className="font-medium hidden sm:inline">Stop Response</span>
                  </button>
                )}
              </div>

            </>
          )}
        </div>
      )}
    </>
  );
}

// Main component that conditionally renders the VAD component
export function VoiceModal(props: VoiceModalProps) {
  // Only render the content (and initialize VAD) when modal is open
  if (!props.isOpen) {
    return null;
  }
  
  return <VoiceModalContent {...props} />;
}